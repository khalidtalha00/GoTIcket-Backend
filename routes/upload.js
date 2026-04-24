const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Upload Endpoint
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json("No file uploaded");
    }
    // Return the file path (relative to the server root, accessible via static middleware)
    // Assuming the server serves 'uploads' folder at '/uploads'
    const filePath = `/uploads/${req.file.filename}`;
    res.status(200).json(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

module.exports = router;
