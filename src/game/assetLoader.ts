/**
 * AssetLoader Module
 * Asynchronously preloads all sprite images before the game loop starts.
 * Maintains an in-memory cache of HTMLImageElement objects and provides
 * safe fallback handling if any sprite fails to load.
 */

// Build default asset URLs pointing to public/assets/vibers/viber_1.png ... viber_15.png
const getBaseUrl = (): string => {
  const base = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/';
  return base.endsWith('/') ? base : `${base}/`;
};

export const TOTAL_VIBER_ASSETS = 15;

export const DEFAULT_VIBER_URLS: string[] = Array.from(
  { length: TOTAL_VIBER_ASSETS },
  (_, i) => `${getBaseUrl()}assets/vibers/viber_${i + 1}.png`
);

export interface AssetLoaderConfig {
  urls?: string[];
}

export class AssetLoader {
  private images: HTMLImageElement[] = [];
  private urls: string[];
  private loadingPromise: Promise<HTMLImageElement[]> | null = null;
  private isLoaded = false;

  constructor(config?: AssetLoaderConfig) {
    this.urls = config?.urls && config.urls.length > 0 ? config.urls : DEFAULT_VIBER_URLS;
  }

  /**
   * Asynchronously preloads all sprite images.
   * Safe against multiple calls: returns the existing in-flight Promise or cached images.
   */
  public async preload(): Promise<HTMLImageElement[]> {
    if (this.isLoaded) {
      return this.images;
    }
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      const promises = this.urls.map((url) => {
        return new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';

          img.onload = () => {
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              resolve(img);
            } else {
              console.warn(`[AssetLoader] Sprite loaded with zero dimensions: ${url}`);
              resolve(null);
            }
          };

          img.onerror = (err) => {
            console.warn(`[AssetLoader] Failed to load sprite at ${url}:`, err);
            resolve(null);
          };

          img.src = url;
        });
      });

      const results = await Promise.all(promises);
      // Filter out any failed image loads
      this.images = results.filter((img): img is HTMLImageElement => img !== null);
      this.isLoaded = true;
      return this.images;
    })();

    return this.loadingPromise;
  }

  /**
   * Returns the array of successfully preloaded HTMLImageElement instances.
   */
  public getLoadedImages(): HTMLImageElement[] {
    return this.images;
  }

  /**
   * Safely retrieves a loaded sprite by index.
   * Returns null if no images are loaded or if the selected image is not ready,
   * triggering a graceful fallback to procedural geometry.
   */
  public getImage(index?: number): HTMLImageElement | null {
    if (index === undefined || this.images.length === 0) {
      return null;
    }
    const safeIndex = ((index % this.images.length) + this.images.length) % this.images.length;
    const img = this.images[safeIndex];
    if (img && img.complete && img.naturalWidth > 0) {
      return img;
    }
    return null;
  }

  /**
   * Returns a random valid index from the preloaded image pool, or 0 if none loaded yet.
   */
  public getRandomIndex(): number {
    if (this.images.length === 0) return 0;
    return Math.floor(Math.random() * this.images.length);
  }

  /**
   * Check if assets have completed loading.
   */
  public isReady(): boolean {
    return this.isLoaded && this.images.length > 0;
  }

  /**
   * Number of loaded images.
   */
  public get count(): number {
    return this.images.length;
  }
}

// Global default instance for reuse across components
export const defaultAssetLoader = new AssetLoader();
