import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { NftEvent, WalletState } from '../types';
import { Wallet, Calendar as CalendarIcon, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { contractService } from '../src/services/contractService';

interface MyEventsProps {
  wallet: WalletState;
  connectWallet: () => void;
  onBuyTicket: (event: NftEvent) => void;
  onViewEventDetails: (event: NftEvent) => void;
}

const MyEvents: React.FC<MyEventsProps> = ({ wallet, connectWallet, onBuyTicket, onViewEventDetails }) => {
  const [events, setEvents] = useState<NftEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's organized events from contract
  useEffect(() => {
    const loadUserEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if MetaMask is available
        if (!window.ethereum) {
          setError('MetaMask not detected. Please install MetaMask to view your events.');
          return;
        }

        // Check if connected to Sepolia network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0xaa36a7') {
          setError('Please switch to Sepolia testnet in MetaMask to view your events.');
          return;
        }

        // Check if wallet is connected
        if (!wallet.isConnected || !wallet.address) {
          setError('Please connect your wallet to view your organized events.');
          return;
        }

        // Initialize contract service
        await contractService.initializeReadOnly();

        // Load all events from blockchain
        const allEvents = await contractService.getAllEvents();
        console.log('📋 All events loaded from blockchain:', allEvents);
        console.log('👤 Current wallet address:', wallet.address);

        // Filter to show only events organized by current user
        const userEvents = allEvents.filter(event => {
          const matches = event.organizer?.toLowerCase() === wallet.address?.toLowerCase();
          console.log(`🔍 Event ${event.id}: organizer=${event.organizer}, matches=${matches}`);
          return matches;
        });
        console.log('✅ Filtered user events:', userEvents);

        setEvents(userEvents);
      } catch (err) {
        console.error('Failed to load user events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events from blockchain');
      } finally {
        setLoading(false);
      }
    };

    loadUserEvents();
  }, [wallet.isConnected, wallet.address]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-display font-bold">My Organized Events</h2>
        {wallet.isConnected && (
          <Link
            to="/create"
            className="flex items-center px-4 py-2 rounded-full bg-lumina-accent hover:bg-violet-600 text-white font-medium transition-all shadow-lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Create Event
          </Link>
        )}
      </div>

      {/* Loading State */}
      {loading && wallet.isConnected && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-lumina-glow mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Loading Your Events</h3>
          <p className="text-gray-400">Fetching events you organized from the blockchain...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Failed to Load Events</h3>
          <p className="text-red-400 mb-4">{error}</p>
          {!wallet.isConnected ? (
            <button
              onClick={connectWallet}
              className="px-6 py-2 bg-lumina-glow text-white rounded-lg hover:bg-lumina-glow/80 transition-colors"
            >
              Connect Wallet
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-lumina-glow text-white rounded-lg hover:bg-lumina-glow/80 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {/* Wallet Not Connected */}
      {!wallet.isConnected && !loading && (
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
      )}

      {/* Events Grid */}
      {wallet.isConnected && !loading && !error && (
        <>
          {events.length > 0 ? (
            <>
              <div className="mb-6">
                <p className="text-gray-400">
                  You have organized <span className="text-lumina-glow font-semibold">{events.length}</span> event{events.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onBuy={onBuyTicket}
                    onClick={() => onViewEventDetails(event)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-lumina-card border border-white/5 rounded-2xl">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                 <CalendarIcon className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Events Created</h3>
              <p className="text-gray-400 mb-6">You haven't organized any events yet. Create your first event to get started!</p>
              <Link
                to="/create"
                className="px-6 py-3 rounded-full bg-white text-lumina-dark hover:bg-gray-200 font-bold transition-all flex items-center"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create Your First Event
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyEvents;
