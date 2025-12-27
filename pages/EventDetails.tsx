import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { NftEvent, WalletState } from '../types';
import { ArrowLeft, Calendar, MapPin, Tag, User, Share2, Ticket as TicketIcon, Clock, ShieldCheck, CalendarPlus, Download, ExternalLink, Star, MessageSquare, Loader2, AlertCircle, Gift } from 'lucide-react';
import { contractService } from '../src/services/contractService';
import ReviewService, { Review, ReviewStats } from '../services/reviewService';
import AirdropModal from '../components/AirdropModal';

interface EventDetailsProps {
  wallet: WalletState;
  onBuyTicket: (event: NftEvent, onSuccess?: () => void) => void;
  mintingEventId: string | null;
  onMintSuccess: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ wallet, onBuyTicket, mintingEventId, onMintSuccess }) => {
  const { id } = useParams<{ id: string }>();
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Event data state
  const [event, setEvent] = useState<NftEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review data state
  const [fetchedReviews, setFetchedReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Review form state
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [userReview, setUserReview] = useState<Review | null>(null);

  // Edit state for individual reviews
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  // Airdrop modal state
  const [showAirdropModal, setShowAirdropModal] = useState(false);

  // Fetch event data from blockchain
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Check MetaMask connection
        if (!window.ethereum) {
          setError('MetaMask not detected. Please install MetaMask to view events.');
          return;
        }

        // Check if on Sepolia network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0xaa36a7') {
          setError('Please switch to Sepolia testnet in MetaMask to view events.');
          return;
        }

        // Initialize contract service and fetch event
        await contractService.initializeReadOnly();
        const eventData = await contractService.getEvent(parseInt(id));

        // Convert to NftEvent format
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
          category: 'Other', // Default category since contract doesn't store it
          reviews: [] // Reviews are handled off-chain
        };

        setEvent(formattedEvent);
      } catch (err) {
        console.error('Failed to fetch event:', err);
        setError(err instanceof Error ? err.message : 'Failed to load event data');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

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

  // Fetch reviews when event is loaded
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;

      try {
        setReviewsLoading(true);
        const [reviewsData, statsData] = await Promise.all([
          ReviewService.getReviews(parseInt(id)),
          ReviewService.getReviewStats(parseInt(id))
        ]);

        setFetchedReviews(reviewsData);
        setReviewStats(statsData);

        // Filter out legacy reviews without user_address and find user's existing review if wallet is connected
        // Note: Database returns snake_case (user_address), not camelCase (userAddress)
        const validReviews = reviewsData.filter(review => review.user_address && review.user_address.trim() !== '');

        if (wallet.isConnected && wallet.address) {
          const userReview = validReviews.find(review =>
            review.user_address?.toLowerCase() === wallet.address?.toLowerCase()
          );
          setUserReview(userReview || null);
        }

        // Update the reviews data to exclude invalid reviews
        setFetchedReviews(validReviews);

        // Pre-fill form with existing review data
        if (userReview) {
          setUserRating(userReview.rating);
          setUserComment(userReview.comment);
        } else {
          // Reset to defaults if no existing review
          setUserRating(5);
          setUserComment('');
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        // Keep empty arrays as fallback
        setFetchedReviews([]);
        setReviewStats(null);
        setUserReview(null);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id, wallet.isConnected, wallet.address]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-lumina-dark text-white flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-lumina-glow mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Loading Event</h3>
          <p className="text-gray-400">Fetching event data from the blockchain...</p>
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
          <h2 className="text-2xl font-bold mb-4">{error ? 'Error Loading Event' : 'Event Not Found'}</h2>
          <p className="text-red-400 mb-6">{error || 'The event could not be found on the blockchain.'}</p>
          <Link to="/explore" className="inline-flex items-center px-6 py-3 bg-lumina-glow text-white rounded-lg hover:bg-lumina-glow/80 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const percentageSold = Math.round((event.soldTickets / event.totalTickets) * 100);
  const isSoldOut = event.soldTickets >= event.totalTickets;

  // Use fetched reviews data
  const reviews = fetchedReviews;
  const averageRating = typeof reviewStats?.averageRating === 'number'
    ? reviewStats.averageRating.toFixed(1)
    : '0.0';

  // Calculate Rating Distribution from stats
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => {
    const count = (reviewStats?.ratingDistribution && reviewStats.ratingDistribution[star]) || 0;
    const percentage = reviewStats?.totalReviews ? (count / reviewStats.totalReviews) * 100 : 0;
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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userComment.trim() || !wallet.isConnected) return;

    try {
      setSubmittingReview(true);

      // Generate the message to sign
      const message = ReviewService.generateReviewMessage(event.id, userReview ? 'update' : 'create');

      // Sign the message with MetaMask
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, wallet.address]
      });

      const requestData = {
        eventId: event.id,
        rating: userRating,
        comment: userComment.trim(),
        signature,
        message
      };

      // Submit or update the review to the API
      if (userReview) {
        // Update existing review
        await ReviewService.updateReview(userReview.id, requestData);
      } else {
        // Create new review
        await ReviewService.submitReview(requestData);
      }

      // Refresh the reviews data
      const [reviewsData, statsData] = await Promise.all([
        ReviewService.getReviews(event.id),
        ReviewService.getReviewStats(event.id)
      ]);

      setFetchedReviews(reviewsData);
      setReviewStats(statsData);

      // Find updated user review
      const updatedUserReview = reviewsData.find(review =>
        review.user_address?.toLowerCase() === wallet.address?.toLowerCase()
      );
      setUserReview(updatedUserReview || null);

    } catch (error) {
      console.error('Failed to submit review:', error);

      // Handle different error types
      let errorMessage = 'Failed to submit review. Please try again.';

      if (error instanceof Error) {
        // Check for specific error messages from backend
        if (error.message.includes('ticket')) {
          errorMessage = 'You must own a ticket for this event to leave a review.';
        } else if (error.message.includes('already reviewed')) {
          errorMessage = 'You have already reviewed this event.';
        } else if (error.message.includes('Invalid signature')) {
          errorMessage = 'Signature verification failed. Please try again.';
        }
      }

      alert(errorMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Helper function to truncate Ethereum addresses
  const truncateAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Copy address to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle edit review
  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  // Handle save edited review
  const handleSaveEdit = async () => {
    if (!editingReviewId || !wallet.isConnected) return;

    try {
      setSubmittingReview(true);

      // Generate the message to sign
      const message = ReviewService.generateReviewMessage(event.id, 'update');

      // Sign the message with MetaMask
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, wallet.address]
      });

      const requestData = {
        eventId: event.id,
        rating: editRating,
        comment: editComment.trim(),
        signature,
        message
      };

      // Update the review
      await ReviewService.updateReview(editingReviewId, requestData);

      // Refresh the reviews data
      const [reviewsData, statsData] = await Promise.all([
        ReviewService.getReviews(event.id),
        ReviewService.getReviewStats(event.id)
      ]);

      setFetchedReviews(reviewsData);
      setReviewStats(statsData);

      // Exit edit mode
      setEditingReviewId(null);
      setEditRating(5);
      setEditComment('');

    } catch (error) {
      console.error('Failed to update review:', error);
      alert('Failed to update review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(5);
    setEditComment('');
  };

  // Generate ticket types data for airdrop modal
  const ticketTypes = [
    { id: 1, name: 'General Admission', available: Math.max(0, event.totalTickets - event.soldTickets) }
  ];

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
              <div className="text-gray-400 text-lg leading-relaxed whitespace-pre-line break-words overflow-wrap-anywhere">
                {event.description}
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500 mb-1">Organizer</p>
                    <button
                      onClick={() => copyToClipboard(event.organizer)}
                      className="font-mono text-lumina-glow hover:text-white transition-colors text-left break-all"
                      title="Click to copy full address"
                    >
                      {truncateAddress(event.organizer)}
                    </button>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <ShieldCheck className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Verified on Blockchain</p>
                    <p className="text-white">Contract: {truncateAddress(contractService.getContractAddress())}</p>
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

               {/* Review Form - Disabled when user already has a review */}
               <div className="mb-10">
                   {wallet.isConnected ? (
                       <div className={`bg-gradient-to-br rounded-2xl p-6 border ${userReview ? 'bg-gray-800/50 border-gray-600/50' : 'from-white/5 to-transparent border-white/5'}`}>
                           <div className="flex items-center justify-between mb-4">
                               <h4 className="text-lg font-semibold text-white flex items-center">
                                   <span className="w-1 h-6 bg-lumina-accent rounded-full mr-3"></span>
                                   {userReview ? 'You have already reviewed this event' : 'Write a Review'}
                               </h4>
                               {userReview && (
                                   <span className="text-xs text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">
                                       Edit your review below
                                   </span>
                               )}
                           </div>

                           <form onSubmit={handleSubmitReview}>
                               <div className="mb-6">
                                   <label className="block text-sm text-gray-400 mb-3">Rate your experience</label>
                                   <div className="flex gap-2">
                                       {[1, 2, 3, 4, 5].map((star) => (
                                           <button
                                               key={star}
                                               type="button"
                                               disabled={!!userReview}
                                               onClick={() => setUserRating(star)}
                                               className="group focus:outline-none transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                       placeholder={userReview ? "Edit your review below" : "Share your thoughts about the event..."}
                                       disabled={!!userReview}
                                       className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-lumina-glow/50 focus:ring-1 focus:ring-lumina-glow/20 transition-all h-32 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                       required={!userReview}
                                   />
                               </div>

                               <div className="flex justify-end">
                                   <button
                                       type="submit"
                                       disabled={submittingReview || !!userReview}
                                       className={`px-8 py-3 font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all duration-300 ${
                                           submittingReview || !!userReview
                                               ? 'bg-gray-600 text-gray-400 cursor-not-allowed shadow-white/5'
                                               : 'bg-lumina-glow text-lumina-dark hover:bg-lumina-glow/80 hover:shadow-lumina-glow/25'
                                       }`}
                                   >
                                       {submittingReview ? (
                                           <>
                                               <Loader2 className="h-4 w-4 animate-spin" />
                                               Submitting...
                                           </>
                                       ) : userReview ? (
                                           'Use Edit Button Below'
                                       ) : (
                                           'Submit Review'
                                       )}
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
                       reviews.map((review) => {
                           const isEditing = editingReviewId === review.id;
                           const isOwnReview = (review.userAddress || review.user_address)?.toLowerCase() === wallet.address?.toLowerCase();

                           // Debug logging for edit button visibility
                           if (isOwnReview) {
                               console.log('Edit button should show for review:', review.id, 'User:', review.userAddress, 'Wallet:', wallet.address);
                           }

                           return (
                               <div key={review.id} className="group bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/5 rounded-2xl p-6 transition-all duration-300">
                                   <div className="flex justify-between items-start mb-4">
                                       <div className="flex items-center gap-4">
                                           <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg ring-2 ring-white/10">
                                               {(review.userAddress || review.user_address) ? (review.userAddress || review.user_address).slice(2, 4).toUpperCase() : '??'}
                                           </div>
                                           <div className="flex-1">
                                               <p className="text-sm font-bold text-white font-mono tracking-wide">
                                                   {(review.userAddress || review.user_address) ? truncateAddress(review.userAddress || review.user_address) : 'Unknown User'}
                                                   {isOwnReview && <span className="ml-2 text-xs text-lumina-glow">(Your Review)</span>}
                                               </p>
                                               <div className="flex gap-0.5 mt-1">
                                                   {isEditing ? (
                                                       // Editable stars
                                                       [1, 2, 3, 4, 5].map((star) => (
                                                           <button
                                                               key={star}
                                                               type="button"
                                                               onClick={() => setEditRating(star)}
                                                               className="group focus:outline-none transition-transform hover:scale-110"
                                                           >
                                                               <Star
                                                                   className={`h-3 w-3 transition-colors ${
                                                                       star <= editRating
                                                                           ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                                                                           : 'text-gray-600 group-hover:text-gray-500'
                                                                   }`}
                                                               />
                                                           </button>
                                                       ))
                                                   ) : (
                                                       // Display stars
                                                       [...Array(5)].map((_, i) => (
                                                           <Star
                                                               key={i}
                                                               className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                                                           />
                                                       ))
                                                   )}
                                               </div>
                                           </div>
                                       </div>
                                       <div className="flex items-center gap-2">
                                           {isOwnReview && !isEditing && (
                                               <button
                                                   onClick={() => handleEditReview(review)}
                                                   className="text-xs px-3 py-1 bg-lumina-glow/20 text-lumina-glow rounded-full hover:bg-lumina-glow/30 transition-colors"
                                               >
                                                   Edit
                                               </button>
                                           )}
                                           {isEditing && (
                                               <div className="flex gap-1">
                                                   <button
                                                       onClick={handleSaveEdit}
                                                       disabled={submittingReview}
                                                       className="text-xs px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                   >
                                                       {submittingReview ? 'Saving...' : 'Save'}
                                                   </button>
                                                   <button
                                                       onClick={handleCancelEdit}
                                                       className="text-xs px-3 py-1 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
                                                   >
                                                       Cancel
                                                   </button>
                                               </div>
                                           )}
                                           <span className="text-xs text-gray-500 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                                               {new Date(review.created_at).toLocaleDateString('en-GB')}
                                           </span>
                                       </div>
                                   </div>
                                   <div className="pl-16">
                                       {isEditing ? (
                                           <textarea
                                               value={editComment}
                                               onChange={(e) => setEditComment(e.target.value)}
                                               className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-lumina-glow/50 focus:ring-1 focus:ring-lumina-glow/20 transition-all resize-none"
                                               rows={3}
                                               placeholder="Update your review..."
                                           />
                                       ) : (
                                           <p className="text-gray-300 text-sm leading-relaxed">
                                               {review.comment}
                                           </p>
                                       )}
                                   </div>
                               </div>
                           );
                       })
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
                          <p className="text-sm font-semibold text-white">Regular</p>
                      </div>
                   </div>
                </div>

                <button
                  onClick={() => onBuyTicket(event, onMintSuccess)}
                  disabled={isSoldOut || mintingEventId !== null}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all duration-300 ${
                    isSoldOut || mintingEventId !== null
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-lumina-dark hover:bg-gray-200 hover:shadow-white/10'
                  }`}
                >
                   {isSoldOut ? 'Sold Out' : mintingEventId === event.id ? 'Ticket is minting...' : mintingEventId ? 'Minting in progress...' : 'Buy Ticket Now'}
                   {!isSoldOut && mintingEventId === null && <TicketIcon className="ml-2 h-5 w-5" />}
                   {mintingEventId === event.id && <Loader2 className="ml-2 h-5 w-5 animate-spin" />}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Secured by Ethereum Smart Contracts. <br/>
                  Resale royalties apply.
                </p>
              </div>

              {/* Airdrop Button for Organizers */}
              {wallet.isConnected && event.organizer?.toLowerCase() === wallet.address?.toLowerCase() && (
                <button
                  onClick={() => setShowAirdropModal(true)}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                >
                  <Gift className="h-5 w-5" />
                  Airdrop Tickets
                </button>
              )}

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

      {/* Airdrop Modal */}
      <AirdropModal
        isOpen={showAirdropModal}
        onClose={() => setShowAirdropModal(false)}
        eventId={event.id}
        eventTitle={event.title}
        ticketTypes={ticketTypes}
      />
    </div>
  );
};

export default EventDetails;
