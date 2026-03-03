// You can enhance detection with metadata or file signature checks
import sharp from "sharp";
import { convertWithImageMagick } from "./imagick.service.js";


const animatedFormats = new Set(["gif", "webp", "apng"]);

export function isAnimatedFormat(format) {
  return animatedFormats.has(format);
}

// export async function convertAnimatedFormat(inputPath, outputFormat) {
//   // Use gifsicle, ffmpeg, or imagemagick CLI to convert animated images
//   // Placeholder example:
//   throw new Error("Animated format conversion not implemented yet");
// }
// export async function convertAnimatedFormat(inputPath, outputFormat) {
//   const outputPath = inputPath + "." + outputFormat;
//   await sharp(inputPath, { animated: true })
//     .toFormat(outputFormat)
//     .toFile(outputPath);
//   return outputPath;
// }


export async function convertAnimatedFormat(inputPath, outputFormat) {
  const outputPath = inputPath + "." + outputFormat;
  
  try {
    // Try Sharp first for supported animated formats
    if (outputFormat === 'webp' || outputFormat === 'gif') {
      await sharp(inputPath, { animated: true })
        .toFormat(outputFormat)
        .toFile(outputPath);
      return outputPath;
    }
    
    // For other formats, try ImageMagick
    return await convertWithImageMagick(inputPath, outputFormat);
    
  } catch (error) {
    console.error(`Animated format conversion failed with Sharp: ${error.message}`);
    
    // Fallback to ImageMagick
    try {
      return await convertWithImageMagick(inputPath, outputFormat);
    } catch (imagickError) {
      console.error(`ImageMagick also failed: ${imagickError.message}`);
      
      // Last resort: extract first frame and convert
      console.log("Attempting to extract first frame for conversion...");
      const firstFramePath = inputPath + ".first_frame.png";
      
      try {
        await sharp(inputPath)
          .png()
          .toFile(firstFramePath);
        
        await sharp(firstFramePath)
          .toFormat(outputFormat)
          .toFile(outputPath);
        
        // Cleanup temp file
        const fs = await import('fs/promises');
        await fs.unlink(firstFramePath);
        
        console.log("Successfully converted using first frame extraction");
        return outputPath;
      } catch (frameError) {
        throw new Error(`All animated conversion methods failed: ${frameError.message}`);
      }
    }
  }
}

