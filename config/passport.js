const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const mongoose = require('mongoose');

const keys = require('../config/keys');
const User = mongoose.model('users');

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: keys.secretOrKey
};

module.exports = passport => {
    passport.use(new JwtStrategy(opts, (jwtPayload, done) => {
        User.findById(jwtPayload.id)
            .then(user => {
                if(user) {
                    return done(null, user);
                } else {
                    return done(null, false);
                }
            })
            .catch(err => console.log(err))
    }));
};