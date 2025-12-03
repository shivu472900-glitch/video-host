const express = require('express');
const aws = require('aws-sdk');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// AWS setup
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new aws.S3();

app.post('/presign', (req, res) => {
  const { filename, contentType } = req.body;

  const params = {
    Bucket: process.env.BUCKET,
    Key: filename,
    ContentType: contentType,
    Expires: 300
  };

  const uploadUrl = s3.getSignedUrl('putObject', params);
  const publicUrl = `https://${process.env.BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;

  res.json({ uploadUrl, publicUrl });
});

// send index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
