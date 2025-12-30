// Verify API endpoint for Vercel
// Checks if the user is authenticated via JWT token
// Returns user info if authenticated, 401 if not

const jwt = require('jsonwebtoken');

// Helper function to verify JWT token
function verifyToken(req) {
	// Try to get token from cookie first
	const cookies = req.headers.cookie || '';
	const cookieToken = cookies
		.split(';')
		.find((c) => c.trim().startsWith('auth_token='))
		?.split('=')[1];

	// Try to get token from Authorization header
	const authHeader = req.headers.authorization;
	const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

	const token = cookieToken || bearerToken;

	if (!token) {
		return null;
	}

	try {
		return jwt.verify(token, process.env.JWT_SECRET || 'default-secret-change-in-production');
	} catch (error) {
		return null;
	}
}

module.exports = async (req, res) => {
	// Allow GET and POST requests
	if (req.method !== 'GET' && req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		const decoded = verifyToken(req);

		if (!decoded || !decoded.username) {
			return res.status(401).json({ authenticated: false, error: 'Not authenticated' });
		}

		return res.status(200).json({
			authenticated: true,
			username: decoded.username
		});
	} catch (error) {
		console.error('Verify error:', error);
		return res.status(401).json({ authenticated: false, error: 'Not authenticated' });
	}
};

