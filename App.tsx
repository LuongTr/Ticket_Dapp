import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import EventCard from './components/EventCard';
import CreateEvent from './components/CreateEvent';
import Dashboard from './components/Dashboard';
import EventDetails from './components/EventDetails';
import { ViewState, WalletState, NftEvent, Ticket, Review } from './types';
import { Search, Filter, X, Calendar as CalendarIcon, Wallet } from 'lucide-react';

// Mock Data
const MOCK_EVENTS: NftEvent[] = [
  {
    id: '1',
    title: 'Neon Nights Festival',
    description: 'A 3-day immersive electronic music experience featuring top global DJs in a holographic arena. Experience the future of sound and light with our state-of-the-art visual projection systems and 3D spatial audio.',
    date: '2024-11-15',
    location: 'Cyber Dome, Tokyo',
    priceETH: 0.15,
    imageUrl: 'https://picsum.photos/800/600?random=1',
    organizer: '0x123...abc',
    totalTickets: 1000,
    soldTickets: 842,
    category: 'Music',
    reviews: [
      {
        id: 'r1',
        userAddress: '0x88...921a',
        rating: 5,
        comment: "Absolutely mind-blowing visuals!",
        timestamp: "2024-10-01T10:00:00Z"
      },
      {
        id: 'r2',
        userAddress: '0x42...b31z',
        rating: 4,
        comment: "Great lineup, but the drinks were expensive.",
        timestamp: "2024-10-02T14:30:00Z"
      }
    ]
  },
  {
    id: '2',
    title: 'Future Tech Summit',
    description: 'Gathering of the brightest minds in AI, Blockchain, and Quantum Computing. Join us for keynotes from industry leaders, hands-on workshops, and networking opportunities that will define the next decade of innovation.',
    date: '2024-12-05',
    location: 'Silicon Valley Conv Center',
    priceETH: 0.5,
    imageUrl: 'https://picsum.photos/800/600?random=2',
    organizer: '0x456...def',
    totalTickets: 500,
    soldTickets: 120,
    category: 'Tech',
    reviews: []
  },
  {
    id: '3',
    title: 'Digital Art Vernissage',
    description: 'Exclusive gallery opening for the new Generative Art collection "Echoes". Meet the artists, view exclusive pieces, and participate in the live auction of rare 1/1 NFTs.',
    date: '2024-10-30',
    location: 'Meta Gallery One',
    priceETH: 0.08,
    imageUrl: 'https://picsum.photos/800/600?random=3',
    organizer: '0x789...ghi',
    totalTickets: 200,
    soldTickets: 195,
    category: 'Art',
    reviews: [
      {
        id: 'r3',
        userAddress: '0x99...a11b',
        rating: 5,
        comment: "A masterpiece of an event.",
        timestamp: "2024-09-28T09:15:00Z"
      }
    ]
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    balanceETH: 0
  });
  const [events, setEvents] = useState<NftEvent[]>(MOCK_EVENTS);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState<NftEvent | null>(null);

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({ min: '', max: '' });

  const categories = ['All', 'Music', 'Tech', 'Art', 'Sports', 'Other'];

  // Helper to fetch balance and update wallet state
  const updateWalletState = async (address: string) => {
    let balance = 0;
    try {
      const balanceHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      // Convert Wei to ETH (approximate for display)
      balance = parseInt(balanceHex, 16) / 1e18;
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
    
    setWallet({
      isConnected: true,
      address,
      balanceETH: balance
    });
  };

  // Real Wallet Connection
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          await updateWalletState(accounts[0]);
        }
      } catch (error) {
        console.error("User denied connection", error);
        alert("Connection request was rejected.");
      }
    } else {
      alert("MetaMask is not installed. Please install it to use this app.");
      window.open('https://metamask.io/download/', '_blank');
    }
  };

  // Check connection on mount and listen for changes
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          // Check if authorized
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await updateWalletState(accounts[0]);
          }
        } catch (err) {
          console.error("Error checking wallet connection:", err);
        }

        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            updateWalletState(accounts[0]);
          } else {
            // Disconnected
            setWallet({ isConnected: false, address: null, balanceETH: 0 });
          }
        });

        // Listen for chain changes
        window.ethereum.on('chainChanged', (_chainId: string) => {
             // Recommended to reload page on chain change
             window.location.reload();
        });
      }
    };
    
    checkConnection();

    // Cleanup not strictly necessary for window.ethereum but good practice if it were a component specific listener
    return () => {};
  }, []);

  const handleBuyTicket = (event: NftEvent) => {
    if (!wallet.isConnected) {
      alert("Please connect your wallet first.");
      connectWallet();
      return;
    }

    if (wallet.balanceETH < event.priceETH) {
      alert("Insufficient funds in your wallet.");
      return;
    }

    const newTicket: Ticket = {
      id: `tkt-${Date.now()}`,
      eventId: event.id,
      ownerAddress: wallet.address!,
      purchaseDate: new Date().toISOString(),
      qrCodeData: `lumina://${event.id}/${Date.now()}`,
      isUsed: false
    };

    setTickets([...tickets, newTicket]);
    
    // Update event sold count
    setEvents(events.map(e => 
      e.id === event.id ? { ...e, soldTickets: e.soldTickets + 1 } : e
    ));

    alert(`Successfully minted ticket for ${event.title}!`);
  };

  const handleEventCreated = (newEvent: NftEvent) => {
    setEvents([newEvent, ...events]);
    setView(ViewState.EXPLORE);
    setSelectedCategory('All');
    alert("Event minted to the blockchain successfully!");
  };

  const handleTicketUse = (ticketId: string) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, isUsed: true } : t
    ));
  };

  const handleTransferTicket = (ticketId: string, toAddress: string) => {
    setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, ownerAddress: toAddress } : t
    ));
    alert(`Ticket successfully transferred to ${toAddress}`);
  };

  const handleAddReview = (eventId: string, rating: number, comment: string) => {
    if (!wallet.isConnected) {
        alert("Please connect your wallet to review.");
        return;
    }

    const newReview: Review = {
        id: `rev-${Date.now()}`,
        userAddress: wallet.address!,
        rating,
        comment,
        timestamp: new Date().toISOString()
    };

    const updatedEvents = events.map(e => 
        e.id === eventId ? { ...e, reviews: [newReview, ...e.reviews] } : e
    );

    setEvents(updatedEvents);
    
    // Update selected event if it's the one being reviewed
    if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent({ ...selectedEvent, reviews: [newReview, ...selectedEvent.reviews] });
    }
  };

  const handleViewEventDetails = (event: NftEvent) => {
    setSelectedEvent(event);
    setView(ViewState.EVENT_DETAILS);
  };

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

  return (
    <div className="min-h-screen bg-lumina-dark text-white font-sans selection:bg-lumina-accent selection:text-white">
      <Navbar 
        currentView={view} 
        changeView={setView} 
        wallet={wallet} 
        connectWallet={connectWallet} 
      />

      <main className="pt-20">
        {view === ViewState.HOME && (
          <Hero onChangeView={setView} />
        )}

        {view === ViewState.EXPLORE && (
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

            {/* Category Filters */}
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
                  onBuy={handleBuyTicket} 
                  onClick={() => handleViewEventDetails(event)}
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
          </div>
        )}

        {/* MY EVENTS VIEW */}
        {view === ViewState.MY_EVENTS && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <h2 className="text-3xl font-display font-bold mb-8">My Organized Events</h2>
            
            {!wallet.isConnected ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-lumina-card border border-white/5 rounded-2xl">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                   <Wallet className="h-8 w-8 text-lumina-accent" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Wallet Not Connected</h3>
                <p className="text-gray-400 mb-6 max-w-sm">Connect your wallet to view and manage the events you have organized.</p>
                <button 
                  onClick={connectWallet}
                  className="px-6 py-3 rounded-full bg-lumina-accent hover:bg-violet-600 text-white font-medium transition-all"
                >
                  Connect Wallet
                </button>
              </div>
            ) : (
              <>
                {events.filter(e => e.organizer === wallet.address).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events
                      .filter(e => e.organizer === wallet.address)
                      .map(event => (
                        <EventCard 
                          key={event.id} 
                          event={event} 
                          onBuy={handleBuyTicket}
                          onClick={() => handleViewEventDetails(event)}
                        />
                      ))
                    }
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-lumina-card border border-white/5 rounded-2xl">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                       <CalendarIcon className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Events Created</h3>
                    <p className="text-gray-400 mb-6">You haven't organized any events yet.</p>
                    <button 
                      onClick={() => setView(ViewState.CREATE)}
                      className="px-6 py-3 rounded-full bg-white text-lumina-dark hover:bg-gray-200 font-bold transition-all"
                    >
                      Create Your First Event
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {view === ViewState.EVENT_DETAILS && selectedEvent && (
          <EventDetails 
            event={selectedEvent} 
            onBack={() => setView(ViewState.EXPLORE)}
            onBuy={handleBuyTicket}
            onAddReview={handleAddReview}
            walletIsConnected={wallet.isConnected}
          />
        )}

        {view === ViewState.CREATE && (
          <CreateEvent 
             onEventCreated={handleEventCreated} 
             walletAddress={wallet.address}
          />
        )}

        {view === ViewState.DASHBOARD && (
          <Dashboard 
            tickets={tickets.filter(t => t.ownerAddress === wallet.address)}
            events={events} 
            onTicketUse={handleTicketUse}
            onTransfer={handleTransferTicket}
          />
        )}
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-white/5 py-10 mt-20 bg-lumina-card">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-500 text-sm">© 2024 Lumina Decentralized Ticketing. Built on Ethereum.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;