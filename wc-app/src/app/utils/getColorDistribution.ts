export const getColorPercentages = (
  imageUrl: string,
  maxSize = 100
): Promise<{ [key: string]: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "CORS";
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      if (ctx) {
        // scale down the image to a manageable size (keeping aspect ratio)
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        // read pixels from the smaller image
        const { data } = ctx.getImageData(0, 0, w, h);
        const colorCounts: { [key: string]: number } = {};
        const totalPixels = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const key =
            "#" +
            [r, g, b]
              .map((x) => x.toString(16).padStart(2, "0"))
              .join("")
              .toUpperCase();
          colorCounts[key] = (colorCounts[key] || 0) + 1;
        }

        const colors: {
          color: string;
          percentage: number;
        }[] = Object.entries(colorCounts)
          .map(([rgb, count]) => ({
            color: rgb,
            percentage: (count / totalPixels) * 100,
          }))
          .filter((c) => c.percentage > 5)
          .slice(0, 4)
          .sort((a, b) => b.percentage - a.percentage);

        const hexColors = {
          innerLeftWing: colors[0].color,
          innerRightWing:
            colors[0].percentage > 67 && colors.length < 4
              ? colors[0].color
              : colors[1].color,
          topInterior:
            colors[0].percentage > 67 && colors.length < 4
              ? colors[1].color
              : colors.length > 2
              ? colors[2].color
              : "",
          topExterior:
            colors[0].percentage <= 67 && colors.length === 2
              ? ""
              : colors[colors.length - 1].color,
          outerUpper:
            colors[0].percentage > 67 && colors.length < 4
              ? colors[0].color
              : colors[1].color,
          outerBody: colors[0].color,
        };

        resolve(hexColors);
      }
    };

    img.onerror = reject;
    img.src = imageUrl;
  });
};
