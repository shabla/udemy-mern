const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const keys = require('../../config/keys');
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');
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

    const { errors, isValid } = validateRegisterInput(req.body);

    // Validate request body
    if(!isValid) {
        return res.status(400).json(errors);
    }

    User.findOne({ email: req.body.email })
        .then(user => {
            if(user) {
                errors.email = 'Email already exists';
                return res.status(404).json(errors);
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

    const { errors, isValid } = validateLoginInput(req.body);

    // Validate request body
    if(!isValid) {
        return res.status(400).json(errors);
    }

    const email = req.body.email;
    const password = req.body.password;

    // Find user by email
    User.findOne({ email }).then(user => {
        if(!user) {
            errors.email = 'User not found';
            return res.status(404).json(errors);
        }

        // Check password
        bcrypt.compare(password, user.password)
            .then(isMatch => {
                if(!isMatch) {
                    errors.password = 'Password incorrect';
                    return res.status(400).json(errors);
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

// @route   POST /api/users/current
// @desc    Return the current user
// @access  Private
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
    });
});

module.exports = router;