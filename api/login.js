// Login API endpoint for Vercel
// Expects POST request with { username, password }
// Returns JWT token on success

const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Get credentials from environment variables
    const validUsername = process.env.LOGIN_USERNAME;
    const validPassword = process.env.LOGIN_PASSWORD;

    // Check if credentials are configured
    if (!validUsername || !validPassword) {
      console.error('Login credentials not configured in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Validate credentials
    if (username !== validUsername || password !== validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username, iat: Math.floor(Date.now() / 1000) },
      process.env.JWT_SECRET || 'default-secret-change-in-production',
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie for security
    res.setHeader(
      'Set-Cookie',
      `auth_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Login successful',
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

