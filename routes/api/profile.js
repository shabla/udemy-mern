const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Load validation
const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

// Load Profile Model
const Profile = require('../../models/Profile');

// Load User Model
const User = require('../../models/User');

// @route   GET /api/profile
// @desc    Get current user's profile
// @access  Private
router.get("/", passport.authenticate('jwt', { session: false }), (req, res) => {
    const errors = {};

    Profile.findOne({ user: req.user.id })
        .populate('user', ['name', 'avatar'])
        .then(profile => {
            if(!profile) {
                errors.noprofile = 'There is no profile for this user';
                return res.status(404).json(errors);
            }
            res.json(profile);
        })
        .catch(err => res.status(404).json(err));
});

// @route   GET /api/profile/all
// @desc    Get all profiles
// @access  Public
router.get("/all", (req, res) => {
    const errors = {};

    Profile.find()
        .populate('user', ['name', 'avatar'])
        .then(profiles => {
            if(!profiles) {
                errors.profiles = 'There are no profiles';
                return res.status(304).json(errors);
            }
            res.json(profiles)
        })
        .catch(err => res.status(500).json(err))
});

// @route   GET /api/profile/handle/:handle
// @desc    Get profile by handle
// @access  Public
router.get("/handle/:handle", (req, res) => {
    const errors = {};

    Profile.findOne({ handle: req.params.handle })
        .populate('user', ['name', 'avatar'])
        .then(profile => {
            if(!profile) {
                errors.profile = 'There is no profile with this handle';
                return res.status(404).json(errors);
            }

            res.json(profile)
        })
        .catch(err => res.status(500).json(err))
});

// @route   GET /api/profile/user/:userId
// @desc    Get profile by id
// @access  Public
router.get("/user/:userId", (req, res) => {
    const errors = {};

    Profile.findOne({ user: req.params.userId })
        .populate('user', ['name', 'avatar'])
        .then(profile => {
            if(!profile) {
                errors.profile = 'There is no profile for this id';
                return res.status(404).json(errors);
            }

            res.json(profile)
        })
        .catch(err => res.status(404).json({ profile: 'There is no profile for this id' }))
});

// @route   POST /api/profile
// @desc    Create/Edit current user's profile
// @access  Private
router.post("/", passport.authenticate('jwt', { session: false }), (req, res) => {

    const { errors, isValid } = validateProfileInput(req.body);

    // Check validation
    if(!isValid) {
        return res.status(400).json(errors);
    }

    // Get fields
    const profileFields = {};
    profileFields.user = req.user.id;

    if(req.body.handle) profileFields.handle = req.body.handle;
    if(req.body.company) profileFields.company = req.body.company;
    if(req.body.website) profileFields.website = req.body.website;
    if(req.body.location) profileFields.location = req.body.location;
    if(req.body.bio) profileFields.bio = req.body.bio;
    if(req.body.status) profileFields.status = req.body.status;
    if(req.body.githubUsername) profileFields.githubUsername = req.body.githubUsername;

    // Skills - split into array
    if(typeof req.body.skills !== 'undefined') {
        profileFields.skills = req.body.skills.split(",").map(skill => skill.trim());
    }

    // Social
    profileFields.social = {};
    if(req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if(req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if(req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if(req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if(req.body.instagram) profileFields.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id })
        .then(profile => {
            if(profile) {
                // Update existing profile
                Profile.findOneAndUpdate(
                    { user: req.user.id }, 
                    { $set: profileFields }, 
                    { new: true }
                ).then(profile => res.json(profile));
            } else {
                // Create profile
                // Check if handle exists
                Profile.findOne({ handle: profileFields.handle })
                    .then(profile => {
                        if(profile) {
                            errors.handle = 'That handle already exists'
                            return res.status(400).json(errors);
                        }

                        new Profile(profileFields).save().then(profile => res.json(profile));
                    })

            }
        })
        .catch(err => res.status(404).json(err));
});

// @route   POST /api/profile/experience
// @desc    Add experience to current user's profile
// @access  Private
router.post("/experience", passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body);

    if(!isValid) {
        return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id })
        .then(profile => {
            if(!profile) {
                return res.status(404).json({msg: 'wtf'});
            }

            const newExp = {
                title: req.body.title,
                company: req.body.company,
                location: req.body.location,
                from: req.body.from,
                to: req.body.to,
                current: req.body.current,
                description: req.body.description,
            };

            // Add to experience array of the profile
            profile.experience.unshift(newExp);

            profile.save().then(profile => res.json(profile));
        })
});

// @route   DELETE /api/profile/experience/:expId
// @desc    Remove an experience from current user's profile
// @access  Private
router.delete("/experience/:expId", passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            if(!profile) {
                return res.status(404).json({ msg: `Couldn't find user profile` });
            }

            // Get remove index
            const removeIndex = profile.experience
                .map(exp => exp.id)
                .indexOf(req.params.expId);

            if(removeIndex == -1) {
                return res.status(404).json({ msg: 'Couldn\'t find experience in user profile'})
            }

            // Splice from array
            profile.experience.splice(removeIndex, 1);

            profile.save().then(profile => res.json(profile));
        })
        .catch(err => res.status(500).json(err))
});

// @route   POST /api/profile/education
// @desc    Add education to current user's profile
// @access  Private
router.post("/education", passport.authenticate('jwt', { session: false }), (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);

    if(!isValid) {
        return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id })
        .then(profile => {
            if(!profile) {
                return res.status(404).json({ msg: `Couldn't find user profile` });
            }

            const newEdu = {
                school: req.body.school,
                degree: req.body.degree,
                fieldOfStudy: req.body.fieldOfStudy,
                from: req.body.from,
                to: req.body.to,
                current: req.body.current,
                description: req.body.description,
            };

            // Add to education array of the profile
            profile.education.unshift(newEdu);

            profile.save().then(profile => res.json(profile));
        })
        .catch(err => res.status(500).json(err))
});

// @route   DELETE /api/profile/education/:eduId
// @desc    Remove an education from current user's profile
// @access  Private
router.delete("/education/:eduId", passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            if (!profile) {
                return res.status(404).json({ msg: `Couldn't find user profile` });
            }

            // Get remove index
            const removeIndex = profile.education
                .map(edu => edu.id)
                .indexOf(req.params.eduId);

            if (removeIndex == -1) {
                return res.status(404).json({ msg: 'Couldn\'t find education in user profile' })
            }

            // Splice from array
            profile.education.splice(removeIndex, 1);

            profile.save().then(profile => res.json(profile));
        })
        .catch(err => res.status(500).json(err))
});

// @route   DELETE /api/profile
// @desc    Delete user and profile
// @access  Private
router.delete("/", passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOneAndRemove({ user: req.user.id })
        .then(() => {
            User.findOneAndRemove({ _id: req.user.id })
                .then(() => res.json({ success: true }));
        })
        .catch(err => res.status(500).json(err))
});

module.exports = router;