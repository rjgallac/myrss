const express = require("express");
const passport = require("passport");
require("../middleware/passport");

const router = express.Router();

router.post("/login", passport.authenticate("local"), (req, res) => {
  // Explicitly touch the session to force a 'set-cookie' header
  req.session.lastLogin = new Date();
  req.session.userEmail = req.user.email;

  res.json({ message: "Logged in successfully", user: req.user });
});

router.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;
