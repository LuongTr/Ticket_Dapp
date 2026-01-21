# Lumina - NFT Event Ticketing Platform

## Overview

Lumina is a revolutionary NFT-based event ticketing platform built on Ethereum blockchain. It eliminates counterfeit tickets, scalping, and provides secure, transparent ticketing with smart contract-backed NFTs. Event organizers earn perpetual royalties on secondary ticket sales while attendees enjoy instant transfers and verified ownership.

## Features

- **Secure NFT Tickets**: Every ticket is an ERC-1155 NFT with cryptographic proof of ownership
- **Instant Transfers**: Send tickets to friends or resell them instantly on the blockchain
- **Smart Royalties**: Organizers earn automatic royalties on every secondary sale
- **Anti-Scalping**: Smart contracts prevent price gouging and ticket bots
- **QR Code Verification**: Seamless check-in with blockchain-verified QR codes
- **Decentralized**: No single point of failure, powered by Ethereum
- **Real-time Analytics**: Comprehensive insights for organizers and attendees
- **Auction System**: Built-in marketplace for ticket auctions

## Architecture

Lumina consists of three main components:

### Frontend

- **Framework**: React 19 + TypeScript + Vite
- **UI**: Custom responsive design with Tailwind CSS
- **Blockchain Integration**: ethers.js for wallet connections and contract interactions
- **Features**: QR code generation, real-time statistics, event management

### Smart Contracts

- **Framework**: Hardhat + Solidity
- **Standard**: ERC-1155 for multi-token support
- **Network**: Ethereum Sepolia testnet
- **Features**: Event creation, ticket minting, royalty management, secure transfers

## Prerequisites

Before running Lumina, ensure you have the following installed:

### Required Accounts & APIs

- **Infura Account**: For Ethereum Sepolia RPC access ([infura.io](https://infura.io/))
- **Pinata Account**: For IPFS file storage ([pinata.cloud](https://pinata.cloud/))
- **Etherscan Account**: For contract verification ([etherscan.io](https://etherscan.io/))
- **MetaMask Wallet**: For blockchain interactions (recommended)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/LuongTr/Ticket_Dapp.git
cd Ticket_Dapp
```

### 2. Smart Contracts Setup

```bash
# Navigate to web3 directory
cd web3

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# INFURA_API_KEY=your_infura_api_key
# PRIVATE_KEY=your_private_key_without_0x
# ETHERSCAN_API_KEY=your_etherscan_api_key

# Compile contracts
npm run compile

# Deploy to Sepolia testnet (optional - already deployed)
npm run deploy:sepolia

# Verify contract on Etherscan (optional)
npm run verify:sepolia
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (root)
cd ..

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your configuration (see Environment Variables section)

# Start the development server
npm run dev
```

## Environment Variables

### Frontend (.env.local)

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Contract Configuration
VITE_CONTRACT_ADDRESS=0xd2c7D664cD1CF54f046BF6086AfC2cAc0B552f43
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY
```

### Smart Contracts (web3/.env)

```env
# Infura API Key
INFURA_API_KEY=your_infura_api_key

# Private Key (NEVER commit - use test account)
PRIVATE_KEY=your_private_key_without_0x_prefix

# Etherscan API Key (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key

# Optional: Gas reporting
REPORT_GAS=true
```

## Running the Application

### Development Mode

1. **Start Frontend**:

   ```bash
   npm run dev
   ```

   Application will be available at http://localhost:3000
