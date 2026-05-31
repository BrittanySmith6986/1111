// api/authorize.js
const { authorizeEmail, revokeEmail } = require('../lib/auth');

module.exports = async (req, res) => {
    // 鉴权：使用 ADMIN_PASSWORD（若未配置则用 SEND_PASSWORD 兜底）
    const { admin_password, email, action = 'add' } = req.method === 'GET' ? req.query : req.body;
    const expectedPassword = process.env.ADMIN_PASSWORD || process.env.SEND_PASSWORD;

    if (!expectedPassword || admin_password !== expectedPassword) {
        return res.status(401).json({ error: 'Unauthorized: Invalid admin password.' });
    }
    if (!email) {
        return res.status(400).json({ error: 'Missing required parameter: email' });
    }

    try {
        if (action === 'add') {
            await authorizeEmail(email);
            return res.status(200).json({ message: `Email ${email} has been authorized.` });
        } else if (action === 'remove') {
            await revokeEmail(email);
            return res.status(200).json({ message: `Email ${email} has been revoked.` });
        } else {
            return res.status(400).json({ error: 'Invalid action. Use "add" or "remove".' });
        }
    } catch (error) {
        console.error('Authorization error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};