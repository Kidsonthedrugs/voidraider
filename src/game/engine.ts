/**
 * Void Raider 2D Space Shooter Canvas Engine
 * Thematic VibeViber Entity Engine with Persistent Input Tracking
 */

import { soundEffects } from './zzfx';
import { AssetLoader, defaultAssetLoader } from './assetLoader';
import { InputManager, globalInputManager } from './inputManager';

export interface GameStats {
  score: number;
  voidTokensEarned: number;
  wave: number;
  asteroidsDestroyed: number;
  dronesDestroyed: number;
  crystalsCollected: number;
  shotsFired: number;
  shotsHit: number;
  accuracy: number;
  timeSurvivedSec: number;
}

export interface PlayerHUDState {
  score: number;
  voidTokens: number;
  wave: number;
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  combo: number;
  highScore: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'line' | 'diamond';
  angle?: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  fontSize: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isEnemy: boolean;
  damage: number;
  life: number;
}

interface SpaceHazard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  points: { x: number; y: number }[];
  rotation: number;
  vRot: number;
  hp: number;
  maxHp: number;
  tier: 1 | 2 | 3; // 3 = large, 2 = med, 1 = small
  color: string;
  hazardType: 'energy_mine' | 'gas_node';
  pulseTimer: number;
  spriteIndex?: number;
}

interface RogueViber {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  type: 'scout' | 'interceptor';
  shootCooldown: number;
  shootInterval: number;
  burstLeft: number;
  burstInterval: number;
  angle: number;
  spriteIndex: number;
}

interface CrystalDrop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  radius: number;
  rotation: number;
  vRot: number;
  life: number;
  type: 'void_token' | 'shield_restore' | 'hull_repair';
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
  twinkleSpeed: number;
  layer: number;
}

export class VoidGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private isRunning = false;
  private isPaused = false;

  // Viewport
  public width = 1200;
  public height = 800;

  // Player state: selected VibeViber PFP avatar inside circular cyber-cockpit
  public player = {
    x: 600,
    y: 400,
    vx: 0,
    vy: 0,
    radius: 20,
    angle: -Math.PI / 2,
    targetAngle: -Math.PI / 2,
    speed: 400, // pixels per sec
    acceleration: 1500,
    friction: 0.94,
    hull: 100,
    maxHull: 100,
    shield: 100,
    maxShield: 100,
    shieldRegenRate: 8,
    shieldRegenDelay: 3.5,
    timeSinceLastHit: 0,
    shootCooldown: 0,
    shootRate: 0.13,
    isThrusting: false,
    invincibleTimer: 1.5,
    spriteIndex: 1, // Default VibeViber pilot avatar (viber_2.png)
  };

  // Game tracking
  public score = 0;
  public voidTokens = 0;
  public wave = 1;
  public waveTimer = 0;
  public highScore = 0;
  public combo = 0;
  public comboTimer = 0;

  // Stats
  public stats: GameStats = {
    score: 0,
    voidTokensEarned: 0,
    wave: 1,
    asteroidsDestroyed: 0,
    dronesDestroyed: 0,
    crystalsCollected: 0,
    shotsFired: 0,
    shotsHit: 0,
    accuracy: 0,
    timeSurvivedSec: 0,
  };

  // Collections
  private stars: Star[] = [];
  private bullets: Bullet[] = [];
  private asteroids: SpaceHazard[] = [];
  private drones: RogueViber[] = [];
  private drops: CrystalDrop[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  // Input states & Touch controls
  public input: InputManager;
  private touchVector = { x: 0, y: 0, active: false };
  private touchFire = false;

  // Screen shake
  private screenShake = 0;
  private shakeDecay = 0.9;

  // Callbacks & Assets
  private onGameOverCallback?: (stats: GameStats) => void;
  private onHUDUpdateCallback?: (hud: PlayerHUDState) => void;
  public assetLoader: AssetLoader;

  private lastTime = 0;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: {
      onGameOver?: (stats: GameStats) => void;
      onHUDUpdate?: (hud: PlayerHUDState) => void;
      highScore?: number;
      assetLoader?: AssetLoader;
      inputManager?: InputManager;
    }
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;

    this.onGameOverCallback = callbacks.onGameOver;
    this.onHUDUpdateCallback = callbacks.onHUDUpdate;
    this.highScore = callbacks.highScore || 0;
    this.assetLoader = callbacks.assetLoader || defaultAssetLoader;
    this.input = callbacks.inputManager || globalInputManager;
    this.input.setCanvas(this.canvas);

    // Asynchronously preload sprites ahead of time
    this.assetLoader.preload().catch((err) => {
      console.warn('[VoidGameEngine] Sprite preload encountered an error, fallbacks will be used:', err);
    });

    this.resizeCanvas();
    this.initStars();
  }

  public resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || 1200;
    this.height = rect.height || 800;

    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
    this.input.setCanvas(this.canvas);
  }

  private initStars() {
    this.stars = [];
    const count = 140;
    for (let i = 0; i < count; i++) {
      const layer = Math.random() < 0.6 ? 1 : Math.random() < 0.85 ? 2 : 3;
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: layer === 1 ? 1 : layer === 2 ? 1.6 : 2.4,
        speed: layer * 15,
        brightness: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 3 + 1,
        layer,
      });
    }
  }

  public detachInputs() {
    // Retained for API compatibility; persistent InputManager manages listeners globally
  }

  // Virtual mobile touch controls
  public setTouchJoystick(dx: number, dy: number, active: boolean) {
    this.touchVector = { x: dx, y: dy, active };
  }

  public setTouchFire(firing: boolean) {
    this.touchFire = firing;
  }

  public async start() {
    // Ensure all sprites are preloaded before beginning the frame loop
    await this.assetLoader.preload().catch(() => {});
    this.reset();
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    soundEffects.waveStart();
    this.spawnWave(1);
    this.loop(this.lastTime);
  }

  public pause() {
    this.isPaused = !this.isPaused;
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public reset() {
    this.resizeCanvas();
    this.player = {
      x: this.width / 2,
      y: this.height / 2,
      vx: 0,
      vy: 0,
      radius: 20,
      angle: -Math.PI / 2,
      targetAngle: -Math.PI / 2,
      speed: 400,
      acceleration: 1500,
      friction: 0.94,
      hull: 100,
      maxHull: 100,
      shield: 100,
      maxShield: 100,
      shieldRegenRate: 8,
      shieldRegenDelay: 3.5,
      timeSinceLastHit: 0,
      shootCooldown: 0,
      shootRate: 0.13,
      isThrusting: false,
      invincibleTimer: 2,
      spriteIndex: this.player?.spriteIndex ?? 1,
    };

    this.score = 0;
    this.voidTokens = 0;
    this.wave = 1;
    this.waveTimer = 0;
    this.combo = 0;
    this.comboTimer = 0;

    this.stats = {
      score: 0,
      voidTokensEarned: 0,
      wave: 1,
      asteroidsDestroyed: 0,
      dronesDestroyed: 0,
      crystalsCollected: 0,
      shotsFired: 0,
      shotsHit: 0,
      accuracy: 0,
      timeSurvivedSec: 0,
    };

    this.bullets = [];
    this.asteroids = [];
    this.drones = [];
    this.drops = [];
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;
  }

  private loop = (time: number) => {
    if (!this.isRunning) return;

    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    if (!this.isPaused) {
      this.update(dt);
    }
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private spawnWave(waveNumber: number) {
    this.wave = waveNumber;
    this.addFloatingText(this.width / 2, this.height / 2 - 40, `SECTOR WAVE ${waveNumber}`, '#38bdf8', 32);

    // Number of Space Energy Mines / Gas Nodes
    const hazardCount = 3 + waveNumber * 2;
    for (let i = 0; i < hazardCount; i++) {
      this.spawnAsteroid(3);
    }

    // Number of Hostile Rogue VibeVibers
    const droneCount = Math.min(10, 3 + Math.floor(waveNumber * 1.5));
    for (let i = 0; i < droneCount; i++) {
      this.spawnDrone(i % 3 === 2 ? 'interceptor' : 'scout');
    }
  }

  // Spawn Space Energy Mines / Gas Nodes
  private spawnAsteroid(tier: 1 | 2 | 3, originX?: number, originY?: number, hazardType?: 'energy_mine' | 'gas_node') {
    let x: number;
    let y: number;

    if (originX !== undefined && originY !== undefined) {
      x = originX;
      y = originY;
    } else {
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) {
        x = Math.random() * this.width;
        y = -40;
      } else if (edge === 1) {
        x = this.width + 40;
        y = Math.random() * this.height;
      } else if (edge === 2) {
        x = Math.random() * this.width;
        y = this.height + 40;
      } else {
        x = -40;
        y = Math.random() * this.height;
      }
    }

    const radius = tier === 3 ? 38 : tier === 2 ? 24 : 14;
    const hp = tier === 3 ? 3 : tier === 2 ? 2 : 1;
    const baseSpeed = (4 - tier) * 38 + Math.random() * 20;
    const angle = Math.random() * Math.PI * 2;
    const type = hazardType || (Math.random() > 0.5 ? 'energy_mine' : 'gas_node');
    const color = type === 'energy_mine' ? '#f59e0b' : '#10b981';

    const numPoints = 8 + Math.floor(Math.random() * 4);
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < numPoints; i++) {
      const a = (i / numPoints) * Math.PI * 2;
      const r = radius * (0.8 + Math.random() * 0.4);
      points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }

    this.asteroids.push({
      x,
      y,
      vx: Math.cos(angle) * baseSpeed,
      vy: Math.sin(angle) * baseSpeed,
      radius,
      points,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 1.8,
      hp,
      maxHp: hp,
      tier,
      color,
      hazardType: type,
      pulseTimer: Math.random() * Math.PI * 2,
    });
  }

  // Spawn Hostile Rogue VibeVibers
  private spawnDrone(type: 'scout' | 'interceptor', spriteIndex?: number) {
    const edge = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    if (edge === 0) {
      x = Math.random() * this.width;
      y = -35;
    } else if (edge === 1) {
      x = this.width + 35;
      y = Math.random() * this.height;
    } else if (edge === 2) {
      x = Math.random() * this.width;
      y = this.height + 35;
    } else {
      x = -35;
      y = Math.random() * this.height;
    }

    const hp = type === 'interceptor' ? 4 : 2;
    const availableCount = this.assetLoader.count;
    let assignedIndex = spriteIndex;
    if (assignedIndex === undefined) {
      if (availableCount > 1) {
        // Choose avatar from index 1-14 to pick genuine PFP avatars
        assignedIndex = 1 + Math.floor(Math.random() * (availableCount - 1));
      } else {
        assignedIndex = 0;
      }
    }

    this.drones.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: type === 'interceptor' ? 22 : 18,
      hp,
      maxHp: hp,
      type,
      shootCooldown: 1.2 + Math.random() * 1.8,
      shootInterval: type === 'interceptor' ? 2.0 : 2.8,
      burstLeft: type === 'interceptor' ? 3 : 2,
      burstInterval: 0.18,
      angle: 0,
      spriteIndex: assignedIndex,
    });
  }

  private update(dt: number) {
    this.stats.timeSurvivedSec += dt;

    // 1. Player Input & Physics
    let moveX = 0;
    let moveY = 0;

    if (this.input.isMovingUp()) moveY -= 1;
    if (this.input.isMovingDown()) moveY += 1;
    if (this.input.isMovingLeft()) moveX -= 1;
    if (this.input.isMovingRight()) moveX += 1;

    // Virtual touch integration
    if (this.touchVector.active) {
      moveX += this.touchVector.x;
      moveY += this.touchVector.y;
    }

    const moveLength = Math.hypot(moveX, moveY);
    if (moveLength > 0.1) {
      const normX = moveX / moveLength;
      const normY = moveY / moveLength;
      this.player.vx += normX * this.player.acceleration * dt;
      this.player.vy += normY * this.player.acceleration * dt;
      this.player.isThrusting = true;

      // Dynamic thruster particle flame/glow trailing behind direction of movement
      const moveAngle = Math.atan2(this.player.vy, this.player.vx);
      const exhaustAngle = moveAngle + Math.PI + (Math.random() - 0.5) * 0.45;
      const pSpeed = 130 + Math.random() * 110;
      this.particles.push({
        x: this.player.x - Math.cos(moveAngle) * (this.player.radius * 0.9),
        y: this.player.y - Math.sin(moveAngle) * (this.player.radius * 0.9),
        vx: Math.cos(exhaustAngle) * pSpeed + this.player.vx * 0.2,
        vy: Math.sin(exhaustAngle) * pSpeed + this.player.vy * 0.2,
        size: Math.random() * 3.5 + 2,
        color: Math.random() > 0.35 ? '#06b6d4' : '#38bdf8',
        alpha: 0.95,
        decay: 3.5,
      });
    } else {
      this.player.isThrusting = false;
    }

    // Apply friction
    this.player.vx *= Math.pow(this.player.friction, dt * 60);
    this.player.vy *= Math.pow(this.player.friction, dt * 60);

    // Limit max velocity
    const speed = Math.hypot(this.player.vx, this.player.vy);
    if (speed > this.player.speed) {
      this.player.vx = (this.player.vx / speed) * this.player.speed;
      this.player.vy = (this.player.vy / speed) * this.player.speed;
    }

    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Viewport clamp
    const pad = this.player.radius;
    this.player.x = Math.max(pad, Math.min(this.width - pad, this.player.x));
    this.player.y = Math.max(pad, Math.min(this.height - pad, this.player.y));

    // Turn smoothly toward mouse cursor
    const mouseX = this.input.mouse.x;
    const mouseY = this.input.mouse.y;
    const targetAngle = Math.atan2(mouseY - this.player.y, mouseX - this.player.x);
    let diff = targetAngle - this.player.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.player.angle += diff * Math.min(1, dt * 24);

    // Invincibility cooldown
    if (this.player.invincibleTimer > 0) {
      this.player.invincibleTimer -= dt;
    }

    // Shield regeneration
    this.player.timeSinceLastHit += dt;
    if (this.player.timeSinceLastHit > this.player.shieldRegenDelay && this.player.shield < this.player.maxShield) {
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + this.player.shieldRegenRate * dt);
    }

    // Firing logic: continuous projectiles on mouse hold
    this.player.shootCooldown -= dt;
    const isTryingToShoot = this.input.isShooting() || this.touchFire;
    if (isTryingToShoot && this.player.shootCooldown <= 0) {
      this.firePlayerLaser();
      this.player.shootCooldown = this.player.shootRate;
    }

    // Combo timer
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // 2. Bullets update
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Despawn offscreen or expired
      if (b.life <= 0 || b.x < -20 || b.x > this.width + 20 || b.y < -20 || b.y > this.height + 20) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Enemy bullet hitting player
      if (b.isEnemy) {
        const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
        if (dist < b.radius + this.player.radius && this.player.invincibleTimer <= 0) {
          this.damagePlayer(b.damage);
          this.bullets.splice(i, 1);
          continue;
        }
      } else {
        // Player bullet hitting Space Hazards
        let bulletConsumed = false;
        for (let aIdx = this.asteroids.length - 1; aIdx >= 0; aIdx--) {
          const ast = this.asteroids[aIdx];
          const dist = Math.hypot(b.x - ast.x, b.y - ast.y);
          if (dist < b.radius + ast.radius) {
            this.stats.shotsHit++;
            ast.hp -= b.damage;
            this.spawnImpactParticles(b.x, b.y, ast.color);
            soundEffects.shieldHit();

            if (ast.hp <= 0) {
              this.destroyAsteroid(aIdx);
            }
            this.bullets.splice(i, 1);
            bulletConsumed = true;
            break;
          }
        }
        if (bulletConsumed) continue;

        // Player bullet hitting Rogue VibeVibers
        for (let dIdx = this.drones.length - 1; dIdx >= 0; dIdx--) {
          const drone = this.drones[dIdx];
          const dist = Math.hypot(b.x - drone.x, b.y - drone.y);
          if (dist < b.radius + drone.radius) {
            this.stats.shotsHit++;
            drone.hp -= b.damage;
            this.spawnImpactParticles(b.x, b.y, '#f43f5e');
            soundEffects.shieldHit();

            if (drone.hp <= 0) {
              this.destroyDrone(dIdx);
            }
            this.bullets.splice(i, 1);
            bulletConsumed = true;
            break;
          }
        }
      }
    }

    // 3. Space Hazards update & collision
    for (let i = 0; i < this.asteroids.length; i++) {
      const ast = this.asteroids[i];
      ast.x += ast.vx * dt;
      ast.y += ast.vy * dt;
      ast.rotation += ast.vRot * dt;

      // Screen wrapping
      if (ast.x < -50) ast.x = this.width + 50;
      if (ast.x > this.width + 50) ast.x = -50;
      if (ast.y < -50) ast.y = this.height + 50;
      if (ast.y > this.height + 50) ast.y = -50;

      // Check collision with player
      if (this.player.invincibleTimer <= 0) {
        const dist = Math.hypot(ast.x - this.player.x, ast.y - this.player.y);
        if (dist < ast.radius + this.player.radius * 0.8) {
          this.damagePlayer(ast.tier * 18);
          // Bounce
          const pushAngle = Math.atan2(this.player.y - ast.y, this.player.x - ast.x);
          this.player.vx += Math.cos(pushAngle) * 350;
          this.player.vy += Math.sin(pushAngle) * 350;
          ast.vx -= Math.cos(pushAngle) * 60;
          ast.vy -= Math.sin(pushAngle) * 60;
        }
      }
    }

    // 4. Hostile Rogue VibeVibers tactical AI & bursts
    for (let i = 0; i < this.drones.length; i++) {
      const drone = this.drones[i];
      const dx = this.player.x - drone.x;
      const dy = this.player.y - drone.y;
      const targetAngle = Math.atan2(dy, dx);
      drone.angle = targetAngle;

      const dist = Math.hypot(dx, dy);
      const idealDist = drone.type === 'interceptor' ? 220 : 310;
      const speed = drone.type === 'interceptor' ? 200 : 150;

      // Maintain dynamic tactical engagement distance
      if (dist > idealDist + 50) {
        drone.vx += Math.cos(targetAngle) * speed * 2.5 * dt;
        drone.vy += Math.sin(targetAngle) * speed * 2.5 * dt;
      } else if (dist < idealDist - 50) {
        drone.vx -= Math.cos(targetAngle) * speed * 2.5 * dt;
        drone.vy -= Math.sin(targetAngle) * speed * 2.5 * dt;
      }

      // Orbital strafing to dodge and flank
      const strafeDir = i % 2 === 0 ? 1 : -1;
      const strafeAngle = targetAngle + (Math.PI / 2) * strafeDir;
      drone.vx += Math.cos(strafeAngle) * (speed * 0.9) * dt;
      drone.vy += Math.sin(strafeAngle) * (speed * 0.9) * dt;

      drone.vx *= 0.94;
      drone.vy *= 0.94;
      drone.x += drone.vx * dt;
      drone.y += drone.vy * dt;

      // Projectile burst firing at intervals
      drone.shootCooldown -= dt;
      if (drone.shootCooldown <= 0) {
        drone.burstInterval -= dt;
        if (drone.burstInterval <= 0) {
          this.fireDroneBullet(drone);
          drone.burstLeft--;
          drone.burstInterval = 0.18;

          if (drone.burstLeft <= 0) {
            drone.shootCooldown = drone.shootInterval + Math.random() * 1.2;
            drone.burstLeft = drone.type === 'interceptor' ? 3 : 2;
          }
        }
      }
    }

    // 5. Crystal & Token Drops update (magnetic pickup)
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.rotation += d.vRot * dt;
      d.life -= dt;

      if (d.life <= 0) {
        this.drops.splice(i, 1);
        continue;
      }

      // Magnetic tractor beam attraction
      const dist = Math.hypot(d.x - this.player.x, d.y - this.player.y);
      if (dist < 180) {
        const pullAngle = Math.atan2(this.player.y - d.y, this.player.x - d.x);
        const pullSpeed = (1 - dist / 180) * 480;
        d.vx += Math.cos(pullAngle) * pullSpeed * dt;
        d.vy += Math.sin(pullAngle) * pullSpeed * dt;
      }

      // Pickup collection
      if (dist < this.player.radius + d.radius + 6) {
        this.collectDrop(d);
        this.drops.splice(i, 1);
      }
    }

    // 6. Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 7. Floating Texts update
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy * dt;
      t.alpha -= 0.85 * dt;
      if (t.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 8. Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake *= Math.pow(this.shakeDecay, dt * 60);
      if (this.screenShake < 0.2) this.screenShake = 0;
    }

    // 9. Wave completion check
    if (this.asteroids.length === 0 && this.drones.length === 0) {
      this.waveTimer += dt;
      if (this.waveTimer > 2.0) {
        this.waveTimer = 0;
        soundEffects.waveStart();
        this.spawnWave(this.wave + 1);
      }
    }

    // 10. Update stats accuracy & HUD
    this.stats.accuracy = this.stats.shotsFired > 0 ? (this.stats.shotsHit / this.stats.shotsFired) * 100 : 0;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    if (this.onHUDUpdateCallback) {
      this.onHUDUpdateCallback({
        score: this.score,
        voidTokens: this.voidTokens,
        wave: this.wave,
        hull: Math.round(this.player.hull),
        maxHull: this.player.maxHull,
        shield: Math.round(this.player.shield),
        maxShield: this.player.maxShield,
        combo: this.combo,
        highScore: this.highScore,
      });
    }
  }

  private firePlayerLaser() {
    this.stats.shotsFired++;
    const speed = 820;
    const offset = 14;

    // Dual wing blasters
    const normal = this.player.angle + Math.PI / 2;
    const leftX = this.player.x + Math.cos(this.player.angle) * 16 + Math.cos(normal) * offset;
    const leftY = this.player.y + Math.sin(this.player.angle) * 16 + Math.sin(normal) * offset;
    const rightX = this.player.x + Math.cos(this.player.angle) * 16 - Math.cos(normal) * offset;
    const rightY = this.player.y + Math.sin(this.player.angle) * 16 - Math.sin(normal) * offset;

    const vx = Math.cos(this.player.angle) * speed + this.player.vx * 0.25;
    const vy = Math.sin(this.player.angle) * speed + this.player.vy * 0.25;

    this.bullets.push(
      { x: leftX, y: leftY, vx, vy, radius: 3.5, color: '#38bdf8', isEnemy: false, damage: 1, life: 1.2 },
      { x: rightX, y: rightY, vx, vy, radius: 3.5, color: '#38bdf8', isEnemy: false, damage: 1, life: 1.2 }
    );

    soundEffects.shoot();
  }

  private fireDroneBullet(drone: RogueViber) {
    const speed = drone.type === 'interceptor' ? 460 : 380;
    const vx = Math.cos(drone.angle) * speed;
    const vy = Math.sin(drone.angle) * speed;

    this.bullets.push({
      x: drone.x + Math.cos(drone.angle) * (drone.radius + 6),
      y: drone.y + Math.sin(drone.angle) * (drone.radius + 6),
      vx,
      vy,
      radius: drone.type === 'interceptor' ? 4.5 : 3.5,
      color: '#f43f5e',
      isEnemy: true,
      damage: drone.type === 'interceptor' ? 14 : 9,
      life: 2.2,
    });
  }

  private damagePlayer(damage: number) {
    this.player.timeSinceLastHit = 0;
    this.screenShake = Math.min(18, this.screenShake + damage * 0.65);
    this.combo = 0;

    if (this.player.shield > 0) {
      if (this.player.shield >= damage) {
        this.player.shield -= damage;
        soundEffects.shieldHit();
      } else {
        const remaining = damage - this.player.shield;
        this.player.shield = 0;
        this.player.hull -= remaining;
        soundEffects.heavyLaser();
      }
    } else {
      this.player.hull -= damage;
      soundEffects.heavyLaser();
    }

    this.spawnImpactParticles(this.player.x, this.player.y, '#f59e0b', 16);

    if (this.player.hull <= 0) {
      this.player.hull = 0;
      this.handleGameOver();
    }
  }

  // Destroy Space Energy Mine / Gas Node with splash damage
  private destroyAsteroid(index: number) {
    const ast = this.asteroids[index];
    this.stats.asteroidsDestroyed++;
    this.asteroids.splice(index, 1);

    this.combo++;
    this.comboTimer = 2.5;

    const points = ast.tier * 70 * Math.min(4, this.combo);
    this.score += points;
    this.addFloatingText(ast.x, ast.y, `+${points}`, '#f59e0b', 14);

    soundEffects.explosion();
    this.screenShake = Math.min(18, this.screenShake + ast.tier * 3.5);
    this.spawnExplosion(ast.x, ast.y, ast.tier * 12, ast.color);

    // Splash damage to nearby entities
    const splashRadius = ast.radius * 3.2;
    const splashDamage = ast.tier * 18;

    // Splash damage to player
    const distToPlayer = Math.hypot(ast.x - this.player.x, ast.y - this.player.y);
    if (distToPlayer < splashRadius && this.player.invincibleTimer <= 0) {
      this.damagePlayer(Math.floor(splashDamage * 0.45));
    }

    // Splash damage to nearby Rogue VibeVibers
    for (let d = this.drones.length - 1; d >= 0; d--) {
      const drone = this.drones[d];
      const distToDrone = Math.hypot(ast.x - drone.x, ast.y - drone.y);
      if (distToDrone < splashRadius + drone.radius) {
        drone.hp -= splashDamage;
        this.spawnImpactParticles(drone.x, drone.y, '#f59e0b', 12);
        this.addFloatingText(drone.x, drone.y - 15, `SPLASH -${splashDamage}`, '#f59e0b', 12);
        if (drone.hp <= 0) {
          this.destroyDrone(d);
        }
      }
    }

    // Exploding splash-damage fragments / fiery shrapnel particles
    const fragmentCount = 10 + ast.tier * 4;
    for (let f = 0; f < fragmentCount; f++) {
      const fAngle = (f / fragmentCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const fSpeed = 160 + Math.random() * 140;
      this.particles.push({
        x: ast.x,
        y: ast.y,
        vx: Math.cos(fAngle) * fSpeed,
        vy: Math.sin(fAngle) * fSpeed,
        size: Math.random() * 3.5 + 2.5,
        color: Math.random() > 0.4 ? ast.color : '#fef08a',
        alpha: 1,
        decay: 2.2,
      });
    }

    // Spawn smaller debris chunks / mini nodes
    if (ast.tier > 1) {
      const nextTier = (ast.tier - 1) as 1 | 2;
      this.spawnAsteroid(nextTier, ast.x, ast.y, ast.hazardType);
      this.spawnAsteroid(nextTier, ast.x, ast.y, ast.hazardType);
    }

    // Drop $VOID crypto gems
    if (Math.random() < 0.75 || ast.tier === 3) {
      const tokenValue = ast.tier === 3 ? 6 : ast.tier === 2 ? 3 : 1;
      this.drops.push({
        x: ast.x,
        y: ast.y,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        value: tokenValue,
        radius: 7,
        rotation: 0,
        vRot: (Math.random() - 0.5) * 4,
        life: 14,
        type: 'void_token',
      });
    }

    // Occasional powerup repair drops
    if (Math.random() < 0.12) {
      this.drops.push({
        x: ast.x,
        y: ast.y,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60,
        value: 1,
        radius: 8,
        rotation: 0,
        vRot: (Math.random() - 0.5) * 3,
        life: 12,
        type: Math.random() > 0.5 ? 'shield_restore' : 'hull_repair',
      });
    }
  }

  // Destroy Hostile Rogue VibeViber
  private destroyDrone(index: number) {
    const drone = this.drones[index];
    this.stats.dronesDestroyed++;
    this.drones.splice(index, 1);

    this.combo++;
    this.comboTimer = 2.5;

    const points = (drone.type === 'interceptor' ? 260 : 140) * Math.min(4, this.combo);
    this.score += points;
    this.addFloatingText(drone.x, drone.y, `+${points}`, '#f43f5e', 16);

    soundEffects.explosion();
    this.screenShake = Math.min(18, this.screenShake + 6);
    this.spawnExplosion(drone.x, drone.y, 20, '#fb7185');

    // Drones always drop $VOID tokens
    this.drops.push({
      x: drone.x,
      y: drone.y,
      vx: (Math.random() - 0.5) * 70,
      vy: (Math.random() - 0.5) * 70,
      value: drone.type === 'interceptor' ? 10 : 5,
      radius: 8,
      rotation: 0,
      vRot: (Math.random() - 0.5) * 4,
      life: 16,
      type: 'void_token',
    });
  }

  private handleGameOver() {
    this.isRunning = false;
    soundEffects.gameOver();
    this.spawnExplosion(this.player.x, this.player.y, 40, '#38bdf8');

    const scoreTokens = Math.floor(this.score / 100);
    this.stats.voidTokensEarned = this.voidTokens + scoreTokens;

    if (this.onGameOverCallback) {
      this.onGameOverCallback(this.stats);
    }
  }

  private spawnImpactParticles(x: number, y: number, color: string, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2 + 1,
        color,
        alpha: 1,
        decay: 3.0,
      });
    }
  }

  private spawnExplosion(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 50 + Math.random() * 180;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: Math.random() > 0.4 ? color : '#fef08a',
        alpha: 1,
        decay: 1.8,
      });
    }
  }

  private collectDrop(d: CrystalDrop) {
    if (d.type === 'void_token') {
      this.voidTokens += d.value;
      this.score += d.value * 25;
      this.stats.crystalsCollected += d.value;
      soundEffects.powerup();
      this.addFloatingText(d.x, d.y, `+${d.value} $VOID`, '#f59e0b', 14);
      this.spawnImpactParticles(d.x, d.y, '#f59e0b', 8);
    } else if (d.type === 'shield_restore') {
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + 35);
      soundEffects.powerup();
      this.addFloatingText(d.x, d.y, '+SHIELD', '#06b6d4', 14);
      this.spawnImpactParticles(d.x, d.y, '#06b6d4', 10);
    } else {
      this.player.hull = Math.min(this.player.maxHull, this.player.hull + 25);
      soundEffects.powerup();
      this.addFloatingText(d.x, d.y, '+HULL', '#10b981', 14);
      this.spawnImpactParticles(d.x, d.y, '#10b981', 10);
    }
  }

  private addFloatingText(x: number, y: number, text: string, color: string, fontSize = 16) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -35,
      fontSize,
    });
  }

  // Canvas rendering
  private render() {
    const ctx = this.ctx;

    ctx.save();

    // Screen Shake transform
    if (this.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.screenShake * 2;
      const dy = (Math.random() - 0.5) * this.screenShake * 2;
      ctx.translate(dx, dy);
    }

    // 1. Clear background void
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Cyber background grid
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    const offsetX = (this.stats.timeSurvivedSec * 8) % gridSize;
    const offsetY = (this.stats.timeSurvivedSec * 8) % gridSize;

    ctx.beginPath();
    for (let x = -gridSize + offsetX; x < this.width + gridSize; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
    }
    for (let y = -gridSize + offsetY; y < this.height + gridSize; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
    }
    ctx.stroke();

    // 3. Parallax stars
    const time = this.stats.timeSurvivedSec;
    for (const star of this.stars) {
      const twinkle = Math.sin(time * star.twinkleSpeed) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(226, 232, 240, ${star.brightness * twinkle})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Token & Crystal Drops
    for (const drop of this.drops) {
      ctx.save();
      ctx.translate(drop.x, drop.y);
      ctx.rotate(drop.rotation);

      if (drop.type === 'void_token') {
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, -drop.radius);
        ctx.lineTo(drop.radius, 0);
        ctx.lineTo(0, drop.radius);
        ctx.lineTo(-drop.radius, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, drop.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (drop.type === 'shield_restore') {
        ctx.strokeStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, drop.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
        ctx.fillRect(-2, -drop.radius, 4, drop.radius * 2);
        ctx.fillRect(-drop.radius, -2, drop.radius * 2, 4);
      }
      ctx.restore();
    }

    // 5. Space Hazards (Energy Mines & Gas Nodes)
    for (const ast of this.asteroids) {
      ctx.save();
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.rotation);

      const isMine = ast.hazardType === 'energy_mine';
      const hazardColor = isMine ? '#f59e0b' : '#10b981';
      const pulse = Math.sin(time * 5 + ast.pulseTimer) * 0.25 + 0.75;

      // Outer hazard containment field glow
      ctx.shadowColor = hazardColor;
      ctx.shadowBlur = 14 * pulse;

      // Spikes / sensor antennae radiating from mine
      const spikeCount = isMine ? 8 : 6;
      ctx.strokeStyle = hazardColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let s = 0; s < spikeCount; s++) {
        const sAngle = (s / spikeCount) * Math.PI * 2;
        const outerR = ast.radius * (1.15 + 0.1 * pulse);
        const innerR = ast.radius * 0.7;
        ctx.moveTo(Math.cos(sAngle) * innerR, Math.sin(sAngle) * innerR);
        ctx.lineTo(Math.cos(sAngle) * outerR, Math.sin(sAngle) * outerR);
      }
      ctx.stroke();

      // Rotating energy containment rings
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = isMine ? `rgba(245, 158, 11, ${0.4 + 0.5 * pulse})` : `rgba(16, 185, 129, ${0.4 + 0.5 * pulse})`;
      ctx.beginPath();
      ctx.arc(0, 0, ast.radius * 0.85, 0, Math.PI * 2);
      ctx.stroke();

      // Pulsing plasma/gas core
      const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, ast.radius * 0.7);
      if (isMine) {
        coreGrad.addColorStop(0, '#fef08a');
        coreGrad.addColorStop(0.5, '#f59e0b');
        coreGrad.addColorStop(1, 'rgba(180, 83, 9, 0.4)');
      } else {
        coreGrad.addColorStop(0, '#a7f3d0');
        coreGrad.addColorStop(0.5, '#10b981');
        coreGrad.addColorStop(1, 'rgba(4, 120, 87, 0.4)');
      }
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, ast.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Inner danger core node
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, ast.radius * 0.22 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 6. Hostile Rogue VibeVibers
    for (const drone of this.drones) {
      ctx.save();
      ctx.translate(drone.x, drone.y);

      // Overhead compact health bar (horizontal, unrotated)
      const barW = Math.max(30, drone.radius * 1.9);
      const barH = 4.5;
      const barX = -barW / 2;
      const barY = -drone.radius - 14;

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      const hpRatio = Math.max(0, drone.hp / drone.maxHp);
      ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#f59e0b' : '#f43f5e';
      ctx.fillRect(barX + 0.5, barY + 0.5, (barW - 1) * hpRatio, barH - 1);

      // Rotating body & danger rim
      ctx.rotate(drone.angle);

      const pulse = Math.sin(time * 7 + drone.x * 0.01) * 0.3 + 0.7;
      const dangerColor = drone.type === 'interceptor' ? '#f43f5e' : '#ec4899';

      // 1. Pulsing red/magenta danger rim
      ctx.shadowColor = dangerColor;
      ctx.shadowBlur = 14 * pulse;
      ctx.strokeStyle = dangerColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, drone.radius, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Circular clipped VibeViber PFP avatar
      const sprite = this.assetLoader.getImage(drone.spriteIndex);
      if (sprite) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, drone.radius - 1, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const imgW = sprite.naturalWidth || sprite.width;
        const imgH = sprite.naturalHeight || sprite.height;
        const cropSize = Math.min(imgW, imgH);
        const sx = (imgW - cropSize) * 0.5;
        const sy = (imgH - cropSize) * 0.5;
        const d = (drone.radius - 1) * 2;

        ctx.drawImage(
          sprite,
          sx,
          sy,
          cropSize,
          cropSize,
          -(drone.radius - 1),
          -(drone.radius - 1),
          d,
          d
        );
        ctx.restore();
      } else {
        // Fallback hostile core
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(0, 0, drone.radius - 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Directional danger reticle pointer pointing toward player (+X)
      ctx.fillStyle = dangerColor;
      ctx.shadowColor = dangerColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(drone.radius + 6, 0);
      ctx.lineTo(drone.radius - 2, -4.5);
      ctx.lineTo(drone.radius - 2, 4.5);
      ctx.closePath();
      ctx.fill();

      // 4. Hostile targeting visor tint
      ctx.strokeStyle = `rgba(244, 63, 94, ${0.4 + 0.4 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, drone.radius * 0.65, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();

      ctx.restore();
    }

    // 7. Bullets
    for (const b of this.bullets) {
      ctx.save();
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = b.color;

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Laser trail line
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02);
      ctx.stroke();

      ctx.restore();
    }

    // 8. Player Character (VibeViber inside sleek circular cyber-cockpit)
    if (this.player.hull > 0) {
      ctx.save();
      ctx.translate(this.player.x, this.player.y);

      // Invincible flash
      if (this.player.invincibleTimer > 0 && Math.floor(time * 12) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      // A. Dynamic thruster particle flame/glow trailing behind direction of movement
      const moveSpeed = Math.hypot(this.player.vx, this.player.vy);
      if (this.player.isThrusting || moveSpeed > 15) {
        ctx.save();
        ctx.rotate(this.player.angle);
        const flameLen = 14 + Math.sin(time * 30) * 5 + (moveSpeed / this.player.speed) * 14;
        const thrusterGrad = ctx.createLinearGradient(0, 0, -this.player.radius - flameLen, 0);
        thrusterGrad.addColorStop(0, 'rgba(6, 182, 212, 0.95)');
        thrusterGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.7)');
        thrusterGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.2)');
        thrusterGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.fillStyle = thrusterGrad;
        ctx.beginPath();
        ctx.moveTo(-this.player.radius * 0.7, -this.player.radius * 0.45);
        ctx.lineTo(-this.player.radius - flameLen, 0);
        ctx.lineTo(-this.player.radius * 0.7, this.player.radius * 0.45);
        ctx.closePath();
        ctx.fill();

        // Inner white-hot flame core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-this.player.radius * 0.6, -this.player.radius * 0.2);
        ctx.lineTo(-this.player.radius - flameLen * 0.4, 0);
        ctx.lineTo(-this.player.radius * 0.6, this.player.radius * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // B. Sleek circular cyber-cockpit chassis
      ctx.save();
      ctx.rotate(this.player.angle);

      // Cockpit hull & cyan energy ring
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Selected VibeViber PFP avatar inside circular cockpit clip
      const playerSprite = this.assetLoader.getImage(this.player.spriteIndex);
      if (playerSprite) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, this.player.radius - 2.5, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const imgW = playerSprite.naturalWidth || playerSprite.width;
        const imgH = playerSprite.naturalHeight || playerSprite.height;
        const cropSize = Math.min(imgW, imgH);
        const sx = (imgW - cropSize) * 0.5;
        const sy = (imgH - cropSize) * 0.5;
        const d = (this.player.radius - 2.5) * 2;

        ctx.drawImage(
          playerSprite,
          sx,
          sy,
          cropSize,
          cropSize,
          -(this.player.radius - 2.5),
          -(this.player.radius - 2.5),
          d,
          d
        );
        ctx.restore();
      }

      // Glass canopy sheen & reflection
      const canopyGrad = ctx.createLinearGradient(-this.player.radius, -this.player.radius, this.player.radius, this.player.radius);
      canopyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      canopyGrad.addColorStop(0.35, 'rgba(6, 182, 212, 0.2)');
      canopyGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0)');
      canopyGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
      ctx.fillStyle = canopyGrad;
      ctx.beginPath();
      ctx.arc(0, 0, this.player.radius - 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Wing cannon pods on left & right
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 6;
      ctx.fillRect(-this.player.radius * 0.2, -this.player.radius - 3.5, 6, 3);
      ctx.fillRect(-this.player.radius * 0.2, this.player.radius + 0.5, 6, 3);

      // C. Crisp directional aim arrow pointing towards mouse cursor
      const arrowStart = this.player.radius + 10;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(arrowStart + 10, 0); // arrow point
      ctx.lineTo(arrowStart, -6);      // left fin
      ctx.lineTo(arrowStart + 3, 0);   // notch
      ctx.lineTo(arrowStart, 6);       // right fin
      ctx.closePath();
      ctx.fill();

      // Laser guide line extension
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(arrowStart + 12, 0);
      ctx.lineTo(arrowStart + 36, 0);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore(); // restore local rotation

      // Energy shield dome (if shield active)
      if (this.player.shield > 0) {
        ctx.strokeStyle = `rgba(6, 182, 212, ${0.4 + (this.player.shield / this.player.maxShield) * 0.4})`;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, this.player.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    // 9. Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 10. Floating Combat Texts
    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.fontSize}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }

    ctx.restore();
  }
}
