/**
 * Void Raider 2D Space Shooter Canvas Engine
 * Procedural graphics, 60 FPS game loop, zero external asset dependencies.
 */

import { soundEffects } from './zzfx';

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

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  points: { x: number; y: number }[];
  rotation: number;
  vRot: number;
  hp: number;
  tier: 1 | 2 | 3; // 3 = large, 2 = med, 1 = small
  color: string;
}

interface EnemyDrone {
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
  angle: number;
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

  // Player state
  public player = {
    x: 600,
    y: 400,
    vx: 0,
    vy: 0,
    radius: 18,
    angle: -Math.PI / 2,
    targetAngle: -Math.PI / 2,
    speed: 380, // pixels per sec
    acceleration: 1400,
    friction: 0.94,
    hull: 100,
    maxHull: 100,
    shield: 100,
    maxShield: 100,
    shieldRegenRate: 8, // shield per sec
    shieldRegenDelay: 3.5, // seconds after hit before regen
    timeSinceLastHit: 0,
    shootCooldown: 0,
    shootRate: 0.14, // seconds between shots
    isThrusting: false,
    invincibleTimer: 1.5,
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
  private asteroids: Asteroid[] = [];
  private drones: EnemyDrone[] = [];
  private drops: CrystalDrop[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  // Input states
  private keys: Record<string, boolean> = {};
  private mouse = { x: 600, y: 400, isDown: false };
  private touchVector = { x: 0, y: 0, active: false };
  private touchFire = false;

  // Screen shake
  private screenShake = 0;
  private shakeDecay = 0.9;

  // Callbacks
  private onGameOverCallback?: (stats: GameStats) => void;
  private onHUDUpdateCallback?: (hud: PlayerHUDState) => void;

  private lastTime = 0;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: {
      onGameOver?: (stats: GameStats) => void;
      onHUDUpdate?: (hud: PlayerHUDState) => void;
      highScore?: number;
    }
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;

    this.onGameOverCallback = callbacks.onGameOver;
    this.onHUDUpdateCallback = callbacks.onHUDUpdate;
    this.highScore = callbacks.highScore || 0;

    this.resizeCanvas();
    this.initStars();
    this.attachInputs();
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

  private attachInputs() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  public detachInputs() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouse.isDown = true;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouse.isDown = false;
    }
  };

  // Virtual mobile touch controls
  public setTouchJoystick(dx: number, dy: number, active: boolean) {
    this.touchVector = { x: dx, y: dy, active };
  }

  public setTouchFire(firing: boolean) {
    this.touchFire = firing;
  }

  public start() {
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
      radius: 18,
      angle: -Math.PI / 2,
      targetAngle: -Math.PI / 2,
      speed: 380,
      acceleration: 1400,
      friction: 0.94,
      hull: 100,
      maxHull: 100,
      shield: 100,
      maxShield: 100,
      shieldRegenRate: 8,
      shieldRegenDelay: 3.5,
      timeSinceLastHit: 0,
      shootCooldown: 0,
      shootRate: 0.14,
      isThrusting: false,
      invincibleTimer: 2,
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
    this.addFloatingText(this.width / 2, this.height / 2 - 40, `WAVE ${waveNumber}`, '#38bdf8', 32);

    // Number of asteroids scales with wave
    const asteroidCount = 4 + waveNumber * 2;
    for (let i = 0; i < asteroidCount; i++) {
      this.spawnAsteroid(3);
    }

    // Number of enemy drones
    const droneCount = Math.min(8, Math.floor(waveNumber * 1.5));
    for (let i = 0; i < droneCount; i++) {
      this.spawnDrone(i % 3 === 2 ? 'interceptor' : 'scout');
    }
  }

  private spawnAsteroid(tier: 1 | 2 | 3, originX?: number, originY?: number) {
    let x: number;
    let y: number;

    if (originX !== undefined && originY !== undefined) {
      x = originX;
      y = originY;
    } else {
      // Spawn at canvas perimeter away from player
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

    const radius = tier === 3 ? 42 : tier === 2 ? 26 : 14;
    const hp = tier === 3 ? 3 : tier === 2 ? 2 : 1;
    const baseSpeed = (4 - tier) * 45 + Math.random() * 20;
    const angle = Math.random() * Math.PI * 2;

    // Generate irregular polygon vertices
    const numPoints = 8 + Math.floor(Math.random() * 5);
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < numPoints; i++) {
      const a = (i / numPoints) * Math.PI * 2;
      const r = radius * (0.75 + Math.random() * 0.45);
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
      vRot: (Math.random() - 0.5) * 1.5,
      hp,
      tier,
      color: tier === 3 ? '#94a3b8' : tier === 2 ? '#64748b' : '#cbd5e1',
    });
  }

  private spawnDrone(type: 'scout' | 'interceptor') {
    const edge = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    if (edge === 0) {
      x = Math.random() * this.width;
      y = -30;
    } else if (edge === 1) {
      x = this.width + 30;
      y = Math.random() * this.height;
    } else if (edge === 2) {
      x = Math.random() * this.width;
      y = this.height + 30;
    } else {
      x = -30;
      y = Math.random() * this.height;
    }

    const hp = type === 'interceptor' ? 4 : 2;
    this.drones.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: type === 'interceptor' ? 20 : 15,
      hp,
      maxHp: hp,
      type,
      shootCooldown: 1.5 + Math.random() * 2,
      shootInterval: type === 'interceptor' ? 2.2 : 3.0,
      angle: 0,
    });
  }

  private update(dt: number) {
    this.stats.timeSurvivedSec += dt;

    // 1. Player Input & Physics
    let moveX = 0;
    let moveY = 0;

    if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

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

      // Thruster exhaust particles
      const exhaustAngle = this.player.angle + Math.PI + (Math.random() - 0.5) * 0.4;
      const pSpeed = 120 + Math.random() * 100;
      this.particles.push({
        x: this.player.x - Math.cos(this.player.angle) * this.player.radius,
        y: this.player.y - Math.sin(this.player.angle) * this.player.radius,
        vx: Math.cos(exhaustAngle) * pSpeed + this.player.vx * 0.3,
        vy: Math.sin(exhaustAngle) * pSpeed + this.player.vy * 0.3,
        size: Math.random() * 3 + 2,
        color: Math.random() > 0.4 ? '#06b6d4' : '#38bdf8',
        alpha: 0.9,
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

    // Turn toward mouse or touch direction
    const targetAngle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);
    // Smooth angle interpolation
    let diff = targetAngle - this.player.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.player.angle += diff * Math.min(1, dt * 18);

    // Invincibility cooldown
    if (this.player.invincibleTimer > 0) {
      this.player.invincibleTimer -= dt;
    }

    // Shield regeneration
    this.player.timeSinceLastHit += dt;
    if (this.player.timeSinceLastHit > this.player.shieldRegenDelay && this.player.shield < this.player.maxShield) {
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + this.player.shieldRegenRate * dt);
    }

    // Firing logic
    this.player.shootCooldown -= dt;
    const isTryingToShoot = this.keys[' '] || this.mouse.isDown || this.touchFire;
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
        // Player bullet hitting asteroids
        let bulletConsumed = false;
        for (let aIdx = this.asteroids.length - 1; aIdx >= 0; aIdx--) {
          const ast = this.asteroids[aIdx];
          const dist = Math.hypot(b.x - ast.x, b.y - ast.y);
          if (dist < b.radius + ast.radius) {
            this.stats.shotsHit++;
            ast.hp -= b.damage;
            this.spawnImpactParticles(b.x, b.y, '#38bdf8');
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

        // Player bullet hitting drones
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

    // 3. Asteroids update & collision
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

    // 4. Enemy Drones update
    for (let i = 0; i < this.drones.length; i++) {
      const drone = this.drones[i];
      const dx = this.player.x - drone.x;
      const dy = this.player.y - drone.y;
      const targetAngle = Math.atan2(dy, dx);
      drone.angle = targetAngle;

      // AI movement: maintain tactical standoff distance
      const dist = Math.hypot(dx, dy);
      const idealDist = drone.type === 'interceptor' ? 240 : 340;
      const speed = drone.type === 'interceptor' ? 180 : 130;

      if (dist > idealDist + 40) {
        drone.vx += Math.cos(targetAngle) * speed * 2 * dt;
        drone.vy += Math.sin(targetAngle) * speed * 2 * dt;
      } else if (dist < idealDist - 40) {
        drone.vx -= Math.cos(targetAngle) * speed * 2 * dt;
        drone.vy -= Math.sin(targetAngle) * speed * 2 * dt;
      }

      // Add slight orbital strafe
      const strafeAngle = targetAngle + Math.PI / 2;
      drone.vx += Math.cos(strafeAngle) * (speed * 0.6) * dt;
      drone.vy += Math.sin(strafeAngle) * (speed * 0.6) * dt;

      drone.vx *= 0.95;
      drone.vy *= 0.95;
      drone.x += drone.vx * dt;
      drone.y += drone.vy * dt;

      // Drone shooting
      drone.shootCooldown -= dt;
      if (drone.shootCooldown <= 0) {
        drone.shootCooldown = drone.shootInterval;
        this.fireDroneBullet(drone);
      }
    }

    // 5. Crystal & Token Drops update (magnetic pickup)
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.rotation += d.vRot * dt;
      d.life -= dt;

      // Magnetic pull when player is close
      const dist = Math.hypot(this.player.x - d.x, this.player.y - d.y);
      const magnetRange = 160;
      if (dist < magnetRange) {
        const pull = (1 - dist / magnetRange) * 550;
        const angle = Math.atan2(this.player.y - d.y, this.player.x - d.x);
        d.vx += Math.cos(angle) * pull * dt;
        d.vy += Math.sin(angle) * pull * dt;
      }

      d.vx *= 0.96;
      d.vy *= 0.96;
      d.x += d.vx * dt;
      d.y += d.vy * dt;

      // Collection
      if (dist < this.player.radius + d.radius + 6) {
        if (d.type === 'void_token') {
          this.voidTokens += d.value;
          this.score += d.value * 25;
          this.stats.crystalsCollected++;
          this.stats.voidTokensEarned = this.voidTokens;
          soundEffects.cryptoPickup();
          this.addFloatingText(d.x, d.y, `+${d.value} $VOID`, '#f59e0b', 16);
        } else if (d.type === 'shield_restore') {
          this.player.shield = Math.min(this.player.maxShield, this.player.shield + 35);
          soundEffects.powerup();
          this.addFloatingText(d.x, d.y, '+SHIELD', '#06b6d4', 15);
        } else if (d.type === 'hull_repair') {
          this.player.hull = Math.min(this.player.maxHull, this.player.hull + 25);
          soundEffects.powerup();
          this.addFloatingText(d.x, d.y, '+ARMOR REPAIR', '#10b981', 15);
        }
        this.drops.splice(i, 1);
        continue;
      }

      if (d.life <= 0) {
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

    // 7. Floating texts update
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy * dt;
      t.alpha -= 0.8 * dt;
      if (t.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 8. Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake *= Math.pow(this.shakeDecay, dt * 60);
      if (this.screenShake < 0.2) this.screenShake = 0;
    }

    // 9. Wave progression check
    if (this.asteroids.length === 0 && this.drones.length === 0) {
      this.waveTimer += dt;
      if (this.waveTimer > 1.8) {
        this.waveTimer = 0;
        this.spawnWave(this.wave + 1);
        soundEffects.waveStart();
      }
    }

    // Accuracy stats
    this.stats.score = this.score;
    this.stats.wave = this.wave;
    this.stats.accuracy = this.stats.shotsFired > 0 ? Math.round((this.stats.shotsHit / this.stats.shotsFired) * 100) : 0;

    // Highscore tracking
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    // Notify HUD
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
    const speed = 780;
    const offset = 12;

    // Dual wing lasers
    const normal = this.player.angle + Math.PI / 2;
    const leftX = this.player.x + Math.cos(this.player.angle) * 14 + Math.cos(normal) * offset;
    const leftY = this.player.y + Math.sin(this.player.angle) * 14 + Math.sin(normal) * offset;
    const rightX = this.player.x + Math.cos(this.player.angle) * 14 - Math.cos(normal) * offset;
    const rightY = this.player.y + Math.sin(this.player.angle) * 14 - Math.sin(normal) * offset;

    const vx = Math.cos(this.player.angle) * speed + this.player.vx * 0.25;
    const vy = Math.sin(this.player.angle) * speed + this.player.vy * 0.25;

    this.bullets.push(
      { x: leftX, y: leftY, vx, vy, radius: 3.5, color: '#38bdf8', isEnemy: false, damage: 1, life: 1.2 },
      { x: rightX, y: rightY, vx, vy, radius: 3.5, color: '#38bdf8', isEnemy: false, damage: 1, life: 1.2 }
    );

    soundEffects.shoot();
  }

  private fireDroneBullet(drone: EnemyDrone) {
    const speed = drone.type === 'interceptor' ? 440 : 360;
    const vx = Math.cos(drone.angle) * speed;
    const vy = Math.sin(drone.angle) * speed;

    this.bullets.push({
      x: drone.x + Math.cos(drone.angle) * (drone.radius + 4),
      y: drone.y + Math.sin(drone.angle) * (drone.radius + 4),
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

  private destroyAsteroid(index: number) {
    const ast = this.asteroids[index];
    this.stats.asteroidsDestroyed++;
    this.asteroids.splice(index, 1);

    this.combo++;
    this.comboTimer = 2.5;

    const points = ast.tier * 60 * Math.min(4, this.combo);
    this.score += points;
    this.addFloatingText(ast.x, ast.y, `+${points}`, '#38bdf8', 14);

    soundEffects.explosion();
    this.screenShake = Math.min(15, this.screenShake + ast.tier * 2.5);
    this.spawnExplosion(ast.x, ast.y, ast.tier * 8, ast.color);

    // Spawn smaller debris chunks
    if (ast.tier > 1) {
      const nextTier = (ast.tier - 1) as 1 | 2;
      this.spawnAsteroid(nextTier, ast.x, ast.y);
      this.spawnAsteroid(nextTier, ast.x, ast.y);
    }

    // Drop $VOID crypto gems
    if (Math.random() < 0.65 || ast.tier === 3) {
      const tokenValue = ast.tier === 3 ? 5 : ast.tier === 2 ? 2 : 1;
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
        vx: (Math.random() - 0.5) * 50,
        vy: (Math.random() - 0.5) * 50,
        value: 1,
        radius: 9,
        rotation: 0,
        vRot: 2,
        life: 12,
        type: Math.random() > 0.5 ? 'shield_restore' : 'hull_repair',
      });
    }
  }

  private destroyDrone(index: number) {
    const drone = this.drones[index];
    this.stats.dronesDestroyed++;
    this.drones.splice(index, 1);

    this.combo++;
    this.comboTimer = 2.5;

    const points = (drone.type === 'interceptor' ? 240 : 120) * Math.min(4, this.combo);
    this.score += points;
    this.addFloatingText(drone.x, drone.y, `+${points}`, '#f43f5e', 16);

    soundEffects.explosion();
    this.screenShake = Math.min(18, this.screenShake + 6);
    this.spawnExplosion(drone.x, drone.y, 18, '#fb7185');

    // Drones always drop $VOID tokens
    this.drops.push({
      x: drone.x,
      y: drone.y,
      vx: (Math.random() - 0.5) * 70,
      vy: (Math.random() - 0.5) * 70,
      value: drone.type === 'interceptor' ? 10 : 4,
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

    // Calculate final tokens from score and crystal pickings
    const scoreTokens = Math.floor(this.score / 100);
    this.stats.voidTokensEarned = this.voidTokens + scoreTokens;

    if (this.onGameOverCallback) {
      this.onGameOverCallback(this.stats);
    }
  }

  private spawnImpactParticles(x: number, y: number, color: string, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2.5 + 1.5,
        color,
        alpha: 1,
        decay: 3.0,
      });
    }
  }

  private spawnExplosion(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 1.5,
        color: Math.random() > 0.4 ? color : '#f59e0b',
        alpha: 1,
        decay: 1.4 + Math.random() * 1.2,
      });
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
        // Glowing crypto diamond shape
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

        // Inner core
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
        // Hull repair cross
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
        ctx.fillRect(-2, -drop.radius, 4, drop.radius * 2);
        ctx.fillRect(-drop.radius, -2, drop.radius * 2, 4);
      }
      ctx.restore();
    }

    // 5. Asteroids
    for (const ast of this.asteroids) {
      ctx.save();
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.rotation);

      ctx.strokeStyle = ast.color;
      ctx.lineWidth = 2;
      ctx.fillStyle = '#111827';

      ctx.beginPath();
      for (let i = 0; i < ast.points.length; i++) {
        const pt = ast.points[i];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Asteroid craters/surface detail
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ast.radius * 0.3, -ast.radius * 0.2, ast.radius * 0.22, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // 6. Enemy Drones
    for (const drone of this.drones) {
      ctx.save();
      ctx.translate(drone.x, drone.y);
      ctx.rotate(drone.angle);

      // Drone hull
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#f43f5e';
      ctx.fillStyle = '#1e1b4b';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(drone.radius, 0);
      ctx.lineTo(-drone.radius * 0.8, -drone.radius * 0.8);
      ctx.lineTo(-drone.radius * 0.4, 0);
      ctx.lineTo(-drone.radius * 0.8, drone.radius * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Drone optic eye
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(drone.radius * 0.2, 0, 3, 0, Math.PI * 2);
      ctx.fill();

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

    // 8. Player Ship (if alive)
    if (this.player.hull > 0) {
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      ctx.rotate(this.player.angle);

      // Invincible flash
      if (this.player.invincibleTimer > 0 && Math.floor(time * 12) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

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

      // Ship body (Sleek Delta Wing)
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = '#0f172a';
      ctx.lineWidth = 2.2;

      ctx.beginPath();
      ctx.moveTo(this.player.radius + 4, 0); // nose
      ctx.lineTo(-this.player.radius, -this.player.radius * 0.85); // left wingtip
      ctx.lineTo(-this.player.radius * 0.5, 0); // rear engine indent
      ctx.lineTo(-this.player.radius, this.player.radius * 0.85); // right wingtip
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit canopy
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.ellipse(this.player.radius * 0.1, 0, 7, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wing cannon tips
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-this.player.radius * 0.2, -this.player.radius * 0.8, 4, 2);
      ctx.fillRect(-this.player.radius * 0.2, this.player.radius * 0.8 - 2, 4, 2);

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
