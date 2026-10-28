/**
 * RewardModal Component
 * Game Over debrief & Web3 $VOID token reward claim dialog.
 * Decoupled from the 60 FPS loop; handles real or simulated on-chain mining.
 */

import React, { useState } from 'react';
import { GameStats } from '../game/engine';
import { Sparkles, Trophy, CheckCircle2, ArrowRight, Loader2, Copy, ExternalLink, ShieldAlert } from 'lucide-react';

interface RewardModalProps {
  stats: GameStats;
  walletAddress: string | null;
  isSimulated: boolean;
  networkName: string;
  onClaim: (tokens: number, score: number, accuracy: number, wave: number) => Promise<{ success: boolean; hash: string }>;
  onPlayAgain: () => void;
}

export const RewardModal: React.FC<RewardModalProps> = ({
  stats,
  walletAddress,
  isSimulated,
  networkName,
  onClaim,
  onPlayAgain,
}) => {
  const [claimStatus, setClaimStatus] = useState<'IDLE' | 'MINING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const scoreTokens = Math.floor(stats.score / 100);
  const totalTokens = stats.voidTokensEarned;

  const handleClaim = async () => {
    if (totalTokens <= 0) return;
    setClaimStatus('MINING');
    try {
      const res = await onClaim(totalTokens, stats.score, stats.accuracy, stats.wave);
      if (res.success) {
        setTxHash(res.hash);
        setClaimStatus('SUCCESS');
      } else {
        setClaimStatus('ERROR');
      }
    } catch {
      setClaimStatus('ERROR');
    }
  };

  const handleCopyHash = () => {
    if (!txHash) return;
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle cyan glow backdrop */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">MISSION DEBRIEF</h2>
            <div className="text-xs text-slate-400 font-mono">SECTOR COMBAT TERMINATED</div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">{stats.score.toLocaleString()} PTS</span>
          </div>
        </div>

        {/* Combat Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
          <div className="bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-xl">
            <div className="text-[10px] text-slate-400 font-mono">SECTOR WAVE</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">{stats.wave}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-xl">
            <div className="text-[10px] text-slate-400 font-mono">TARGETS DESTROYED</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">
              {stats.dronesDestroyed + stats.asteroidsDestroyed}
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-xl">
            <div className="text-[10px] text-slate-400 font-mono">ACCURACY</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">{stats.accuracy}%</div>
          </div>
        </div>

        {/* Reward Computation Breakdown */}
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-4 mb-5">
          <div className="text-xs text-slate-300 font-semibold mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              CLAIMABLE ON-CHAIN REWARDS
            </span>
            <span className="text-[11px] text-cyan-400 font-mono">{networkName}</span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800 pt-2 mb-3">
            <div className="flex justify-between">
              <span>Combat Score Bonus (1 token / 100 pts):</span>
              <span className="text-slate-200 font-mono">+{scoreTokens} $VOID</span>
            </div>
            <div className="flex justify-between">
              <span>Crystal Loot Gathered:</span>
              <span className="text-slate-200 font-mono">+{stats.crystalsCollected * 2} $VOID</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Total Payout:</span>
            <div className="text-xl font-bold font-mono text-amber-400">
              {totalTokens} <span className="text-xs font-semibold text-slate-400">$VOID</span>
            </div>
          </div>
        </div>

        {/* Claim State Machine */}
        {claimStatus === 'IDLE' && (
          <div className="space-y-3">
            <button
              onClick={handleClaim}
              disabled={totalTokens <= 0}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                totalTokens > 0
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>CLAIM {totalTokens} $VOID TO WALLET</span>
            </button>

            <button
              onClick={onPlayAgain}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs transition-colors cursor-pointer border border-slate-800"
            >
              Skip Claim & Launch Again
            </button>
          </div>
        )}

        {claimStatus === 'MINING' && (
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
            <div className="text-sm font-semibold text-white">Minting Tokens on Testnet...</div>
            <p className="text-xs text-slate-400">
              Broadcasting claimScoreReward({stats.score}, {totalTokens}) transaction to {networkName}
            </p>
          </div>
        )}

        {claimStatus === 'SUCCESS' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-center space-y-1.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-emerald-300">Transaction Confirmed!</div>
              <p className="text-xs text-slate-300">
                {totalTokens} $VOID successfully credited to your wallet address.
              </p>

              {txHash && (
                <div className="mt-2 pt-2 border-t border-emerald-800/40 flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-950/60 p-2 rounded-lg">
                  <span className="truncate max-w-[260px]">{txHash}</span>
                  <button
                    onClick={handleCopyHash}
                    className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer ml-2 shrink-0"
                    title="Copy Hash"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onPlayAgain}
              className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>DEPLOY NEXT COMBAT RUN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {claimStatus === 'ERROR' && (
          <div className="space-y-3">
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-center text-xs text-rose-300">
              Transaction rejected or timed out. You can retry or return to combat.
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClaim}
                className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Retry Claim
              </button>
              <button
                onClick={onPlayAgain}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 text-slate-300 font-medium text-xs border border-slate-800 cursor-pointer"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
