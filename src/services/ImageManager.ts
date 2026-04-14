import { compressImage } from './imageUtils';

export class ImageManager {
  private static MAX_DIMENSION = 512;
  private static DEFAULT_QUALITY = 0.7;
  private static MAX_FIRESTORE_BYTES = 750000; // Leave buffer for other fields

  /**
   * Universal optimization for any image intended for Firestore
   * 
   */
  static async optimizeForStorage(dataUrl: string): Promise<string> {
    if (!dataUrl || !dataUrl.startsWith('data:image')) return dataUrl;

    try {
      // First pass compression
      let optimized = await compressImage(dataUrl, this.MAX_DIMENSION, this.DEFAULT_QUALITY);
      
      // If still too large, aggressive compression
      if (optimized.length > this.MAX_FIRESTORE_BYTES) {
        console.warn("[ImageManager] Image still too large, applying aggressive compression.");
        optimized = await compressImage(optimized, 400, 0.5);
      }
      
      // Safety check
      if (optimized.length > 1000000) {
        throw new Error("Image exceeds 1MB limit even after aggressive compression.");
      }

      return optimized;
    } catch (e) {
      console.error("[ImageManager] Optimization failed:", e);
      return dataUrl; // Fallback to original
    }
  }

  /**
   * Helper for warrior objects
   */
  static async processWarrior(warrior: any): Promise<any> {
    if (warrior.imageUrl && warrior.imageUrl.startsWith('data:image')) {
      const optimized = await this.optimizeForStorage(warrior.imageUrl);
      return { ...warrior, imageUrl: optimized };
    }
    return warrior;
  }
}
