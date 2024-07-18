const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const Userdb = require("../models/UserModels");
const dotenv = require("dotenv").config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await Userdb.userCollection.findOne({ googleID: profile.id });

        if (user) {
            return done(null, user);
        } else {
            // Create a new user if not found
            user = new Userdb.userCollection({
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                email: profile.email,
                googleID: profile.id
            });
            await user.save();
            return done(null, user);
        }
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
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
