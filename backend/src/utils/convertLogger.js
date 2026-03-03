// utils/convertLogger.js
import fs from "fs/promises";

export async function convertWithLogging(conversionName, convertFn, inputPath, outputFormat) {
  console.log(`[${conversionName}] Starting conversion. Input: ${inputPath}, Target format: ${outputFormat}`);

  const start = Date.now();
  try {
    const outputPath = await convertFn(inputPath, outputFormat);
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`[${conversionName}] Conversion succeeded. Output: ${outputPath}. Time taken: ${elapsed}s`);
    return outputPath;
  } catch (error) {
    console.error(`[${conversionName}] Conversion failed with error:`, error);
    // Cleanup partial output if it exists
    try {
      const possibleOutputPath = inputPath + "." + outputFormat;
      await fs.unlink(possibleOutputPath);
      console.log(`[${conversionName}] Partial output file deleted: ${possibleOutputPath}`);
    } catch (e) {
      // Ignore if file doesn't exist
    }
    throw error; // Rethrow so caller knows conversion failed
  }
}
