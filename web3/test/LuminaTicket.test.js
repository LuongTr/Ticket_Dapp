const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LuminaTicket", function () {
  let luminaTicket;
  let owner;
  let organizer;
  let buyer;
  let addrs;

  const EVENT_DATA = {
    title: "Test Music Festival",
    description: "A great music event",
    date: "2024-12-25",
    location: "Test Venue",
    prices: [ethers.parseEther("0.1")], // 0.1 ETH
    supplies: [100], // 100 tickets
    imageUrl: "https://example.com/image.jpg",
    category: "Music",
    royaltyPercentage: 500, // 5%
  };

  beforeEach(async function () {
    // Get signers
    [owner, organizer, buyer, ...addrs] = await ethers.getSigners();

    // Deploy contract
    const LuminaTicket = await ethers.getContractFactory("LuminaTicket");
    luminaTicket = await LuminaTicket.deploy();
    await luminaTicket.waitForDeployment();
  });

  describe("Event Creation", function () {
    it("Should create an event successfully", async function () {
      const tx = await luminaTicket
        .connect(organizer)
        .createEvent(
          EVENT_DATA.title,
          EVENT_DATA.description,
          EVENT_DATA.date,
          EVENT_DATA.location,
          EVENT_DATA.prices,
          EVENT_DATA.supplies,
          EVENT_DATA.imageUrl,
          EVENT_DATA.category,
          EVENT_DATA.royaltyPercentage
        );

      await expect(tx)
        .to.emit(luminaTicket, "EventCreated")
        .withArgs(1, organizer.address, EVENT_DATA.title);

      const event = await luminaTicket.events(1);
      expect(event.title).to.equal(EVENT_DATA.title);
      expect(event.organizer).to.equal(organizer.address);
      expect(event.totalTickets).to.equal(100);
    });

    it("Should fail with mismatched price/supply arrays", async function () {
      await expect(
        luminaTicket.connect(organizer).createEvent(
          EVENT_DATA.title,
          EVENT_DATA.description,
          EVENT_DATA.date,
          EVENT_DATA.location,
          [ethers.parseEther("0.1")], // 1 price
          [50, 50], // 2 supplies
          EVENT_DATA.imageUrl,
          EVENT_DATA.category,
          EVENT_DATA.royaltyPercentage
        )
      ).to.be.revertedWith("Prices and supplies arrays must match");
    });
  });

  describe("Ticket Minting", function () {
    beforeEach(async function () {
      // Create event first
      await luminaTicket
        .connect(organizer)
        .createEvent(
          EVENT_DATA.title,
          EVENT_DATA.description,
          EVENT_DATA.date,
          EVENT_DATA.location,
          EVENT_DATA.prices,
          EVENT_DATA.supplies,
          EVENT_DATA.imageUrl,
          EVENT_DATA.category,
          EVENT_DATA.royaltyPercentage
        );
    });

    it("Should mint tickets successfully", async function () {
      const ticketPrice = ethers.parseEther("0.1");
      const quantity = 2;

      const tx = await luminaTicket
        .connect(organizer)
        .mintTickets(1, 1, quantity, buyer.address, {
          value: ticketPrice * BigInt(quantity),
        });

      await expect(tx)
        .to.emit(luminaTicket, "TicketMinted")
        .withArgs(1, 1, buyer.address, 1);

      // Check ticket ownership
      const tokenId = await luminaTicket.generateTokenId(1, 1); // event 1, type 1
      expect(await luminaTicket.balanceOf(buyer.address, tokenId)).to.equal(
        quantity
      );

      // Check ticket data
      const ticket = await luminaTicket.tickets(1);
      expect(ticket.ownerAddress).to.equal(buyer.address);
      expect(ticket.eventId).to.equal(1);
      expect(ticket.ticketType).to.equal(1);
      expect(ticket.isUsed).to.equal(false);
    });

    it("Should fail with insufficient payment", async function () {
      const insufficientPayment = ethers.parseEther("0.05"); // Less than 0.1 ETH

      await expect(
        luminaTicket.connect(organizer).mintTickets(1, 1, 1, buyer.address, {
          value: insufficientPayment,
        })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should handle royalty payments", async function () {
      const ticketPrice = ethers.parseEther("0.1");
      const royaltyPercentage = 500; // 5%

      const initialBalance = await ethers.provider.getBalance(
        organizer.address
      );

      await luminaTicket
        .connect(organizer)
        .mintTickets(1, 1, 1, buyer.address, {
          value: ticketPrice,
        });

      // Check that royalties were accumulated
      const royalties = await luminaTicket.organizerRoyalties(
        organizer.address
      );
      const expectedRoyalty =
        (ticketPrice * BigInt(royaltyPercentage)) / BigInt(10000);
      expect(royalties).to.equal(expectedRoyalty);
    });
  });

  describe("Ticket Transfers", function () {
    beforeEach(async function () {
      // Create event and mint ticket
      await luminaTicket
        .connect(organizer)
        .createEvent(
          EVENT_DATA.title,
          EVENT_DATA.description,
          EVENT_DATA.date,
          EVENT_DATA.location,
          EVENT_DATA.prices,
          EVENT_DATA.supplies,
          EVENT_DATA.imageUrl,
          EVENT_DATA.category,
          EVENT_DATA.royaltyPercentage
        );

      await luminaTicket
        .connect(organizer)
        .mintTickets(1, 1, 1, buyer.address, {
          value: ethers.parseEther("0.1"),
        });
    });

    it("Should transfer tickets with royalties", async function () {
      const tokenId = await luminaTicket.generateTokenId(1, 1);
      const recipient = addrs[0];

      const initialRoyalties = await luminaTicket.organizerRoyalties(
        organizer.address
      );

      await luminaTicket.connect(buyer).transferTicket(1, recipient.address);

      // Check token transfer
      expect(await luminaTicket.balanceOf(buyer.address, tokenId)).to.equal(0);
      expect(await luminaTicket.balanceOf(recipient.address, tokenId)).to.equal(
        1
      );

      // Check ticket ownership updated
      const ticket = await luminaTicket.tickets(1);
      expect(ticket.ownerAddress).to.equal(recipient.address);

      // Check royalties increased
      const finalRoyalties = await luminaTicket.organizerRoyalties(
        organizer.address
      );
      expect(finalRoyalties).to.be.gt(initialRoyalties);
    });

    it("Should fail to transfer used ticket", async function () {
      // Use the ticket first
      await luminaTicket.connect(buyer).useTicket(1);

      // Try to transfer
      await expect(
        luminaTicket.connect(buyer).transferTicket(1, addrs[0].address)
      ).to.be.revertedWith("Ticket already used");
    });
  });

  describe("Ticket Usage", function () {
    beforeEach(async function () {
      // Create event and mint ticket
      await luminaTicket
        .connect(organizer)
        .createEvent(
          EVENT_DATA.title,
          EVENT_DATA.description,
          EVENT_DATA.date,
          EVENT_DATA.location,
          EVENT_DATA.prices,
          EVENT_DATA.supplies,
          EVENT_DATA.imageUrl,
          EVENT_DATA.category,
          EVENT_DATA.royaltyPercentage
        );

      await luminaTicket
        .connect(organizer)
        .mintTickets(1, 1, 1, buyer.address, {
          value: ethers.parseEther("0.1"),
        });
    });

    it("Should mark ticket as used and burn token", async function () {
      const tokenId = await luminaTicket.generateTokenId(1, 1);

      // Check initial state
      expect(await luminaTicket.balanceOf(buyer.address, tokenId)).to.equal(1);

      await luminaTicket.connect(buyer).useTicket(1);

      // Check ticket is marked as used
      const ticket = await luminaTicket.tickets(1);
      expect(ticket.isUsed).to.equal(true);

      // Check token is burned
      expect(await luminaTicket.balanceOf(buyer.address, tokenId)).to.equal(0);

      await expect(luminaTicket.connect(buyer).useTicket(1)).to.be.revertedWith(
        "Ticket already used"
      );
    });
  });

  describe("Royalty Withdrawal", function () {
    beforeEach(async function () {
      // Create event and mint ticket to generate royalties
      await luminaTicket
        .connect(organizer)
        .createEvent(
          EVENT_DATA.title,
          EVENT_DATA.description,
          EVENT_DATA.date,
          EVENT_DATA.location,
          EVENT_DATA.prices,
          EVENT_DATA.supplies,
          EVENT_DATA.imageUrl,
          EVENT_DATA.category,
          EVENT_DATA.royaltyPercentage
        );

      await luminaTicket
        .connect(organizer)
        .mintTickets(1, 1, 1, buyer.address, {
          value: ethers.parseEther("0.1"),
        });
    });

    it("Should allow organizers to withdraw royalties", async function () {
      const initialBalance = await ethers.provider.getBalance(
        organizer.address
      );
      const royalties = await luminaTicket.organizerRoyalties(
        organizer.address
      );

      expect(royalties).to.be.gt(0);

      const tx = await luminaTicket.connect(organizer).withdrawRoyalties();
      const receipt = await tx.wait();

      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const finalBalance = await ethers.provider.getBalance(organizer.address);

      expect(finalBalance).to.equal(initialBalance - gasCost + royalties);

      // Royalties should be reset to 0
      expect(await luminaTicket.organizerRoyalties(organizer.address)).to.equal(
        0
      );
    });
  });
});
