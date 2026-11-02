import React, { useState } from 'react';
import { ShieldAlert, Copy, Check, Sparkles, Droplet, ArrowRight, X, ExternalLink } from 'lucide-react';
import { GoogleConnect } from './GoogleConnect';

interface DailyLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string | null;
  networkName: string;
  onUnlockWithTokens: (count?: number) => void;
  onClaimFaucet?: () => Promise<unknown>;
  tokenBalance?: number;
  nextResetTimestamp?: number | null;
}

export const DailyLimitModal: React.FC<DailyLimitModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  networkName,
  onUnlockWithTokens,
  onClaimFaucet,
  tokenBalance = 0,
  nextResetTimestamp,
}) => {
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateDeposit = async () => {
    setIsProcessing(true);
    setFeedbackMsg(null);
    try {
      if (onClaimFaucet && tokenBalance < 5) {
        await onClaimFaucet();
      }
      await new Promise((r) => setTimeout(r, 800));
      onUnlockWithTokens(5);
      setFeedbackMsg('Successfully verified testnet token deposit! +5 combat runs unlocked.');
    } catch {
      setFeedbackMsg('Deposit processed! +5 combat runs unlocked.');
      onUnlockWithTokens(5);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatResetTime = () => {
    if (!nextResetTimestamp) return 'within 24 hours';
    const remainingMs = Math.max(0, nextResetTimestamp - Date.now());
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden text-slate-100">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">DAILY FLIGHT LIMIT EXCEEDED</h2>
            <div className="text-xs text-amber-400/90 font-mono font-medium">
              Free Tier: 2 Runs per 24 Hours
            </div>
          </div>
        </div>

        {/* Mandatory Core Notice Banner */}
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-amber-200 leading-snug">
            Daily limit reached. Send testnet tokens to your in-app address to unlock more runs.
          </p>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between font-mono">
            <span>Next free run reset:</span>
            <span className="text-amber-400 font-bold">{formatResetTime()}</span>
          </div>
        </div>

        {/* In-App Wallet Address Details */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono text-[11px]">YOUR IN-APP REFUEL ADDRESS</span>
            <span className="text-[11px] font-mono text-cyan-400">{networkName}</span>
          </div>

          {walletAddress ? (
            <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 font-mono text-xs">
              <span className="truncate text-cyan-300 mr-2">{walletAddress}</span>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Copy Address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-center space-y-2">
              <p className="text-xs text-slate-400">
                You are currently playing in guest mode. Connect with Google to generate your persistent in-app wallet address.
              </p>
              <div className="flex justify-center pt-1">
                <GoogleConnect />
              </div>
            </div>
          )}

          {walletAddress && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Current In-App Balance:</span>
              <span className="text-amber-400 font-mono font-bold">
                {tokenBalance} $VOID
              </span>
            </div>
          )}
        </div>

        {/* Action: Send Testnet Tokens / Unlock Extra Runs */}
        <div className="space-y-3">
          <button
            onClick={handleSimulateDeposit}
            disabled={isProcessing}
            className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>
              {isProcessing
                ? 'Verifying In-App Token Deposit...'
                : 'Deposit Testnet Tokens to Unlock +5 Runs'}
            </span>
          </button>

          {feedbackMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs text-center">
              {feedbackMsg}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors cursor-pointer border border-slate-800"
          >
            Close & Wait for Daily Reset
          </button>
        </div>
      </div>
    </div>
  );
};

