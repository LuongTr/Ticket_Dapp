import React, { useState } from 'react';
import { NftEvent } from '../types';
import { Calendar, MapPin, Tag, Image as ImageIcon } from 'lucide-react';

interface EventCardProps {
  event: NftEvent;
  onBuy: (event: NftEvent) => void;
  onClick?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onBuy, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div 
      onClick={onClick}
      className="group relative rounded-2xl bg-lumina-card border border-white/5 overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:border-lumina-glow/30 cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-lumina-card to-transparent z-10 opacity-60"></div>
        
        {/* Placeholder while loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-white/10 animate-pulse" />
          </div>
        )}

        <img 
          src={event.imageUrl} 
          alt={event.title} 
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transform group-hover:scale-110 transition-all duration-700 ease-out ${
            imageLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
          }`}
        />
        <div className="absolute top-3 right-3 z-20 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
          <span className="text-xs font-semibold text-white uppercase tracking-wider">{event.category}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 relative z-20">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-lumina-glow transition-colors">{event.title}</h3>
        </div>
        
        <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">{event.description}</p>

        <div className="space-y-2 mb-6">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2 text-lumina-glow" />
            <span>{new Date(event.date).toLocaleDateString('en-GB')}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-2 text-lumina-glow" />
            <span>{event.location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Price</span>
            <div className="flex items-center">
                <Tag className="h-3 w-3 mr-1 text-lumina-accent" />
                <span className="text-lg font-bold text-white">{event.priceETH} ETH</span>
            </div>
          </div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onBuy(event);
            }}
            className="px-5 py-2 rounded-lg bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-colors z-30"
          >
            Mint Ticket
          </button>
        </div>
        
        {/* Progress Bar for Tickets */}
        <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{event.soldTickets} sold</span>
                <span>{event.totalTickets} total</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500" 
                    style={{ width: `${(event.soldTickets / event.totalTickets) * 100}%` }}
                ></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;