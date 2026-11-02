/**
 * GameCanvas Component
 * Mounts the high-speed 2D Canvas engine with interactive HUD overlay and responsive controls.
 */

import React, { useEffect, useRef, useState } from 'react';
import { VoidGameEngine, GameStats, PlayerHUDState } from '../game/engine';
import { globalInputManager } from '../game/inputManager';
import { Play, RotateCcw, Pause, Crosshair, Zap, Shield, Sparkles, Lock, ShieldAlert } from 'lucide-react';
import { GoogleConnect } from './GoogleConnect';

interface GameCanvasProps {
  onGameOver: (stats: GameStats) => void;
  highScore: number;
  walletAddress: string | null;
  runsRemaining: number;
  maxFreeRuns: number;
  canPlay: boolean;
  onStartRun: () => boolean;
  onOpenDailyLimitModal: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onGameOver,
  highScore,
  walletAddress,
  runsRemaining,
  maxFreeRuns,
  canPlay,
  onStartRun,
  onOpenDailyLimitModal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<VoidGameEngine | null>(null);

  const [gameState, setGameState] = useState<'TITLE' | 'PLAYING' | 'PAUSED'>('TITLE');
  const [hud, setHud] = useState<PlayerHUDState>({
    score: 0,
    voidTokens: 0,
    wave: 1,
    hull: 100,
    maxHull: 100,
    shield: 100,
    maxShield: 100,
    combo: 0,
    highScore,
  });

  // Touch control state
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [touchActive, setTouchActive] = useState(false);
  const [touchPos, setTouchPos] = useState({ x: 0, y: 0 });

  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new VoidGameEngine(canvasRef.current, {
      onGameOver: (stats) => {
        setGameState('TITLE');
        onGameOver(stats);
      },
      onHUDUpdate: (updatedHud) => {
        setHud(updatedHud);
      },
      highScore,
    });

    engineRef.current = engine;

    const handleResize = () => {
      engine.resizeCanvas();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stop();
      engine.detachInputs();
    };
  }, [highScore, onGameOver]);

  const handleStartGame = () => {
    if (!canPlay) {
      onOpenDailyLimitModal();
      return;
    }
    const started = onStartRun();
    if (!started) {
      onOpenDailyLimitModal();
      return;
    }
    if (!engineRef.current) return;
    containerRef.current?.focus();
    setGameState('PLAYING');
    engineRef.current.start();
  };

  const handleTogglePause = () => {
    if (!engineRef.current || gameState === 'TITLE') return;
    engineRef.current.pause();
    setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
  };

  const handleRestart = () => {
    if (!canPlay) {
      onOpenDailyLimitModal();
      return;
    }
    const started = onStartRun();
    if (!started) {
      onOpenDailyLimitModal();
      return;
    }
    if (!engineRef.current) return;
    containerRef.current?.focus();
    setGameState('PLAYING');
    engineRef.current.start();
  };

  // Touch event handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setTouchActive(true);
    setTouchPos({ x: 0, y: 0 });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || !engineRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const maxRadius = 45;
    const clampedX = Math.max(-maxRadius, Math.min(maxRadius, dx));
    const clampedY = Math.max(-maxRadius, Math.min(maxRadius, dy));
    setTouchPos({ x: clampedX, y: clampedY });

    engineRef.current.setTouchJoystick(clampedX / maxRadius, clampedY / maxRadius, true);
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    setTouchActive(false);
    setTouchPos({ x: 0, y: 0 });
    engineRef.current?.setTouchJoystick(0, 0, false);
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onMouseDown={() => containerRef.current?.focus()}
      className="relative w-full h-[620px] max-h-[80vh] bg-[#070b14] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center select-none outline-none focus:outline-none"
    >
      {/* 2D Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair touch-none"
      />

      {/* IN-GAME HUD OVERLAY (Visible during active play) */}
      {gameState === 'PLAYING' && (
        <div className="absolute inset-0 pointer-events-none p-5 flex flex-col justify-between">
          {/* Top Bar HUD */}
          <div className="flex items-center justify-between gap-4">
            {/* Health & Shield telemetry */}
            <div className="flex flex-col gap-1.5 bg-slate-950/70 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-800/80 min-w-[190px]">
              {/* Shield Bar */}
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-cyan-400" /> SHIELD
                </span>
                <span className="tabular-nums font-semibold">{hud.shield}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-150"
                  style={{ width: `${(hud.shield / hud.maxShield) * 100}%` }}
                />
              </div>

              {/* Hull Armor Bar */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mt-1">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Zap className="w-3 h-3" /> HULL
                </span>
                <span className="tabular-nums font-semibold">{hud.hull}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-150 ${
                    hud.hull > 40 ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'
                  }`}
                  style={{ width: `${(hud.hull / hud.maxHull) * 100}%` }}
                />
              </div>
            </div>

            {/* Central Pilot In-App HUD & Wave Multiplier */}
            <div className="flex flex-col items-center gap-1.5">
              {/* Compact Styled In-App Address HUD */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 text-[11px] font-mono text-cyan-300 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-slate-400 font-medium">PILOT HUD:</span>
                <span className="font-bold text-white tracking-wide">
                  {truncatedAddress || '0xGUEST'}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/90 text-cyan-400 border border-cyan-800/60 hidden sm:inline">
                  IN-APP
                </span>
              </div>

              <div className="px-3.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 tracking-wider">
                SECTOR WAVE <span className="text-cyan-400 font-bold">{hud.wave}</span>
              </div>
              {hud.combo > 1 && (
                <div className="text-amber-400 text-xs font-mono font-bold tracking-wide animate-bounce">
                  {hud.combo}x COMBO MULTIPLIER
                </div>
              )}
            </div>

            {/* Right Score & Token counter */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-950/70 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800/80 flex flex-col items-end">
                <div className="text-[11px] text-slate-400 font-mono">COMBAT SCORE</div>
                <div className="text-lg font-mono font-extrabold text-white tabular-nums">
                  {hud.score.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-400 font-mono mt-0.5">
                  <Sparkles className="w-3 h-3" />
                  <span>+{hud.voidTokens} $VOID DROP</span>
                </div>
              </div>

              {/* Pause & Restart buttons */}
              <div className="pointer-events-auto flex flex-col gap-1.5">
                <button
                  onClick={handleTogglePause}
                  className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
                  title="Pause Simulation"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRestart}
                  className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
                  title="Restart Run"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom On-Screen Mobile Touch Controls */}
          <div className="pointer-events-auto flex items-end justify-between sm:hidden pb-2">
            {/* Virtual Thumb Joystick */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-24 h-24 rounded-full bg-slate-900/70 border border-slate-700 flex items-center justify-center relative touch-none"
            >
              <div
                className="w-10 h-10 rounded-full bg-cyan-500/80 shadow-md shadow-cyan-500/30"
                style={{
                  transform: `translate(${touchPos.x}px, ${touchPos.y}px)`,
                  transition: touchActive ? 'none' : 'transform 0.15s ease-out',
                }}
              />
            </div>

            {/* Fire Button */}
            <button
              onTouchStart={() => engineRef.current?.setTouchFire(true)}
              onTouchEnd={() => engineRef.current?.setTouchFire(false)}
              className="w-20 h-20 rounded-full bg-rose-600/80 active:bg-rose-500 border border-rose-400 text-white font-mono font-bold text-xs flex items-center justify-center shadow-lg shadow-rose-600/30"
            >
              FIRE
            </button>
          </div>
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-30">
          <h2 className="text-2xl font-bold text-white tracking-wider font-mono">MISSION SUSPENDED</h2>
          <p className="text-sm text-slate-400">Weapon systems standing by</p>
          <button
            onClick={handleTogglePause}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors cursor-pointer"
          >
            Resume Mission
          </button>
        </div>
      )}

      {/* TITLE / PRE-FLIGHT BRIEFING OVERLAY */}
      {gameState === 'TITLE' && (
        <div className="absolute inset-0 bg-[#070b14]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="max-w-md w-full flex flex-col items-center">
            {/* Cyber Emblem */}
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-500/10">
              <Crosshair className="w-6 h-6" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
              VOID RAIDER
            </h1>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Pilot your skirmisher through the hostile cyber-asteroid belt. Destroy rogue drones, collect $VOID crystal shards, and claim on-chain ERC-20 token rewards.
            </p>

            {/* Daily Run Status Badge */}
            <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl mb-3 text-xs font-mono">
              <span className="text-slate-400">DAILY COMBAT RUNS:</span>
              <span
                className={`font-bold ${
                  runsRemaining > 0 ? 'text-cyan-400' : 'text-rose-400'
                }`}
              >
                {runsRemaining} / {maxFreeRuns} AVAILABLE
              </span>
            </div>

            {/* Guest Sign-In Prompt to Save Progress */}
            {!walletAddress && (
              <div className="w-full bg-slate-950/80 border border-cyan-500/30 rounded-xl p-3 mb-3 flex flex-col items-center gap-2">
                <div className="text-[11px] text-cyan-300 font-medium text-center">
                  Sign in with Google to create an in-app wallet and save combat progress on-chain.
                </div>
                <GoogleConnect compact />
              </div>
            )}

            {/* Controls Guide */}
            <div className="w-full grid grid-cols-2 gap-2.5 mb-4 text-xs text-slate-300">
              <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl flex flex-col items-center text-center">
                <span className="text-[10px] text-slate-500 font-mono">STEERING</span>
                <span className="font-semibold text-white">WASD / Arrows</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl flex flex-col items-center text-center">
                <span className="text-[10px] text-slate-500 font-mono">TARGET & FIRE</span>
                <span className="font-semibold text-white">Aim + Space / Click</span>
              </div>
            </div>

            {/* Launch / Locked Button */}
            {canPlay ? (
              <button
                onClick={handleStartGame}
                className="w-full py-3.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>LAUNCH COMBAT RUN ({runsRemaining} runs left)</span>
              </button>
            ) : (
              <div className="w-full space-y-2">
                <button
                  onClick={onOpenDailyLimitModal}
                  className="w-full py-3.5 px-6 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>DAILY LIMIT REACHED (0/{maxFreeRuns}) — CLICK TO UNLOCK</span>
                </button>
                <p className="text-[11px] text-amber-400/80 font-mono">
                  Send testnet tokens to your in-app address to unlock more runs.
                </p>
              </div>
            )}

            {highScore > 0 && (
              <div className="mt-3 text-xs font-mono text-slate-500">
                CURRENT FLEET RECORD: <span className="text-amber-400 font-bold">{highScore.toLocaleString()}</span> PTS
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
