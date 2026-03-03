import express from "express";
import multer from "multer";
// import upload from "../middleware/multerConfig.js";
import {    convertImageController } from "../controller/image.controller.js"

const router= express.Router();

const upload = multer({dest: "uploads/"});
router.post("/", upload.array("Image"), convertImageController);

export default router;