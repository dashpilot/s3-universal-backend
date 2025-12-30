// Save API endpoint for Vercel
// Saves JSON data and base-64 images to S3-compatible storage
// Requires authentication via JWT token

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const jwt = require('jsonwebtoken');

// Initialize S3 client
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true', // Required for some S3-compatible services
});

// Helper function to verify JWT token
function verifyToken(req) {
  // Try to get token from cookie first
  const cookies = req.headers.cookie || '';
  const cookieToken = cookies
    .split(';')
    .find(c => c.trim().startsWith('auth_token='))
    ?.split('=')[1];

  // Try to get token from Authorization header
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  const token = cookieToken || bearerToken;

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret-change-in-production'
    );
  } catch (error) {
    return null;
  }
}

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const decoded = verifyToken(req);
    if (!decoded || !decoded.username) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const username = decoded.username;
    const { data, image, filename } = req.body;

    // Validate that at least one type of data is provided
    if (!data && !image) {
      return res.status(400).json({ 
        error: 'Either data (JSON) or image (base64) must be provided' 
      });
    }

    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      console.error('S3_BUCKET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const results = {};

    // Save JSON data
    if (data) {
      const jsonKey = `${username}/data.json`;
      const jsonBody = typeof data === 'string' ? data : JSON.stringify(data);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: jsonKey,
          Body: jsonBody,
          ContentType: 'application/json',
        })
      );

      results.json = { key: jsonKey, saved: true };
    }

    // Save base-64 image
    if (image) {
      if (!filename) {
        return res.status(400).json({ 
          error: 'filename is required when providing image data' 
        });
      }

      // Remove data URL prefix if present (e.g., "data:image/png;base64,")
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Determine content type from filename or default to image/png
      const extension = filename.split('.').pop().toLowerCase();
      const contentTypeMap = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
      };
      const contentType = contentTypeMap[extension] || 'image/png';

      const imageKey = `${username}/img/${filename}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: imageKey,
          Body: imageBuffer,
          ContentType: contentType,
        })
      );

      results.image = { key: imageKey, saved: true };
    }

    return res.status(200).json({
      success: true,
      message: 'Data saved successfully',
      results,
    });
  } catch (error) {
    console.error('Save error:', error);
    return res.status(500).json({ 
      error: 'Failed to save data',
      message: error.message 
    });
  }
};

