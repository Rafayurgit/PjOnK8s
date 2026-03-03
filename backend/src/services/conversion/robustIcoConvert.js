// robustIcoConvert.js
import fs from "fs/promises";
import { parseICO } from "icojs";
import sharp from "sharp";
import path from "path";
import { convertWithImageMagick } from "./imagick.service.js";
import { rasterToSvg } from "../../utils/rasterToSvg.js";

export async function robustIcoConvert(inputPath, outputFormat) {
  const buf = await fs.readFile(inputPath);
  const images = await parseICO(buf, "image/png");

  if (!images || !images.length) {
    throw new Error("ICO parsing failed – no images found.");
  }

  // Choose largest
  const best = images.sort((a, b) => b.width * b.height - a.width * a.height)[0];
  const tempPNG = inputPath + ".tmp.png";
  await fs.writeFile(tempPNG, Buffer.from(best.buffer));

  let outputPath = inputPath + "." + outputFormat;

  try {
    if (outputFormat === "bmp") {
      // fallback to ImageMagick
      outputPath = await convertWithImageMagick(tempPNG, "bmp");
    } else if (outputFormat === "svg") {
      outputPath = await rasterToSvg(tempPNG);
    } else if (outputFormat === "heic") {
      // use sharp heif with options
      await sharp(tempPNG)
  .toFormat("heif", { compression: "av1" })
  .toFile(outputPath);
    } else {
      // sharp supported formats
      await sharp(tempPNG).toFormat(outputFormat).toFile(outputPath);
    }
    return outputPath;
  } finally {
    try { await fs.unlink(tempPNG); } catch {}
  }
}
