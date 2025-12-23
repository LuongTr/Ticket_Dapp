import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { NftEvent, WalletState } from '../types';
import { ArrowLeft, Calendar, MapPin, Tag, User, Share2, Ticket as TicketIcon, Clock, ShieldCheck, CalendarPlus, Download, ExternalLink, Star, MessageSquare } from 'lucide-react';

interface EventDetailsProps {
  events: NftEvent[];
  wallet: WalletState;
  onBuyTicket: (event: NftEvent) => void;
  onAddReview: (eventId: string, rating: number, comment: string) => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ events, wallet, onBuyTicket, onAddReview }) => {
  const { id } = useParams<{ id: string }>();
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Review form state
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');

  // Find the event by ID
  const event = events.find(e => e.id === id);

  // If event not found, could show error or redirect
  if (!event) {
    return (
      <div className="min-h-screen bg-lumina-dark text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
          <Link to="/explore" className="text-lumina-glow hover:text-white">
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendarOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const percentageSold = Math.round((event.soldTickets / event.totalTickets) * 100);
  const isSoldOut = event.soldTickets >= event.totalTickets;

  // Review Stats
  const reviews = event.reviews || [];
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  // Calculate Rating Distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { star, count, percentage };
  });

  // Calendar Logic
  const getEventDates = () => {
    const startDate = new Date(event.date);
    const endDate = new Date(event.date);
    endDate.setDate(endDate.getDate() + 1); // Next day for all-day event end

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, "").split("T")[0];
    };

    return {
      start: formatDate(startDate),
      end: formatDate(endDate)
    };
  };

  const handleGoogleCalendar = () => {
    const { start, end } = getEventDates();
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}&dates=${start}/${end}`;
    window.open(url, '_blank');
    setShowCalendarOptions(false);
  };

  const handleDownloadIcs = () => {
    const { start, end } = getEventDates();
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
URL:${window.location.href}
DTSTART;VALUE=DATE:${start}
DTEND;VALUE=DATE:${end}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowCalendarOptions(false);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (userComment.trim()) {
        onAddReview(event.id, userRating, userComment);
        setUserComment('');
        setUserRating(5);
    }
  };

  return (
    <div className="min-h-screen bg-lumina-dark pb-20 animate-in fade-in duration-500">
      
      {/* Immersive Hero Header */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-lumina-dark via-lumina-dark/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-lumina-accent/10 z-10 mix-blend-overlay" />
        <img 
          src={event.imageUrl} 
          alt={event.title} 
          className="w-full h-full object-cover blur-sm scale-105"
        />
        
        <div className="absolute top-8 left-4 sm:left-8 z-20">
          <Link
            to="/explore"
            className="flex items-center space-x-2 px-4 py-2 bg-black/30 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Explore</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Title Card */}
            <div className="bg-lumina-card/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-lumina-accent/20 text-lumina-glow text-xs font-bold uppercase tracking-wider border border-lumina-accent/20">
                  {event.category}
                </span>
                {isSoldOut && (
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider border border-red-500/20">
                    Sold Out
                  </span>
                )}
                <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                   <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                   <span className="text-xs font-bold text-yellow-400">{averageRating}</span>
                   <span className="text-[10px] text-gray-500 ml-1">({reviews.length})</span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
                {event.title}
              </h1>

              <div className="flex flex-wrap gap-6 text-gray-300">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-lumina-glow" />
                  <span className="text-lg">{new Date(event.date).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-lumina-glow" />
                  <span className="text-lg">{event.location}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-lumina-card border border-white/5 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">About this Event</h3>
              <p className="text-gray-400 text-lg leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
              
              <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Organizer</p>
                    <p className="font-mono text-lumina-glow">{event.organizer}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <ShieldCheck className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Verified on Blockchain</p>
                    <p className="text-white">Contract: 0x7a...F39e</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Map */}
            <div className="bg-lumina-card border border-white/5 rounded-3xl overflow-hidden h-80 relative shadow-inner group">
               <iframe 
                 width="100%" 
                 height="100%" 
                 id="gmap_canvas" 
                 src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=13&ie=UTF8&iwloc=&output=embed`} 
                 frameBorder="0" 
                 scrolling="no" 
                 marginHeight={0} 
                 marginWidth={0}
                 title="Event Location"
                 className="filter grayscale contrast-125 opacity-80 group-hover:opacity-100 transition-all duration-500"
               ></iframe>
               <div className="absolute top-4 right-4 bg-lumina-dark/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center shadow-lg pointer-events-none z-10">
                  <MapPin className="h-4 w-4 text-lumina-glow mr-2" />
                  <span className="text-sm font-medium text-white">{event.location}</span>
               </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-lumina-card border border-white/5 rounded-3xl p-8">
               <div className="flex items-center gap-3 mb-8">
                   <MessageSquare className="h-6 w-6 text-lumina-glow" />
                   <h3 className="text-2xl font-bold text-white">Reviews & Ratings</h3>
               </div>

               {/* Ratings Summary Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 bg-white/5 rounded-2xl p-6 border border-white/5">
                   {/* Left: Big Number */}
                   <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-6">
                       <div className="text-6xl font-bold text-white mb-2">{averageRating}</div>
                       <div className="flex gap-1 mb-2">
                           {[1, 2, 3, 4, 5].map((star) => (
                               <Star 
                                   key={star} 
                                   className={`h-5 w-5 ${star <= Math.round(parseFloat(averageRating)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} 
                               />
                           ))}
                       </div>
                       <p className="text-gray-400 text-sm">{reviews.length} Verified Reviews</p>
                   </div>

                   {/* Right: Distribution Bars */}
                   <div className="flex flex-col justify-center space-y-2">
                       {ratingDistribution.map((item) => (
                           <div key={item.star} className="flex items-center text-sm">
                               <div className="flex items-center w-12 text-gray-400">
                                   <span className="font-medium mr-1">{item.star}</span>
                                   <Star className="h-3 w-3 text-gray-500" />
                               </div>
                               <div className="flex-1 h-2 bg-white/10 rounded-full mx-3 overflow-hidden">
                                   <div 
                                       className="h-full bg-yellow-400 rounded-full transition-all duration-500 ease-out"
                                       style={{ width: `${item.percentage}%` }}
                                   ></div>
                               </div>
                               <div className="w-8 text-right text-gray-500 text-xs">{item.count}</div>
                           </div>
                       ))}
                   </div>
               </div>

               {/* Review Form */}
               <div className="mb-10">
                   {wallet.isConnected ? (
                       <div className="bg-gradient-to-br from-white/5 to-transparent rounded-2xl p-6 border border-white/5">
                           <form onSubmit={handleSubmitReview}>
                               <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                   <span className="w-1 h-6 bg-lumina-accent rounded-full mr-3"></span>
                                   Write a Review
                               </h4>
                               
                               <div className="mb-6">
                                   <label className="block text-sm text-gray-400 mb-3">Rate your experience</label>
                                   <div className="flex gap-2">
                                       {[1, 2, 3, 4, 5].map((star) => (
                                           <button
                                               key={star}
                                               type="button"
                                               onClick={() => setUserRating(star)}
                                               className="group focus:outline-none transition-transform hover:scale-110"
                                           >
                                               <Star 
                                                   className={`h-8 w-8 transition-colors ${
                                                       star <= userRating 
                                                           ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' 
                                                           : 'text-gray-600 group-hover:text-gray-500'
                                                   }`} 
                                               />
                                           </button>
                                       ))}
                                   </div>
                               </div>

                               <div className="mb-6">
                                   <label className="block text-sm text-gray-400 mb-3">Your Review</label>
                                   <textarea
                                       value={userComment}
                                       onChange={(e) => setUserComment(e.target.value)}
                                       placeholder="Share your thoughts about the event..."
                                       className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-lumina-glow/50 focus:ring-1 focus:ring-lumina-glow/20 transition-all h-32 resize-none"
                                       required
                                   />
                               </div>

                               <div className="flex justify-end">
                                   <button 
                                       type="submit"
                                       className="px-8 py-3 bg-white text-lumina-dark font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-lg shadow-white/5"
                                   >
                                       Submit Review
                                   </button>
                               </div>
                           </form>
                       </div>
                   ) : (
                       <div className="bg-white/5 border border-white/5 border-dashed rounded-2xl p-8 text-center">
                           <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                               <User className="h-6 w-6 text-gray-400" />
                           </div>
                           <h4 className="text-white font-medium mb-2">Want to leave a review?</h4>
                           <p className="text-gray-400 text-sm mb-4">Please connect your wallet to share your experience.</p>
                       </div>
                   )}
               </div>

               {/* Reviews List */}
               <div className="space-y-6">
                   {reviews.length > 0 ? (
                       reviews.map((review) => (
                           <div key={review.id} className="group bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/5 rounded-2xl p-6 transition-all duration-300">
                               <div className="flex justify-between items-start mb-4">
                                   <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg ring-2 ring-white/10">
                                           {review.userAddress.slice(2, 4).toUpperCase()}
                                       </div>
                                       <div>
                                           <p className="text-sm font-bold text-white font-mono tracking-wide">{review.userAddress}</p>
                                           <div className="flex gap-0.5 mt-1">
                                               {[...Array(5)].map((_, i) => (
                                                   <Star 
                                                       key={i} 
                                                       className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                                                   />
                                               ))}
                                           </div>
                                       </div>
                                   </div>
                                   <span className="text-xs text-gray-500 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                                       {new Date(review.timestamp).toLocaleDateString('en-GB')}
                                   </span>
                               </div>
                               <p className="text-gray-300 text-sm leading-relaxed pl-16">
                                   {review.comment}
                               </p>
                           </div>
                       ))
                   ) : (
                       <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                           <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
                           <p>No reviews yet. Be the first to share your experience!</p>
                       </div>
                   )}
               </div>
            </div>

          </div>

          {/* Sticky Sidebar (Right) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              
              <div className="bg-lumina-card/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-lumina-accent/30 rounded-full blur-3xl"></div>
                
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <TicketIcon className="h-5 w-5 mr-2 text-lumina-glow" />
                  Ticket Details
                </h3>

                <div className="mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-gray-400">Current Price</span>
                    <span className="text-3xl font-bold text-white">{event.priceETH} ETH</span>
                  </div>
                  <p className="text-xs text-gray-500 text-right">≈ ${(event.priceETH * 2800).toLocaleString()} USD</p>
                </div>

                <div className="space-y-4 mb-8">
                   <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Availability</span>
                        <span className="text-white font-medium">{event.soldTickets} / {event.totalTickets} sold</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            percentageSold > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-lumina-accent to-lumina-glow'
                          }`}
                          style={{ width: `${percentageSold}%` }}
                        />
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <p className="text-sm font-semibold text-white">
                             {isSoldOut ? 'Sold Out' : 'Available'}
                          </p>
                      </div>
                       <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Type</p>
                          <p className="text-sm font-semibold text-white">NFT Ticket</p>
                      </div>
                   </div>
                </div>

                <button
                  onClick={() => onBuyTicket(event)}
                  disabled={isSoldOut}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all duration-300 ${
                    isSoldOut
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-lumina-dark hover:bg-gray-200 hover:shadow-white/10'
                  }`}
                >
                   {isSoldOut ? 'Sold Out' : 'Mint Ticket Now'}
                   {!isSoldOut && <TicketIcon className="ml-2 h-5 w-5" />}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Secured by Ethereum Smart Contracts. <br/>
                  Resale royalties apply.
                </p>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-3">
                  <button className="bg-lumina-card border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors group">
                     <Share2 className="h-6 w-6 text-gray-400 mb-2 group-hover:text-white transition-colors" />
                     <span className="text-xs font-medium text-gray-400 group-hover:text-white">Share</span>
                  </button>

                  <div className="relative" ref={calendarRef}>
                    <button 
                        onClick={() => setShowCalendarOptions(!showCalendarOptions)}
                        className={`w-full h-full bg-lumina-card border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors group ${showCalendarOptions ? 'bg-white/5 ring-1 ring-lumina-glow/50' : ''}`}
                    >
                        <CalendarPlus className={`h-6 w-6 mb-2 transition-colors ${showCalendarOptions ? 'text-lumina-glow' : 'text-gray-400 group-hover:text-white'}`} />
                        <span className={`text-xs font-medium transition-colors ${showCalendarOptions ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>Calendar</span>
                    </button>

                    {/* Dropdown Menu */}
                    {showCalendarOptions && (
                        <div className="absolute bottom-full right-0 mb-2 w-56 bg-lumina-card/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="p-1">
                                <button 
                                    onClick={handleGoogleCalendar}
                                    className="w-full flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors text-left"
                                >
                                    <ExternalLink className="h-4 w-4 mr-3 text-lumina-glow" />
                                    Google Calendar
                                </button>
                                <button 
                                    onClick={handleDownloadIcs}
                                    className="w-full flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors text-left"
                                >
                                    <Download className="h-4 w-4 mr-3 text-lumina-glow" />
                                    Apple / Outlook (.ics)
                                </button>
                            </div>
                        </div>
                    )}
                  </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EventDetails;
