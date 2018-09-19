const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Load Post Model
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');

// Load validation
const validatePostInput = require('../../validation/post');

// @route   POST /api/posts
// @desc    Create a post
// @access  Private
router.post("/", passport.authenticate('jwt', { session: false }), (req, res) => {

    const { errors, isValid } = validatePostInput(req.body);

    // Check validation
    if (!isValid) {
        return res.status(400).json(errors);
    }

    const newPost = new Post({
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id
    });

    newPost.save().then(post => res.json(post));
});

// @route   GET /api/posts
// @desc    Get all posts
// @access  Public
router.get("/", (req, res) => {
    Post.find()
        .sort({ date: -1 })
        .then(posts => res.json(posts))
        .catch(err => res.status(404).json({ noposts: 'No posts found' }))

});

// @route   GET /api/posts/:id
// @desc    Get a post
// @access  Public
router.get("/:id", (req, res) => {
    Post.findById(req.params.id)
        .then(post => res.json(post))
        .catch(err => res.status(404).json({ noposts: `No posts found with that ID`}))

});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete("/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            if(!profile) {
                return res.status(404).json({ msg: `Couldn't find user profile`})
            }

            Post.findById(req.params.id)
                .then(post => {
                    // Check for post owner
                    if(post.user.toString() != req.user.id) {
                        return res.status(401).json({ notauthorized: 'User not authorized' });
                    }

                    // Delete
                    Post.remove().then(() => res.json({ success: true }));
                })
                .catch(err => res.status(404).json({ noposts: `No posts found with that ID`}))
        })
        .catch(err => res.status(404).json(err))
});

module.exports = router;