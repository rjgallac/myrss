const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { pool } = require("../db/init");

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error);
  }
});

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      console.log("--- Passport Local Strategy Debug ---");
      console.log("Received Username:", username);
      // Do NOT log the password in production, but for debugging:
      console.log("Received Password:", password ? "****" : "null");
      console.log("Expected Username (from env):", process.env.ADMIN_USERNAME);
      // Avoid logging actual password from env, just confirm it exists
      console.log(
        "Env ADMIN_PASSWORD present:",
        !!process.env.ADMIN_password || !!process.env.ADMIN_PASSWORD,
      );

      if (
        username !== process.env.ADMIN_USERNAME ||
        password !== process.env.ADMIN_PASSWORD
      ) {
        console.log("Authentication failed: Username or Password mismatch");
        return done(null, false, { message: "Invalid credentials" });
      }

      console.log("Credentials match environment variables");

      const adminEmail = process.env.ADMIN_EMAIL;
      console.log("Looking for admin email:", adminEmail);

      // Check if this admin user already exists in the database
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [
        adminEmail,
      ]);

      if (result.rows.length > 0) {
        console.log("User found in database:", result.rows[0].email);
        return done(null, result.rows[0]);
      }

      console.log("User not found in database, attempting to create...");
      // Create new user
      const newUser = await pool.query(
        "INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *",
        [adminEmail, process.env.ADMIN_USERNAME],
      );

      console.log("User created successfully:", newUser.rows[0].email);
      done(null, newUser.rows[0]);
    } catch (error) {
      console.error("Error during Passport Local Strategy:", error);
      done(error);
    }
  }),
);

module.exports = passport;
