/**
 * DocsModal Component
 * 1-Day Sprint Roadmap, Architecture Rules, and Tech Specs from user brief.
 */

import React from 'react';
import { BookOpen, CheckCircle, Zap, Cpu, Flame, Layers } from 'lucide-react';

interface DocsModalProps {
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">1-DAY SPRINT ARCHITECTURE</h2>
              <p className="text-xs text-slate-400 font-mono">Zero-Bloat Web3 Mini-Game Guidelines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4 text-xs text-slate-300">
          {/* Sprint Phases */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Operational 24-Hour Roadmap
            </h3>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800">
                <span className="text-cyan-400 font-bold">Hours 00–03:</span> Smart Contract & Testnet
                <p className="text-slate-500 text-[10px] mt-0.5">Foundry ERC-20 deploy & ABI hookup</p>
              </div>
              <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800">
                <span className="text-cyan-400 font-bold">Hours 03–07:</span> 60 FPS Core Game Loop
                <p className="text-slate-500 text-[10px] mt-0.5">Movement, weapons, collisions, game-over</p>
              </div>
              <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800">
                <span className="text-cyan-400 font-bold">Hours 07–10:</span> Web3 Token Bridge
                <p className="text-slate-500 text-[10px] mt-0.5">Post-run claim popup & leaderboard sync</p>
              </div>
              <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800">
                <span className="text-cyan-400 font-bold">Hours 10–13:</span> Game Juice & Polish
                <p className="text-slate-500 text-[10px] mt-0.5">ZzFX sounds, screen shake, particles</p>
              </div>
            </div>
          </div>

          {/* Key Principles */}
          <div className="space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Critical Engineering Principles
            </h3>

            <div className="space-y-2 text-slate-400 leading-relaxed">
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                <span className="text-white font-semibold">1. Isolated Web3 Hook (`useGameRewards`):</span>
                <p className="mt-0.5">
                  The game loop must NEVER be blocked by RPC latency or wallet modal popups. Web3 transactions only occur at START (token gate/check) or END (Game Over reward claim).
                </p>
              </div>

              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                <span className="text-white font-semibold">2. Zero External Sound/Image Assets:</span>
                <p className="mt-0.5">
                  Audio is synthesized mathematically using ZzFX micro-arrays via Web Audio API. Sprites and particles are drawn procedurally on HTML5 Canvas. No heavy MP3 downloads or network lag.
                </p>
              </div>

              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                <span className="text-white font-semibold">3. Dual-Mode Wallet Flexibility:</span>
                <p className="mt-0.5">
                  Supports real EVM extensions (MetaMask, Coinbase, Base) alongside an instant in-memory simulated testnet burner wallet so any user can play and test claims immediately without friction.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>React + HTML5 Canvas + ZzFX + Viem</span>
          <span>1-Day Fast Deployment Architecture</span>
        </div>
      </div>
    </div>
  );
};
