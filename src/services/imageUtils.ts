/**
 * Utility to compress base64 images to stay under Firestore 1MB limit.
 */
export async function compressImage(dataUrl: string, maxWidth: number = 512, quality: number = 0.7): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image')) return dataUrl;
  
  // If it's already small, don't bother
  if (dataUrl.length < 500000) return dataUrl; 

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("No context");
      
      // Draw white background for JPEGs
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (e) => reject("Image load error: " + e);
    img.src = dataUrl;
  });
}

/**
 * Ensures a warrior object is small enough for Firestore
 */
export async function ensureWarriorSmall(warrior: any): Promise<any> {
    if (!warrior.imageUrl) return warrior;
    
    try {
        const compressed = await compressImage(warrior.imageUrl);
        return { ...warrior, imageUrl: compressed };
    } catch (e) {
        console.warn("Auto-compression failed during check", e);
        return warrior;
    }
}
