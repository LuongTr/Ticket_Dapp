import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WalletState, NftEvent } from '../types';
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
  Check
} from 'lucide-react';

interface MarketplaceProps {
  wallet: WalletState;
  onConnectWallet?: () => void;
}

// Mock auction data
const MOCK_AUCTIONS = [
  {
    id: '1',
    ticketId: '123',
    eventId: '1',
    event: {
      id: '1',
      title: 'Neon Nights Festival',
      date: '2024-12-15',
      location: 'Cyber Dome, Tokyo',
      imageUrl: 'https://picsum.photos/400/300?random=1',
      category: 'Music'
    },
    sellerAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    startingPrice: 0.1,
    currentPrice: 0.35,
    highestBidder: '0x8ba1f109551bD432803012645ac136ddd64DBA72',
    bidCount: 7,
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    status: 'active'
  },
  {
    id: '2',
    ticketId: '456',
    eventId: '2',
    event: {
      id: '2',
      title: 'Future Tech Summit',
      date: '2024-12-20',
      location: 'Silicon Valley Center',
      imageUrl: 'https://picsum.photos/400/300?random=2',
      category: 'Tech'
    },
    sellerAddress: '0x3a4b5c6d7e8f9012345678901234567890123456',
    startingPrice: 0.5,
    currentPrice: 0.8,
    highestBidder: '0x9876543210987654321098765432109876543210',
    bidCount: 12,
    endTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
    status: 'active'
  },
  {
    id: '3',
    ticketId: '789',
    eventId: '3',
    event: {
      id: '3',
      title: 'Digital Art Exhibition',
      date: '2025-01-10',
      location: 'Meta Gallery',
      imageUrl: 'https://picsum.photos/400/300?random=3',
      category: 'Art'
    },
    sellerAddress: '0x1111111111111111111111111111111111111111',
    startingPrice: 0.08,
    currentPrice: 0.15,
    highestBidder: '0x2222222222222222222222222222222222222222',
    bidCount: 4,
    endTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    status: 'active'
  },
  {
    id: '4',
    ticketId: '101',
    eventId: '1',
    event: {
      id: '1',
      title: 'Neon Nights Festival',
      date: '2024-12-15',
      location: 'Cyber Dome, Tokyo',
      imageUrl: 'https://picsum.photos/400/300?random=1',
      category: 'Music'
    },
    sellerAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    startingPrice: 0.2,
    currentPrice: 0.42,
    highestBidder: '0xfedcba0987654321fedcba0987654321fedcba09',
    bidCount: 9,
    endTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
    status: 'active'
  }
];

const Marketplace: React.FC<MarketplaceProps> = ({ wallet, onConnectWallet }) => {
  const [activeTab, setActiveTab] = useState<'auctions' | 'list'>('auctions');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'ending-soon' | 'highest-bid' | 'newest' | 'lowest-price'>('ending-soon');
  const [auctions, setAuctions] = useState(MOCK_AUCTIONS);

  // Bid Modal State
  const [selectedAuction, setSelectedAuction] = useState<typeof MOCK_AUCTIONS[0] | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isPlacingBid, setIsPlacingBid] = useState(false);

  // Countdown timers for auctions
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: { hours: number; minutes: number; seconds: number; totalMs: number } }>({});

  // Update countdown timers every second
  useEffect(() => {
    const updateTimers = () => {
      const now = new Date();
      const newTimeLeft: { [key: string]: { hours: number; minutes: number; seconds: number; totalMs: number } } = {};

      auctions.forEach(auction => {
        const timeDiff = auction.endTime.getTime() - now.getTime();
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
    if (address.length <= 12) return address;
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

  // Filter and sort auctions
  const filteredAuctions = auctions
    .filter(auction =>
      auction.event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auction.event.location.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'ending-soon':
          return (timeLeft[a.id]?.totalMs || 0) - (timeLeft[b.id]?.totalMs || 0);
        case 'highest-bid':
          return b.currentPrice - a.currentPrice;
        case 'newest':
          return b.endTime.getTime() - a.endTime.getTime();
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
                        src={auction.event.imageUrl}
                        alt={auction.event.title}
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
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{auction.event.title}</h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-400">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(auction.event.date).toLocaleDateString('en-GB')}
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <MapPin className="h-4 w-4 mr-2" />
                          {auction.event.location}
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

            {filteredAuctions.length === 0 && (
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
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-2">No tickets available for auction</p>
                      <p className="text-sm text-gray-500">Purchase tickets first, then list them here</p>
                    </div>
                  </div>
                </div>

                {/* Auction Settings */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Starting Price</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.10"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-lumina-glow/50 focus:ring-1 focus:ring-lumina-glow/20 pr-12"
                        disabled
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">ETH</span>
                    </div>
                  </div>

                  {/* Auction Start Date & Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Auction Start</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="date"
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lumina-glow/50 focus:ring-1 focus:ring-lumina-glow/20"
                        disabled
                      />
                      <input
                        type="time"
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lumina-glow/50 focus:ring-1 focus:ring-lumina-glow/20"
                        disabled
                      />
                    </div>
                  </div>

                  {/* Auction End Date & Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Auction End</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="date"
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lumina-glow/50 focus:ring-1 focus:ring-lumina-glow/20"
                        disabled
                      />
                      <input
                        type="time"
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lumina-glow/50 focus:ring-1 focus:ring-lumina-glow/20"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h4 className="text-lg font-medium text-white mb-4">Auction Preview</h4>
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400">Select a ticket to see preview</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    className="flex-1 py-4 bg-lumina-glow text-lumina-dark font-bold rounded-xl hover:bg-lumina-glow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled
                  >
                    Create Auction
                  </button>
                  <Link
                    to="/dashboard"
                    className="px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors text-center"
                  >
                    View My Tickets
                  </Link>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Auctions are coming soon! For now, use the dashboard to manage your tickets.
                  </p>
                </div>
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
                  {selectedAuction.event.title}
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
                  onClick={() => {
                    // TODO: Implement bid submission
                    alert('Bid functionality coming soon! This would submit your bid to the blockchain.');
                    setSelectedAuction(null);
                    setBidAmount('');
                  }}
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
