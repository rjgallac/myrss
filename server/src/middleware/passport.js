const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('../db/init');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Try to find user
    const result = await pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [profile.id]
    );

    if (result.rows.length > 0) {
      return done(null, result.rows[0]);
    }

    // Create new user
    const newUser = await pool.query(
      'INSERT INTO users (google_id, email, name, picture) VALUES ($1, $2, $3, $4) RETURNING *',
      [profile.id, profile.emails[0].value, profile.displayName, profile.photos[0]?.value]
    );

    done(null, newUser.rows[0]);
  } catch (error) {
    done(error);
  }
}));

module.exports = passport;
