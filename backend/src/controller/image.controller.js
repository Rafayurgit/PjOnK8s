// controllers/image.controller.js
import { imageService } from "../services/image.service.js";
import path from "path";
import fs from "fs";

// export const convertImageController = async (req, res) => {
//   try {
//     const files = req.files;
//     const { Format } = req.body;

//     if (!files.length || !Format) {
//       return res.status(400).json({ message: "File and format are required" });
//     }

//     const results= await Promise.all(
//       files.map(async(file)=>{
//         try {
//           const { filePath, outputPath, uniqueKey } = await imageService.convert(file, Format);
//         const newFileName = `converted_${file.originalname.replace(/\.[^.]+$/, "." + Format.toLowerCase())}`;

//         return {
//           url: `/uploads/${path.basename(outputPath)}`,
//           format: Format,
//           originalName: file.originalname,
//           size: fs.statSync(outputPath).size,
//           filePath,
//           outputPath,
//           uniqueKey,
//         }
//         } catch (error) {
//           return {
//         url: null,
//         format: Format,
//         originalName: file.originalname,
//         size: null,
//         error: err.message,
//       }
//         }

//     })
//   )

//   return res.json({
//       success: true,
//       files: results.map(({ url, format, originalName, size, error }) => ({
//         url,
//         format,
//         originalName,
//         size,
//         error: error || null
//       })),
//     });

//     // const { stream, mimeType, uniqueKey, filePath, outputPath } =
//     //   await imageService.convert(file, Format);

//     // res.setHeader(
//     //   "Content-Disposition",
//     //   `attachment; filename=converted.${Format.toLowerCase()}`
//     // );
//     // res.setHeader("Content-Type", mimeType);

//     // Handle cleanup after response
//     // res.on("finish", () => {
//     //   imageService.cleanup(filePath, outputPath, uniqueKey, "finished");
//     // });

//     // res.on("close", () => {
//     //   imageService.cleanup(filePath, outputPath, uniqueKey, "aborted");
//     // });

//     // stream.pipe(res);

//     setTimeout(() => {
//       results.forEach(({ filePath, outputPath, uniqueKey }) => {
//         imageService.cleanup(filePath, outputPath, uniqueKey, "scheduled");
//       });
//     }, 1000 * 60 * 10);

    

//   } catch (error) {
//     console.error("Controller error:", error);
//     return res
//       .status(500)
//       .json({ message: "Failed to convert image", error: error.message });
//   }

//   console.log("File saved to:", outputPath);
// };
export const convertImageController = async (req, res) => {
  try {
    const files = req.files;
    const { Format } = req.body;

    if (!files || !files.length || !Format) {
      return res.status(400).json({ message: "Files and format are required" });
    }

    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const { filePath, outputPath, uniqueKey } = await imageService.convert(file, Format);
          return {
            url: `/uploads/${path.basename(outputPath)}`,
            format: Format,
            originalName: file.originalname,
            size: fs.statSync(outputPath).size,
            filePath,
            outputPath,
            uniqueKey,
            error: null,
          };
        } catch (error) {
          return {
            url: null,
            format: Format,
            originalName: file.originalname,
            size: null,
            filePath: null,
            outputPath: null,
            uniqueKey: null,
            error: error.message,
          };
        }
      })
    );
    

    // setTimeout(() => {
    //   results.forEach(({ filePath, outputPath, uniqueKey }) => {
    //     if (filePath && outputPath && uniqueKey) {
    //       imageService.cleanup(filePath, outputPath, uniqueKey, "scheduled");
    //     }
    //   });
      
    // }, 1000 * 60 * 10);

    results.forEach(({ outputPath }) => {
  console.log("File for download available at:", outputPath);
});

    return res.json({
      success: true,
      files: results.map(({ url, format, originalName, size, error }) => ({
        url,
        format,
        originalName,
        name: originalName.replace(/\.[^.]+$/,`.${format}`),
        size,
        error,
      })),
    });
  } catch (error) {
    console.error("Controller error:", error);
    return res.status(500).json({ message: "Failed to convert image", error: error.message });
  }

  
};
