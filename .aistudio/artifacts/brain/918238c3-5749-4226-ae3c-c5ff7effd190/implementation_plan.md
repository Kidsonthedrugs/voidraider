# Cyberpunk Void Raider: 1-Day On-Chain Space Shooter Sprint

A high-octane 2D space shooter and score-attack arcade game built for rapid 1-day deployment, combining a zero-bloat 60 FPS HTML5 Canvas engine, procedural ZzFX 8-bit sound generation, and a decoupled Dual-Mode Web3 reward loop (Real EVM Wallet + Instant Testnet Simulator).

## User Review & Critical Decisions

> [!IMPORTANT]
> The architectural directions selected during Phase 1 clarification have been incorporated:

- **Game Genre & Mechanics**: Cyberpunk Void Raider — 2D space shooter with responsive ship thrusters, plasma blasters, asteroid splitting, cyber-drone enemies, and score-based $VOID token drops.
- **Rendering & Audio Stack**: Pure client-side HTML5 Canvas running at 60 FPS with particle systems, starfield parallax, screen shake, and lightweight ZzFX procedural synthesizer (zero audio asset downloads or network latency).
- **Web3 Integration Model**: Decoupled Dual-Mode — supports real EVM wallet connections (via Viem/Wagmi patterns) alongside an immediate in-memory Simulated Testnet wallet with simulated gas, mining confirmation toasts, and transaction explorer, ensuring immediate playability for anyone without wallet extensions.

---

## 1. Overview & Core Concept

- **What It Does**: Players pilot a void skirmisher through an asteroid belt and hostile drone grid. Every destroyed target yields combat points and dropped crystal fragments. Upon game over, the achieved score converts into claimable `$VOID` ERC-20 testnet tokens, minting tokens directly to the connected player address with on-chain transaction verification and leaderboard submission.
- **Target Audience**: Web3 developers, game-jam builders, and players seeking an immediate, responsive arcade experience that demonstrates how to couple Web3 rewards without sacrificing smooth 60 FPS game-feel.
- **Key Value**: Demonstrates the ideal 1-day sprint architecture: an isolated local game loop with zero asset bloat, coupled to on-chain state exclusively at clean boundaries (game over claim & leaderboard sync).

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Title & Pre-Flight**: The player arrives at the mission briefing screen showing high score, current wallet status (Connected or Instant Demo Wallet), volume control, and key bindings (WASD/Arrows + Space/Mouse click).
2. **Combat Loop (60 FPS Canvas)**:
   - Ship movement with inertia, thruster flame particles, and directional firing.
   - Waves of asteroids and hostile interceptors spawning with progressive difficulty.
   - Audio feedback for blaster shots, shield impacts, explosions, and crypto gem pickups via ZzFX.
   - Screen shake and burst particles on impacts.
3. **Mission Debrief & Reward Claim (Game Over)**:
   - Final score, accuracy rate, waves cleared, and calculated `$VOID` token reward (e.g. 1 token per 100 points).
   - Instant `"Claim $VOID Tokens"` button triggering a transaction modal (either via real connected wallet or simulated testnet RPC with hash, block confirmation, and explorer link).
   - On-chain leaderboard updated with player address and high score.
4. **Smart Contract & Faucet Drawer**: A dedicated developer tab providing the production-ready Foundry / Solidity ERC-20 token contract (`VoidToken.sol`), ABI, and one-click copyable testnet deployment script.

### Visual Identity & Theme

- **Aesthetic Direction**: Deep space industrial cyber-arcade. High-contrast neon vectors, crisp geometric silhouettes, and glowing procedural particle effects on a dark obsidian void.
- **Color Palette**:
  - Neutral Canvas (60%): `#090D16` (Deep space black) and `#111827` (Void navy).
  - Structural Panels (30%): `#1E293B` (Subdued slate borders and frosted panels) with `#64748B` muted labels.
  - Intent Accents (10%): `#06B6D4` (Plasma Cyan for player thrusters & shields), `#F59E0B` (Amber gold for score & crypto drops), and `#EF4444` (Laser Red for hostile drones).
- **Typography**:
  - Display Font: Sharp athletic neo-grotesque (`Plus Jakarta Sans` / `Outfit`).
  - Numbers & Metrics: `font-mono tabular-nums` for score counters, multiplier meters, coordinates, and Ethereum hashes.
- **Top Bar Contract**:
  - Zone 1 (Wordmark): `VOID RAIDER // ON-CHAIN ARCADE`
  - Zone 2 (Nav Links): `Play`, `Leaderboard`, `Smart Contract`, `Documentation`
  - Zone 3 (Action): Single-line `Connect Wallet` button showing truncated address or network status.

---

## 3. Key Product Decisions & Trade-Offs

- **Zero External Assets (Canvas + ZzFX)**:
  - *Chosen Approach*: Procedural vector drawing on HTML5 Canvas + mathematical sound synthesis using ZzFX micro-arrays.
  - *Why*: Guarantees zero loading spinners, zero network asset failures, zero CORS issues, and fits the 1-day sprint mandate perfectly.
- **Isolated Web3 Hook (`useGameRewards`)**:
  - *Chosen Approach*: All Web3 states (wallet balance, pending claim, transaction status, testnet simulation) reside in an isolated React hook.
  - *Why*: The game loop runs independently at 60 FPS in `requestAnimationFrame`. RPC latency or wallet modal pauses never hitch the physics engine.
- **Dual-Mode Wallet System**:
  - *Chosen Approach*: If `window.ethereum` is detected and approved, it interacts with live testnets (e.g. Sepolia / Base Sepolia); if no wallet is present or the user chooses quick play, a temporary burner testnet wallet is auto-provisioned with full transaction simulation and mock blocks.
  - *Why*: Eliminates onboarding friction for reviewers and players who don't have MetaMask installed.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Container (React Root)                      │
│                                                                        │
│  ┌──────────────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │ TopBar Navigation    │  │ Web3 Wallet Bar │  │ Audio Master Vol  │  │
│  └──────────────────────┘  └─────────────────┘  └───────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           │                                                 │
           ▼                                                 ▼
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     Game Canvas Viewport        │       │      Web3 & HUD Overlay Layer   │
│                                 │       │                                 │
│  - 60 FPS Render Loop           │       │  - Score, Health, Shield Meters │
│  - Physics & Collision Grid     │       │  - Wave Announcement Banner     │
│  - Procedural Starfield         │       │  - Game Over Claim Modal        │
│  - Particle Burst Emitters      │       │  - On-Chain Leaderboard Modal   │
│  - ZzFX Audio Synthesizer       │       │  - Foundry Contract Code Drawer │
└─────────────────────────────────┘       └─────────────────────────────────┘
           │                                                 ▲
           │ Dispatches: onGameOver(score, waves, stats)     │
           └─────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    useGameRewards Hook (Isolated Web3)                 │
│                                                                        │
│  - Wallet Connection State (Injected or Burner Simulator)              │
│  - $VOID Balance & Claim Calculation Engine                            │
│  - Transaction Pipeline (Prepare -> Sign -> Mine -> Receipt)           │
│  - On-Chain Leaderboard State & Local Persistence                      │
│  - Verified ERC-20 Smart Contract Artifacts & ABI                      │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Modules & Files to Build

1. `src/game/zzfx.ts`: Zero-dependency, lightweight procedural sound effect engine with presets for shoot, explosion, gem pickup, shield hit, and game over.
2. `src/game/engine.ts`: Self-contained 2D Canvas engine managing player spaceship physics, keyboard/touch input, asteroid debris, enemy drones, laser projectiles, floating combat text, and particle explosions.
3. `src/hooks/useGameRewards.ts`: Decoupled Web3 hook handling wallet connection, dual-mode testnet simulation, signature/minting state, and transaction receipts.
4. `src/components/GameCanvas.tsx`: Canvas mount component with resize handling, touch stick/controls for mobile, and HUD overlay.
5. `src/components/RewardModal.tsx`: Post-game claim dialog displaying score breakdown, token calculation, and blockchain transaction progress.
6. `src/components/LeaderboardModal.tsx`: High score registry showing verified wallet addresses, scores, and timestamps.
7. `src/components/ContractDrawer.tsx`: Full Foundry ERC-20 `VoidToken.sol` source code, deployment CLI commands, and ABI inspector for developers.
8. `src/components/TopBar.tsx`: Accessible 3-zone header compliant with design rules.

### Verification Plan

- Run `compile_applet` to ensure full TypeScript typing and clean bundle.
- Test 60 FPS game loop responsiveness with keyboard (WASD/Arrow keys, Space to shoot) and mouse aiming.
- Test audio synthesis triggering properly on user interaction without autoplay errors.
- Test Game Over transition and token claim flow in both simulated and real wallet modes.
- Verify contract copy and leaderboard persistence.
