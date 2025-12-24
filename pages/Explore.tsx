import React, { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import { NftEvent, WalletState } from '../types';
import { Search, Filter, X, Loader2, AlertCircle } from 'lucide-react';
import { contractService } from '../src/services/contractService';

interface ExploreProps {
  wallet: WalletState;
  onBuyTicket: (event: NftEvent, onSuccess?: () => void) => void;
  onViewEventDetails: (event: NftEvent) => void;
  mintingEventId?: string | null;
}

const Explore: React.FC<ExploreProps> = ({ wallet, onBuyTicket, onViewEventDetails, mintingEventId }) => {
  const [events, setEvents] = useState<NftEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({ min: '', max: '' });

  // Load events from contract on component mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if MetaMask is available
        if (!window.ethereum) {
          setError('MetaMask not detected. Please install MetaMask to view events.');
          return;
        }

        // Check if connected to Sepolia network (chainId: 0xaa36a7)
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0xaa36a7') {
          setError('Please switch to Sepolia testnet in MetaMask to view events. Current network: ' + chainId);
          return;
        }

        // Initialize contract service with read-only access
        await contractService.initializeReadOnly();

        // Fetch all events from the blockchain
        const blockchainEvents = await contractService.getAllEvents();
        setEvents(blockchainEvents);
      } catch (err) {
        console.error('Failed to load events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events from blockchain');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const categories = ['All', 'Music', 'Tech', 'Art', 'Sports', 'Other'];

  const filteredEvents = events.filter(e => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      e.title.toLowerCase().includes(searchLower) ||
      e.location.toLowerCase().includes(searchLower) ||
      e.category.toLowerCase().includes(searchLower);

    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;

    // Date Logic
    const eventDate = new Date(e.date);
    const start = dateRange.start ? new Date(dateRange.start) : null;
    const end = dateRange.end ? new Date(dateRange.end) : null;
    const matchesDate = (!start || eventDate >= start) && (!end || eventDate <= end);

    // Price Logic
    const min = priceRange.min !== '' ? parseFloat(priceRange.min) : 0;
    const max = priceRange.max !== '' ? parseFloat(priceRange.max) : Infinity;
    const matchesPrice = e.priceETH >= min && e.priceETH <= max;

    return matchesSearch && matchesCategory && matchesDate && matchesPrice;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setDateRange({ start: '', end: '' });
    setPriceRange({ min: '', max: '' });
  };

  // Refresh events data from blockchain
  const refreshEvents = async () => {
    try {
      await contractService.initializeReadOnly();
      const blockchainEvents = await contractService.getAllEvents();
      setEvents(blockchainEvents);
    } catch (err) {
      console.error('Failed to refresh events:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <h2 className="text-3xl font-display font-bold">Explore Events</h2>

        <div className="flex gap-3 w-full lg:w-auto">
          <div className="relative flex-grow lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-lumina-glow transition-all"
            />
          </div>

          <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl border transition-all flex items-center justify-center ${
                  showFilters
                  ? 'bg-lumina-glow text-white border-lumina-glow shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title="Toggle Filters"
          >
              {showFilters ? <X className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Filters Panel */}
      {showFilters && (
          <div className="bg-lumina-card border border-white/5 rounded-2xl p-6 mb-8 animate-in slide-in-from-top-2 fade-in duration-200 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                  {/* Date Range */}
                  <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-400">Date Range</h4>
                      <div className="flex items-center gap-2">
                          <input
                              type="date"
                              value={dateRange.start}
                              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lumina-glow/50"
                          />
                          <span className="text-gray-600">-</span>
                          <input
                              type="date"
                              value={dateRange.end}
                              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lumina-glow/50"
                          />
                      </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-400">Price Range (ETH)</h4>
                      <div className="flex items-center gap-2">
                          <input
                              type="number"
                              placeholder="Min"
                              min="0"
                              step="0.01"
                              value={priceRange.min}
                              onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lumina-glow/50"
                          />
                          <span className="text-gray-600">-</span>
                          <input
                              type="number"
                              placeholder="Max"
                              min="0"
                              step="0.01"
                              value={priceRange.max}
                              onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lumina-glow/50"
                          />
                      </div>
                  </div>

                  {/* Quick Actions / Reset */}
                  <div className="flex items-end justify-end">
                      <button
                          onClick={clearFilters}
                          className="px-4 py-2 text-sm text-gray-400 hover:text-white underline decoration-gray-600 hover:decoration-white transition-all"
                      >
                          Reset Filters
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-lumina-glow mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Loading Events</h3>
          {/* <p className="text-gray-400">Fetching events from the blockchain...</p> */}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Failed to Load Events</h3>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-lumina-glow text-white rounded-lg hover:bg-lumina-glow/80 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Category Filters */}
      {!loading && !error && (
        <>
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                  selectedCategory === cat
                    ? 'bg-white text-lumina-dark border-white'
                    : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onBuy={(event, onSuccess) => onBuyTicket(event, () => {
                  // Call refreshEvents after successful minting
                  refreshEvents();
                  // Also call the original onSuccess if provided
                  if (onSuccess) onSuccess();
                })}
                onClick={() => onViewEventDetails(event)}
                isMinting={mintingEventId === event.id}
              />
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No events found</h3>
              <p className="text-gray-400">Try adjusting your search or filters.</p>
              <button
                onClick={clearFilters}
                className="mt-6 text-lumina-glow hover:text-white transition-colors text-sm font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Explore;
