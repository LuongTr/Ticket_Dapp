import React from 'react';
import { ViewState, WalletState } from '../types';
import { Hexagon, Wallet, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentView: ViewState;
  changeView: (view: ViewState) => void;
  wallet: WalletState;
  connectWallet: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, changeView, wallet, connectWallet }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { label: 'Home', view: ViewState.HOME },
    { label: 'Explore', view: ViewState.EXPLORE },
    { label: 'My Events', view: ViewState.MY_EVENTS },
    { label: 'Create Event', view: ViewState.CREATE },
    { label: 'My Tickets', view: ViewState.DASHBOARD },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-lumina-dark/70 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex items-center cursor-pointer group" onClick={() => changeView(ViewState.HOME)}>
            <div className="relative">
              <div className="absolute inset-0 bg-lumina-glow blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <Hexagon className="relative h-8 w-8 text-white fill-white/10" strokeWidth={1.5} />
            </div>
            <span className="ml-3 text-xl font-display font-bold tracking-tight text-white">
              LUMINA
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:block">
            <div className="flex items-baseline space-x-8">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => changeView(link.view)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    currentView === link.view
                      ? 'text-white bg-white/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Button */}
          <div className="hidden md:block">
            <button
              onClick={connectWallet}
              className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                wallet.isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                  : 'bg-lumina-accent hover:bg-violet-600 border-transparent text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:shadow-[0_0_25px_rgba(139,92,246,0.7)]'
              }`}
            >
              <Wallet className="h-4 w-4 mr-2" />
              {wallet.isConnected ? (
                <span>{wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}</span>
              ) : (
                'Connect Wallet'
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-lumina-card border-b border-white/5">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  changeView(link.view);
                  setIsMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  currentView === link.view
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => {
                 connectWallet();
                 setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-base font-medium text-lumina-glow"
            >
              {wallet.isConnected ? 'Wallet Connected' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;