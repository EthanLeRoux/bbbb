const express = require("express");
const cors = require('cors');
const { initializeFirebase, healthCheck: firebaseHealthCheck } = require('./firebase');

const app = express();
app.use(express.json());
app.use(cors());
require("dotenv").config();

// Initialize Firebase
try {
  initializeFirebase();
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Failed to initialize Firebase:", error.message);
  process.exit(1);
}

// ── Routes ────────────────────────────────────────────────────────────────────
const vaultRoutes = require('./Routes/vaultRoutes');
const testRoutes = require('./Routes/testRoutes');
const attemptRoutes = require('./Routes/attemptRoutes');
const spacedRepetitionRoutes = require('./Routes/spacedRepetitionRoutes');
const vaultSpacedRepetitionRoutes = require('./Routes/vaultSpacedRepetitionRoutes');
const dailyReviewScheduleRoutes = require('./Routes/dailyReviewScheduleRoutes');
app.use('/api/vault', vaultRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/attempt', attemptRoutes);
app.use('/api/spaced-repetition', spacedRepetitionRoutes);
app.use('/api/vault-learning', vaultSpacedRepetitionRoutes);
app.use('/api/review-schedule', dailyReviewScheduleRoutes);


// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    const firebaseHealth = await firebaseHealthCheck();
    res.json({
      status: "ok",
      firebase: firebaseHealth.status,
      uptime: Math.floor(process.uptime()),
    });
  } catch (error) {
    res.json({
      status: "error",
      firebase: "error",
      error: error.message,
      uptime: Math.floor(process.uptime()),
    });
  }
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`✓ anisubs server on http://localhost:${PORT}`)
);
