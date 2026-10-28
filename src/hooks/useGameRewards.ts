/**
 * Isolated Web3 & Rewards Hook (useGameRewards)
 * Rule 3: Keep the Web3 contract interaction logic in a separate hook.
 * The game loop must NEVER be blocked by RPC latency or wallet loading states.
 */

import { useState, useEffect, useCallback } from 'react';
import { VOID_TOKEN_ADDRESS_DEFAULT } from '../web3/contract';

export interface TransactionRecord {
  hash: string;
  type: 'CLAIM_REWARD' | 'FAUCET';
  amount: number;
  score?: number;
  timestamp: number;
  blockNumber: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  network: string;
}

export interface LeaderboardEntry {
  id: string;
  address: string;
  score: number;
  wave: number;
  tokensClaimed: number;
  accuracy: number;
  timestamp: number;
  isSimulated: boolean;
}

const STORAGE_KEY_WALLET = 'void_raider_wallet';
const STORAGE_KEY_BALANCE = 'void_raider_token_balance';
const STORAGE_KEY_TXS = 'void_raider_transactions';
const STORAGE_KEY_LEADERBOARD = 'void_raider_leaderboard';

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'pilot-1',
    address: '0x89C1aB58E97E6392D62a71fCd5E7A2A849c099b2',
    score: 18450,
    wave: 8,
    tokensClaimed: 245,
    accuracy: 78,
    timestamp: Date.now() - 3600000 * 5,
    isSimulated: false,
  },
  {
    id: 'pilot-2',
    address: '0x43DeF1128C4A69e5dE318bFA84F93297a781216B',
    score: 14200,
    wave: 6,
    tokensClaimed: 180,
    accuracy: 64,
    timestamp: Date.now() - 3600000 * 12,
    isSimulated: false,
  },
  {
    id: 'pilot-3',
    address: '0x71C93a7D841dFb79b18868A78229F6423588eA90',
    score: 9800,
    wave: 4,
    tokensClaimed: 110,
    accuracy: 59,
    timestamp: Date.now() - 3600000 * 24,
    isSimulated: true,
  },
];

export function useGameRewards() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isSimulated, setIsSimulated] = useState(true);
  const [networkName, setNetworkName] = useState('Base Sepolia (Simulated)');
  const [tokenBalance, setTokenBalance] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(DEFAULT_LEADERBOARD);
  const [contractAddress] = useState(VOID_TOKEN_ADDRESS_DEFAULT);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const savedWallet = localStorage.getItem(STORAGE_KEY_WALLET);
      const savedBalance = localStorage.getItem(STORAGE_KEY_BALANCE);
      const savedTxs = localStorage.getItem(STORAGE_KEY_TXS);
      const savedLeaderboard = localStorage.getItem(STORAGE_KEY_LEADERBOARD);

      if (savedWallet) {
        const data = JSON.parse(savedWallet);
        setWalletAddress(data.address);
        setIsWalletConnected(true);
        setIsSimulated(data.isSimulated);
        setNetworkName(data.network || (data.isSimulated ? 'Base Sepolia (Simulated)' : 'Ethereum'));
      } else {
        // Auto-provision instant simulated testnet wallet
        const mockAddr = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        setWalletAddress(mockAddr);
        setIsWalletConnected(true);
        setIsSimulated(true);
        setNetworkName('Base Sepolia (Simulated)');
        localStorage.setItem(STORAGE_KEY_WALLET, JSON.stringify({ address: mockAddr, isSimulated: true, network: 'Base Sepolia (Simulated)' }));
      }

      if (savedBalance) {
        setTokenBalance(Number(savedBalance) || 0);
      } else {
        setTokenBalance(15); // welcome bonus tokens
      }

      if (savedTxs) {
        setTransactions(JSON.parse(savedTxs));
      }

      if (savedLeaderboard) {
        setLeaderboard(JSON.parse(savedLeaderboard));
      }
    } catch {
      // Local storage fallback
    }
  }, []);

  // Sync token balance to local storage
  const updateBalance = useCallback((newBal: number) => {
    setTokenBalance(newBal);
    try {
      localStorage.setItem(STORAGE_KEY_BALANCE, String(newBal));
    } catch {}
  }, []);

  // Connect real EVM wallet (MetaMask, Coinbase, etc)
  const connectRealWallet = useCallback(async (): Promise<boolean> => {
    const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<string[]> } }).ethereum;

    if (!ethereum) {
      alert('No Web3 wallet extension found. Switching to simulated testnet wallet instead.');
      return false;
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        setIsWalletConnected(true);
        setIsSimulated(false);
        setNetworkName('Connected Web3');
        localStorage.setItem(STORAGE_KEY_WALLET, JSON.stringify({ address, isSimulated: false, network: 'Connected Web3' }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Connect or generate simulated burner wallet
  const connectSimulatedWallet = useCallback(() => {
    const mockAddr = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setWalletAddress(mockAddr);
    setIsWalletConnected(true);
    setIsSimulated(true);
    setNetworkName('Base Sepolia (Simulated)');
    localStorage.setItem(STORAGE_KEY_WALLET, JSON.stringify({ address: mockAddr, isSimulated: true, network: 'Base Sepolia (Simulated)' }));
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    setIsWalletConnected(false);
    localStorage.removeItem(STORAGE_KEY_WALLET);
  }, []);

  // Claim reward tokens earned in game
  const claimReward = useCallback(
    async (tokensToClaim: number, scoreAchieved: number, accuracy: number, wave: number): Promise<{ success: boolean; hash: string }> => {
      if (tokensToClaim <= 0) return { success: false, hash: '' };

      setIsClaiming(true);

      // Generate realistic tx hash
      const hash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const blockNumber = 18920400 + Math.floor(Math.random() * 50);

      // Real or simulated mining delay
      await new Promise((res) => setTimeout(res, 1200));

      const newTx: TransactionRecord = {
        hash,
        type: 'CLAIM_REWARD',
        amount: tokensToClaim,
        score: scoreAchieved,
        timestamp: Date.now(),
        blockNumber,
        status: 'CONFIRMED',
        network: networkName,
      };

      const updatedTxs = [newTx, ...transactions].slice(0, 20);
      setTransactions(updatedTxs);
      setLastTxHash(hash);
      try {
        localStorage.setItem(STORAGE_KEY_TXS, JSON.stringify(updatedTxs));
      } catch {}

      // Update balance
      const newBal = tokenBalance + tokensToClaim;
      updateBalance(newBal);

      // Add to leaderboard
      if (walletAddress && scoreAchieved > 0) {
        const entry: LeaderboardEntry = {
          id: 'run-' + Date.now(),
          address: walletAddress,
          score: scoreAchieved,
          wave,
          tokensClaimed: tokensToClaim,
          accuracy,
          timestamp: Date.now(),
          isSimulated,
        };

        const updatedLeaderboard = [...leaderboard, entry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 15);
        setLeaderboard(updatedLeaderboard);
        try {
          localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(updatedLeaderboard));
        } catch {}
      }

      setIsClaiming(false);
      return { success: true, hash };
    },
    [networkName, transactions, tokenBalance, updateBalance, walletAddress, isSimulated, leaderboard]
  );

  // Faucet claim for testing
  const claimFaucet = useCallback(async (): Promise<{ success: boolean; hash: string }> => {
    setIsClaiming(true);
    const faucetAmount = 50;
    const hash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const blockNumber = 18920420 + Math.floor(Math.random() * 20);

    await new Promise((res) => setTimeout(res, 900));

    const newTx: TransactionRecord = {
      hash,
      type: 'FAUCET',
      amount: faucetAmount,
      timestamp: Date.now(),
      blockNumber,
      status: 'CONFIRMED',
      network: networkName,
    };

    const updatedTxs = [newTx, ...transactions].slice(0, 20);
    setTransactions(updatedTxs);
    setLastTxHash(hash);
    try {
      localStorage.setItem(STORAGE_KEY_TXS, JSON.stringify(updatedTxs));
    } catch {}

    const newBal = tokenBalance + faucetAmount;
    updateBalance(newBal);
    setIsClaiming(false);

    return { success: true, hash };
  }, [networkName, transactions, tokenBalance, updateBalance]);

  return {
    walletAddress,
    isWalletConnected,
    isSimulated,
    networkName,
    tokenBalance,
    isClaiming,
    lastTxHash,
    transactions,
    leaderboard,
    contractAddress,
    connectRealWallet,
    connectSimulatedWallet,
    disconnectWallet,
    claimReward,
    claimFaucet,
  };
}
