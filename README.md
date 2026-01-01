# Lumina - NFT Event Ticketing Platform

<div align="center">
<img width="1200" height="475" alt="Lumina Banner" src="https://github.com/user-attachments/assets/lumina-banner" />
</div>

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

### Backend API

- **Framework**: Node.js + Express.js
- **Database**: Microsoft SQL Server
- **Blockchain**: ethers.js for contract interactions
- **IPFS**: Pinata integration for metadata storage
- **Security**: Helmet, CORS, rate limiting

### Smart Contracts

- **Framework**: Hardhat + Solidity
- **Standard**: ERC-1155 for multi-token support
- **Network**: Ethereum Sepolia testnet
- **Features**: Event creation, ticket minting, royalty management, secure transfers

## Prerequisites

Before running Lumina, ensure you have the following installed:

### System Requirements

- **Node.js** (>= 18.0.0)
- **npm** (>= 8.0.0) or **yarn**
- **Git**
- **Microsoft SQL Server** (for database) or alternative SQL database

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

### 2. Database Setup

#### Option A: Microsoft SQL Server (Recommended)

1. Install SQL Server Express or Developer Edition
2. Create a new database named `lumina_tickets`
3. Update connection settings in `lumina-api/.env` (see Environment Configuration)

#### Option B: Alternative Database

Modify `lumina-api/src/services/database.js` to use your preferred SQL database.

### 3. Smart Contracts Setup

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

### 4. Backend API Setup

```bash
# Navigate to API directory
cd ../lumina-api

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration (see Environment Variables section)

# Start the development server
npm run dev
```

### 5. Frontend Setup

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

### Backend (lumina-api/.env)

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration (MS SQL Server)
DB_SERVER=DESKTOP-UNPULAB
DB_DATABASE=lumina_tickets
DB_TRUSTED_CONNECTION=false
DB_USER=sa
DB_PASSWORD=your_password

# Blockchain Configuration
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY
CONTRACT_ADDRESS=0xd2c7D664cD1CF54f046BF6086AfC2cAc0B552f43

# Pinata Configuration (IPFS)
PINATA_JWT=your_pinata_jwt_token

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

## ▶️ Running the Application

### Development Mode

1. **Start Backend API** (Terminal 1):

   ```bash
   cd lumina-api
   npm run dev
   ```

   Server will start on http://localhost:3001

2. **Start Frontend** (Terminal 2):

   ```bash
   npm run dev
   ```

   Application will be available at http://localhost:3000

---

**Lumina** - Transforming event ticketing with blockchain technology ✨
