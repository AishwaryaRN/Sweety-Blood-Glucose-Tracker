
const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./db');
const authRoutes = require('./auth');
const readingRoutes = require('./readings');
const reportRoutes = require('./reports');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/reports', reportRoutes);
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Sweety Blood Glucose Tracker API!'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Sweety backend is running!'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Sweety server running at http://localhost:${PORT}`);
});
