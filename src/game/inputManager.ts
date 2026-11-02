/**
 * InputManager Module
 * Isolated, persistent input engine tracking keyboard (WASD/Arrows/Space)
 * and mouse/pointer tracking with zero UI re-render resetting.
 */

export class InputManager {
  public keys: Record<string, boolean> = {};
  public mouse = { x: 600, y: 400, isDown: false };
  private canvas: HTMLCanvasElement | null = null;
  private attached = false;

  private preventKeys = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD',
    'Space',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' '
  ]);

  constructor() {
    this.attach();
  }

  public setCanvas(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        this.mouse.x = rect.width / 2;
        this.mouse.y = rect.height / 2;
      }
    }
  }

  public attach() {
    if (typeof window === 'undefined' || this.attached) return;
    this.attached = true;

    window.addEventListener('keydown', this.handleKeyDown, { passive: false });
    window.addEventListener('keyup', this.handleKeyUp, { passive: false });
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('blur', this.handleBlur);
  }

  public detach() {
    if (typeof window === 'undefined' || !this.attached) return;
    this.attached = false;

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('blur', this.handleBlur);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.preventKeys.has(e.code) || this.preventKeys.has(e.key)) {
      e.preventDefault();
    }
    this.keys[e.code] = true;
    this.keys[e.key.toLowerCase()] = true;
    this.keys[e.key] = true;
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
    this.keys[e.key.toLowerCase()] = false;
    this.keys[e.key] = false;
  };

  private updateCoordinates(clientX: number, clientY: number) {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;

    // Direct pixel coordinate inside the canvas element
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;

    this.mouse.x = Math.max(0, Math.min(rect.width, rawX));
    this.mouse.y = Math.max(0, Math.min(rect.height, rawY));
  }

  private handleMouseMove = (e: MouseEvent) => {
    this.updateCoordinates(e.clientX, e.clientY);
  };

  private handlePointerMove = (e: PointerEvent) => {
    this.updateCoordinates(e.clientX, e.clientY);
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouse.isDown = true;
      this.updateCoordinates(e.clientX, e.clientY);
    }
  };

  private handlePointerDown = (e: PointerEvent) => {
    if (e.button === 0) {
      this.mouse.isDown = true;
      this.updateCoordinates(e.clientX, e.clientY);
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouse.isDown = false;
    }
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (e.button === 0) {
      this.mouse.isDown = false;
    }
  };

  private handleBlur = () => {
    // Reset keys when tab loses focus to prevent keys staying stuck down
    this.keys = {};
    this.mouse.isDown = false;
  };

  public isMovingUp(): boolean {
    return Boolean(this.keys['KeyW'] || this.keys['w'] || this.keys['ArrowUp']);
  }

  public isMovingDown(): boolean {
    return Boolean(this.keys['KeyS'] || this.keys['s'] || this.keys['ArrowDown']);
  }

  public isMovingLeft(): boolean {
    return Boolean(this.keys['KeyA'] || this.keys['a'] || this.keys['ArrowLeft']);
  }

  public isMovingRight(): boolean {
    return Boolean(this.keys['KeyD'] || this.keys['d'] || this.keys['ArrowRight']);
  }

  public isShooting(): boolean {
    return Boolean(this.mouse.isDown || this.keys['Space'] || this.keys[' ']);
  }

  public reset() {
    this.keys = {};
    this.mouse.isDown = false;
  }
}

// Global persistent instance that never resets across component re-renders
export const globalInputManager = new InputManager();
