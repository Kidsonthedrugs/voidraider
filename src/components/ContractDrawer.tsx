/**
 * ContractDrawer Component
 * Smart contract code inspector, Foundry deployment guide, and testnet faucet.
 */

import React, { useState } from 'react';
import { SOLIDITY_CONTRACT_CODE, FOUNDRY_DEPLOY_GUIDE, VOID_TOKEN_ADDRESS_DEFAULT } from '../web3/contract';
import { Code2, Copy, Check, Terminal, Droplet, ExternalLink, ShieldCheck } from 'lucide-react';

interface ContractDrawerProps {
  onClose: () => void;
  onClaimFaucet: () => Promise<{ success: boolean; hash: string }>;
  isClaiming: boolean;
  walletAddress: string | null;
  networkName: string;
}

export const ContractDrawer: React.FC<ContractDrawerProps> = ({
  onClose,
  onClaimFaucet,
  isClaiming,
  walletAddress,
  networkName,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'solidity' | 'foundry' | 'faucet'>('solidity');
  const [copiedSolidity, setCopiedSolidity] = useState(false);
  const [copiedFoundry, setCopiedFoundry] = useState(false);
  const [faucetSuccess, setFaucetSuccess] = useState(false);

  const handleCopySolidity = () => {
    navigator.clipboard.writeText(SOLIDITY_CONTRACT_CODE);
    setCopiedSolidity(true);
    setTimeout(() => setCopiedSolidity(false), 2000);
  };

  const handleCopyFoundry = () => {
    navigator.clipboard.writeText(FOUNDRY_DEPLOY_GUIDE);
    setCopiedFoundry(true);
    setTimeout(() => setCopiedFoundry(false), 2000);
  };

  const handleTriggerFaucet = async () => {
    const res = await onClaimFaucet();
    if (res.success) {
      setFaucetSuccess(true);
      setTimeout(() => setFaucetSuccess(false), 4000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">SMART CONTRACT & FOUNDRY</h2>
              <p className="text-xs text-slate-400 font-mono">VoidToken.sol (ERC-20 + Arcade Score Claim)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Sub Navigation Segmented Control */}
        <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800 mb-4 text-xs">
          <button
            onClick={() => setActiveSubTab('solidity')}
            className={`px-3.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeSubTab === 'solidity'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Solidity Contract
          </button>
          <button
            onClick={() => setActiveSubTab('foundry')}
            className={`px-3.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeSubTab === 'foundry'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Foundry CLI Deploy Script
          </button>
          <button
            onClick={() => setActiveSubTab('faucet')}
            className={`px-3.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeSubTab === 'faucet'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Testnet Faucet Drip
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeSubTab === 'solidity' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">Default Address: {VOID_TOKEN_ADDRESS_DEFAULT}</span>
                <button
                  onClick={handleCopySolidity}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
                >
                  {copiedSolidity ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSolidity ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="bg-[#060910] p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-[460px]">
                {SOLIDITY_CONTRACT_CODE}
              </pre>
            </div>
          )}

          {activeSubTab === 'foundry' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Fast 1-day deploy instructions for Foundry & Base Sepolia</span>
                <button
                  onClick={handleCopyFoundry}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
                >
                  {copiedFoundry ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFoundry ? 'Copied' : 'Copy Script'}</span>
                </button>
              </div>

              <pre className="bg-[#060910] p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed max-h-[460px]">
                {FOUNDRY_DEPLOY_GUIDE}
              </pre>
            </div>
          )}

          {activeSubTab === 'faucet' && (
            <div className="p-6 bg-slate-900/40 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Droplet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Testnet Faucet Dispatch</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Instantly request a 50 $VOID token drip to test transaction signing, gas estimation, and wallet balance updates without playing a full combat run.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Address:</span>
                  <span className="truncate max-w-[280px] text-cyan-300">
                    {walletAddress || 'No wallet connected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Network:</span>
                  <span className="text-slate-200">{networkName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Faucet Payout:</span>
                  <span className="text-amber-400 font-bold">50.00 $VOID</span>
                </div>
              </div>

              <button
                onClick={handleTriggerFaucet}
                disabled={isClaiming || !walletAddress}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                <Droplet className="w-4 h-4 fill-current" />
                <span>{isClaiming ? 'TRANSMITTING DRIP TRANSACTION...' : 'REQUEST 50 $VOID DRIP'}</span>
              </button>

              {faucetSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-center text-xs font-mono text-emerald-300 animate-in fade-in">
                  Transaction confirmed! 50 $VOID tokens credited to your account.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
