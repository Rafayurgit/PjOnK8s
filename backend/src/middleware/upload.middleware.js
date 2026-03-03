import multer from "multer";
import path from "path";
import crypto from "crypto";
import { error } from "console";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve("uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const hash = crypto.randomBytes(16).toString("hex");
    cb(null, hash + ext);
  },
});

const fileFilter = (req, file, cb) => {
  console.log("Multer files:", req.files);
  console.log("Format body:", req.body.Format);
  console.log("File received by Multer:", file);

  const ext = path.extname(file.originalname).toLowerCase().slice(1); // "png", "jpg", etc.
  const mime = file.mimetype;
  if (!acceptedFormats.includes(ext) || !mime.startsWith("image/")) {
    return cb(new Error("Only supported image formats are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter,
});

export default upload;
