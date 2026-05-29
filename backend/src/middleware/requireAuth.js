const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
	const token = req.cookies?.auth_token;

	if (!token) {
		return res.status(401).json({ error: 'No auth cookie provided' });
	}

	try {
		req.user = jwt.verify(token, process.env.JWT_SECRET);
		return next();
	} catch (error) {
		return res.status(403).json({ error: 'Invalid or expired session' });
	}
};

module.exports = requireAuth;
