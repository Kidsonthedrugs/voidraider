/**
 * TopBar Component
 * Strictly adheres to 3-zone contract:
 * Zone 1: Wordmark
 * Zone 2: 4-5 single-line nav links
 * Zone 3: 1 primary action (Google In-App Wallet Connect / Status) + Audio & Balance
 */

import React from 'react';
import { Volume2, VolumeX, Wallet, Settings2 } from 'lucide-react';
import { toggleMute, getMuteState } from '../game/zzfx';
import { GoogleConnect } from './GoogleConnect';

interface TopBarProps {
  activeTab: 'game' | 'leaderboard' | 'contract' | 'docs';
  setActiveTab: (tab: 'game' | 'leaderboard' | 'contract' | 'docs') => void;
  walletAddress: string | null;
  isSimulated: boolean;
  tokenBalance: number;
  onConnectReal: () => void;
  onConnectSimulated: () => void;
  onDisconnect: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  walletAddress,
  isSimulated,
  tokenBalance,
  onConnectReal,
  onConnectSimulated,
  onDisconnect,
}) => {
  const [muted, setMuted] = React.useState(getMuteState());
  const [altMenuOpen, setAltMenuOpen] = React.useState(false);

  const handleToggleSound = () => {
    const isNowMuted = toggleMute();
    setMuted(isNowMuted);
  };

  return (
    <header className="w-full bg-[#090d16] border-b border-slate-800/80 px-6 py-3.5 z-40 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
            <span className="font-mono text-sm">VR</span>
          </div>
          <button
            onClick={() => setActiveTab('game')}
            className="text-left font-bold tracking-tight text-white text-base hover:text-cyan-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            VOID RAIDER <span className="text-cyan-400 text-xs font-mono font-normal">ON-CHAIN</span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('game')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              activeTab === 'game'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Arcade Battle
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Leaderboard
          </button>

          <button
            onClick={() => setActiveTab('contract')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              activeTab === 'contract'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Smart Contract
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              activeTab === 'docs'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Sprint Specs
          </button>
        </nav>

        {/* Zone 3: Google In-App Wallet Action & Audio Control */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Audio toggle button */}
          <button
            onClick={handleToggleSound}
            aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 text-slate-400 hover:text-cyan-400 bg-slate-900/80 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Token Balance Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="text-amber-400 font-mono font-bold">{tokenBalance}</span>
            <span className="text-slate-400 font-medium">$VOID</span>
          </div>

          {/* Clean Google In-App Wallet Connect / Status */}
          <GoogleConnect compact />

          {/* Alternate Wallet Options Menu */}
          <div className="relative">
            <button
              onClick={() => setAltMenuOpen(!altMenuOpen)}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900/80 border border-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Alternative Wallets & Testnet Options"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {altMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-800 text-slate-400 text-[11px] font-mono">
                  FALLBACK / DEV WALLETS
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onConnectReal();
                      setAltMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>Connect Injected EVM</span>
                    <span className="text-[10px] text-cyan-400 font-mono">MetaMask</span>
                  </button>

                  <button
                    onClick={() => {
                      onConnectSimulated();
                      setAltMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800/80 text-slate-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>Instant Burner Wallet</span>
                    <span className="text-[10px] text-amber-400 font-mono">Local Sim</span>
                  </button>
                </div>

                {walletAddress && (
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        onDisconnect();
                        setAltMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 text-xs cursor-pointer font-mono"
                    >
                      Reset Local Storage
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
