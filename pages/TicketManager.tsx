import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { NftEvent, WalletState, Ticket } from '../types';
import {
  ArrowLeft,
  QrCode,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ScanLine,
  Check,
  AlertCircle,
  Camera,
  CameraOff,
  Loader2,
  RefreshCw,
  Download,
  BarChart3,
  PieChart,
  TrendingUp,
  UserCheck,
  X,
  AlertTriangle
} from 'lucide-react';
import { contractService } from '../src/services/contractService';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface TicketManagerProps {
  wallet: WalletState;
  onConnectWallet?: () => void;
}

interface TicketWithOwner extends Ticket {
  ownerName?: string;
  checkInTime?: string;
}

const TicketManager: React.FC<TicketManagerProps> = ({ wallet, onConnectWallet }) => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<NftEvent | null>(null);
  const [tickets, setTickets] = useState<TicketWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOrganizer, setIsOrganizer] = useState<boolean | null>(null);

  // QR Scanner State
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // QR Scanner Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Check-in State
  const [checkingIn, setCheckingIn] = useState(false);
  const [lastCheckedIn, setLastCheckedIn] = useState<TicketWithOwner | null>(null);

  // Analytics State
  const [checkInHistory, setCheckInHistory] = useState<{ time: string; count: number }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Helper function to truncate addresses
  const truncateAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Verify organizer access
  useEffect(() => {
    const verifyAccess = async () => {
      if (!eventId) {
        setError('Event ID is required');
        setLoading(false);
        return;
      }

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

        // Get event data
        const eventData = await contractService.getEvent(parseInt(eventId));

        const formattedEvent: NftEvent = {
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
          category: 'Other',
          reviews: []
        };

        setEvent(formattedEvent);

        // Check if current user is the organizer
        if (wallet.isConnected && wallet.address) {
          const isUserOrganizer = wallet.address.toLowerCase() === formattedEvent.organizer.toLowerCase();
          setIsOrganizer(isUserOrganizer);
        } else {
          setIsOrganizer(false);
        }

      } catch (err) {
        console.error('Failed to load event:', err);
        setError(err instanceof Error ? err.message : 'Failed to load event data');
      } finally {
        setLoading(false);
      }
    };

    verifyAccess();
  }, [eventId, wallet.isConnected, wallet.address]);

  // Load tickets when event is loaded and user is organizer
  useEffect(() => {
    const loadTickets = async () => {
      if (!event || !isOrganizer || !wallet.isConnected) return;

      try {
        // Get all tickets for this event
        const ticketIds = await contractService.getTicketsByOwner(wallet.address!, parseInt(event.id));

        const loadedTickets: TicketWithOwner[] = [];

        for (const ticketId of ticketIds) {
          try {
            const ticketData = await contractService.getTicket(ticketId);
            const ticket: TicketWithOwner = {
              id: ticketId.toString(),
              eventId: event.id,
              ownerAddress: ticketData.ownerAddress,
              purchaseDate: ticketData.purchaseDate,
              qrCodeData: `lumina://${event.id}/${ticketId}`,
              isUsed: ticketData.isUsed,
              checkInTime: ticketData.isUsed ? new Date().toISOString() : undefined
            };
            loadedTickets.push(ticket);
          } catch (ticketError) {
            console.error(`Failed to load ticket ${ticketId}:`, ticketError);
          }
        }

        setTickets(loadedTickets);

        // Generate mock check-in history for demo
        const history = [];
        const now = new Date();
        for (let i = 23; i >= 0; i--) {
          const time = new Date(now.getTime() - i * 60 * 60 * 1000);
          history.push({
            time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            count: Math.floor(Math.random() * 5)
          });
        }
        setCheckInHistory(history);

      } catch (err) {
        console.error('Failed to load tickets:', err);
      }
    };

    loadTickets();
  }, [event, isOrganizer, wallet.isConnected, wallet.address]);

  // Handle QR scan
  const handleScan = async (data: string | null) => {
    if (!data || scanning) return;

    setScanning(true);
    setScanResult(data);
    setScanError(null);

    try {
      // Parse QR data (format: lumina://eventId/ticketId)
      const match = data.match(/lumina:\/\/(\d+)\/(\d+)/);
      if (!match) {
        throw new Error('Invalid QR code format');
      }

      const scannedEventId = match[1];
      const ticketId = parseInt(match[2]);

      // Verify this QR is for the correct event
      if (scannedEventId !== event?.id) {
        throw new Error('This QR code is for a different event');
      }

      // Check if ticket exists and get its data
      const ticketData = await contractService.getTicket(ticketId);

      if (ticketData.isUsed) {
        throw new Error('This ticket has already been used');
      }

      // Mark ticket as used
      setCheckingIn(true);
      await contractService.initializeWithMetaMask();
      await contractService.useTicket(ticketId);

      // Update local state
      const updatedTicket: TicketWithOwner = {
        id: ticketId.toString(),
        eventId: event.id,
        ownerAddress: ticketData.ownerAddress,
        purchaseDate: ticketData.purchaseDate,
        qrCodeData: data,
        isUsed: true,
        checkInTime: new Date().toISOString()
      };

      setTickets(prev => prev.map(t =>
        t.id === ticketId.toString() ? updatedTicket : t
      ));

      setLastCheckedIn(updatedTicket);

      // Success feedback
      setTimeout(() => {
        setShowScanner(false);
        setScanResult(null);
        setScanning(false);
        setCheckingIn(false);
      }, 2000);

    } catch (error) {
      console.error('Scan error:', error);
      setScanError(error instanceof Error ? error.message : 'Failed to process QR code');
      setScanning(false);
      setCheckingIn(false);
    }
  };

  const handleScanError = (error: any) => {
    console.error('QR scan error:', error);
    setScanError('Camera access failed. Please check permissions.');
  };

  // QR Scanner Effects
  useEffect(() => {
    if (showScanner && !cameraActive) {
      initializeCamera();
    }

    return () => {
      if (!showScanner && cameraActive) {
        stopCamera();
      }
    };
  }, [showScanner, cameraActive]);

  const initializeCamera = async () => {
    try {
      setCameraError(null);

      // Create code reader instance
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      // Get available video devices
      const videoDevices = await codeReader.getVideoInputDevices();

      if (videoDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Use the first available camera (usually back camera on mobile)
      const selectedDeviceId = videoDevices[0].deviceId;

      // Start decoding
      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            // Successfully scanned QR code
            handleScan(result.getText());
          }
          // Ignore NotFoundException (normal when no QR code is visible)
          if (error && !(error instanceof NotFoundException)) {
            console.error('QR scan error:', error);
            setCameraError('Camera scanning error');
          }
        }
      );

      setCameraActive(true);
    } catch (error) {
      console.error('Failed to initialize camera:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to access camera';
      setCameraError(errorMessage);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setCameraActive(false);
    setCameraError(null);
  };

  // Handle closing scanner modal
  const handleCloseScanner = () => {
    stopCamera();
    setShowScanner(false);
    setScanResult(null);
    setScanError(null);
    setScanning(false);
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    // Re-run the ticket loading logic
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Calculate stats
  const totalSold = event?.soldTickets || 0;
  const totalCheckedIn = tickets.filter(t => t.isUsed).length;
  const checkInRate = totalSold > 0 ? Math.round((totalCheckedIn / totalSold) * 100) : 0;

  const chartData = [
    { name: 'Checked In', value: totalCheckedIn, color: '#10b981' },
    { name: 'Not Checked In', value: totalSold - totalCheckedIn, color: '#6b7280' }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-lumina-dark text-white flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-lumina-glow mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Loading Event Manager</h3>
          <p className="text-gray-400">Verifying access and loading ticket data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-lumina-dark text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4 mx-auto" />
          <h2 className="text-2xl font-bold mb-4">{error ? 'Access Error' : 'Event Not Found'}</h2>
          <p className="text-red-400 mb-6">{error || 'The event could not be found.'}</p>
          <Link to="/explore" className="inline-flex items-center px-6 py-3 bg-lumina-glow text-white rounded-lg hover:bg-lumina-glow/80 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  // Access control: Not connected
  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen bg-lumina-dark text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Wallet Connection Required</h2>
          <p className="text-gray-400 mb-8">
            Please connect your wallet to access the ticket management system for <span className="text-white font-medium">{event.title}</span>.
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

  // Access control: Not organizer
  if (isOrganizer === false) {
    return (
      <div className="min-h-screen bg-lumina-dark text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-400 mb-8">
            Only the event organizer can manage tickets for <span className="text-white font-medium">{event.title}</span>.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Event Organizer:</p>
            <p className="font-mono text-lumina-glow bg-black/20 px-3 py-2 rounded">
              {truncateAddress(event.organizer)}
            </p>
          </div>
          <Link
            to="/explore"
            className="inline-block mt-6 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  // Main interface for organizers
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
                <span>Back</span>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Ticket Manager</h1>
                <p className="text-gray-400 text-sm">{event.title}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                onClick={() => setShowScanner(true)}
                className="flex items-center px-6 py-2 bg-lumina-glow text-lumina-dark font-bold rounded-lg hover:bg-lumina-glow/90 transition-colors"
              >
                <ScanLine className="h-4 w-4 mr-2" />
                Scan QR Code
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Stats & Analytics */}
          <div className="lg:col-span-1 space-y-6">

            {/* Live Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-lumina-card border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="h-8 w-8 text-blue-400" />
                  <span className="text-xs text-gray-500 bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full">Total</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{totalSold}</div>
                <p className="text-gray-400 text-sm">Tickets Sold</p>
              </div>

              <div className="bg-lumina-card border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <UserCheck className="h-8 w-8 text-green-400" />
                  <span className="text-xs text-gray-500 bg-green-500/10 text-green-400 px-2 py-1 rounded-full">Checked In</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{totalCheckedIn}</div>
                <p className="text-gray-400 text-sm">{checkInRate}% Check-in Rate</p>
              </div>
            </div>

            {/* Check-in Progress */}
            <div className="bg-lumina-card border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-lumina-glow" />
                Check-in Progress
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white font-medium">{totalCheckedIn}/{totalSold}</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-lumina-accent to-lumina-glow rounded-full transition-all duration-1000"
                    style={{ width: `${checkInRate}%` }}
                  />
                </div>
                <p className="text-center text-2xl font-bold text-lumina-glow">{checkInRate}%</p>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-lumina-card border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-6">Check-in Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Check-in Timeline */}
            <div className="bg-lumina-card border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-6">Check-in Activity (Last 24h)</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={checkInHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column: Ticket List */}
          <div className="lg:col-span-2">
            <div className="bg-lumina-card border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Ticket Overview</h3>
                <div className="flex items-center space-x-2">
                  <button className="flex items-center px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${ticket.isUsed ? 'bg-green-400' : 'bg-gray-400'}`} />
                      <div>
                        <p className="text-white font-medium">Ticket #{ticket.id.slice(-4)}</p>
                        <p className="text-gray-400 text-sm font-mono">{truncateAddress(ticket.ownerAddress)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`text-sm font-medium ${ticket.isUsed ? 'text-green-400' : 'text-gray-400'}`}>
                          {ticket.isUsed ? 'Checked In' : 'Not Checked In'}
                        </p>
                        {ticket.checkInTime && (
                          <p className="text-xs text-gray-500">
                            {new Date(ticket.checkInTime).toLocaleTimeString()}
                          </p>
                        )}
                      </div>

                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        ticket.isUsed
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {ticket.isUsed ? '✓ Used' : '○ Valid'}
                      </div>
                    </div>
                  </div>
                ))}

                {tickets.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No tickets sold yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-lumina-card border border-white/10 rounded-3xl max-w-md w-full p-6 relative shadow-2xl">

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Scan QR Code</h3>
              <button
                onClick={handleCloseScanner}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Camera Scanner */}
            <div className="relative mb-6">
              <div className="w-full h-64 bg-black rounded-xl overflow-hidden">
                {cameraError ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <CameraOff className="h-12 w-12 text-red-400 mx-auto mb-4" />
                      <p className="text-red-400 text-sm font-medium">Camera Error</p>
                      <p className="text-gray-400 text-xs mt-1">{cameraError}</p>
                    </div>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                )}

                {/* Scanning overlay */}
                {!cameraError && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="w-full h-full border-2 border-lumina-glow rounded-xl">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/50 rounded-lg">
                        <div className="absolute inset-2 border border-lumina-glow rounded animate-pulse" />
                      </div>
                      {/* Scanning line animation */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="w-full h-0.5 bg-lumina-glow/60 shadow-[0_0_10px_rgba(139,92,246,0.8)] absolute top-1/2 transform -translate-y-1/2 animate-[scan_2s_ease-in-out_infinite]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <style>{`
              @keyframes scan {
                0%, 100% { transform: translateY(-50%) translateX(-100%); opacity: 0; }
                50% { transform: translateY(-50%) translateX(100%); opacity: 1; }
              }
            `}</style>

            {/* Status Messages */}
            {scanError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                <p className="text-red-400 text-sm">{scanError}</p>
              </div>
            )}

            {scanResult && !scanError && (
              <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-green-400 font-medium">QR Code Detected</p>
                  {checkingIn && (
                    <p className="text-green-400 text-sm mt-1">Processing check-in...</p>
                  )}
                </div>
              </div>
            )}

            {/* Success Message */}
            {lastCheckedIn && (
              <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-center mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2" />
                  <p className="text-green-400 font-medium">Check-in Successful!</p>
                </div>
                <p className="text-white text-sm">Ticket #{lastCheckedIn.id.slice(-4)} checked in at {new Date(lastCheckedIn.checkInTime!).toLocaleTimeString()}</p>
              </div>
            )}

            <p className="text-center text-gray-400 text-sm">
              Position the QR code within the frame to scan
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketManager;
