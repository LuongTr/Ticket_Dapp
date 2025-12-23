# Lumina Web3 - Smart Contracts

This directory contains the smart contracts and deployment scripts for the Lumina NFT Event Ticketing platform.

## Overview

The LuminaTicket contract is an ERC-1155 compliant smart contract that enables:

- Creation of events with multiple ticket types
- Minting of NFT tickets with royalties
- Secure transfer of tickets between users
- Verification of ticket ownership and usage
- Automatic royalty payments to event organizers

## Project Structure

```
web3/
├── contracts/
│   └── LuminaTicket.sol          # Main ERC-1155 contract
├── scripts/
│   └── deploy.js                 # Deployment script
├── test/
│   └── LuminaTicket.test.js      # Contract tests
├── hardhat.config.js             # Hardhat configuration
├── .env.example                  # Environment variables template
└── README.md                     # This file
```

## Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Fill in your environment variables:

   - `INFURA_API_KEY`: Get from [Infura](https://infura.io/)
   - `PRIVATE_KEY`: Your wallet private key (use a test wallet for Sepolia)
   - `ETHERSCAN_API_KEY`: Get from [Etherscan](https://etherscan.io/)

## Usage

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm run test
```

### Deploy to Local Network

```bash
npm run deploy:local
```

### Deploy to Sepolia Testnet

```bash
npm run deploy:sepolia
```

## Contract Features

### Event Creation

Events can be created with multiple ticket types (VIP, General, Early Bird, etc.):

```javascript
await contract.createEvent(
  "Music Festival",
  "Amazing music event",
  "2024-12-25",
  "Concert Hall",
  [ethers.parseEther("0.5"), ethers.parseEther("0.2")], // VIP, General prices
  [100, 500], // Supplies
  "https://example.com/image.jpg",
  "Music",
  500 // 5% royalty
);
```

### Token ID Structure

Token IDs are generated as: `eventId * 1000 + ticketType`

- Event 1, VIP tickets: `1001`
- Event 1, General tickets: `1002`
- Event 2, VIP tickets: `2001`

### Ticket Lifecycle

1. **Minting**: Organizer mints tickets for buyers
2. **Transfer**: Buyers can transfer tickets (with royalty fees)
3. **Usage**: Tickets can be marked as used (burned)
4. **Royalties**: Organizers earn royalties on secondary sales

## Contract Functions

### Core Functions

- `createEvent()` - Create new events
- `mintTickets()` - Mint tickets for buyers
- `transferTicket()` - Transfer tickets between users
- `useTicket()` - Mark ticket as used
- `withdrawRoyalties()` - Organizer royalty withdrawal

### View Functions

- `getEvent()` - Get event details
- `getTicket()` - Get ticket details
- `getTicketsByOwner()` - Get tickets owned by an address
- `generateTokenId()` - Generate token ID from event and ticket type

## Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Access Control**: Only organizers can mint tickets for their events
- **Input Validation**: Comprehensive input validation
- **Royalty Protection**: Automatic royalty collection on transfers

## Testing

Run the full test suite:

```bash
npm test
```

Tests cover:

- Event creation
- Ticket minting and payment
- Ticket transfers with royalties
- Ticket usage and burning
- Royalty withdrawal

## Deployment

### Local Development

```bash
npx hardhat node    # Start local Hardhat network
npm run deploy:local
```

### Sepolia Testnet

```bash
npm run deploy:sepolia
```

The deployment script will:

1. Deploy the contract
2. Wait for confirmations
3. Verify the contract on Etherscan
4. Save deployment info to `deployment.json`

## Integration with Frontend

The contract is designed to work seamlessly with the React frontend. Key integration points:

- Event creation through the CreateEvent page
- Ticket purchasing through event detail pages
- Wallet connection for transaction signing
- Real-time balance updates

## Gas Optimization

The contract uses several gas optimization techniques:

- ERC-1155 batch operations for multiple ticket minting
- Efficient data structures
- Minimal storage operations
- Optimized royalty calculations

## License

This project is licensed under the MIT License.
