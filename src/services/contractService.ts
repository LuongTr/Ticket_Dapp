import { ethers, Contract, BrowserProvider, JsonRpcSigner } from 'ethers';
import { getContract, CONTRACT_ADDRESS } from '../contracts/contractConfig';
import { NftEvent, Ticket } from '../../types';

// Contract service class for all blockchain interactions
export class ContractService {
  private contract: Contract | null = null;
  private signer: JsonRpcSigner | null = null;
  private provider: BrowserProvider | null = null;

  // Initialize with MetaMask
  async initializeWithMetaMask() {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask.');
    }

    try {
      this.provider = new BrowserProvider(window.ethereum);
      await this.provider.send('eth_requestAccounts', []);
      this.signer = await this.provider.getSigner();
      this.contract = getContract(this.provider, this.signer);
    } catch (error) {
      console.error('Failed to initialize MetaMask:', error);
      throw error;
    }
  }

  // Initialize with MetaMask provider (required for all contract interactions)
  async initializeReadOnly() {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask to use this app.');
    }

    // Don't reinitialize if already done
    if (this.contract) {
      console.log('🔄 Contract already initialized, skipping...');
      return;
    }

    try {
      console.log('🚀 Initializing MetaMask provider...');
      // Use MetaMask's provider for all contract calls
      this.provider = new BrowserProvider(window.ethereum);
      this.contract = getContract(this.provider);
      console.log('✅ Contract initialized successfully:', !!this.contract);
    } catch (error) {
      console.error('Failed to initialize MetaMask provider:', error);
      throw error;
    }
  }

  // Get signer address
  async getSignerAddress(): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized');
    return await this.signer.getAddress();
  }

  // Get user balance
  async getBalance(): Promise<string> {
    if (!this.signer) throw new Error('Signer not initialized');
    const balance = await this.provider!.getBalance(await this.signer.getAddress());
    return ethers.formatEther(balance);
  }

  // EVENT FUNCTIONS

  // Create a new event
  async createEvent(eventData: {
    title: string;
    description: string;
    date: string;
    location: string;
    prices: number[]; // ETH prices for different ticket types
    supplies: number[]; // Supply for each ticket type
    imageUrl: string;
    category: string;
    royaltyPercentage: number; // in basis points (500 = 5%)
  }): Promise<number> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized or signer not available');
    }

    try {
      // Convert prices to wei
      const pricesWei = eventData.prices.map(price => ethers.parseEther(price.toString()));

      const tx = await (this.contract as any).createEvent(
        eventData.title,
        eventData.description,
        eventData.date,
        eventData.location,
        pricesWei,
        eventData.supplies,
        eventData.imageUrl,
        eventData.category,
        eventData.royaltyPercentage
      );

      const receipt = await tx.wait();
      console.log('Event created:', receipt);

      // For now, we'll get the next event ID to determine the created event ID
      // In production, you'd parse the event logs properly
      const nextEventId = await (this.contract as any).nextEventId();
      return Number(nextEventId) - 1; // The event ID we just created
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  // Get event details by ID
  async getEvent(eventId: number): Promise<any> {
    if (!this.contract) throw new Error('Contract not initialized');

    try {
      const eventData = await (this.contract as any).getEvent(eventId);

      // Parse the struct data
      const [
        eventIdReturned,
        title,
        description,
        date,
        location,
        priceETH,
        imageUrl,
        organizer,
        totalTickets,
        soldTickets,
        category,
        isActive,
        royaltyPercentage
      ] = eventData;

      return {
        id: eventId.toString(),
        title,
        description,
        date,
        location,
        priceETH: ethers.formatEther(priceETH),
        imageUrl,
        organizer,
        totalTickets: Number(totalTickets),
        soldTickets: Number(soldTickets),
        category,
        reviews: [] // Reviews are handled off-chain
      };
    } catch (error) {
      console.error('Failed to get event:', error);
      throw error;
    }
  }

  // Get all events (this is simplified - in production you'd use events or indexing)
  async getAllEvents(): Promise<any[]> {
    console.log('🔍 getAllEvents called, contract status:', {
      contractExists: !!this.contract,
      contractAddress: this.contract?.address,
      providerExists: !!this.provider
    });

    if (!this.contract) {
      console.log('🚨 Contract not initialized, attempting to initialize...');
      await this.initializeReadOnly();
    }

    if (!this.contract) {
      throw new Error('Failed to initialize contract');
    }

    try {
      console.log('🔍 Getting all events from contract...');

      const nextEventIdResult = await (this.contract as any).nextEventId();
      const nextEventId = Number(nextEventIdResult);

      console.log('📊 nextEventId:', nextEventId);
      console.log('📊 nextEventId type:', typeof nextEventId);

      const events = [];

      // Get last 10 events (simplified approach)
      const startId = Math.max(1, nextEventId - 10);
      console.log('🎯 Checking events from ID', startId, 'to', nextEventId - 1);

      for (let i = startId; i < nextEventId; i++) {
        console.log(`🔎 Attempting to fetch event ID: ${i}`);

        try {
          console.log(`📞 Calling events(${i}) mapping getter...`);

          // Use the events mapping getter instead of getEvent function
          const eventData = await (this.contract as any).events(i);
          console.log(`✅ SUCCESS: events(${i}) returned:`, eventData);
          console.log(`📊 eventData type:`, typeof eventData);
          console.log(`📊 eventData isArray:`, Array.isArray(eventData));
          console.log(`📊 eventData length:`, eventData?.length);

          // Parse the struct data - ensure we have the right format
          if (eventData && Array.isArray(eventData) && eventData.length >= 13) {
            console.log(`🔍 Parsing struct fields:`);
            console.log(`  eventData[0] (eventId):`, eventData[0], typeof eventData[0]);
            console.log(`  eventData[1] (title):`, eventData[1], typeof eventData[1]);
            console.log(`  eventData[5] (priceETH):`, eventData[5], typeof eventData[5]);

            const parsedEvent = {
              id: i.toString(),
              title: eventData[1]?.toString() || '',
              description: eventData[2]?.toString() || '',
              date: eventData[3]?.toString() || '',
              location: eventData[4]?.toString() || '',
              priceETH: eventData[5] ? ethers.formatEther(eventData[5]) : '0',
              imageUrl: eventData[6]?.toString() || '',
              organizer: eventData[7]?.toString() || '',
              totalTickets: eventData[8] ? Number(eventData[8]) : 0,
              soldTickets: eventData[9] ? Number(eventData[9]) : 0,
              category: eventData[10]?.toString() || '',
              isActive: Boolean(eventData[11]),
              royaltyPercentage: eventData[12] ? Number(eventData[12]) : 0
            };

            console.log(`🎉 Successfully parsed event ${i}:`, parsedEvent);
            events.push(parsedEvent);
          } else {
            console.log(`⚠️ Event ${i} has invalid data format:`, {
              isArray: Array.isArray(eventData),
              length: eventData?.length,
              data: eventData
            });
          }
        } catch (getEventError) {
          console.log(`❌ events(${i}) mapping getter failed:`, getEventError.message);
          console.log(`❌ Error details:`, getEventError);
          console.log(`❌ Error stack:`, getEventError.stack);

          // Check if it's a specific ethers error
          if (getEventError.message.includes('key.format')) {
            console.log(`🔍 This is a BigNumber formatting error. Event ${i} might exist but parsing failed.`);
          }
        }
      }

      console.log('📋 Final events array:', events);
      return events.reverse(); // Most recent first
    } catch (error) {
      console.error('❌ Failed to get all events:', error);
      throw error;
    }
  }

  // TICKET FUNCTIONS

  // Mint tickets
  async mintTickets(
    eventId: number,
    ticketType: number,
    quantity: number
  ): Promise<void> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized or signer not available');
    }

    try {
      // Get event details to calculate price
      const eventData = await (this.contract as any).getEvent(eventId);
      const priceWei = eventData[5]; // priceETH is at index 5 in the struct

      const totalPrice = priceWei * BigInt(quantity);
      const buyerAddress = await this.signer.getAddress();

      const tx = await (this.contract as any).mintTickets(
        eventId,
        ticketType,
        quantity,
        buyerAddress,
        { value: totalPrice }
      );

      const receipt = await tx.wait();
      console.log('Tickets minted:', receipt);
    } catch (error) {
      console.error('Failed to mint tickets:', error);
      throw error;
    }
  }

  // Get ticket details
  async getTicket(ticketId: number): Promise<any> {
    if (!this.contract) throw new Error('Contract not initialized');

    try {
      const ticketData = await (this.contract as any).getTicket(ticketId);

      const [
        ticketIdReturned,
        eventId,
        ownerAddress,
        purchaseDate,
        qrCodeData,
        isUsed,
        ticketType
      ] = ticketData;

      return {
        id: ticketId.toString(),
        eventId: eventId.toString(),
        ownerAddress,
        purchaseDate: new Date(Number(purchaseDate) * 1000).toISOString(),
        qrCodeData,
        isUsed,
        ticketType: Number(ticketType)
      };
    } catch (error) {
      console.error('Failed to get ticket:', error);
      throw error;
    }
  }

  // Transfer ticket
  async transferTicket(ticketId: number, toAddress: string): Promise<void> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized or signer not available');
    }

    try {
      const tx = await this.contract.transferTicket(ticketId, toAddress);
      await tx.wait();
      console.log('Ticket transferred successfully');
    } catch (error) {
      console.error('Failed to transfer ticket:', error);
      throw error;
    }
  }

  // Use ticket (mark as used)
  async useTicket(ticketId: number): Promise<void> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized or signer not available');
    }

    try {
      const tx = await this.contract.useTicket(ticketId);
      await tx.wait();
      console.log('Ticket marked as used');
    } catch (error) {
      console.error('Failed to use ticket:', error);
      throw error;
    }
  }

  // Get tickets owned by user for specific event
  async getTicketsByOwner(ownerAddress: string, eventId: number): Promise<number[]> {
    if (!this.contract) throw new Error('Contract not initialized');

    try {
      const ticketIds = await (this.contract as any).getTicketsByOwner(ownerAddress, eventId);
      return ticketIds.map((id: any) => Number(id));
    } catch (error) {
      console.error('Failed to get tickets by owner:', error);
      throw error;
    }
  }

  // ROYALTY FUNCTIONS

  // Get organizer royalties
  async getOrganizerRoyalties(organizerAddress: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');

    try {
      const royalties = await this.contract.organizerRoyalties(organizerAddress);
      return ethers.formatEther(royalties);
    } catch (error) {
      console.error('Failed to get organizer royalties:', error);
      throw error;
    }
  }

  // Withdraw royalties
  async withdrawRoyalties(): Promise<void> {
    if (!this.contract || !this.signer) {
      throw new Error('Contract not initialized or signer not available');
    }

    try {
      const tx = await this.contract.withdrawRoyalties();
      await tx.wait();
      console.log('Royalties withdrawn successfully');
    } catch (error) {
      console.error('Failed to withdraw royalties:', error);
      throw error;
    }
  }

  // UTILITY FUNCTIONS

  // Check if user is connected
  isConnected(): boolean {
    return this.signer !== null;
  }

  // Get contract address
  getContractAddress(): string {
    return CONTRACT_ADDRESS;
  }

  // Event listeners can be added later once basic integration is working
  // onEventCreated(callback: (eventId: number, organizer: string, title: string) => void) {
  //   // Implementation for real-time event updates
  // }

  // onTicketMinted(callback: (ticketId: number, eventId: number, buyer: string, ticketType: number) => void) {
  //   // Implementation for real-time ticket updates
  // }
}

// Singleton instance
export const contractService = new ContractService();
