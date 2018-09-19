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
            Post.findById(req.params.id)
                .then(post => {
                    // Check for post owner
                    if(post.user.toString() !== req.user.id) {
                        return res.status(401).json({ notauthorized: 'User not authorized' });
                    }

                    // Delete
                    Post.deleteOne({ _id: post.id }).then(() => res.json({ success: true }));
                })
                .catch(err => res.status(404).json({ noposts: `No posts found with that ID` }))
        })
        .catch(err => res.status(404).json(err))
});

// @route   POST /api/posts/like/:id
// @desc    Like a post
// @access  Private
router.post("/like/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            Post.findById(req.params.id)
                .then(post => {
                    if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
                        return res.status(400).json({ alreadyliked: 'User already liked this post' });
                    }

                    // Add user to likes array
                    post.likes.push({ user: req.user.id });

                    post.save().then(post => res.json(post));
                })
                .catch(err => res.status(404).json({ noposts: `No posts found with that ID`}))
        })
        .catch(err => res.status(404).json(err))
});

// @route   POST /api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private
router.post("/unlike/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            Post.findById(req.params.id)
                .then(post => {
                    if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
                        return res.status(400).json({ alreadyliked: 'You have not yet liked this post' });
                    }

                    // Get remove index
                    const removeIndex = post.likes
                        .map(post => post.user.toString())
                        .indexOf(req.user.id);
                    
                    // Splice from the array
                    post.likes.splice(removeIndex, 1);

                    post.save().then(post => res.json(post));
                })
                .catch(err => res.status(404).json({ noposts: `No posts found with that ID`}))
        })
        .catch(err => res.status(404).json(err))
});

// @route   POST /api/posts/comment/:id
// @desc    Add comment to post
// @access  Private
router.post("/comment/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // Check validation
    if (!isValid) {
        return res.status(400).json(errors);
    }

    Post.findById(req.params.id)
        .then(post => {
            const newComment = {
                text: req.body.text,
                name: req.body.name,
                avatar: req.body.avatar,
                user: req.user.id
            };

            // Add to post's comments array
            post.comments.unshift(newComment);

            // Save
            post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ noposts: `No posts found with that ID`}))
});

// @route   DELETE /api/posts/comment/:id/:commentId
// @desc    Delete comment to post
// @access  Private
router.delete("/comment/:id/:commentId", passport.authenticate('jwt', { session: false }), (req, res) => {
    Post.findById(req.params.id)
        .then(post => {
            // Find index of comment to remove
            const removeIndex = post.comments
                .map(comment => comment._id.toString())
                .indexOf(req.params.commentId);
            
            // Check to see if the comment exists
            if(removeIndex === -1) {
                return res.status(404).json({ commentnotexist: `Comment doesn't in this post`});
            }

            // Remove comment from post
            post.comments.splice(removeIndex, 1);

            // Save post
            post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ noposts: `No posts found with that ID`}))
});

module.exports = router;