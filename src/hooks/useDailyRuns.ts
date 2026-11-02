import { useState, useEffect, useCallback } from 'react';

const STORAGE_PREFIX = 'void_raider_daily_runs_';
const MAX_FREE_RUNS = 2;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

interface StoredRunsData {
  runTimestamps: number[];
  bonusRuns: number;
}

export function useDailyRuns(walletAddress: string | null) {
  const storageKey = walletAddress
    ? `${STORAGE_PREFIX}${walletAddress.toLowerCase()}`
    : `${STORAGE_PREFIX}guest`;

  const [runsData, setRunsData] = useState<StoredRunsData>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return { runTimestamps: [], bonusRuns: 0 };
  });

  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

  // Reload data when wallet address changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setRunsData(JSON.parse(saved));
      } else {
        setRunsData({ runTimestamps: [], bonusRuns: 0 });
      }
    } catch {
      setRunsData({ runTimestamps: [], bonusRuns: 0 });
    }
  }, [storageKey]);

  // Clean up expired runs (> 24 hours)
  const getActiveTimestamps = useCallback((timestamps: number[]) => {
    const cutoff = Date.now() - WINDOW_MS;
    return timestamps.filter((t) => t > cutoff);
  }, []);

  const activeRuns = getActiveTimestamps(runsData.runTimestamps);
  const usedFreeRuns = Math.min(MAX_FREE_RUNS, activeRuns.length);
  const freeRunsRemaining = Math.max(0, MAX_FREE_RUNS - activeRuns.length);
  const totalRunsRemaining = freeRunsRemaining + runsData.bonusRuns;
  const canPlay = totalRunsRemaining > 0;

  // Calculate next reset time if any runs were used
  const nextResetTimestamp =
    activeRuns.length > 0 ? activeRuns[0] + WINDOW_MS : null;

  // Save changes to localStorage
  const saveRunsData = useCallback(
    (newData: StoredRunsData) => {
      setRunsData(newData);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newData));
      } catch {}
    },
    [storageKey]
  );

  // Consume 1 run
  const recordRunStart = useCallback((): boolean => {
    const currentActive = getActiveTimestamps(runsData.runTimestamps);
    const freeLeft = Math.max(0, MAX_FREE_RUNS - currentActive.length);

    if (runsData.bonusRuns > 0) {
      // Use bonus run first
      const updated: StoredRunsData = {
        runTimestamps: currentActive,
        bonusRuns: runsData.bonusRuns - 1,
      };
      saveRunsData(updated);
      return true;
    }

    if (freeLeft > 0) {
      // Consume free run
      const updated: StoredRunsData = {
        runTimestamps: [...currentActive, Date.now()],
        bonusRuns: 0,
      };
      saveRunsData(updated);
      return true;
    }

    // Daily limit reached
    setIsLimitModalOpen(true);
    return false;
  }, [runsData, getActiveTimestamps, saveRunsData]);

  // Unlock runs by sending/depositing testnet tokens
  const unlockRunsWithTokens = useCallback(
    (bonusCount = 5) => {
      const currentActive = getActiveTimestamps(runsData.runTimestamps);
      const updated: StoredRunsData = {
        runTimestamps: currentActive,
        bonusRuns: runsData.bonusRuns + bonusCount,
      };
      saveRunsData(updated);
      setIsLimitModalOpen(false);
    },
    [runsData, getActiveTimestamps, saveRunsData]
  );

  return {
    runsRemaining: totalRunsRemaining,
    freeRunsRemaining,
    bonusRuns: runsData.bonusRuns,
    usedFreeRuns,
    maxFreeRuns: MAX_FREE_RUNS,
    canPlay,
    isLimitModalOpen,
    nextResetTimestamp,
    openLimitModal: () => setIsLimitModalOpen(true),
    closeLimitModal: () => setIsLimitModalOpen(false),
    recordRunStart,
    unlockRunsWithTokens,
  };
}

