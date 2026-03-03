import fs from "fs/promises";
import path from "path";
import os from "os";
import sharp from "sharp";
import { exec as execCb } from "child_process";
import { promisify } from "util";
const execAsync = promisify(execCb);

// safe icon sizes expected by OS loaders
const ICON_SIZES = [16, 24, 32, 48, 64, 128, 256];

async function findImageMagickCmd() {
  // prefer ImageMagick 7 ('magick'), fallback to 'convert'
  try {
    await execAsync('magick -version');
    return 'magick';
  } catch (e) {
    try {
      await execAsync('convert -version');
      return 'convert';
    } catch (e2) {
      throw new Error('ImageMagick not found. Install ImageMagick (ensure `magick` or `convert` is on PATH).');
    }
  }
}

async function validateFileNonEmpty(filePath, contextMsg) {
  try {
    const st = await fs.stat(filePath);
    if (!st.isFile() || st.size === 0) {
      throw new Error(`${contextMsg}: file missing or zero-size -> ${filePath}`);
    }
  } catch (err) {
    throw new Error(`${contextMsg}: ${err.message}`);
  }
}

export async function convertToIco(inputPath) {
  const magickCmd = await findImageMagickCmd();

  // Use a stable temp directory per conversion to avoid collisions
  const tmpBase = path.join(os.tmpdir(), `desipix-ico-${Date.now()}-${Math.floor(Math.random()*10000)}`);
  await fs.mkdir(tmpBase, { recursive: true });

  const basename = path.basename(inputPath, path.extname(inputPath));
  const tempFiles = [];

  try {
    // 1) Normalize input -> single PNG (ImageMagick is robust for BMP quirks)
    const normalizedPng = path.join(tmpBase, `${basename}-norm.png`);
    // Use magick/convert to create a normalized PNG
    const normalizeCmd = `${magickCmd} "${inputPath}" "${normalizedPng}"`;
    console.log(`Running normalization: ${normalizeCmd}`);
    await execAsync(normalizeCmd);
    await validateFileNonEmpty(normalizedPng, "Normalization failed");
    tempFiles.push(normalizedPng);

    // 2) Generate PNGs for each icon size via Sharp (fast)
    const resized = [];
    for (const size of ICON_SIZES) {
      const resizedPath = path.join(tmpBase, `${basename}-${size}.png`);
      await sharp(normalizedPng)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ compressionLevel: 0 })
        .toFile(resizedPath);

      await validateFileNonEmpty(resizedPath, `Resize to ${size} failed`);
      resized.push(resizedPath);
      tempFiles.push(resizedPath);
    }

    // 3) Combine resized PNGs into .ico with ImageMagick (robust)
    const outputDir = path.dirname(inputPath);
    const outIcoPath = path.join(outputDir, `${basename}.ico`);
    const buildCmd = `${magickCmd} ${resized.map(p => `"${p}"`).join(" ")} "${outIcoPath}"`;
    console.log(`Building ICO: ${buildCmd}`);
    await execAsync(buildCmd);

    await validateFileNonEmpty(outIcoPath, "ICO creation failed");
    console.log("ICO conversion successful:", outIcoPath);
    return outIcoPath;

  } catch (err) {
    console.error("convertToIco error:", err && err.stack ? err.stack : err);
    // Final fallback: if you already have a convertWithImageMagick helper, call it here
    // (this code assumes you have convertWithImageMagick implemented)
    try {
      console.log("Falling back to convertWithImageMagick...");
      return await convertWithImageMagick(inputPath, "ico");
    } catch (fallbackErr) {
      throw new Error(`ICO conversion failed: ${err.message}. Fallback also failed: ${fallbackErr.message}`);
    }
  } finally {
    // cleanup tempFiles and temp dir
    await Promise.all(tempFiles.map(async f => {
      try { await fs.unlink(f); } catch (e) { /* ignore */ }
    }));
    try { await fs.rmdir(tmpBase); } catch (e) { /* ignore - may contain leftover files */ }
  }
}
