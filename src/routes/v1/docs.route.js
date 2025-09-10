const express = require("express");
const { docsController } = require("../../controllers");
const multer = require("multer");
const path = require("path");
const fs = require('fs');

const router = express.Router();

const uploadsDir = path.join(__dirname, "../../../uploads");
const jdDir = path.join(uploadsDir, "jobDescriptions");
const resumesDir = path.join(uploadsDir, "resumes");

// Ensure directories exist
[uploadsDir, jdDir, resumesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on field name
    if (file.fieldname === "jobDescription") {
      cb(null, jdDir);
    } else if (file.fieldname === "resumes") {
      cb(null, resumesDir);
    } else {
      cb(null, uploadsDir); // fallback
    }
  },
  filename: function (req, file, cb) {
    // Use original filename in lowercase with timestamp prefix
    const timestamp = Date.now();
    const originalName = file.originalname.toLowerCase();
    const fileExtension = path.extname(originalName);
    const fileNameWithoutExt = path.basename(originalName, fileExtension);
    
    // Create filename with timestamp and original name in lowercase
    const safeFileName = `${fileNameWithoutExt.replace(/[^a-z0-9]/g, '_')}_${timestamp}${fileExtension}`;
    cb(null, safeFileName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.docx', '.doc'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  // Check file type
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, and DOC files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
    files: 4 
  }
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB per file.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 1 job description and 3 resumes.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "jobDescription" and "resumes".'
      });
    }
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

router.post(
  "/upload",
  upload.fields([
    { name: "jobDescription", maxCount: 1 },
    { name: "resumes", maxCount: 3 },
  ]),
  handleMulterError,
  docsController.uploadDocs
);

module.exports = router;
