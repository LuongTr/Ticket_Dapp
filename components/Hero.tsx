import React from 'react';
import { ViewState } from '../types';
import { ArrowRight, Zap, ShieldCheck, Ticket } from 'lucide-react';

interface HeroProps {
  onChangeView: (view: ViewState) => void;
}

const Hero: React.FC<HeroProps> = ({ onChangeView }) => {
  return (
    <div className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-lumina-accent/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-md animate-float">
          <span className="flex h-2 w-2 rounded-full bg-lumina-success"></span>
          <span className="text-sm font-medium text-gray-300">Live on Ethereum Sepolia</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-display font-bold text-white tracking-tight mb-8 leading-tight">
          The Future of <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400">
            Event Ticketing
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-xl text-gray-400 mb-10 leading-relaxed">
          Secure, transparent, and resale-controlled tickets powered by NFTs. 
          Say goodbye to scalpers and fake tickets.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <button
            onClick={() => onChangeView(ViewState.EXPLORE)}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-lumina-dark font-bold text-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            Explore Events
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
          <button
            onClick={() => onChangeView(ViewState.CREATE)}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-colors backdrop-blur-sm"
          >
            Create Event
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
          {[
            {
              icon: ShieldCheck,
              title: "100% Secure",
              desc: "Blockchain verification eliminates counterfeit tickets instantly."
            },
            {
              icon: Zap,
              title: "Instant Transfer",
              desc: "Send tickets to friends or resell them safely in seconds."
            },
            {
              icon: Ticket,
              title: "Smart Royalties",
              desc: "Organizers earn perpetual royalties on every secondary sale."
            }
          ].map((feature, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-lg bg-lumina-accent/20 flex items-center justify-center mb-4 text-lumina-glow">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;