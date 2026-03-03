// import sharp from "sharp";
// import fs from "fs";
// import { exec } from "child_process";
// import path from "path";
// import { promisify } from "util";

// const execAsync = promisify(exec);

// export const convertHEIC = async (inputPath, targetFormat) => {
//   const outputPath = inputPath + "." + targetFormat;
//   const command = `magick ${inputPath} ${outputPath}`;

//   await execAsync(command); // throws if fails
//   return outputPath;
// };

import heicConvert from 'heic-convert';
import fs from 'fs/promises';

export const convertHEIC = async (inputPath, targetFormat) => {
  try {
    const buf = await fs.readFile(inputPath);
    const format = targetFormat.toLowerCase();
    if (!['jpeg', 'jpg', 'png'].includes(format)) {
      throw new Error('Unsupported HEIC target format');
    }
    const heicFormat = (format === 'png') ? 'PNG' : 'JPEG';
    const outputBuffer = await heicConvert({
      buffer: buf,
      format: heicFormat,
      quality: 1
    });
    const outputPath = inputPath + '.' + format;
    await fs.writeFile(outputPath, outputBuffer);
    
    return outputPath;
  } catch (err) {
    console.error('Error during HEIC conversion:', err);
    throw err;
  }
};
