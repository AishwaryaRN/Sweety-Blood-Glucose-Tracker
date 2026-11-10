
const pool = require('./db');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    const email = 'demo@sweety.com';
    const password = 'Demo@123';
    const name = 'Demo User';

    // Check whether the demo user already exists
    let result = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    let userId;

    if (result.rows.length > 0) {
      userId = result.rows[0].id;
      console.log('Demo user already exists.');
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);

      result = await pool.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [name, email, hashedPassword]
      );

      userId = result.rows[0].id;
      console.log('Demo user created.');
    }

    // Add sample readings only if the demo user has none
    const existingReadings = await pool.query(
      'SELECT COUNT(*) FROM glucose_readings WHERE user_id = $1',
      [userId]
    );

    if (Number(existingReadings.rows[0].count) === 0) {
      await pool.query(
        `INSERT INTO glucose_readings
         (user_id, reading_date, slot, glucose_value)
         VALUES
         ($1, CURRENT_DATE, 'Morning fasting', 110),
         ($1, CURRENT_DATE, 'After breakfast', 145),
         ($1, CURRENT_DATE - 1, 'Morning fasting', 105)`,
        [userId]
      );

      console.log('Sample glucose readings added.');
    } else {
      console.log('Demo readings already exist.');
    }

    console.log('Database seeding completed!');
    console.log('Demo email:', email);
    console.log('Demo password:', password);

  } catch (error) {
    console.error('Seeding error:', error.message);
  } finally {
    await pool.end();
  }
}

seedDatabase();
