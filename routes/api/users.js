const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const keys = require('../../config/keys');
const User = require('../../models/User');

// @route   GET /api/users/test
// @desc    Tests Users route
// @access  Public
router.get('/test', (req, res) => res.json({
    msg: "Users Works"
}));

// @route   POST /api/users/register
// @desc    Register user
// @access  Public
router.post('/register', (req, res) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if(user) {
                return res.status(404).json({ email: 'Email already exists' });
            }

            const avatar = gravatar.url(req.body.email, {
                s: '200', // Size
                r: 'pg', // Rating
                d: 'mm', // Default
            });

            const newUser = new User({
                email: req.body.email,
                password: req.body.password,
                name: req.body.name,
                avatar
            });

            bcrypt.genSalt(10, (err, salt) => {
                if(err) throw err;

                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if(err) throw err;

                    newUser.password = hash;
                    newUser.save()
                        .then(user => res.json(user))
                        .catch(err => console.log(err))
                });
            });
        });
});

// @route   POST /api/users/login
// @desc    Login User / Returning JWT Token
// @access  Public
router.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    // Find user by email
    User.findOne({ email }).then(user => {
        if(!user) {
            return res.status(404).json({ email: 'User not found' });
        }

        // Check password
        bcrypt.compare(password, user.password)
            .then(isMatch => {
                if(!isMatch) {
                    return res.status(400).json({ password: 'Password incorrect' });
                }

                const payload = {
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar,
                };
                
                // Sign token
                jwt.sign(payload, keys.secretOrKey, { expiresIn: 60 * 60 }, (err, token) => {
                    if(err) throw err;

                    res.json({
                        success: true,
                        token: 'Bearer ' + token
                    });
                });
            });
    });
});

module.exports = router;