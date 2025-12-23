import React, { useState } from 'react';
import { Ticket, NftEvent } from '../types';
import { QrCode, Ticket as TicketIcon, Clock, CheckCircle2, XCircle, X, ScanLine, Check, Send, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  tickets: Ticket[];
  events: NftEvent[];
  onTicketUse: (id: string) => void;
  onTransfer: (ticketId: string, toAddress: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tickets, events, onTicketUse, onTransfer }) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Transfer State
  const [transferTicket, setTransferTicket] = useState<Ticket | null>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const getEventById = (id: string) => events.find(e => e.id === id);

  // Stats for chart
  const ticketsByCategory = tickets.reduce((acc, ticket) => {
    const event = getEventById(ticket.eventId);
    if (event) {
        acc[event.category] = (acc[event.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(ticketsByCategory).map(key => ({
    name: key,
    value: ticketsByCategory[key]
  }));

  const COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b'];

  const handleVerify = () => {
    if (!selectedTicket) return;
    setIsVerifying(true);
    // Simulate network delay
    setTimeout(() => {
        onTicketUse(selectedTicket.id);
        setIsVerifying(false);
        setSelectedTicket(null);
    }, 1500);
  };

  const handleTransferConfirm = async () => {
    if (!transferTicket || !recipientAddress) return;
    setIsTransferring(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    onTransfer(transferTicket.id, recipientAddress);
    setIsTransferring(false);
    setTransferTicket(null);
    setRecipientAddress('');
  };

  if (tickets.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <TicketIcon className="h-10 w-10 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Tickets Yet</h2>
            <p className="text-gray-400 mb-8 max-w-md">Explore the marketplace to find exclusive events and mint your first NFT ticket.</p>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-display font-bold text-white mb-8">My Ticket Wallet</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Ticket List */}
        <div className="lg:col-span-2 space-y-6">
          {tickets.map(ticket => {
            const event = getEventById(ticket.eventId);
            if (!event) return null;

            return (
              <div key={ticket.id} className="group relative bg-lumina-card border border-white/5 rounded-2xl overflow-hidden flex flex-col sm:flex-row hover:border-lumina-glow/30 transition-all shadow-lg hover:shadow-lumina-glow/5">
                {/* Event Image */}
                <div className="w-full sm:w-48 h-32 sm:h-full relative shrink-0">
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20" />
                    {/* Mobile Badge */}
                    <div className={`absolute top-2 left-2 sm:hidden px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md flex items-center gap-1 ${
                        ticket.isUsed 
                        ? 'bg-black/50 text-gray-400 border-white/10' 
                        : 'bg-emerald-900/60 text-emerald-400 border-emerald-500/30'
                    }`}>
                        {!ticket.isUsed && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        {ticket.isUsed ? 'Used' : 'Valid'}
                    </div>
                </div>
                
                {/* Ticket Details */}
                <div className="flex-1 p-6 flex flex-col justify-between min-h-[180px]">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold text-white pr-2">{event.title}</h3>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                {/* Desktop Status Badge with Animation */}
                                <div className={`hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border transition-all ${
                                    ticket.isUsed
                                    ? 'bg-white/5 text-gray-500 border-white/10'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                }`}>
                                    {!ticket.isUsed && (
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                    )}
                                    {ticket.isUsed && <XCircle className="w-3 h-3" />}
                                    <span>{ticket.isUsed ? 'Used' : 'Valid'}</span>
                                </div>
                                <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-500 font-mono">#{ticket.id.slice(-4)}</span>
                            </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-400 mb-4">
                            <Clock className="h-4 w-4 mr-2" />
                            {new Date(event.date).toLocaleDateString('en-GB')} • {event.location}
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-4">
                        <span className="text-xs text-gray-500">Purchased {new Date(ticket.purchaseDate).toLocaleDateString('en-GB')}</span>
                        
                        <div className="flex space-x-2">
                             <button
                                onClick={() => !ticket.isUsed && setTransferTicket(ticket)}
                                disabled={ticket.isUsed}
                                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    ticket.isUsed
                                    ? 'hidden'
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10'
                                }`}
                                title="Transfer Ticket"
                            >
                                <Send className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Transfer</span>
                            </button>

                            <button 
                                onClick={() => !ticket.isUsed && setSelectedTicket(ticket)}
                                disabled={ticket.isUsed}
                                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    ticket.isUsed 
                                    ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                    : 'bg-lumina-glow/10 text-lumina-glow hover:bg-lumina-glow/20 hover:shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                                }`}
                            >
                                <QrCode className="h-4 w-4 mr-2" />
                                {ticket.isUsed ? 'Archived' : 'Reveal QR'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Decorative perforation */}
                <div className="hidden sm:block absolute left-48 top-0 bottom-0 w-4 pointer-events-none">
                     <div className="absolute top-0 bottom-0 left-0 w-[1px] border-l border-dashed border-gray-600/30"></div>
                     <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-[#050505]"></div>
                     <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-[#050505]"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Analytics */}
        <div className="lg:col-span-1">
            <div className="bg-lumina-card border border-white/5 rounded-2xl p-6 sticky top-24">
                <h3 className="text-xl font-bold text-white mb-6">Portfolio Analysis</h3>
                
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1f1f22', borderColor: '#333', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                        <span className="text-gray-400">Total Tickets</span>
                        <span className="text-xl font-bold text-white">{tickets.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                        <span className="text-gray-400">Value (Est.)</span>
                        <span className="text-xl font-bold text-white">
                             {tickets.reduce((acc, t) => acc + (getEventById(t.eventId)?.priceETH || 0), 0).toFixed(4)} ETH
                        </span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* QR Verification Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-lumina-card border border-white/10 rounded-3xl max-w-md w-full p-8 relative shadow-2xl shadow-violet-900/20">
                <button 
                    onClick={() => setSelectedTicket(null)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="h-6 w-6" />
                </button>

                <div className="text-center mb-8">
                    <h3 className="text-2xl font-display font-bold text-white mb-2">
                        {getEventById(selectedTicket.eventId)?.title}
                    </h3>
                    <p className="text-gray-400 text-sm font-mono">
                        ID: {selectedTicket.id}
                    </p>
                </div>

                <div className="relative w-64 h-64 mx-auto mb-8 bg-white p-4 rounded-xl">
                    <QrCode className="w-full h-full text-black" strokeWidth={1} />
                    {/* Scanning Animation */}
                    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                         <div className="w-full h-1 bg-lumina-accent/50 shadow-[0_0_20px_rgba(109,40,217,0.8)] absolute top-0 animate-[float_3s_ease-in-out_infinite]" style={{ animation: 'scan 2s linear infinite' }}></div>
                    </div>
                    <style>{`
                        @keyframes scan {
                            0% { top: 0%; opacity: 0; }
                            10% { opacity: 1; }
                            90% { opacity: 1; }
                            100% { top: 100%; opacity: 0; }
                        }
                    `}</style>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleVerify}
                        disabled={isVerifying}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-lumina-accent to-lumina-glow text-white font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50"
                    >
                        {isVerifying ? (
                            <span className="animate-pulse">Verifying...</span>
                        ) : (
                            <>
                                <ScanLine className="mr-2 h-5 w-5" />
                                Verify Ticket
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-gray-500">
                        Show this QR code at the venue entrance.
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-lumina-card border border-white/10 rounded-3xl max-w-md w-full p-8 relative shadow-2xl">
                <button 
                    onClick={() => {
                        setTransferTicket(null);
                        setRecipientAddress('');
                    }}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="h-6 w-6" />
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send className="h-8 w-8 text-lumina-glow" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-white mb-2">
                        Transfer Ticket
                    </h3>
                    <p className="text-gray-400 text-sm">
                        You are about to transfer your ticket for <br/>
                        <span className="text-white font-medium">{getEventById(transferTicket.eventId)?.title}</span>
                    </p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Recipient Address</label>
                        <input
                            type="text"
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                            placeholder="0x..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lumina-glow/50 transition-colors font-mono text-sm"
                        />
                    </div>

                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3">
                         <AlertCircle className="h-5 w-5 text-orange-400 shrink-0" />
                         <p className="text-xs text-orange-200 leading-relaxed">
                            This action is irreversible. The ticket will be moved to the recipient's wallet and removed from your dashboard immediately.
                         </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => {
                                setTransferTicket(null);
                                setRecipientAddress('');
                            }}
                            className="py-3 rounded-xl bg-white/5 border border-white/5 text-gray-300 hover:bg-white/10 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleTransferConfirm}
                            disabled={!recipientAddress || isTransferring}
                            className="py-3 rounded-xl bg-white text-lumina-dark hover:bg-gray-200 font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                            {isTransferring ? (
                                <span className="animate-pulse">Sending...</span>
                            ) : (
                                'Confirm Transfer'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;