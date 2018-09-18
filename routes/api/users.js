const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');

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

module.exports = router;