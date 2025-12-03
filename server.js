const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ts = Date.now();
    // normalize extension and avoid weird chars
    const ext = path.extname(file.originalname).slice(0, 10) || '.mp4';
    const safe = file.originalname.replace(/[^a-zA-Z0-9\-_.]/g, '_').slice(0, 30);
    cb(null, `${ts}_${safe}${ext}`);
  }
});

// Accept only common video mime types and limit size (e.g. 500MB)
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-matroska'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only video files allowed.'));
  }
});

const app = express();
app.use(cors());
app.use(express.json());

// serve uploads folder publicly
app.use('/uploads', express.static(UPLOAD_DIR, {
  extensions: ['mp4','webm','ogg','mov','mkv'],
  maxAge: '1d'
}));

// Health
app.get('/', (req, res) => res.send('Video host server is running.'));

// Upload endpoint
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // Build public URL
  const host = process.env.HOSTNAME || `${req.protocol}://${req.get('host')}`;
  const publicUrl = `${host}/uploads/${encodeURIComponent(path.basename(req.file.path))}`;
  res.json({ url: publicUrl, filename: path.basename(req.file.path), size: req.file.size });
});

// Optional: delete by filename (simple)
app.delete('/uploads/:name', (req, res) => {
  const name = path.basename(req.params.name); // sanitize
  const full = path.join(UPLOAD_DIR, name);
  fs.unlink(full, (err) => {
    if (err) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  });
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));