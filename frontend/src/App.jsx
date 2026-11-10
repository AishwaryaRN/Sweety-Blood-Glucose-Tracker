
import { useEffect, useState } from 'react';
import './App.css';

const API = 'http://localhost:5000/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('sweety_token') || '');
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('sweety_user') || 'null')
  );

  const [page, setPage] = useState('home');
  const [authMode, setAuthMode] = useState('signup');
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [readingForm, setReadingForm] = useState({
    reading_date: new Date().toLocaleDateString('en-CA'),
    slot: 'Morning fasting',
    glucose_value: ''
  });

  const [readings, setReadings] = useState([]);
  const [report, setReport] = useState(null);
  const [period, setPeriod] = useState('daily');
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const slots = [
    'Morning fasting',
    'After breakfast',
    'After lunch',
    'After dinner'
  ];

  async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  }

  async function handleAuth(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const endpoint = authMode === 'signup' ? '/auth/signup' : '/auth/login';

      const data = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(authForm)
      });

      if (authMode === 'signup') {
        setMessage('Account created! Please log in.');
        setAuthMode('login');
        setAuthForm({ name: '', email: authForm.email, password: '' });
      } else {
        localStorage.setItem('sweety_token', data.token);
        localStorage.setItem('sweety_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setPage('dashboard');
        setMessage('');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('sweety_token');
    localStorage.removeItem('sweety_user');
    setToken('');
    setUser(null);
    setReadings([]);
    setReport(null);
    setPage('home');
    setMessage('');
  }

  async function loadReadings() {
    try {
      const data = await apiRequest('/readings');
      setReadings(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function loadReport(selectedPeriod = period) {
    try {
      const data = await apiRequest(`/reports?period=${selectedPeriod}`);
      setReport(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    if (token) {
      loadReadings();
      loadReport();
    }
  }, [token]);

  async function saveReading(event) {
    event.preventDefault();
    setMessage('');

    try {
      const endpoint = editingId
        ? `/readings/${editingId}`
        : '/readings';

      await apiRequest(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...readingForm,
          glucose_value: Number(readingForm.glucose_value)
        })
      });

      setMessage(editingId ? 'Reading updated successfully!' : 'Reading added successfully!');

      setEditingId(null);
      setReadingForm({
        reading_date: new Date().toLocaleDateString('en-CA'),
        slot: 'Morning fasting',
        glucose_value: ''
      });

      await loadReadings();
      await loadReport();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function editReading(reading) {
    setEditingId(reading.id);
    setReadingForm({
      reading_date: String(reading.reading_date).slice(0, 10),
      slot: reading.slot,
      glucose_value: reading.glucose_value
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteReading(id) {
    if (!window.confirm('Are you sure you want to delete this reading?')) {
      return;
    }

    try {
      await apiRequest(`/readings/${id}`, { method: 'DELETE' });
      setMessage('Reading deleted successfully!');
      await loadReadings();
      await loadReport();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function changePeriod(value) {
    setPeriod(value);
    await loadReport(value);
  }

function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

  if (token && page !== 'home' && page !== 'auth') {
    return (
      <div className="dashboard-page">
        <header className="dashboard-nav">
          <h2>💗 Sweety</h2>
          <div>
            <span>Hi, {user?.name || 'User'}!</span>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </header>

        <main className="dashboard-container">
          <div className="welcome">
            <p className="tagline">YOUR HEALTH, YOUR CONTROL</p>
            <h1>Welcome to your dashboard 💗</h1>
            <p>Track your glucose readings and understand your health patterns.</p>
          </div>

          {message && <div className="message">{message}</div>}

          <section className="stats-grid">
            <div className="stat-card">
              <span>Total readings</span>
              <h2>{readings.length}</h2>
            </div>
            <div className="stat-card">
              <span>Highest reading</span>
              <h2>{report?.highest ?? '--'}</h2>
              <small>mg/dL</small>
            </div>
            <div className="stat-card">
              <span>Lowest reading</span>
              <h2>{report?.lowest ?? '--'}</h2>
              <small>mg/dL</small>
            </div>
            <div className="stat-card">
              <span>Average reading</span>
              <h2>{report?.average ?? '--'}</h2>
              <small>mg/dL</small>
            </div>
          </section>

          <section className="content-card">
            <h2>{editingId ? '✏️ Edit Reading' : '➕ Add Glucose Reading'}</h2>

            <form className="reading-form" onSubmit={saveReading}>
              <label>
                Reading date
                <input
                  type="date"
                  value={readingForm.reading_date}
                  max={new Date().toLocaleDateString('en-CA')}
                  required
                  onChange={e => setReadingForm({
                    ...readingForm,
                    reading_date: e.target.value
                  })}
                />
              </label>

              <label>
                Reading slot
                <select
                  value={readingForm.slot}
                  onChange={e => setReadingForm({
                    ...readingForm,
                    slot: e.target.value
                  })}
                >
                  {slots.map(slot => <option key={slot}>{slot}</option>)}
                </select>
              </label>

              <label>
                Glucose value (mg/dL)
                <input
                  type="number"
                  min="40"
                  max="600"
                  step="1"
                  placeholder="Enter value"
                  value={readingForm.glucose_value}
                  required
                  onChange={e => setReadingForm({
                    ...readingForm,
                    glucose_value: e.target.value
                  })}
                />
              </label>

              <button className="primary-btn" type="submit">
                {editingId ? 'Update Reading' : 'Save Reading'}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setEditingId(null);
                    setReadingForm({
                      reading_date: new Date().toLocaleDateString('en-CA'),
                      slot: 'Morning fasting',
                      glucose_value: ''
                    });
                  }}
                >
                  Cancel
                </button>
              )}
            </form>
          </section>

          <section className="content-card">
            <h2>📊 Glucose Reports</h2>

            <div className="report-tabs">
              <button
                className={period === 'daily' ? 'active-tab' : ''}
                onClick={() => changePeriod('daily')}
              >
                Daily
              </button>
              <button
                className={period === 'mtd' ? 'active-tab' : ''}
                onClick={() => changePeriod('mtd')}
              >
                Month to date
              </button>
              <button
                className={period === 'previous-month' ? 'active-tab' : ''}
                onClick={() => changePeriod('previous-month')}
              >
                Previous month
              </button>
            </div>

            {report?.count === 0 ? (
              <p className="empty-state">No readings available for this period.</p>
            ) : (
              <p className="report-summary">
                Showing {report?.count ?? 0} readings from {report?.startDate} to {report?.endDate}.
              </p>
            )}
          </section>

          <section className="content-card">
            <h2>🩷 Reading History</h2>

            {readings.length === 0 ? (
              <p className="empty-state">No readings yet. Add your first reading above!</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Slot</th>
                      <th>Glucose (mg/dL)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map(reading => (
                      <tr key={reading.id}>
                        <td>{formatDate(reading.reading_date)}</td>
                        <td>{reading.slot}</td>
                        <td><strong>{reading.glucose_value}</strong></td>
                        <td className="action-buttons">
                          <button onClick={() => editReading(reading)}>Edit</button>
                          <button onClick={() => deleteReading(reading.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>

        <footer>© 2026 Sweety. Your personal glucose companion.</footer>
      </div>
    );
  }

  if (page === 'auth') {
    return (
      <div className="auth-page">
        <header className="navbar">
          <h2 onClick={() => setPage('home')}>💗 Sweety</h2>
          <span>Blood Glucose Tracker</span>
        </header>

        <main className="auth-card">
          <h1>{authMode === 'signup' ? 'Create your account' : 'Welcome back!'}</h1>
          <p>{authMode === 'signup' ? 'Start tracking your glucose readings.' : 'Login to access your dashboard.'}</p>

          {message && <div className="message">{message}</div>}

          <form onSubmit={handleAuth}>
            {authMode === 'signup' && (
              <label>
                Full name
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={authForm.name}
                  required
                  onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                placeholder="Enter your email"
                value={authForm.email}
                required
                onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
              />
            </label>

            <label>
              Password
              <input
                type="password"
                placeholder="At least 6 characters"
                minLength="6"
                value={authForm.password}
                required
                onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
              />
            </label>

            <button className="primary-btn full-btn" disabled={loading}>
              {loading ? 'Please wait...' : authMode === 'signup' ? 'Create Account' : 'Login'}
            </button>
          </form>

          <p className="switch-auth">
            {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={() => {
              setAuthMode(authMode === 'signup' ? 'login' : 'signup');
              setMessage('');
            }}>
              {authMode === 'signup' ? ' Login' : ' Sign up'}
            </button>
          </p>

          <button className="back-home" onClick={() => setPage('home')}>← Back to Home</button>
        </main>

        <footer>© 2026 Sweety. Your personal glucose companion.</footer>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="navbar">
        <h2>💗 Sweety</h2>
        <span>Blood Glucose Tracker</span>
      </header>

      <main className="hero">
        <div className="hero-content">
          <p className="tagline">YOUR HEALTH, YOUR CONTROL</p>
          <h1>
            Take control of your
            <span> blood sugar health.</span>
          </h1>
          <p className="description">
            Track your daily glucose readings, understand your
            patterns, and take a step towards a healthier life.
          </p>

          <div className="buttons">
            <button className="primary-btn" onClick={() => {
              setAuthMode('signup');
              setMessage('');
              setPage('auth');
            }}>
              Get Started
            </button>

            <button className="secondary-btn" onClick={() => {
              setAuthMode('login');
              setMessage('');
              setPage('auth');
            }}>
              Login
            </button>
          </div>
        </div>

        <div className="hero-card">
          <div className="heart">💗</div>
          <h3>Your health matters</h3>
          <p>Small steps today, healthier tomorrow.</p>
          <div className="health-line"></div>
          <span>Track • Understand • Improve</span>
        </div>
      </main>

      <footer>© 2026 Sweety. Your personal glucose companion.</footer>
    </div>
  );
}

export default App;

