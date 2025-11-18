const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Root uploads folder (global)
const ROOT_UPLOAD_DIR = path.join(__dirname, "../../uploads");

if (!fs.existsSync(ROOT_UPLOAD_DIR)) {
    fs.mkdirSync(ROOT_UPLOAD_DIR, { recursive: true });
    console.log("📁 Created uploads folder at:", ROOT_UPLOAD_DIR);
}

// Multer storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, ROOT_UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        const unique =
            Date.now() + "_" + Math.round(Math.random() * 1e9) +
            path.extname(file.originalname);
        cb(null, unique);
    }
});

// PDF-only upload
const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files allowed"));
        }
    }
});

// ===============================
// UPLOAD NEW RESULT PDF
// ===============================
router.post("/result", upload.single("pdf"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No PDF uploaded"
        });
    }

    res.json({
        success: true,
        message: "PDF uploaded successfully",
        fileUrl: "/uploads/" + req.file.filename
    });
});

// ===============================
// REPLACE EXISTING PDF (ADMIN USE)
// ===============================
router.post("/replace", upload.single("pdf"), (req, res) => {
    const oldPath = req.body.oldPath; // "/uploads/old.pdf"

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No new PDF uploaded"
        });
    }

    const newFileUrl = "/uploads/" + req.file.filename;

    // Delete old file if exists
    if (oldPath) {
        const oldFile = path.join(ROOT_UPLOAD_DIR, path.basename(oldPath));

        if (fs.existsSync(oldFile)) {
            fs.unlinkSync(oldFile);
        }
    }

    res.json({
        success: true,
        message: "PDF replaced successfully",
        fileUrl: newFileUrl
    });
});

// ===============================
// DELETE UPLOADED PDF FILE
// ===============================
router.delete("/delete", (req, res) => {
    const { fileUrl } = req.body; // "/uploads/xxx.pdf"

    if (!fileUrl)
        return res.status(400).json({ success: false, message: "fileUrl required" });

    const filePath = path.join(ROOT_UPLOAD_DIR, path.basename(fileUrl));

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return res.json({ success: true, message: "PDF deleted" });
    }

    res.status(404).json({ success: false, message: "File not found" });
});

module.exports = router;
