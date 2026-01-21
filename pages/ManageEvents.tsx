import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NftEvent, WalletState } from '../types';
import {
  ArrowLeft,
  Users,
  Calendar,
  MapPin,
  Ticket,
  Settings,
  AlertCircle,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  DollarSign
} from 'lucide-react';
import { contractService } from '../src/services/contractService';

interface ManageEventsProps {
  wallet: WalletState;
  onConnectWallet?: () => void;
}

const ManageEvents: React.FC<ManageEventsProps> = ({ wallet, onConnectWallet }) => {
  const [events, setEvents] = useState<NftEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'today' | 'past'>('all');

  // Helper function to truncate addresses
  const truncateAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Helper function to check if user is organizer of event
  const isOrganizerOf = (event: NftEvent) => {
    return wallet.isConnected && wallet.address?.toLowerCase() === event.organizer.toLowerCase();
  };

  // Load all events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check MetaMask connection
        if (!window.ethereum) {
          setError('MetaMask not detected. Please install MetaMask to manage events.');
          return;
        }

        // Check if on Sepolia network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0xaa36a7') {
          setError('Please switch to Sepolia testnet in MetaMask.');
          return;
        }

        // Initialize contract service
        await contractService.initializeReadOnly();

        // Get all events
        const allEvents = await contractService.getAllEvents();

        // Format events
        const formattedEvents = allEvents.map(eventData => ({
          id: eventData.id,
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          location: eventData.location,
          priceETH: parseFloat(eventData.priceETH),
          imageUrl: eventData.imageUrl,
          organizer: eventData.organizer,
          totalTickets: eventData.totalTickets,
          soldTickets: eventData.soldTickets,
          category: eventData.category || 'Other',
          reviews: []
        }));

        setEvents(formattedEvents);
      } catch (err) {
        console.error('Failed to load events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [wallet.isConnected]);

  // Filter events where user is organizer
  const myEvents = events.filter(event => isOrganizerOf(event));

  // Apply search and status filtering
  const filteredEvents = myEvents.filter(event => {
    const eventDate = new Date(event.date);
    const now = new Date();
    const isUpcoming = eventDate > now;
    const isToday = eventDate.toDateString() === now.toDateString();

    // Status filter
    let statusMatch = true;
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'upcoming':
          statusMatch = isUpcoming;
          break;
        case 'today':
          statusMatch = isToday;
          break;
        case 'past':
          statusMatch = !isUpcoming && !isToday;
          break;
      }
    }

    // Search filter
    const searchMatch = searchTerm === '' ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && searchMatch;
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-lumina-dark text-white flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-lumina-glow mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Loading Your Events</h3>
          {/* <p className="text-gray-400">Fetching events from the blockchain...</p> */}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-lumina-dark text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4 mx-auto" />
          <h2 className="text-2xl font-bold mb-4">Connection Error</h2>
          <p className="text-gray-400 mb-8">{error}</p>
          <Link to="/explore" className="inline-flex items-center px-6 py-3 bg-lumina-glow text-white rounded-lg hover:bg-lumina-glow/80 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen bg-lumina-dark text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Wallet Connection Required</h2>
          <p className="text-gray-400 mb-8">
            Please connect your wallet to access ticket management for your events.
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
                to="/manage"
                className="flex items-center space-x-2 px-4 py-2 bg-black/30 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Event Management</h1>
                <p className="text-gray-400 text-sm">Manage tickets for your events</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        {myEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-lumina-card border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="h-8 w-8 text-blue-400" />
                <span className="text-xs text-gray-500 bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full">Total Events</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{myEvents.length}</div>
              <p className="text-gray-400 text-sm">Events you organize</p>
            </div>

            <div className="bg-lumina-card border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Ticket className="h-8 w-8 text-green-400" />
                <span className="text-xs text-gray-500 bg-green-500/10 text-green-400 px-2 py-1 rounded-full">Total Tickets</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {myEvents.reduce((acc, event) => acc + event.soldTickets, 0)}
              </div>
              <p className="text-gray-400 text-sm">Tickets sold across all events</p>
            </div>

            <div className="bg-lumina-card border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="h-8 w-8 text-green-400" />
                <span className="text-xs text-gray-500 bg-green-500/10 text-green-400 px-2 py-1 rounded-full">Revenue</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {myEvents.reduce((acc, event) => acc + (event.soldTickets * event.priceETH), 0).toFixed(2)}
              </div>
              <p className="text-gray-400 text-sm">Total ETH earned</p>
            </div>
          </div>
        )}

        {/* Events List */}
        <div className="bg-lumina-card border border-white/5 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-white">Your Events</h2>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-lumina-glow/50 focus:ring-1 focus:ring-lumina-glow/20 w-full sm:w-64"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'upcoming' | 'today' | 'past')}
                  className="appearance-none pl-10 pr-8 py-2 bg-black/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-lumina-glow/50 focus:ring-1 focus:ring-lumina-glow/20 min-w-32 [& option]:bg-black"
                >
                  <option value="all">All Events</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="today">Today</option>
                  <option value="past">Past</option>
                </select>
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {myEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Events Found</h3>
              <p className="text-gray-400 mb-6">You haven't created any events yet, or your wallet isn't connected to the organizer account.</p>
              <Link
                to="/create"
                className="inline-flex items-center px-6 py-3 bg-lumina-glow text-lumina-dark font-bold rounded-xl hover:bg-lumina-glow/90 transition-colors"
              >
                Create Your First Event
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Events Match Your Search</h3>
                  <p className="text-gray-400 mb-6">Try adjusting your search terms or filter settings.</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="px-4 py-2 bg-lumina-glow text-lumina-dark font-medium rounded-lg hover:bg-lumina-glow/90 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                filteredEvents.map(event => {
                const eventDate = new Date(event.date);
                const now = new Date();
                const isUpcoming = eventDate > now;
                const isToday = eventDate.toDateString() === now.toDateString();
                const hasSoldTickets = event.soldTickets > 0;

                return (
                  <div key={event.id} className="bg-white/5 border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors group">
                    {/* Event Image */}
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20" />

                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          isToday
                            ? 'bg-blue-500/90 text-white'
                            : isUpcoming
                              ? 'bg-green-500/90 text-white'
                              : 'bg-gray-500/90 text-white'
                        }`}>
                          {isToday ? 'Today' : isUpcoming ? 'Upcoming' : 'Past'}
                        </span>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{event.title}</h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-400">
                          <Calendar className="h-4 w-4 mr-2" />
                          {eventDate.toLocaleDateString('en-GB')}
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <MapPin className="h-4 w-4 mr-2" />
                          {event.location}
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <Ticket className="h-4 w-4 mr-2" />
                          {event.soldTickets} / {event.totalTickets} tickets sold
                        </div>
                      </div>

                      {/* Action Button */}
                      <Link
                        to={`/manage/${event.id}`}
                        className="w-full flex items-center justify-center px-4 py-3 bg-lumina-glow text-lumina-dark font-bold rounded-lg hover:bg-lumina-glow/90 transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Tickets
                      </Link>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="text-center p-2 bg-white/5 rounded">
                          <p className="text-xs text-gray-400">Sold</p>
                          <p className="text-sm font-bold text-white">{event.soldTickets}</p>
                        </div>
                        <div className="text-center p-2 bg-white/5 rounded">
                          <p className="text-xs text-gray-400">Available</p>
                          <p className="text-sm font-bold text-white">{event.totalTickets - event.soldTickets}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
              )}
            </div>
          )}
        </div>

        {/* Help Section */}
        {myEvents.length > 0 && (
          <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-start">
              <CheckCircle2 className="h-6 w-6 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-white mb-2">How to Manage Your Events</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Click "Manage Tickets" on any event to access the ticket management dashboard</li>
                  <li>• Use QR scanning to check in attendees at your event venue</li>
                  <li>• Monitor real-time attendance and check-in statistics</li>
                  <li>• Export attendance reports for your records</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEvents;
