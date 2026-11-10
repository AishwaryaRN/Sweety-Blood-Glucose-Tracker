
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const router = express.Router();

// Protect reports with login token
router.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Login required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
});

// GET reports
router.get('/', async (req, res) => {
  try {
    const period = req.query.period;
    const today = new Date();
    const todayString = today.toISOString().slice(0, 10);

    let startDate;
    let endDate;

    if (period === 'daily') {
      startDate = req.query.date || todayString;
      endDate = startDate;
    } else if (period === 'mtd') {
      startDate = `${todayString.slice(0, 7)}-01`;
      endDate = todayString;
    } else if (period === 'previous-month') {
      const firstDay = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)
      );
      const lastDay = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0)
      );

      startDate = firstDay.toISOString().slice(0, 10);
      endDate = lastDay.toISOString().slice(0, 10);
    } else {
      return res.status(400).json({
        message: 'Use daily, mtd or previous-month as the period'
      });
    }

    const result = await pool.query(
      `SELECT
         COUNT(*)::int AS count,
         MAX(glucose_value)::int AS highest,
         MIN(glucose_value)::int AS lowest,
         ROUND(AVG(glucose_value), 1) AS average
       FROM glucose_readings
       WHERE user_id = $1
       AND reading_date BETWEEN $2 AND $3`,
      [req.userId, startDate, endDate]
    );

    const stats = result.rows[0];

    const readingsResult = await pool.query(
      `SELECT id, reading_date, slot, glucose_value
       FROM glucose_readings
       WHERE user_id = $1
       AND reading_date BETWEEN $2 AND $3
       ORDER BY reading_date DESC, slot`,
      [req.userId, startDate, endDate]
    );

    res.json({
      period,
      startDate,
      endDate,
      count: stats.count,
      highest: stats.highest,
      lowest: stats.lowest,
      average: stats.average === null ? null : Number(stats.average),
      readings: readingsResult.rows,
      message: stats.count === 0 ? 'No readings available for this period' : undefined
    });

  } catch (error) {
    console.error('Report error:', error.message);
    res.status(500).json({ message: 'Could not generate report' });
  }
});

module.exports = router;
