/**
 * Frontend IPFS Service for Lumina NFT Ticketing
 * Handles IPFS data retrieval from gateways (storage is handled by backend)
 */

class IPFSService {
  private readonly gateways = [
    'https://w3s.link/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://dweb.link/ipfs/'
  ];

  /**
   * Retrieve data from IPFS using multiple gateways for redundancy
   * @param cid - IPFS Content Identifier
   * @returns Promise with parsed JSON data
   */
  async getData(cid: string): Promise<any> {
    for (const gateway of this.gateways) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${gateway}${cid}`, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`📥 Retrieved data from IPFS (${gateway}): ${cid}`);
        return data;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn(`Timeout fetching from ${gateway}`);
        } else {
          console.warn(`Failed to fetch from ${gateway}:`, error.message);
        }
        continue; // Try next gateway
      }
    }

    throw new Error(`Failed to retrieve data from IPFS: ${cid}`);
  }

  /**
   * Get auction metadata from IPFS
   * @param cid - IPFS hash of auction metadata
   * @returns Promise with auction data
   */
  async getAuctionMetadata(cid: string): Promise<any> {
    const data = await this.getData(cid);
    if (data.type !== 'auction-metadata') {
      throw new Error('Invalid auction metadata format');
    }
    return data;
  }

  /**
   * Get bid data from IPFS
   * @param cid - IPFS hash of bid data
   * @returns Promise with bid data
   */
  async getBidData(cid: string): Promise<any> {
    const data = await this.getData(cid);
    if (data.type !== 'bid-data') {
      throw new Error('Invalid bid data format');
    }
    return data;
  }

  /**
   * Construct IPFS gateway URL for direct access
   * @param cid - IPFS Content Identifier
   * @param gatewayIndex - Index of gateway to use (default: 0)
   * @returns Full URL to access content
   */
  getGatewayUrl(cid: string, gatewayIndex: number = 0): string {
    return `${this.gateways[gatewayIndex]}${cid}`;
  }

  /**
   * Get image URL from IPFS hash
   * @param cid - IPFS hash of image
   * @returns URL to access image
   */
  getImageUrl(cid: string): string {
    return this.getGatewayUrl(cid);
  }
}

// Singleton instance
export const ipfsService = new IPFSService();

export default ipfsService;
