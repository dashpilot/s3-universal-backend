// Logout API endpoint for Vercel
// Clears the authentication cookie

module.exports = async (req, res) => {
	// Allow GET and POST requests
	if (req.method !== 'GET' && req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		// Clear the auth cookie by setting it to expire in the past
		res.setHeader(
			'Set-Cookie',
			'auth_token=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict'
		);

		return res.status(200).json({
			success: true,
			message: 'Logged out successfully'
		});
	} catch (error) {
		console.error('Logout error:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
};

