import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Explore from './pages/Explore';
import MyEvents from './pages/MyEvents';
import CreateEvent from './pages/CreateEvent';
import Dashboard from './pages/Dashboard';
import EventDetails from './pages/EventDetails';
import { WalletState, NftEvent, Ticket, Review } from './types';

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
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    balanceETH: 0
  });
  const [events, setEvents] = useState<NftEvent[]>(MOCK_EVENTS);
  const [tickets, setTickets] = useState<Ticket[]>([]);

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

    setEvents(events.map(e =>
        e.id === eventId ? { ...e, reviews: [newReview, ...e.reviews] } : e
    ));
  };

  return (
    <Router>
      <div className="min-h-screen bg-lumina-dark text-white font-sans selection:bg-lumina-accent selection:text-white">
        <Navbar
          wallet={wallet}
          connectWallet={connectWallet}
        />

        <main className="pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/explore"
              element={
                <Explore
                  wallet={wallet}
                  onBuyTicket={handleBuyTicket}
                  onViewEventDetails={(event) => {
                    // Navigate to event details page
                    window.location.href = `/events/${event.id}`;
                  }}
                />
              }
            />
            <Route
              path="/my-events"
              element={
                <MyEvents
                  wallet={wallet}
                  connectWallet={connectWallet}
                  onBuyTicket={handleBuyTicket}
                  onViewEventDetails={(event) => {
                    window.location.href = `/events/${event.id}`;
                  }}
                />
              }
            />
            <Route
              path="/events/:id"
              element={
                <EventDetails
                  events={events}
                  wallet={wallet}
                  onBuyTicket={handleBuyTicket}
                  onAddReview={handleAddReview}
                />
              }
            />
            <Route
              path="/create"
              element={
                <CreateEvent
                  onEventCreated={handleEventCreated}
                  walletAddress={wallet.address}
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  tickets={tickets.filter(t => t.ownerAddress === wallet.address)}
                  events={events}
                  onTicketUse={handleTicketUse}
                  onTransfer={handleTransferTicket}
                />
              }
            />
          </Routes>
        </main>

        {/* Simple Footer */}
        <footer className="border-t border-white/5 py-10 mt-20 bg-lumina-card">
          <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-gray-500 text-sm">© 2024 Lumina Decentralized Ticketing. Built on Ethereum.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
