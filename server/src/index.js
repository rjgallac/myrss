require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const { initializeDB } = require("./db/init");
const { startFeedFetcher } = require("./jobs/feedFetcher");
const authRoutes = require("./routes/auth");
const feedRoutes = require("./routes/feeds");
const itemRoutes = require("./routes/items");

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Ensure this is false for local http development
      sameSite: "lax",
      maxAge: 24 * 6 * 60 * 60 * 1000, // 24 hours
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/feeds", feedRoutes);
app.use("/api/items", itemRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// Initialize
async function start() {
  try {
    await initializeDB();
    startFeedFetcher();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
