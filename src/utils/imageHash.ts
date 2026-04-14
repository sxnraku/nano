export async function calculateImageHash(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Create a small 8x8 canvas for Average Hash (aHash)
      canvas.width = 8;
      canvas.height = 8;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve("");
        return;
      }
      
      // Draw image shrunk down
      ctx.drawImage(img, 0, 0, 8, 8);
      const data = ctx.getImageData(0, 0, 8, 8).data;
      
      let total = 0;
      const pixels: number[] = [];
      
      // Convert to grayscale and sum
      for (let i = 0; i < data.length; i += 4) {
        // Average of RGB for grayscale
        const avg = (data[i] + data[i+1] + data[i+2]) / 3;
        pixels.push(avg);
        total += avg;
      }
      
      const overallAvg = total / pixels.length;
      let hash = '';
      
      // Compute binary string based on average
      pixels.forEach(p => {
        hash += p >= overallAvg ? '1' : '0';
      });
      
      resolve(hash);
    };
    // Handle error gracefully so it doesn't crash the scanning loop
    img.onerror = () => resolve("");
    img.src = base64;
  });
}

export function calculateHammingDistance(hash1: string, hash2: string): number {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 999;
  
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  return distance;
}
