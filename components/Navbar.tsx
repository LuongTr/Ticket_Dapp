import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletState } from '../types';
import { Hexagon, Wallet, Menu, X, ChevronDown, LogOut, RefreshCw } from 'lucide-react';

interface NavbarProps {
  wallet: WalletState;
  connectWallet: () => void;
  disconnectWallet: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ wallet, connectWallet, disconnectWallet }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Explore', path: '/explore' },
    { label: 'Create Event', path: '/create' },
    { label: 'My Tickets', path: '/dashboard' },
    { label: 'Manage', path: '/manage' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-lumina-dark/70 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center cursor-pointer group">
            <div className="relative">
              <div className="absolute inset-0 bg-lumina-glow blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <Hexagon className="relative h-8 w-8 text-white fill-white/10" strokeWidth={1.5} />
            </div>
            <span className="ml-3 text-xl font-display font-bold tracking-tight text-white">
              LUMINA
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:block">
            <div className="flex items-baseline space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    location.pathname === link.path
                      ? 'text-white bg-white/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Wallet Button */}
          <div className="hidden md:block relative">
            {wallet.isConnected ? (
              <div>
                <button
                  onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                  className="flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border bg-emerald-500/10 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  <span>{wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}</span>
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isWalletDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Wallet Dropdown */}
                {isWalletDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-lumina-card border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-1">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-xs text-gray-400">Connected Wallet</p>
                        <p className="text-xs font-mono text-white break-all leading-relaxed">{wallet.address}</p>
                        <p className="text-xs text-gray-400 mt-1">{wallet.balanceETH.toFixed(4)} ETH</p>
                      </div>
                      <button
                        onClick={() => {
                          disconnectWallet();
                          setIsWalletDropdownOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4 mr-3 text-red-400" />
                        Disconnect Wallet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border bg-lumina-accent hover:bg-violet-600 border-transparent text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:shadow-[0_0_25px_rgba(139,92,246,0.7)]"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </button>
            )}
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
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === link.path
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
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
