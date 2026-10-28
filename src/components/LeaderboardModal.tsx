/**
 * LeaderboardModal Component
 * Shows fleet pilots, verified combat scores, and on-chain token awards.
 * Adheres strictly to Zero-Pill discipline and Tabular Numerals.
 */

import React from 'react';
import { LeaderboardEntry } from '../hooks/useGameRewards';
import { Trophy, Medal, ExternalLink, ShieldCheck } from 'lucide-react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentAddress: string | null;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardProps> = ({ entries, currentAddress, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">HALL OF PILOTS</h2>
              <p className="text-xs text-slate-400">Verified top scores and on-chain token payouts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-2">
          {entries.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No flight records logged yet. Be the first to deploy!
            </div>
          ) : (
            entries.map((item, index) => {
              const isCurrentUser = currentAddress && item.address.toLowerCase() === currentAddress.toLowerCase();
              const formattedDate = new Date(item.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                    isCurrentUser
                      ? 'bg-cyan-950/30 border-cyan-500/40'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900'
                  }`}
                >
                  {/* Left: Rank & Pilot Identity */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-7 text-center font-mono font-bold text-sm">
                      {index === 0 ? (
                        <span className="text-amber-400">01</span>
                      ) : index === 1 ? (
                        <span className="text-slate-300">02</span>
                      ) : index === 2 ? (
                        <span className="text-amber-600">03</span>
                      ) : (
                        <span className="text-slate-500 tabular-nums">{index < 9 ? `0${index + 1}` : index + 1}</span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-white">
                          {item.address.slice(0, 6)}...{item.address.slice(-4)}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] text-cyan-400 font-mono font-medium">(YOU)</span>
                        )}
                      </div>
                      {/* Zero-Pill Metadata Line */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-mono">
                        <span>Wave {item.wave}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.accuracy}% Acc</span>
                        <span aria-hidden="true">·</span>
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score & Tokens Earned */}
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-cyan-400 tabular-nums">
                      {item.score.toLocaleString()} <span className="text-[10px] text-slate-400">PTS</span>
                    </div>
                    <div className="text-xs font-mono text-amber-400 tabular-nums mt-0.5">
                      +{item.tokensClaimed} $VOID
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Synced with EVM Testnet & Local Registry</span>
          <span>Rewards calculated at 1 token / 100 combat pts</span>
        </div>
      </div>
    </div>
  );
};
