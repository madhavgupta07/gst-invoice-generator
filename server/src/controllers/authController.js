const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
        expiresIn: '30d',
    });
};

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Please provide both username and password' });
        }

        // Check if user exists
        const userExists = await User.findOne({ username: username.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        const user = await User.create({
            username,
            password
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ error: 'Invalid user data' });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Login a user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Please provide both username and password' });
        }

        const user = await User.findOne({ username: username.toLowerCase() });

        if (user && (await user.comparePassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login
};
