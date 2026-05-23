import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { USER_API } from '../api/index';

const ROLES = ['FARMER', 'CUSTOMER'];

// ── Field component OUTSIDE LoginPage so React doesn't recreate it on every keystroke ──
function Field({ label, id, type = 'text', placeholder, maxLength, form, onChange, errs }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block', fontSize: '0.76rem', fontWeight: 700,
        color: '#4a5c4a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6
      }}>
        {label}
      </label>
      <input
        type={type}
        value={form[id] || ''}
        onChange={e => onChange(id, e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        style={{
          width: '100%', padding: '11px 14px',
          border: `1.5px solid ${errs[id] ? '#c0392b' : '#e2e8e2'}`,
          borderRadius: 10, fontSize: '0.9rem',
          fontFamily: "'DM Sans', sans-serif",
          background: '#fafcfa', outline: 'none', color: '#1a2e1a',
          transition: 'border 0.2s', boxSizing: 'border-box'
        }}
        onFocus={e => { if (!errs[id]) e.target.style.borderColor = '#4a9e3f'; }}
        onBlur={e => { if (!errs[id]) e.target.style.borderColor = '#e2e8e2'; }}
      />
      {errs[id] && (
        <div style={{ fontSize: '0.76rem', color: '#c0392b', marginTop: 4 }}>
          {errs[id]}
        </div>
      )}
    </div>
  );
}

const btnStyle = (loading) => ({
  width: '100%', padding: 14,
  background: loading ? '#6b9e62' : 'linear-gradient(135deg, #4a9e3f, #2d5a1b)',
  color: 'white', border: 'none', borderRadius: 12,
  fontWeight: 700, fontSize: '1rem',
  cursor: loading ? 'not-allowed' : 'pointer',
  fontFamily: "'DM Sans', sans-serif",
  transition: 'all 0.2s', marginTop: 4
});

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({});
  const [errs, setErrs] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');
  const [otpEmail, setOtpEmail] = useState('');

  function handleChange(id, value) {
    setForm(f => ({ ...f, [id]: value }));
    setErrs(e => ({ ...e, [id]: '' }));
  }

  function flash(text, type = 'error') {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 6000);
  }

  function switchMode(next, keepMsg = false) {
    setMode(next);
    setForm({});
    setErrs({});
    if (!keepMsg) setMsg('');
  }

  async function handleLogin(e) {
    e.preventDefault();
    const e2 = {};
    if (!form.email?.trim()) e2.email = 'Email is required.';
    if (!form.password) e2.password = 'Password is required.';
    if (Object.keys(e2).length) { setErrs(e2); return; }
    setLoading(true);
    try {
      const res = await fetch(`${USER_API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      });
      if (res.ok) {
        const user = await res.json();
        sessionStorage.setItem('loggedUser', JSON.stringify(user));
        if (user.role === 'ADMIN') navigate('/admin');
        else if (user.role === 'FARMER') navigate('/farmer');
        else navigate('/customer');
      } else {
        flash((await res.text()) || 'Invalid credentials.');
      }
    } catch {
      flash('Cannot reach server. Is the backend running?');
    }
    setLoading(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    const e2 = {};
    if (!form.name?.trim()) e2.name = 'Name is required.';
    if (!form.email?.trim()) e2.email = 'Email is required.';
    if (!form.phone || !/^[0-9]{10}$/.test(form.phone)) e2.phone = 'Phone must be 10 digits.';
    if (!form.nic || (!/^[0-9]{9}[VvXx]$/.test(form.nic) && !/^[0-9]{12}$/.test(form.nic))) e2.nic = 'NIC: 9 digits+V/X or 12 digits.';
    if (!form.password || form.password.length < 6) e2.password = 'Min 6 characters.';
    if (form.password !== form.confirmPassword) e2.confirmPassword = 'Passwords do not match.';
    if (!form.role) e2.role = 'Please select a role.';
    if (Object.keys(e2).length) { setErrs(e2); return; }
    setLoading(true);
    try {
      const res = await fetch(`${USER_API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone,
          nic: form.nic, password: form.password, role: form.role
        })
      });
      if (res.ok) {
        flash(
          form.role === 'FARMER'
            ? 'Registered! Your account is pending admin approval.'
            : 'Registered successfully! You can now log in.',
          'success'
        );
        switchMode('login', true);
      } else {
        flash(await res.text());
      }
    } catch { flash('Network error.'); }
    setLoading(false);
  }

  async function handleForgot(e) {
    e.preventDefault();
    if (!form.forgotEmail?.trim()) { setErrs({ forgotEmail: 'Email is required.' }); return; }
    setLoading(true);
    try {
      const res = await fetch(`${USER_API}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.forgotEmail })
      });
      if (res.ok) {
        setOtpEmail(form.forgotEmail);
        setMode('otp');
        flash('OTP sent! Check your email (or backend console in dev mode).', 'success');
      } else flash(await res.text());
    } catch { flash('Network error.'); }
    setLoading(false);
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!form.otp?.trim()) { setErrs({ otp: 'OTP is required.' }); return; }
    setLoading(true);
    try {
      const res = await fetch(`${USER_API}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp: form.otp })
      });
      if (res.ok) { setMode('reset'); flash('OTP verified. Enter your new password.', 'success'); }
      else flash('Invalid or expired OTP.');
    } catch { flash('Network error.'); }
    setLoading(false);
  }

  async function handleReset(e) {
    e.preventDefault();
    const e2 = {};
    if (!form.newPassword || form.newPassword.length < 6) e2.newPassword = 'Min 6 characters.';
    if (form.newPassword !== form.confirmNewPassword) e2.confirmNewPassword = 'Passwords do not match.';
    if (Object.keys(e2).length) { setErrs(e2); return; }
    setLoading(true);
    try {
      const res = await fetch(`${USER_API}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, newPassword: form.newPassword })
      });
      if (res.ok) {
        flash('Password reset! You can now log in.', 'success');
        switchMode('login', true);
      } else flash(await res.text());
    } catch { flash('Network error.'); }
    setLoading(false);
  }

  // Shared props passed to every Field
  const fp = { form, onChange: handleChange, errs };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a3a0a 0%, #2d5a1b 40%, #1a4a0a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden'
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.25)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 80 80" fill="none">
                <path d="M40 8C40 8,68 18,68 42C68 62,54 72,40 74C26 72,12 62,12 42C12 18,40 8,40 8Z" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
                <path d="M40 8L40 74" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M40 30L56 40M40 30L24 40" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 800, letterSpacing: '0.5px' }}>VegLife</span>
          </div>
          <p style={{ fontSize: '0.88rem', opacity: 0.65 }}>Sri Lanka's Farm-to-Table Platform</p>
        </div>

        {/* Panel */}
        <div style={{
          background: 'white', borderRadius: 20, padding: '40px 36px',
          width: 440, maxWidth: '95vw',
          boxShadow: '0 16px 60px rgba(0,0,0,0.15)',
          animation: 'scaleIn 0.25s ease'
        }}>
          {/* Flash message */}
          {msg && (
            <div style={{
              background: msgType === 'success' ? '#d4edda' : '#f8d7da',
              border: `1px solid ${msgType === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
              color: msgType === 'success' ? '#155724' : '#721c24',
              borderRadius: 10, padding: '12px 16px', fontSize: '0.86rem', marginBottom: 20
            }}>
              {msg}
            </div>
          )}

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: '#1a3a0a', marginBottom: 4 }}>Welcome back</div>
              <div style={{ fontSize: '0.84rem', color: '#8a9e8a', marginBottom: 24 }}>Sign in to your VegLife account</div>
              <form onSubmit={handleLogin} noValidate>
                <Field label="Email Address" id="email"    type="email"    placeholder="you@example.com" {...fp} />
                <Field label="Password"      id="password" type="password" placeholder="Your password"   {...fp} />
                <div style={{ textAlign: 'right', marginBottom: 20 }}>
                  <span onClick={() => switchMode('forgot')} style={{ fontSize: '0.82rem', color: '#2980b9', cursor: 'pointer', fontWeight: 600 }}>
                    Forgot password?
                  </span>
                </div>
                <button type="submit" disabled={loading} style={btnStyle(loading)}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.86rem', color: '#8a9e8a' }}>
                Don't have an account?{' '}
                <span onClick={() => switchMode('register')} style={{ color: '#2d5a1b', fontWeight: 700, cursor: 'pointer' }}>
                  Register here
                </span>
              </div>
            </>
          )}

          {/* ── REGISTER ── */}
          {mode === 'register' && (
            <>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: '#1a3a0a', marginBottom: 4 }}>Create Account</div>
              <div style={{ fontSize: '0.84rem', color: '#8a9e8a', marginBottom: 24 }}>Join VegLife as a farmer or customer</div>
              <form onSubmit={handleRegister} noValidate>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#4a5c4a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>I am a</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {ROLES.map(r => (
                      <div
                        key={r}
                        onClick={() => handleChange('role', r)}
                        style={{
                          padding: '12px 16px',
                          border: `2px solid ${form.role === r ? '#4a9e3f' : '#e2e8e2'}`,
                          borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                          background: form.role === r ? '#e8f5e9' : 'white', transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{r === 'FARMER' ? '👨‍🌾' : '🛒'}</div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: form.role === r ? '#2d5a1b' : '#4a5c4a' }}>
                          {r === 'FARMER' ? 'Farmer' : 'Customer'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#8a9e8a', marginTop: 2 }}>
                          {r === 'FARMER' ? 'Sell produce' : 'Buy fresh'}
                        </div>
                      </div>
                    ))}
                  </div>
                  {errs.role && <div style={{ fontSize: '0.76rem', color: '#c0392b', marginTop: 4 }}>{errs.role}</div>}
                </div>

                <Field label="Full Name"        id="name"            placeholder="Kamal Perera"                                  {...fp} />
                <Field label="Email Address"    id="email"           type="email"    placeholder="you@example.com"               {...fp} />
                <Field label="Phone Number"     id="phone"           placeholder="0771234567"                  maxLength={10}    {...fp} />
                <Field label="NIC Number"       id="nic"             placeholder="123456789V or 12 digits"                       {...fp} />
                <Field label="Password"         id="password"        type="password" placeholder="Min 6 chars, 1 letter, 1 special char" {...fp} />
                <Field label="Confirm Password" id="confirmPassword" type="password" placeholder="Repeat password"               {...fp} />

                <button type="submit" disabled={loading} style={btnStyle(loading)}>
                  {loading ? 'Registering…' : 'Create Account'}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.86rem', color: '#8a9e8a' }}>
                Already have an account?{' '}
                <span onClick={() => switchMode('login')} style={{ color: '#2d5a1b', fontWeight: 700, cursor: 'pointer' }}>Sign in</span>
              </div>
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {mode === 'forgot' && (
            <>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: '#1a3a0a', marginBottom: 4 }}>Reset Password</div>
              <div style={{ fontSize: '0.84rem', color: '#8a9e8a', marginBottom: 24 }}>Enter your email and we'll send you an OTP</div>
              <form onSubmit={handleForgot} noValidate>
                <Field label="Email Address" id="forgotEmail" type="email" placeholder="you@example.com" {...fp} />
                <button type="submit" disabled={loading} style={btnStyle(loading)}>
                  {loading ? 'Sending…' : 'Send OTP'}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.86rem', color: '#8a9e8a' }}>
                <span onClick={() => switchMode('login')} style={{ color: '#2d5a1b', fontWeight: 700, cursor: 'pointer' }}>
                  ← Back to login
                </span>
              </div>
            </>
          )}

          {/* ── OTP ── */}
          {mode === 'otp' && (
            <>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: '#1a3a0a', marginBottom: 4 }}>Enter OTP</div>
              <div style={{ fontSize: '0.84rem', color: '#8a9e8a', marginBottom: 24 }}>
                Check your email at <strong>{otpEmail}</strong>
                <br /><span style={{ fontSize: '0.78rem' }}>(or check the backend console in dev mode)</span>
              </div>
              <form onSubmit={handleVerifyOtp} noValidate>
                <Field label="6-Digit OTP" id="otp" placeholder="000000" maxLength={6} {...fp} />
                <button type="submit" disabled={loading} style={btnStyle(loading)}>
                  {loading ? 'Verifying…' : 'Verify OTP'}
                </button>
              </form>
            </>
          )}

          {/* ── RESET PASSWORD ── */}
          {mode === 'reset' && (
            <>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: '#1a3a0a', marginBottom: 4 }}>New Password</div>
              <div style={{ fontSize: '0.84rem', color: '#8a9e8a', marginBottom: 24 }}>Choose a strong new password</div>
              <form onSubmit={handleReset} noValidate>
                <Field label="New Password"     id="newPassword"        type="password" placeholder="Min 6 chars, 1 letter, 1 special char" {...fp} />
                <Field label="Confirm Password" id="confirmNewPassword" type="password" placeholder="Repeat password"                        {...fp} />
                <button type="submit" disabled={loading} style={btnStyle(loading)}>
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
          VegLife © 2025 · Sri Lanka Farm-to-Table Platform
        </p>
      </div>
    </div>
  );
}
