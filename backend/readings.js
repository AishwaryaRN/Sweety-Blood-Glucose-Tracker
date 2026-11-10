
const express = require('express');
const pool = require('./db');
const jwt = require('jsonwebtoken');

const router = express.Router();

const validSlots = [
  'Morning fasting',
  'After breakfast',
  'After lunch',
  'After dinner'
];

// Verify login token
function authenticateToken(req, res, next) {
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
}

router.use(authenticateToken);

// GET all readings belonging to logged-in user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM glucose_readings
       WHERE user_id = $1
       ORDER BY reading_date DESC, id DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Could not fetch readings' });
  }
});

// ADD a reading
router.post('/', async (req, res) => {
  try {
    const { reading_date, slot, glucose_value } = req.body;

    if (!reading_date || !slot || glucose_value === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(reading_date)) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const date = new Date(`${reading_date}T00:00:00Z`);
    if (Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== reading_date) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    if (reading_date > new Date().toISOString().slice(0, 10)) {
      return res.status(400).json({ message: 'Future dates are not allowed' });
    }

    if (!validSlots.includes(slot)) {
      return res.status(400).json({ message: 'Invalid reading slot' });
    }

    const value = Number(glucose_value);

    if (!Number.isInteger(value) || value < 40 || value > 600) {
      return res.status(400).json({
        message: 'Glucose value must be an integer between 40 and 600'
      });
    }

    const result = await pool.query(
      `INSERT INTO glucose_readings
       (user_id, reading_date, slot, glucose_value)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.userId, reading_date, slot, value]
    );

    res.status(201).json({
      message: 'Reading added successfully',
      reading: result.rows[0]
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'A reading already exists for this slot and date'
      });
    }

    console.error(error.message);
    res.status(500).json({ message: 'Could not add reading' });
  }
});

// UPDATE a reading
router.put('/:id', async (req, res) => {
  try {
    const { reading_date, slot, glucose_value } = req.body;
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid reading ID' });
    }

    if (!reading_date || !slot || glucose_value === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(reading_date)) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const date = new Date(`${reading_date}T00:00:00Z`);
    if (Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== reading_date) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    if (reading_date > new Date().toISOString().slice(0, 10)) {
      return res.status(400).json({ message: 'Future dates are not allowed' });
    }

    if (!validSlots.includes(slot)) {
      return res.status(400).json({ message: 'Invalid reading slot' });
    }

    const value = Number(glucose_value);

    if (!Number.isInteger(value) || value < 40 || value > 600) {
      return res.status(400).json({
        message: 'Glucose value must be an integer between 40 and 600'
      });
    }

    const result = await pool.query(
      `UPDATE glucose_readings
       SET reading_date = $1, slot = $2, glucose_value = $3
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [reading_date, slot, value, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Reading not found' });
    }

    res.json({
      message: 'Reading updated successfully',
      reading: result.rows[0]
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'A reading already exists for this slot and date'
      });
    }

    console.error(error.message);
    res.status(500).json({ message: 'Could not update reading' });
  }
});

// DELETE a reading
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid reading ID' });
    }

    const result = await pool.query(
      `DELETE FROM glucose_readings
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Reading not found' });
    }

    res.json({ message: 'Reading deleted successfully' });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Could not delete reading' });
  }
});

module.exports = router;
