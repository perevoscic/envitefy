/**
 * Extract dominant colors from an image and generate gradient CSS values
 */

export type ImageColors = {
  headerLight: string;
  headerDark: string;
  cardLight: string;
  cardDark: string;
  borderLight: string;
  borderDark: string;
  chipLight: string;
  chipDark: string;
  textLight: string;
  textDark: string;
};

/**
 * Extract dominant colors from an image data URL
 * Returns CSS gradient values based on the image's dominant colors
 */
export async function extractColorsFromImage(
  imageDataUrl: string
): Promise<ImageColors | null> {
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.crossOrigin = "anonymous";
      img.src = imageDataUrl;
    });

    // Create a canvas and draw the image
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Scale down for faster processing (max 200x200)
    const maxSize = 200;
    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Sample pixels from the image
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Sample pixels strategically (corners, center, edges)
    const samplePoints: { x: number; y: number }[] = [];
    const width = canvas.width;
    const height = canvas.height;

    // Corners
    samplePoints.push({ x: 0, y: 0 });
    samplePoints.push({ x: width - 1, y: 0 });
    samplePoints.push({ x: 0, y: height - 1 });
    samplePoints.push({ x: width - 1, y: height - 1 });
    // Center
    samplePoints.push({ x: Math.floor(width / 2), y: Math.floor(height / 2) });
    // Edges
    samplePoints.push({ x: Math.floor(width / 2), y: 0 });
    samplePoints.push({ x: Math.floor(width / 2), y: height - 1 });
    samplePoints.push({ x: 0, y: Math.floor(height / 2) });
    samplePoints.push({ x: width - 1, y: Math.floor(height / 2) });

    // Also sample a grid of points
    const gridSize = 5;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        samplePoints.push({
          x: Math.floor((width / (gridSize + 1)) * (i + 1)),
          y: Math.floor((height / (gridSize + 1)) * (j + 1)),
        });
      }
    }

    // Extract colors from sample points
    const colors: { r: number; g: number; b: number; brightness: number }[] = [];
    for (const point of samplePoints) {
      const idx = (point.y * width + point.x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      colors.push({ r, g, b, brightness });
    }

    if (colors.length === 0) return null;

    // Find dominant colors (sort by frequency and brightness)
    const colorBuckets = new Map<string, number>();
    colors.forEach((color) => {
      // Quantize colors to reduce noise
      const quantized = `rgb(${Math.round(color.r / 32) * 32},${Math.round(color.g / 32) * 32},${Math.round(color.b / 32) * 32})`;
      colorBuckets.set(quantized, (colorBuckets.get(quantized) || 0) + 1);
    });

    // Get top colors
    const sortedColors = Array.from(colorBuckets.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => {
        const match = color.match(/rgb\((\d+),(\d+),(\d+)\)/);
        if (!match) return null;
        return {
          r: parseInt(match[1], 10),
          g: parseInt(match[2], 10),
          b: parseInt(match[3], 10),
          brightness: (parseInt(match[1], 10) * 299 + parseInt(match[2], 10) * 587 + parseInt(match[3], 10) * 114) / 1000,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    if (sortedColors.length === 0) return null;

    // Separate into light and dark colors
    const lightColors = sortedColors.filter((c) => c.brightness > 128).slice(0, 2);
    const darkColors = sortedColors.filter((c) => c.brightness <= 128).slice(0, 2);

    // Use the most common colors, or fallback to brightest/darkest
    const primaryLight = lightColors[0] || sortedColors[sortedColors.length - 1];
    const secondaryLight = lightColors[1] || primaryLight;
    const primaryDark = darkColors[0] || sortedColors[0];
    const secondaryDark = darkColors[1] || primaryDark;

    // Helper to convert RGB to hex
    const rgbToHex = (r: number, g: number, b: number) => {
      return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
    };

    // Helper to lighten/darken color
    const lighten = (r: number, g: number, b: number, factor: number) => {
      return {
        r: Math.min(255, Math.round(r + (255 - r) * factor)),
        g: Math.min(255, Math.round(g + (255 - g) * factor)),
        b: Math.min(255, Math.round(b + (255 - b) * factor)),
      };
    };

    const darken = (r: number, g: number, b: number, factor: number) => {
      return {
        r: Math.max(0, Math.round(r * (1 - factor))),
        g: Math.max(0, Math.round(g * (1 - factor))),
        b: Math.max(0, Math.round(b * (1 - factor))),
      };
    };

    // Generate gradients
    const lightGradient1 = lighten(primaryLight.r, primaryLight.g, primaryLight.b, 0.3);
    const lightGradient2 = lighten(secondaryLight.r, secondaryLight.g, secondaryLight.b, 0.2);
    const darkGradient1 = darken(primaryDark.r, primaryDark.g, primaryDark.b, 0.2);
    const darkGradient2 = darken(secondaryDark.r, secondaryDark.g, secondaryDark.b, 0.3);

    // Calculate text colors for contrast
    const getContrastColor = (r: number, g: number, b: number, isLight: boolean) => {
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return isLight
        ? brightness > 180
          ? "#1E293B"
          : brightness > 120
          ? "#0F172A"
          : "#000000"
        : brightness < 75
        ? "#F8FAFC"
        : brightness < 120
        ? "#E2E8F0"
        : "#FFFFFF";
    };

    return {
      headerLight: `linear-gradient(135deg, ${rgbToHex(lightGradient1.r, lightGradient1.g, lightGradient1.b)} 0%, ${rgbToHex(lightGradient2.r, lightGradient2.g, lightGradient2.b)} 100%)`,
      headerDark: `linear-gradient(135deg, ${rgbToHex(darkGradient1.r, darkGradient1.g, darkGradient1.b)} 0%, ${rgbToHex(darkGradient2.r, darkGradient2.g, darkGradient2.b)} 100%)`,
      cardLight: `rgba(${primaryLight.r}, ${primaryLight.g}, ${primaryLight.b}, 0.85)`,
      cardDark: `rgba(${primaryDark.r}, ${primaryDark.g}, ${primaryDark.b}, 0.65)`,
      borderLight: `rgba(${primaryLight.r}, ${primaryLight.g}, ${primaryLight.b}, 0.7)`,
      borderDark: `rgba(${primaryDark.r}, ${primaryDark.g}, ${primaryDark.b}, 0.45)`,
      chipLight: "rgba(255, 255, 255, 0.85)",
      chipDark: "rgba(18, 18, 18, 0.85)",
      textLight: getContrastColor(primaryLight.r, primaryLight.g, primaryLight.b, true),
      textDark: getContrastColor(primaryDark.r, primaryDark.g, primaryDark.b, false),
    };
  } catch (error) {
    console.error("Failed to extract colors from image:", error);
    return null;
  }
}









