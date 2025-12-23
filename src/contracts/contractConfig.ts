import { ethers } from 'ethers';

// Contract ABI - generated from Hardhat compilation
export const LUMINA_TICKET_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },

  /* ─────────────── EVENTS ─────────────── */

  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "eventId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "organizer", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "title", "type": "string" }
    ],
    "name": "EventCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "ticketId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "eventId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "ticketType", "type": "uint256" }
    ],
    "name": "TicketMinted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "ticketId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" }
    ],
    "name": "TicketTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "ticketId", "type": "uint256" }
    ],
    "name": "TicketUsed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "organizer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "RoyaltyWithdrawn",
    "type": "event"
  },

  /* ─────────────── WRITE FUNCTIONS ─────────────── */

  {
    "inputs": [
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "string", "name": "_description", "type": "string" },
      { "internalType": "string", "name": "_date", "type": "string" },
      { "internalType": "string", "name": "_location", "type": "string" },
      { "internalType": "uint256[]", "name": "_prices", "type": "uint256[]" },
      { "internalType": "uint256[]", "name": "_supplies", "type": "uint256[]" },
      { "internalType": "string", "name": "_imageUrl", "type": "string" },
      { "internalType": "string", "name": "_category", "type": "string" },
      { "internalType": "uint256", "name": "_royaltyPercentage", "type": "uint256" }
    ],
    "name": "createEvent",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "uint256", "name": "_eventId", "type": "uint256" },
      { "internalType": "uint256", "name": "_ticketType", "type": "uint256" },
      { "internalType": "uint256", "name": "_quantity", "type": "uint256" },
      { "internalType": "address", "name": "_buyer", "type": "address" }
    ],
    "name": "mintTickets",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "uint256", "name": "_ticketId", "type": "uint256" },
      { "internalType": "address", "name": "_to", "type": "address" }
    ],
    "name": "transferTicket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "uint256", "name": "_ticketId", "type": "uint256" }
    ],
    "name": "useTicket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "withdrawRoyalties",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  /* ─────────────── READ FUNCTIONS ─────────────── */

  {
    "inputs": [
      { "internalType": "uint256", "name": "_eventId", "type": "uint256" }
    ],
    "name": "getEvent",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "eventId", "type": "uint256" },
          { "internalType": "string", "name": "title", "type": "string" },
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "string", "name": "date", "type": "string" },
          { "internalType": "string", "name": "location", "type": "string" },
          { "internalType": "uint256", "name": "priceETH", "type": "uint256" },
          { "internalType": "string", "name": "imageUrl", "type": "string" },
          { "internalType": "address", "name": "organizer", "type": "address" },
          { "internalType": "uint256", "name": "totalTickets", "type": "uint256" },
          { "internalType": "uint256", "name": "soldTickets", "type": "uint256" },
          { "internalType": "string", "name": "category", "type": "string" },
          { "internalType": "bool", "name": "isActive", "type": "bool" },
          { "internalType": "uint256", "name": "royaltyPercentage", "type": "uint256" }
        ],
        "internalType": "struct LuminaTicket.EventData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "uint256", "name": "_ticketId", "type": "uint256" }
    ],
    "name": "getTicket",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "ticketId", "type": "uint256" },
          { "internalType": "uint256", "name": "eventId", "type": "uint256" },
          { "internalType": "address", "name": "ownerAddress", "type": "address" },
          { "internalType": "uint256", "name": "purchaseDate", "type": "uint256" },
          { "internalType": "string", "name": "qrCodeData", "type": "string" },
          { "internalType": "bool", "name": "isUsed", "type": "bool" },
          { "internalType": "uint256", "name": "ticketType", "type": "uint256" }
        ],
        "internalType": "struct LuminaTicket.TicketData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "address", "name": "_owner", "type": "address" },
      { "internalType": "uint256", "name": "_eventId", "type": "uint256" }
    ],
    "name": "getTicketsByOwner",
    "outputs": [
      { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "uint256", "name": "_eventId", "type": "uint256" },
      { "internalType": "uint256", "name": "_ticketType", "type": "uint256" }
    ],
    "name": "generateTokenId",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "pure",
    "type": "function"
  },

  /* ─────────────── ERC1155 STANDARD ─────────────── */

  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "uint256", "name": "id", "type": "uint256" }
    ],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [
      { "internalType": "address", "name": "from", "type": "address" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Contract address from deployment
export const CONTRACT_ADDRESS = (import.meta as any).env?.VITE_CONTRACT_ADDRESS || '0x06E15Ed01A4330fd008DC7A40a2671FEC06E86BA';

// Create contract instance (now only uses provided provider/signer)
export function getContract(provider?: ethers.Provider, signer?: ethers.Signer) {
  const contractAddress = CONTRACT_ADDRESS;
  console.log('🎯 Creating contract with address:', contractAddress);
  console.log('🎯 Provider provided:', !!provider);
  console.log('🎯 Signer provided:', !!signer);

  if (signer) {
    return new ethers.Contract(contractAddress, LUMINA_TICKET_ABI, signer);
  } else if (provider) {
    return new ethers.Contract(contractAddress, LUMINA_TICKET_ABI, provider);
  } else {
    throw new Error('Provider or signer required for contract initialization');
  }
}

// Contract interaction functions will be added in contractService.ts
