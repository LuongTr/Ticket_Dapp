// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LuminaTicket is ERC1155, Ownable, ReentrancyGuard {
    // Structs to match frontend types.ts
    struct EventData {
        uint256 eventId;
        string title;
        string description;
        string date; // ISO string
        string location;
        uint256 priceETH; // in wei
        string imageUrl;
        address organizer;
        uint256 totalTickets;
        uint256 soldTickets;
        string category; // Music, Tech, Art, Sports, Other
        bool isActive;
        uint256 royaltyPercentage; // in basis points (100 = 1%)
    }

    struct TicketData {
        uint256 ticketId;
        uint256 eventId;
        address ownerAddress;
        uint256 purchaseDate; // timestamp
        string qrCodeData;
        bool isUsed;
        uint256 ticketType; // 1 = General, 2 = VIP, 3 = Early Bird, etc.
    }

    // State variables
    mapping(uint256 => EventData) public events;
    mapping(uint256 => TicketData) public tickets;
    mapping(uint256 => mapping(uint256 => uint256)) public ticketTypeSupply; // eventId => ticketType => supply
    mapping(address => uint256) public organizerRoyalties; // accumulated royalties for organizers

    uint256 public nextEventId = 1;
    uint256 public nextTicketId = 1;

    // Events
    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        string title
    );
    event TicketMinted(
        uint256 indexed ticketId,
        uint256 indexed eventId,
        address indexed buyer,
        uint256 ticketType
    );
    event TicketTransferred(
        uint256 indexed ticketId,
        address indexed from,
        address indexed to
    );
    event TicketUsed(uint256 indexed ticketId);
    event RoyaltyWithdrawn(address indexed organizer, uint256 amount);

    constructor()
        ERC1155("https://lumina-tickets.com/api/token/{id}.json")
        Ownable(msg.sender)
    {}

    // Create a new event with multiple ticket types
    function createEvent(
        string memory _title,
        string memory _description,
        string memory _date,
        string memory _location,
        uint256[] memory _prices, // price per ticket type
        uint256[] memory _supplies, // supply per ticket type
        string memory _imageUrl,
        string memory _category,
        uint256 _royaltyPercentage
    ) external returns (uint256) {
        require(
            _prices.length == _supplies.length,
            "Prices and supplies arrays must match"
        );
        require(_prices.length > 0, "Must have at least one ticket type");
        require(
            _royaltyPercentage <= 1000,
            "Royalty percentage too high (max 10%)"
        ); // max 10%

        uint256 eventId = nextEventId++;
        uint256 totalSupply = 0;

        // Calculate total tickets across all types
        for (uint256 i = 0; i < _supplies.length; i++) {
            totalSupply += _supplies[i];
            ticketTypeSupply[eventId][i + 1] = _supplies[i]; // ticket types start from 1
        }

        events[eventId] = EventData({
            eventId: eventId,
            title: _title,
            description: _description,
            date: _date,
            location: _location,
            priceETH: _prices[0], // Default to first price, can be different per type
            imageUrl: _imageUrl,
            organizer: msg.sender,
            totalTickets: totalSupply,
            soldTickets: 0,
            category: _category,
            isActive: true,
            royaltyPercentage: _royaltyPercentage
        });

        emit EventCreated(eventId, msg.sender, _title);
        return eventId;
    }

    // Mint tickets for buyers (batch operation)
    function mintTickets(
        uint256 _eventId,
        uint256 _ticketType,
        uint256 _quantity,
        address _buyer
    ) external payable nonReentrant {
        EventData storage eventData = events[_eventId];
        require(eventData.isActive, "Event is not active");
        require(
            eventData.organizer == msg.sender || owner() == msg.sender,
            "Only organizer or owner can mint"
        );

        uint256 availableSupply = ticketTypeSupply[_eventId][_ticketType];
        require(availableSupply >= _quantity, "Not enough tickets available");

        // Calculate price based on ticket type (simplified - uses event base price)
        uint256 totalPrice = eventData.priceETH * _quantity;
        require(msg.value >= totalPrice, "Insufficient payment");

        // Update supply and sold count
        ticketTypeSupply[_eventId][_ticketType] -= _quantity;
        eventData.soldTickets += _quantity;

        // Generate token IDs and mint
        uint256[] memory ids = new uint256[](_quantity);
        uint256[] memory amounts = new uint256[](_quantity);

        for (uint256 i = 0; i < _quantity; i++) {
            uint256 ticketId = nextTicketId++;
            uint256 tokenId = generateTokenId(_eventId, _ticketType);

            ids[i] = tokenId;
            amounts[i] = 1;

            // Store ticket data
            tickets[ticketId] = TicketData({
                ticketId: ticketId,
                eventId: _eventId,
                ownerAddress: _buyer,
                purchaseDate: block.timestamp,
                qrCodeData: generateQRCode(ticketId),
                isUsed: false,
                ticketType: _ticketType
            });

            emit TicketMinted(ticketId, _eventId, _buyer, _ticketType);
        }

        // Mint ERC-1155 tokens
        _mintBatch(_buyer, ids, amounts, "");

        // Handle royalties
        uint256 royaltyAmount = (totalPrice * eventData.royaltyPercentage) /
            10000; // basis points
        organizerRoyalties[eventData.organizer] += royaltyAmount;

        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
    }

    // Buy tickets directly (public function for users)
    function buyTickets(
        uint256 _eventId,
        uint256 _ticketType,
        uint256 _quantity
    ) external payable nonReentrant {
        EventData storage eventData = events[_eventId];
        require(eventData.isActive, "Event is not active");

        uint256 availableSupply = ticketTypeSupply[_eventId][_ticketType];
        require(availableSupply >= _quantity, "Not enough tickets available");

        // Calculate price based on ticket type (simplified - uses event base price)
        uint256 totalPrice = eventData.priceETH * _quantity;
        require(msg.value >= totalPrice, "Insufficient payment");

        // Update supply and sold count
        ticketTypeSupply[_eventId][_ticketType] -= _quantity;
        eventData.soldTickets += _quantity;

        // Generate token IDs and mint
        uint256[] memory ids = new uint256[](_quantity);
        uint256[] memory amounts = new uint256[](_quantity);

        for (uint256 i = 0; i < _quantity; i++) {
            uint256 ticketId = nextTicketId++;
            uint256 tokenId = generateTokenId(_eventId, _ticketType);

            ids[i] = tokenId;
            amounts[i] = 1;

            // Store ticket data
            tickets[ticketId] = TicketData({
                ticketId: ticketId,
                eventId: _eventId,
                ownerAddress: msg.sender, // Buyer is the caller
                purchaseDate: block.timestamp,
                qrCodeData: generateQRCode(ticketId),
                isUsed: false,
                ticketType: _ticketType
            });

            emit TicketMinted(ticketId, _eventId, msg.sender, _ticketType);
        }

        // Mint ERC-1155 tokens to buyer
        _mintBatch(msg.sender, ids, amounts, "");

        // Handle royalties
        uint256 royaltyAmount = (totalPrice * eventData.royaltyPercentage) /
            10000; // basis points
        organizerRoyalties[eventData.organizer] += royaltyAmount;

        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
    }

    // Transfer ticket (with royalty)
    function transferTicket(uint256 _ticketId, address _to) external {
        TicketData storage ticket = tickets[_ticketId];
        require(ticket.ownerAddress == msg.sender, "Not ticket owner");
        require(!ticket.isUsed, "Ticket already used");

        uint256 tokenId = generateTokenId(ticket.eventId, ticket.ticketType);
        EventData storage eventData = events[ticket.eventId];

        // Calculate and collect royalty
        uint256 royaltyAmount = (eventData.priceETH *
            eventData.royaltyPercentage) / 10000;
        require(
            address(this).balance >= royaltyAmount,
            "Contract has insufficient funds"
        );

        organizerRoyalties[eventData.organizer] += royaltyAmount;

        // Transfer ERC-1155 token
        _safeTransferFrom(msg.sender, _to, tokenId, 1, "");

        // Update ticket ownership
        ticket.ownerAddress = _to;

        emit TicketTransferred(_ticketId, msg.sender, _to);
    }

    // Mark ticket as used (burn or flag)
    function useTicket(uint256 _ticketId) external {
        TicketData storage ticket = tickets[_ticketId];
        require(ticket.ownerAddress == msg.sender, "Not ticket owner");
        require(!ticket.isUsed, "Ticket already used");

        ticket.isUsed = true;

        // Optional: burn the token
        uint256 tokenId = generateTokenId(ticket.eventId, ticket.ticketType);
        _burn(msg.sender, tokenId, 1);

        emit TicketUsed(_ticketId);
    }

    // Organizers can withdraw their royalties
    function withdrawRoyalties() external nonReentrant {
        uint256 amount = organizerRoyalties[msg.sender];
        require(amount > 0, "No royalties to withdraw");

        organizerRoyalties[msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit RoyaltyWithdrawn(msg.sender, amount);
    }

    // Generate token ID from event ID and ticket type
    // Format: eventId * 1000 + ticketType
    function generateTokenId(
        uint256 _eventId,
        uint256 _ticketType
    ) public pure returns (uint256) {
        return (_eventId * 1000) + _ticketType;
    }

    // Generate QR code data (simplified)
    function generateQRCode(
        uint256 _ticketId
    ) internal pure returns (string memory) {
        return string(abi.encodePacked("LUMINA-", uint2str(_ticketId)));
    }

    // Utility function to convert uint to string
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    // Get event details
    function getEvent(
        uint256 _eventId
    ) external view returns (EventData memory) {
        return events[_eventId];
    }

    // Get ticket details
    function getTicket(
        uint256 _ticketId
    ) external view returns (TicketData memory) {
        return tickets[_ticketId];
    }

    // Get tickets owned by an address for a specific event
    function getTicketsByOwner(
        address _owner,
        uint256 _eventId
    ) external view returns (uint256[] memory) {
        // This is a simplified version - in production, you'd want a more efficient data structure
        uint256[] memory ownedTickets = new uint256[](nextTicketId);
        uint256 count = 0;

        for (uint256 i = 1; i < nextTicketId; i++) {
            if (
                tickets[i].ownerAddress == _owner &&
                tickets[i].eventId == _eventId
            ) {
                ownedTickets[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = ownedTickets[i];
        }

        return result;
    }

    // Airdrop tickets to listed addresses (organizer only)
    function airdropTickets(
        uint256 _eventId,
        uint256 _ticketType,
        address[] memory _recipients
    ) external {
        EventData storage eventData = events[_eventId];
        require(
            eventData.organizer == msg.sender,
            "Only event organizer can airdrop"
        );
        require(eventData.isActive, "Event is not active");

        uint256 recipientCount = _recipients.length;
        require(recipientCount > 0, "Must provide at least one recipient");

        uint256 availableSupply = ticketTypeSupply[_eventId][_ticketType];
        require(
            availableSupply >= recipientCount,
            "Not enough tickets available for airdrop"
        );

        // Update supply and sold count
        ticketTypeSupply[_eventId][_ticketType] -= recipientCount;
        eventData.soldTickets += recipientCount;

        // Generate token IDs and mint to each recipient
        for (uint256 i = 0; i < recipientCount; i++) {
            uint256 ticketId = nextTicketId++;
            uint256 tokenId = generateTokenId(_eventId, _ticketType);

            // Store ticket data for recipient
            tickets[ticketId] = TicketData({
                ticketId: ticketId,
                eventId: _eventId,
                ownerAddress: _recipients[i],
                purchaseDate: block.timestamp,
                qrCodeData: generateQRCode(ticketId),
                isUsed: false,
                ticketType: _ticketType
            });

            // Mint single token to recipient
            _mint(_recipients[i], tokenId, 1, "");

            emit TicketMinted(ticketId, _eventId, _recipients[i], _ticketType);
        }
    }

    // Contract can receive ETH for royalties
    receive() external payable {}
}
