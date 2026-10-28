/**
 * Void Raider - On-Chain Space Shooter
 * High-speed 2D Canvas engine with ZzFX procedural audio & Dual-Mode Web3 Token Rewards.
 */

import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { GameCanvas } from './components/GameCanvas';
import { RewardModal } from './components/RewardModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ContractDrawer } from './components/ContractDrawer';
import { DocsModal } from './components/DocsModal';
import { useGameRewards } from './hooks/useGameRewards';
import { GameStats } from './game/engine';
import { Sparkles, Trophy, Code2, Droplet, BookOpen, ExternalLink, ShieldCheck, Terminal, Cpu } from 'lucide-react';

const STORAGE_KEY_HIGHSCORE = 'void_raider_highscore';

export default function App() {
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard' | 'contract' | 'docs'>('game');
  const [gameOverStats, setGameOverStats] = useState<GameStats | null>(null);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(STORAGE_KEY_HIGHSCORE)) || 0;
    } catch {
      return 0;
    }
  });

  const {
    walletAddress,
    isWalletConnected,
    isSimulated,
    networkName,
    tokenBalance,
    isClaiming,
    lastTxHash,
    transactions,
    leaderboard,
    connectRealWallet,
    connectSimulatedWallet,
    disconnectWallet,
    claimReward,
    claimFaucet,
  } = useGameRewards();

  const handleGameOver = (stats: GameStats) => {
    setGameOverStats(stats);
    if (stats.score > highScore) {
      setHighScore(stats.score);
      try {
        localStorage.setItem(STORAGE_KEY_HIGHSCORE, String(stats.score));
      } catch {}
    }
  };

  const handlePlayAgain = () => {
    setGameOverStats(null);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 3-Zone Top Navigation */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        walletAddress={walletAddress}
        isSimulated={isSimulated}
        tokenBalance={tokenBalance}
        onConnectReal={connectRealWallet}
        onConnectSimulated={connectSimulatedWallet}
        onDisconnect={disconnectWallet}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Active Combat Canvas Arena */}
        <div className="w-full">
          <GameCanvas onGameOver={handleGameOver} highScore={highScore} />
        </div>

        {/* 3-Column Fleet Telemetry & Quick Action Deck */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Pilot & Network Identity */}
          <div className="bg-[#0b101b] border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-400">PILOT IDENTITY</span>
                <span className="text-[11px] font-mono text-cyan-400 font-medium">
                  {isSimulated ? 'TESTNET SIM' : 'CONNECTED EVM'}
                </span>
              </div>
              <div className="text-sm font-mono font-bold text-white truncate mb-1">
                {walletAddress ? walletAddress : 'Not Connected'}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Network: <span className="text-slate-200">{networkName}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">Auto-Provision:</span>
              <button
                onClick={connectSimulatedWallet}
                className="text-cyan-400 hover:text-cyan-300 font-mono transition-colors cursor-pointer"
              >
                Reset Burner Wallet
              </button>
            </div>
          </div>

          {/* Card 2: Token Balance & Fleet Ledger */}
          <div className="bg-[#0b101b] border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-400">$VOID VAULT</span>
                <span className="text-[11px] font-mono text-amber-400 font-medium">ERC-20</span>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
                  {tokenBalance.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-400">$VOID</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Fleet Record: <span className="text-white font-semibold">{highScore.toLocaleString()} pts</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">Claim Rate:</span>
              <span className="text-slate-300 font-mono">1 $VOID / 100 combat pts</span>
            </div>
          </div>

          {/* Card 3: Quick Terminal & Contract Tools */}
          <div className="bg-[#0b101b] border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-400">ENGINEERING SUITE</span>
                <span className="text-[11px] font-mono text-emerald-400 font-medium">FOUNDRY</span>
              </div>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                Inspect the Solidity smart contract, testnet faucet, and 1-day sprint documentation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setActiveTab('contract')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Contract & ABI</span>
              </button>
              <button
                onClick={() => setActiveTab('docs')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sprint Guide</span>
              </button>
            </div>
          </div>
        </section>

        {/* Recent On-Chain Transactions Ledger */}
        <section className="bg-[#0b101b] border border-slate-800/90 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">ON-CHAIN TRANSACTIONS LEDGER</h3>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              {transactions.length} confirmed on {networkName}
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 font-mono">
              No transactions recorded in this session. Play a run or claim from faucet to mint $VOID.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 font-mono text-xs">
              {transactions.map((tx) => (
                <div key={tx.hash} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <div>
                      <div className="text-slate-200 font-medium">
                        {tx.type === 'CLAIM_REWARD' ? 'Combat Reward Mint' : 'Testnet Faucet Drip'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[220px] sm:max-w-md">
                        {tx.hash}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-amber-400 tabular-nums">+{tx.amount} $VOID</div>
                    <div className="text-[10px] text-slate-500">Block #{tx.blockNumber}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d16] py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Void Raider // 1-Day Web3 Game Sprint Architecture. 60 FPS HTML5 Canvas + ZzFX + Viem.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Leaderboard
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('contract')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Smart Contract
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('docs')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Sprint Rules
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      {gameOverStats && (
        <RewardModal
          stats={gameOverStats}
          walletAddress={walletAddress}
          isSimulated={isSimulated}
          networkName={networkName}
          onClaim={claimReward}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {activeTab === 'leaderboard' && (
        <LeaderboardModal
          entries={leaderboard}
          currentAddress={walletAddress}
          onClose={() => setActiveTab('game')}
        />
      )}

      {activeTab === 'contract' && (
        <ContractDrawer
          onClose={() => setActiveTab('game')}
          onClaimFaucet={claimFaucet}
          isClaiming={isClaiming}
          walletAddress={walletAddress}
          networkName={networkName}
        />
      )}

      {activeTab === 'docs' && <DocsModal onClose={() => setActiveTab('game')} />}
    </div>
  );
}
