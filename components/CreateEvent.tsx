import React, { useState, useRef } from 'react';
import { generateEventConcept } from '../services/geminiService';
import { NftEvent } from '../types';
import { Sparkles, Loader2, Image as ImageIcon, Upload } from 'lucide-react';

interface CreateEventProps {
  onEventCreated: (event: NftEvent) => void;
  walletAddress: string | null;
}

const CreateEvent: React.FC<CreateEventProps> = ({ onEventCreated, walletAddress }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<Partial<NftEvent>>({
    title: '',
    description: '',
    priceETH: 0.05,
    location: 'Metaverse Hall A',
    date: new Date().toISOString().split('T')[0],
    totalTickets: 100,
    category: 'Other',
    imageUrl: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAiGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const result = await generateEventConcept(prompt);
      if (result) {
        setFormData(prev => ({
          ...prev,
          title: result.title,
          description: result.shortDescription,
          priceETH: result.suggestedPriceETH,
          category: result.category as any
        }));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate with AI. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    const newEvent: NftEvent = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      date: formData.date || '',
      location: formData.location || '',
      priceETH: formData.priceETH || 0,
      imageUrl: formData.imageUrl || `https://picsum.photos/800/600?random=${Date.now()}`,
      organizer: walletAddress || '0xYOU',
      totalTickets: formData.totalTickets || 100,
      soldTickets: 0,
      category: formData.category as any,
      reviews: []
    };

    onEventCreated(newEvent);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-white mb-2">Create New Event</h2>
        <p className="text-gray-400">Mint a new event NFT collection. Use AI to help you get started.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: AI Assistant */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-gradient-to-b from-violet-900/20 to-fuchsia-900/20 p-5 rounded-2xl border border-violet-500/20">
            <div className="flex items-center space-x-2 text-lumina-glow mb-3">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">AI Assistant</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Describe your event idea roughly, and let Gemini generate the details.
            </p>
            <textarea
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lumina-glow/50 resize-none h-32 mb-3"
              placeholder="e.g. A cyberpunk techno rave in an abandoned warehouse..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              onClick={handleAiGenerate}
              disabled={isGenerating || !prompt}
              className="w-full py-2 bg-lumina-accent hover:bg-violet-600 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Details"}
            </button>
          </div>
        </div>

        {/* Right: Main Form */}
        <div className="md:col-span-2 bg-lumina-card border border-white/5 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Event Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lumina-glow/50 transition-colors"
                placeholder="Enter event title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lumina-glow/50 transition-colors h-24"
                placeholder="Event description..."
                required
              />
            </div>

            {/* Added Location Input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lumina-glow/50 transition-colors"
                placeholder="e.g. Cyber Dome, Tokyo"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lumina-glow/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lumina-glow/50"
                >
                  <option>Music</option>
                  <option>Tech</option>
                  <option>Art</option>
                  <option>Sports</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Price (ETH)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.priceETH}
                  onChange={(e) => setFormData({...formData, priceETH: parseFloat(e.target.value)})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lumina-glow/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Total Tickets</label>
                <input
                  type="number"
                  value={formData.totalTickets}
                  onChange={(e) => setFormData({...formData, totalTickets: parseInt(e.target.value)})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lumina-glow/50"
                  required
                />
              </div>
            </div>

             {/* Image Upload Visual */}
             <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Cover Image</label>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*"
                />
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-lumina-glow/50 hover:bg-white/5 transition-all cursor-pointer overflow-hidden relative group"
                >
                    {formData.imageUrl ? (
                        <>
                            <img src={formData.imageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white font-medium flex items-center">
                                    <Upload className="h-5 w-5 mr-2" />
                                    Change Image
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-300">Click to upload cover image</span>
                            <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</span>
                        </>
                    )}
                </div>
             </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
              >
                Mint Event NFT
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;