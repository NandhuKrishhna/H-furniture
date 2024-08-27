const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const Userdb = require("../models/UserModels");
const dotenv = require("dotenv").config();
const jwt = require("jsonwebtoken");

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://www.nandhu.live/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await Userdb.userCollection.findOne({ googleID: profile.id });

        if (user) {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
            return done(null, { user, token });
        } else {
            user = new Userdb.userCollection({
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                email: profile.email,
                googleID: profile.id
            });
            await user.save();

            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
            return done(null, { user, token });
        }
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        let user = await Userdb.userCollection.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
