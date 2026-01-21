import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WalletState, NftEvent } from '../types';
import { auctionService, AuctionData } from '../src/services/auctionService';
import {
  ShoppingBag,
  Gavel,
  ArrowLeftRight,
  ArrowLeft,
  List,
  Eye,
  Search,
  Filter,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Heart,
  Zap,
  Timer,
  Calendar,
  MapPin,
  User,
  Plus,
  Minus,
  X,
  Check,
  Loader2,
  QrCode
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MarketplaceProps {
  wallet: WalletState;
  onConnectWallet?: () => void;
}

// Mock auction data (converted to match AuctionData interface)
const MOCK_AUCTIONS: AuctionData[] = [
  {
    id: 1,
    ticketId: 123,
    eventId: 1,
    event_title: 'Neon Nights Festival',
    event_date: '2024-12-15',
    event_location: 'Cyber Dome, Tokyo',
    event_image_url: 'https://picsum.photos/400/300?random=1',
    event_category: 'Music',
    sellerAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    startingPrice: 0.1,
    currentPrice: 0.35,
    highestBidder: '0x8ba1f109551bD432803012645ac136ddd64DBA72',
    bidCount: 7,
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    startTime: null,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    ticketId: 456,
    eventId: 2,
    event_title: 'Future Tech Summit',
    event_date: '2024-12-20',
    event_location: 'Silicon Valley Center',
    event_image_url: 'https://picsum.photos/400/300?random=2',
    event_category: 'Tech',
    sellerAddress: '0x3a4b5c6d7e8f9012345678901234567890123456',
    startingPrice: 0.5,
    currentPrice: 0.8,
    highestBidder: '0x9876543210987654321098765432109876543210',
    bidCount: 12,
    endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
    startTime: null,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    ticketId: 789,
    eventId: 3,
    event_title: 'Digital Art Exhibition',
    event_date: '2025-01-10',
    event_location: 'Meta Gallery',
    event_image_url: 'https://picsum.photos/400/300?random=3',
    event_category: 'Art',
    sellerAddress: '0x1111111111111111111111111111111111111111',
    startingPrice: 0.08,
    currentPrice: 0.15,
    highestBidder: '0x2222222222222222222222222222222222222222',
    bidCount: 4,
    endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
    startTime: null,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    ticketId: 101,
    eventId: 1,
    event_title: 'Neon Nights Festival',
    event_date: '2024-12-15',
    event_location: 'Cyber Dome, Tokyo',
    event_image_url: 'https://picsum.photos/400/300?random=1',
    event_category: 'Music',
    sellerAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    startingPrice: 0.2,
    currentPrice: 0.42,
    highestBidder: '0xfedcba0987654321fedcba0987654321fedcba09',
    bidCount: 9,
    endTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 minutes from now
    startTime: null,
    status: 'active',
    createdAt: new Date().toISOString(),
  }
];

const Marketplace: React.FC<MarketplaceProps> = ({ wallet, onConnectWallet }) => {
  const [activeTab, setActiveTab] = useState<'auctions' | 'list'>('auctions');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'ending-soon' | 'highest-bid' | 'newest' | 'lowest-price'>('ending-soon');
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // Auction Creation Form State
  const [auctionForm, setAuctionForm] = useState({
    startingPrice: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [isCreatingAuction, setIsCreatingAuction] = useState(false);
  const [auctionCreated, setAuctionCreated] = useState(false);

  // Bid Modal State
  const [selectedAuction, setSelectedAuction] = useState<AuctionData | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);

  // Countdown timers for auctions
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: { hours: number; minutes: number; seconds: number; totalMs: number } }>({});

  // Load auctions on component mount
  useEffect(() => {
    const loadAuctions = async () => {
      try {
        setLoading(true);
        setError(null);
        const auctionData = await auctionService.getAuctions();
        setAuctions(auctionData);
      } catch (err) {
        console.error('Failed to load auctions:', err);
        setError('Failed to load auctions. Please try again.');
        // Fallback to mock data for development
        setAuctions(MOCK_AUCTIONS);
      } finally {
        setLoading(false);
      }
    };

    if (wallet.isConnected) {
      loadAuctions();
    }
  }, [wallet.isConnected]);

  // Load user tickets when switching to list tab
  useEffect(() => {
    const loadUserTickets = async () => {
      if (!wallet.address || activeTab !== 'list') return;

      try {
        setLoadingTickets(true);

        const response = await fetch(`http://localhost:3001/api/marketplace/user-tickets/${wallet.address}`);
        const result = await response.json();

        if (result.success) {
          setUserTickets(result.data);
        }
      } catch (error) {
        console.error('Failed to load user tickets:', error);
      } finally {
        setLoadingTickets(false);
      }
    };

    loadUserTickets();
  }, [wallet.address, activeTab]);

  // Update countdown timers every second
  useEffect(() => {
    const updateTimers = () => {
      const now = new Date();
      const newTimeLeft: { [key: string]: { hours: number; minutes: number; seconds: number; totalMs: number } } = {};

      auctions.forEach(auction => {
        // Skip auctions with invalid endTime
        if (!auction.endTime) {
          newTimeLeft[auction.id] = { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
          return;
        }

        // Handle both string and Date formats for endTime
        const endTime = typeof auction.endTime === 'string' ? new Date(auction.endTime) : auction.endTime;

        // Additional safety check
        if (!endTime || isNaN(endTime.getTime())) {
          newTimeLeft[auction.id] = { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
          return;
        }

        const timeDiff = endTime.getTime() - now.getTime();
        if (timeDiff > 0) {
          const hours = Math.floor(timeDiff / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
          newTimeLeft[auction.id] = { hours, minutes, seconds, totalMs: timeDiff };
        } else {
          newTimeLeft[auction.id] = { hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
        }
      });

      setTimeLeft(newTimeLeft);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);

    return () => clearInterval(interval);
  }, [auctions]);

  // Helper function to truncate addresses
  const truncateAddress = (address: string) => {
    if (!address || address.length <= 12) return address || 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Helper function to format time left
  const formatTimeLeft = (time: { hours: number; minutes: number; seconds: number }) => {
    if (time.hours > 0) {
      return `${time.hours}h ${time.minutes}m`;
    } else if (time.minutes > 0) {
      return `${time.minutes}m ${time.seconds}s`;
    } else {
      return `${time.seconds}s`;
    }
  };

  // Helper function to get auction title (handles both data structures)
  const getAuctionTitle = (auction: AuctionData) => {
    // Real API data structure
    if (auction.event_title) return auction.event_title;
    // Mock data structure (fallback)
    if ((auction as any).event?.title) return (auction as any).event.title;
    return 'Unknown Event';
  };

  // Helper function to get auction location
  const getAuctionLocation = (auction: AuctionData) => {
    if (auction.event_location) return auction.event_location;
    if ((auction as any).event?.location) return (auction as any).event.location;
    return 'Unknown Location';
  };

  // Helper function to get event date
  const getEventDate = (auction: AuctionData) => {
    if (auction.event_date) return auction.event_date;
    if ((auction as any).event?.date) return (auction as any).event.date;
    return '';
  };

  // Helper function to get event image
  const getEventImage = (auction: AuctionData) => {
    if (auction.event_image_url) return auction.event_image_url;
    if ((auction as any).event?.imageUrl) return (auction as any).event.imageUrl;
    return 'https://picsum.photos/400/300?random=default';
  };

  // Form validation
  const validateAuctionForm = () => {
    const errors: {[key: string]: string} = {};

    if (!selectedTicket) {
      errors.ticket = 'Please select a ticket to auction';
    }

    if (!auctionForm.startingPrice || parseFloat(auctionForm.startingPrice) <= 0) {
      errors.startingPrice = 'Starting price must be greater than 0';
    }

    if (!auctionForm.startDate) {
      errors.startDate = 'Auction start date is required';
    }

    if (!auctionForm.startTime) {
      errors.startTime = 'Auction start time is required';
    }

    if (!auctionForm.endDate) {
      errors.endDate = 'Auction end date is required';
    }

    if (!auctionForm.endTime) {
      errors.endTime = 'Auction end time is required';
    }

    // Validate date/time logic
    if (auctionForm.startDate && auctionForm.endDate && auctionForm.startTime && auctionForm.endTime) {
      const startDateTime = new Date(`${auctionForm.startDate}T${auctionForm.startTime}`);
      const endDateTime = new Date(`${auctionForm.endDate}T${auctionForm.endTime}`);
      const now = new Date();

      if (startDateTime <= now) {
        errors.startTime = 'Auction start time must be in the future';
      }

      if (endDateTime <= startDateTime) {
        errors.endTime = 'Auction end time must be after start time';
      }

      // Minimum auction duration: 1 hour
      const duration = endDateTime.getTime() - startDateTime.getTime();
      if (duration < 60 * 60 * 1000) {
        errors.endTime = 'Auction must last at least 1 hour';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input changes
  const handleFormChange = (field: string, value: string) => {
    setAuctionForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle bid placement
  const handlePlaceBid = async () => {
    if (!selectedAuction || !bidAmount) {
      return;
    }

    try {
      setIsPlacingBid(true);

      // Generate message and signature for wallet verification
      const message = `Place bid of ${bidAmount} ETH on auction for ticket #${selectedAuction.ticketId} (${getAuctionTitle(selectedAuction)}). Timestamp: ${new Date().toISOString()}`;

      // Request user signature (this will show MetaMask popup)
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, wallet.address],
      });

      const bidData = {
        bidAmount: parseFloat(bidAmount),
        signature,
        message,
      };

      // Submit bid to backend
      const bidResponse = await fetch(`http://localhost:3001/api/marketplace/${selectedAuction.id}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bidData),
      });

      const bidResult = await bidResponse.json();

      if (!bidResult.success) {
        console.error('❌ Bid submission failed:', bidResult.error);
        //alert(`Bid failed: ${bidResult.error}`);
        toast.error(`Bid failed: ${bidResult.error}`);
        setIsPlacingBid(false);
        return;
      }

      // Update auction data locally
      const updatedAuctions = auctions.map(auction =>
        auction.id === selectedAuction.id
          ? {
              ...auction,
              currentPrice: parseFloat(bidAmount),
              highestBidder: wallet.address,
              bidCount: (auction.bidCount || 0) + 1,
              lastBidTime: new Date().toISOString(),
            }
          : auction
      );

      setAuctions(updatedAuctions);

      // Close modal and show success
      setSelectedAuction(null);
      setBidAmount('');

      //alert('Bid placed successfully! You are now the highest bidder.');
      toast.success('Bid placed successfully! You are now the highest bidder.');

    } catch (error) {
      console.error('❌ Error placing bid:', error);
      //alert('Failed to place bid. Please try again.');
      toast.error('Failed to place bid. Please try again.');
    } finally {
      setIsPlacingBid(false);
    }
  };

  // Handle auction creation
  const handleCreateAuction = async () => {
    if (!validateAuctionForm() || !selectedTicket) {
      return;
    }

    try {
      setIsCreatingAuction(true);

      // Check if ticket is already in an active auction
      const checkResponse = await fetch(`http://localhost:3001/api/marketplace/check-ticket/${selectedTicket.ticketId}`);
      const checkResult = await checkResponse.json();

      if (checkResult.success && checkResult.inAuction) {
        setFormErrors({ ticket: "This ticket is already listed for auction" });
        setIsCreatingAuction(false);
        return;
      }

      // Combine date and time
      const startDateTime = new Date(`${auctionForm.startDate}T${auctionForm.startTime}`).toISOString();
      const endDateTime = new Date(`${auctionForm.endDate}T${auctionForm.endTime}`).toISOString();

      // Generate message and signature for wallet verification
      const message = `Create auction for ticket #${selectedTicket.ticketId} (${selectedTicket.eventTitle}) with starting price ${auctionForm.startingPrice} ETH. Timestamp: ${new Date().toISOString()}`;

      // Request user signature (this will show MetaMask popup)
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, wallet.address],
      });

      const auctionData = {
        ticketId: selectedTicket.ticketId.toString(),
        eventId: selectedTicket.eventId.toString(),
        startingPrice: parseFloat(auctionForm.startingPrice),
        endTime: endDateTime,
        startTime: startDateTime,
        signature,
        message,
      };

      // Step 1: Call backend to prepare auction metadata and get IPFS hash
      const prepareResponse = await fetch('http://localhost:3001/api/marketplace/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(auctionData),
      });

      const prepareResult = await prepareResponse.json();

      if (!prepareResult.success) {
        console.error('❌ Auction preparation failed:', prepareResult.error);
        setFormErrors({ submit: prepareResult.error || 'Failed to prepare auction' });
        setIsCreatingAuction(false);
        return;
      }

      const { ipfsHash, auctionMetadata, sellerAddress } = prepareResult.data;

      // Step 2: Create auction directly on blockchain

      try {
        // Import contract service dynamically to avoid circular imports
        const { contractService } = await import('../src/services/contractService');

        // Initialize contract service if needed
        if (!contractService.isConnected()) {
          await contractService.initializeWithMetaMask();
        }

        // Create auction on blockchain
        const auctionId = await contractService.createAuction(
          parseInt(selectedTicket.ticketId),
          ipfsHash
        );

        // Step 3: Register auction in database
        const registerData = {
          auctionId,
          ipfsHash,
          auctionMetadata,
          signature,
          message,
        };

        const registerResponse = await fetch('http://localhost:3001/api/marketplace/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registerData),
        });

        const registerResult = await registerResponse.json();

        if (!registerResult.success) {
          console.error('❌ Auction registration failed:', registerResult.error);
          setFormErrors({ submit: 'Auction created on blockchain but registration failed. Contact support.' });
          setIsCreatingAuction(false);
          return;
        }

        setAuctionCreated(true);

        // Immediately refresh auctions list to show the new auction
        try {
          const updatedAuctions = await auctionService.getAuctions();
          setAuctions(updatedAuctions);
        } catch (refreshError) {
          console.error('❌ Failed to refresh auctions:', refreshError);
        }

        // Reset form after successful creation
        setTimeout(() => {
          setSelectedTicket(null);
          setAuctionForm({
            startingPrice: '',
            startDate: '',
            startTime: '',
            endDate: '',
            endTime: ''
          });
          setFormErrors({});
          setAuctionCreated(false);
        }, 2000);

      } catch (blockchainError) {
        console.error('❌ Blockchain auction creation failed:', blockchainError);
        setFormErrors({ submit: 'Blockchain transaction failed. Please try again.' });
      }

    } catch (error) {
      console.error('❌ Error creating auction:', error);
      setFormErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsCreatingAuction(false);
    }
  };

  // Filter and sort auctions
  const filteredAuctions = auctions
    .filter(auction =>
      getAuctionTitle(auction).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getAuctionLocation(auction).toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'ending-soon':
          return (timeLeft[a.id]?.totalMs || 0) - (timeLeft[b.id]?.totalMs || 0);
        case 'highest-bid':
          return b.currentPrice - a.currentPrice;
        case 'newest':
          // Handle both string and Date formats
          const aTime = typeof a.endTime === 'string' ? new Date(a.endTime).getTime() : (a.endTime as any)?.getTime?.() || 0;
          const bTime = typeof b.endTime === 'string' ? new Date(b.endTime).getTime() : (b.endTime as any)?.getTime?.() || 0;
          return bTime - aTime;
        case 'lowest-price':
          return a.currentPrice - b.currentPrice;
        default:
          return 0;
      }
    });

  const tabs = [
    { id: 'auctions', label: 'Auction House', disabled: false },
    { id: 'list', label: 'List Ticket', disabled: false }
  ];

  // Loading state
  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen bg-lumina-dark text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-8 w-8 text-lumina-accent" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Marketplace Access</h2>
          <p className="text-gray-400 mb-8">
            Connect your wallet to access the ticket marketplace and auction house.
          </p>
          <button
            onClick={onConnectWallet}
            className="w-full py-4 bg-lumina-glow text-lumina-dark font-bold rounded-xl hover:bg-lumina-glow/90 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lumina-dark pb-20">
      {/* Header */}
      <div className="bg-lumina-card/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/explore"
                className="flex items-center space-x-2 px-4 py-2 bg-black/30 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Explore</span>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Marketplace</h1>
                <p className="text-gray-400 text-sm">Buy, sell, and trade event tickets</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/5 pb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
              disabled={tab.disabled}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-lumina-glow text-lumina-dark shadow-lg'
                  : tab.disabled
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                    : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
              {tab.disabled && <span className="ml-2 text-xs">(Coming Soon)</span>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'auctions' && (
          <div>
            

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search auctions by event or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-lumina-glow/50 focus:ring-1 focus:ring-lumina-glow/20"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-lumina-card border border-white/10 rounded-xl text-white focus:outline-none focus:border-lumina-glow/50 focus:ring-1 focus:ring-lumina-glow/20 [&>option]:bg-lumina-dark [&>option]:text-white"
              >
                <option value="ending-soon">Ending Soon</option>
                <option value="highest-bid">Highest Bid</option>
                <option value="newest">Newest</option>
                <option value="lowest-price">Lowest Price</option>
              </select>
            </div>

            {/* Loading State for Auction House */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-lumina-glow mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Loading Auction House</h3>
                {/* <p className="text-gray-400">Fetching live auctions from the marketplace...</p> */}
              </div>
            )}

            {/* Auctions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAuctions.map(auction => {
                const timeRemaining = timeLeft[auction.id];
                const isEndingSoon = timeRemaining && timeRemaining.totalMs < 60 * 60 * 1000; // Less than 1 hour
                const isUrgent = timeRemaining && timeRemaining.totalMs < 15 * 60 * 1000; // Less than 15 minutes

                return (
                  <div key={auction.id} className="group bg-lumina-card border border-white/5 rounded-2xl overflow-hidden hover:border-lumina-glow/30 transition-all shadow-lg hover:shadow-lumina-glow/5">
                    {/* Event Image with Auction Badge */}
                    <div className="relative">
                    <img
                        src={getEventImage(auction)}
                        alt={getAuctionTitle(auction)}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20" />

                      {/* Time Remaining Badge */}
                      <div className="absolute top-3 left-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${
                          isUrgent
                            ? 'bg-red-500/90 text-white border-red-400'
                            : isEndingSoon
                              ? 'bg-orange-500/90 text-white border-orange-400'
                              : 'bg-black/70 text-white border-white/20'
                        }`}>
                          <Clock className="h-3 w-3 inline mr-1" />
                          {timeRemaining ? formatTimeLeft(timeRemaining) : 'Ended'}
                        </div>
                      </div>


                    </div>

                    {/* Auction Details */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{getAuctionTitle(auction)}</h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-400">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(getEventDate(auction)).toLocaleDateString('en-GB')}
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <MapPin className="h-4 w-4 mr-2" />
                          {getAuctionLocation(auction)}
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <User className="h-4 w-4 mr-2" />
                          Seller: {truncateAddress(auction.sellerAddress)}
                        </div>
                      </div>

                      {/* Bid Info */}
                      <div className="bg-white/5 rounded-lg p-3 mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-400">Current Bid</span>
                          <span className="text-sm text-gray-400">{auction.bidCount} bids</span>
                        </div>
                        <div className="text-xl font-bold text-lumina-glow">
                          {auction.currentPrice} ETH
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Started at {auction.startingPrice} ETH
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <button
                        onClick={() => {
                          setSelectedAuction(auction);
                          setBidAmount((auction.currentPrice + 0.01).toFixed(2));
                        }}
                        className="w-full flex items-center justify-center px-4 py-3 bg-white text-lumina-dark font-bold rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Place Bid
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {!loading && filteredAuctions.length === 0 && (
              <div className="text-center py-12">
                <Gavel className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Auctions Found</h3>
                <p className="text-gray-400">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'list' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-lumina-card border border-white/5 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">List Ticket for Auction</h3>
                <p className="text-gray-400">Turn your unused tickets into opportunities</p>
              </div>

              <div className="space-y-6">
                {/* Ticket Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Select Ticket to Auction</label>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-h-80 overflow-y-auto">
                    {loadingTickets ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-lumina-glow" />
                        <p className="text-gray-400">Loading your tickets...</p>
                      </div>
                    ) : userTickets.length > 0 ? (
                      <div className="space-y-3">
                        {userTickets.map(ticket => (
                          <div
                            key={ticket.id}
                            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer ${
                              selectedTicket?.id === ticket.id
                                ? 'border-lumina-glow bg-lumina-glow/10'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <div className="flex items-center space-x-4">
                              <img
                                src={ticket.eventImage || 'https://picsum.photos/80/80?random=default'}
                                alt={ticket.eventTitle}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                              <div>
                                <h4 className="font-medium text-white">{ticket.eventTitle}</h4>
                                <p className="text-sm text-gray-400">
                                  {new Date(ticket.eventDate).toLocaleDateString('en-GB')} • {ticket.eventLocation}
                                </p>
                                <p className="text-xs text-gray-500">Ticket #{ticket.ticketId}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {selectedTicket?.id === ticket.id ? (
                                <Check className="h-6 w-6 text-lumina-glow" />
                              ) : (
                                <div className="w-6 h-6 border-2 border-white/30 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400 mb-2">No unused tickets available for auction</p>
                        <p className="text-sm text-gray-500">Purchase tickets first, then list them here</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Auction Settings */}
                <div className="space-y-6">
                  {/* Form Errors */}
                  {formErrors.submit && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <p className="text-red-400 text-sm">{formErrors.submit}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Starting Price {formErrors.startingPrice && <span className="text-red-400">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.10"
                        value={auctionForm.startingPrice}
                        onChange={(e) => handleFormChange('startingPrice', e.target.value)}
                        className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 pr-12 ${
                          formErrors.startingPrice
                            ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                            : 'border-white/10 focus:border-lumina-glow/50 focus:ring-lumina-glow/20'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">ETH</span>
                    </div>
                    {formErrors.startingPrice && (
                      <p className="text-red-400 text-sm mt-1">{formErrors.startingPrice}</p>
                    )}
                  </div>

                  {/* Auction Start Date & Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Auction Start {(formErrors.startDate || formErrors.startTime) && <span className="text-red-400">*</span>}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="date"
                          value={auctionForm.startDate}
                          onChange={(e) => handleFormChange('startDate', e.target.value)}
                          className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 ${
                            formErrors.startDate
                              ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                              : 'border-white/10 focus:border-lumina-glow/50 focus:ring-lumina-glow/20'
                          }`}
                          style={{ colorScheme: 'dark' }}
                        />
                        {formErrors.startDate && (
                          <p className="text-red-400 text-sm mt-1">{formErrors.startDate}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="time"
                          value={auctionForm.startTime}
                          onChange={(e) => handleFormChange('startTime', e.target.value)}
                          className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 ${
                            formErrors.startTime
                              ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                              : 'border-white/10 focus:border-lumina-glow/50 focus:ring-lumina-glow/20'
                          }`}
                          style={{ colorScheme: 'dark' }}
                        />
                        {formErrors.startTime && (
                          <p className="text-red-400 text-sm mt-1">{formErrors.startTime}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Auction End Date & Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Auction End {(formErrors.endDate || formErrors.endTime) && <span className="text-red-400">*</span>}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <input
                          type="date"
                          value={auctionForm.endDate}
                          onChange={(e) => handleFormChange('endDate', e.target.value)}
                          className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 ${
                            formErrors.endDate
                              ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                              : 'border-white/10 focus:border-lumina-glow/50 focus:ring-lumina-glow/20'
                          }`}
                          style={{ colorScheme: 'dark' }}
                        />
                        {formErrors.endDate && (
                          <p className="text-red-400 text-sm mt-1">{formErrors.endDate}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="time"
                          value={auctionForm.endTime}
                          onChange={(e) => handleFormChange('endTime', e.target.value)}
                          className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 ${
                            formErrors.endTime
                              ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                              : 'border-white/10 focus:border-lumina-glow/50 focus:ring-lumina-glow/20'
                          }`}
                          style={{ colorScheme: 'dark' }}
                        />
                        {formErrors.endTime && (
                          <p className="text-red-400 text-sm mt-1">{formErrors.endTime}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>



                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleCreateAuction}
                    disabled={isCreatingAuction || !selectedTicket}
                    className="flex-1 py-4 bg-lumina-glow text-lumina-dark font-bold rounded-xl hover:bg-lumina-glow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isCreatingAuction ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Creating Auction...
                      </>
                    ) : (
                      'Create Auction'
                    )}
                  </button>
                  <Link
                    to="/dashboard"
                    className="px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors text-center flex items-center justify-center"
                  >
                    View My Tickets
                  </Link>
                </div>

                {/* Success Message */}
                {auctionCreated && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                    <Check className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <h4 className="text-lg font-medium text-green-400 mb-1">Auction Created Successfully!</h4>
                    <p className="text-sm text-green-300">Your ticket is now listed for auction in the marketplace.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bid Modal */}
        {selectedAuction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-lumina-card border border-white/10 rounded-3xl max-w-md w-full p-8 relative shadow-2xl">
              <button
                onClick={() => {
                  setSelectedAuction(null);
                  setBidAmount('');
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-display font-bold text-white mb-2">Place Your Bid</h3>
                <p className="text-gray-400 text-sm">
                  {getAuctionTitle(selectedAuction)}
                </p>
              </div>

              {/* Current Bid Info */}
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-400">Current Highest Bid</span>
                  <span className="text-sm text-gray-400">{selectedAuction.bidCount} total bids</span>
                </div>
                <div className="text-xl font-bold text-lumina-glow mb-2">
                  {selectedAuction.currentPrice} ETH
                </div>
                <div className="text-xs text-gray-500">
                  Minimum bid: {(selectedAuction.currentPrice + 0.01).toFixed(2)} ETH
                </div>
              </div>

              {/* Bid Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">Your Bid Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min={(selectedAuction.currentPrice + 0.01).toFixed(2)}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Enter bid amount"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-lumina-glow/50 focus:ring-1 focus:ring-lumina-glow/20 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">ETH</span>
                </div>

                {/* Validation Messages */}
                {bidAmount && (
                  <div className="mt-2">
                    {parseFloat(bidAmount) <= selectedAuction.currentPrice ? (
                      <p className="text-red-400 text-sm flex items-center">
                        <X className="h-4 w-4 mr-1" />
                        Bid must be higher than current bid
                      </p>
                    ) : parseFloat(bidAmount) > wallet.balanceETH ? (
                      <p className="text-red-400 text-sm flex items-center">
                        <X className="h-4 w-4 mr-1" />
                        Insufficient balance ({wallet.balanceETH.toFixed(4)} ETH available)
                      </p>
                    ) : (
                      <p className="text-green-400 text-sm flex items-center">
                        <Check className="h-4 w-4 mr-1" />
                        Valid bid amount
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedAuction(null);
                    setBidAmount('');
                  }}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceBid}
                  disabled={
                    !bidAmount ||
                    parseFloat(bidAmount) <= selectedAuction.currentPrice ||
                    parseFloat(bidAmount) > wallet.balanceETH ||
                    isPlacingBid
                  }
                  className="flex-1 py-3 bg-lumina-glow text-lumina-dark font-bold rounded-xl hover:bg-lumina-glow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlacingBid ? 'Placing Bid...' : 'Place Bid'}
                </button>
              </div>

              <div className="text-center mt-4">
                <p className="text-xs text-gray-500">
                  By placing a bid, you agree to the auction terms and conditions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
