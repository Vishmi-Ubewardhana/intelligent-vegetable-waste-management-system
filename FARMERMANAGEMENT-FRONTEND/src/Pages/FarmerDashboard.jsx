import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { USER_API, greeting } from '../api/index';
import { BellDropdown } from '../components/shared/BellDropdown';
import { showToast } from '../components/shared/Toast';
import { Modal } from '../components/shared/Modal';

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [form, setForm] = useState({});
  const [pwForm, setPwForm] = useState({});
  const [errs, setErrs] = useState({});
  const [pwErrs, setPwErrs] = useState({});
  const [saving, setSaving] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [picPreview, setPicPreview] = useState(null);

  useEffect(() => {
    const u = JSON.parse(sessionStorage.getItem('loggedUser') || 'null');
    if (!u || u.role !== 'FARMER') { navigate('/'); return; }
    setUser(u);
  }, []);

  useEffect(() => {
    function handler(e) {
      if (!e.target.closest('#farmerDropBtn')) setDropOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function logout() { sessionStorage.removeItem('loggedUser'); navigate('/'); }

  function openEdit() {
    if (!user) return;
    setForm({ name: user.name || '', phone: user.phone || '', nic: user.nic || '', farmSize: user.farmSize || '', farmLocation: user.farmLocation || '', yearsOfExperience: user.yearsOfExperience ?? '', cultivatedVegetables: user.cultivatedVegetables || '' });
    setPicPreview(user.profilePicture || null);
    setErrs({});
    setEditOpen(true);
    setDropOpen(false);
  }

  function handlePic(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2MB.', true); return; }
    const reader = new FileReader();
    reader.onload = ev => setPicPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    const e = {};
    if (!form.name?.trim()) e.name = 'Name is required.';
    if (!/^[0-9]{10}$/.test(form.phone)) e.phone = 'Phone must be 10 digits.';
    if (!/^[0-9]{9}[VvXx]$/.test(form.nic) && !/^[0-9]{12}$/.test(form.nic)) e.nic = 'Invalid NIC.';
    if (Object.keys(e).length) { setErrs(e); return; }
    setSaving(true);
    try {
      const payload = { ...form, profilePicture: picPreview || user.profilePicture || null, yearsOfExperience: form.yearsOfExperience !== '' ? parseInt(form.yearsOfExperience) : null };
      const res = await fetch(`${USER_API}/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        const updated = await res.json();
        const newUser = { ...user, ...updated };
        setUser(newUser);
        sessionStorage.setItem('loggedUser', JSON.stringify(newUser));
        setEditOpen(false);
        showToast('✅ Profile updated!');
      } else showToast(await res.text(), true);
    } catch { showToast('Network error.', true); }
    setSaving(false);
  }

  async function changePassword() {
    const e = {};
    if (!pwForm.current) e.current = 'Current password is required.';
    if (!pwForm.new || pwForm.new.length < 6) e.new = 'Password must be at least 6 characters.';
    if (pwForm.new !== pwForm.confirm) e.confirm = 'Passwords do not match.';
    if (Object.keys(e).length) { setPwErrs(e); return; }
    setSaving(true);
    try {
      const res = await fetch(`${USER_API}/change-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, currentPassword: pwForm.current, newPassword: pwForm.new }) });
      if (res.ok) { setPwOpen(false); setPwForm({}); showToast('✅ Password changed!'); }
      else showToast(await res.text(), true);
    } catch { showToast('Network error.', true); }
    setSaving(false);
  }

  if (!user) return null;

  if (user.status === 'pending') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a3a0a, #2d5a1b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: 24 }}>
      <div>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>⏳</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.8rem', marginBottom: 10 }}>Pending Approval</div>
        <div style={{ opacity: 0.75, marginBottom: 24, lineHeight: 1.6 }}>Your account is awaiting admin review.<br />You'll be able to log in once approved.</div>
        <button onClick={logout} style={{ padding: '12px 28px', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: 12, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>Sign Out</button>
      </div>
    </div>
  );

  const F = (label, id, type = 'text', placeholder, obj, setObj, errObj) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4a5c4a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>{label}</label>
      <input className="input" type={type} value={obj[id] || ''} onChange={e => setObj(o => ({ ...o, [id]: e.target.value }))} placeholder={placeholder} />
      {errObj[id] && <div className="field-err">{errObj[id]}</div>}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Topbar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 'var(--topbar-h)', background: 'var(--green-deep)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 100, boxShadow: '0 2px 16px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>🌿 VegLife</span>
          {['overview', 'orders', 'marketplace'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ background: tab === t ? 'rgba(255,255,255,0.15)' : 'transparent', border: tab === t ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent', color: 'white', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600, fontFamily: "'DM Sans',sans-serif", textTransform: 'capitalize' }}>
              {t === 'overview' ? '📊 Overview' : t === 'orders' ? '📦 Orders' : '🏪 Marketplace'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BellDropdown role="FARMER" />
          <div id="farmerDropBtn" style={{ position: 'relative' }}>
            <div onClick={() => setDropOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 10px', borderRadius: 10, background: dropOpen ? 'rgba(255,255,255,0.1)' : 'transparent', transition: 'background 0.2s' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--green-mid))', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {user.profilePicture ? <img src={user.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{(user.name || 'F').charAt(0).toUpperCase()}</span>}
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '0.88rem', fontWeight: 600 }}>{user.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>VegLife Farmer</div>
              </div>
            </div>
            {dropOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'white', borderRadius: 14, padding: '8px 0', minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 200, animation: 'dropIn 0.15s ease' }}>
                {[['✏️ Edit Profile', openEdit], ['🔒 Change Password', () => { setPwOpen(true); setDropOpen(false); setPwForm({}); setPwErrs({}); }], null, ['🚪 Sign Out', logout]].map((item, i) =>
                  item === null ? <div key={i} style={{ height: 1, background: '#f0f0f0', margin: '6px 0' }} /> :
                  <div key={i} onClick={item[1]} style={{ padding: '10px 16px', fontSize: '0.88rem', cursor: 'pointer', color: item[0].includes('Sign') ? '#c0392b' : '#4a5c4a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}
                    onMouseOver={e => e.currentTarget.style.background = item[0].includes('Sign') ? '#fdecea' : 'var(--green-pale)'}
                    onMouseOut={e => e.currentTarget.style.background = ''}>
                    {item[0]}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginTop: 'var(--topbar-h)', maxWidth: 1200, margin: 'var(--topbar-h) auto 0', padding: '28px 24px' }}>
        {tab === 'overview' && (
          <div className="animate-fade">
            {/* Welcome banner */}
            <div style={{ background: 'linear-gradient(135deg, var(--green-deep), var(--green-mid))', borderRadius: 20, padding: '28px 32px', color: 'white', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                {user.farmerIndex && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 20, padding: '4px 14px', marginBottom: 10, fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px' }}>
                    👨‍🌾 ID: {user.farmerIndex}
                  </div>
                )}
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>
                  Good {greeting()}, {user.name.split(' ')[0]}! 🌿
                </div>
                <div style={{ opacity: 0.75, fontSize: '0.9rem' }}>Here's a snapshot of your farm activity on VegLife today</div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '14px 20px' }}>
                <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Account Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: user.status === 'active' ? '#a5d6a7' : '#ef9a9a' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', textTransform: 'capitalize' }}>{user.status}</span>
                </div>
              </div>
              <div style={{ position: 'absolute', right: -40, top: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            </div>

            {/* Stats */}
            <div className="stats-row" style={{ marginBottom: 24 }}>
              {[['📦', '12', 'Total Orders'], ['⏳', '3', 'Pending', 'orange'], ['💰', 'Rs.18,400', 'This Month', 'blue'], ['⭐', '4.8', 'Avg. Rating']].map(([icon, num, label, cls]) => (
                <div key={label} className={`stat-card${cls ? ' ' + cls : ''}`}>
                  <div className="stat-icon">{icon}</div>
                  <div className="stat-num" style={{ fontSize: '1.6rem' }}>{num}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>

            {/* Info card */}
            <div className="card">
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--green-deep)', marginBottom: 16 }}>🌾 My Farm Details</div>
              {[['Farm Location', user.farmLocation], ['Farm Size', user.farmSize], ['Experience', user.yearsOfExperience != null ? `${user.yearsOfExperience} years` : null], ['Cultivated Vegetables', user.cultivatedVegetables]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-light)', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{l}</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{v || '—'}</span>
                </div>
              ))}
              <button onClick={openEdit} className="btn btn-primary" style={{ marginTop: 16, width: '100%' }}>✏️ Update Farm Details</button>
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="animate-fade card" style={{ textAlign: 'center', padding: '48px 36px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 14 }}>📦</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', color: 'var(--green-deep)', marginBottom: 10 }}>Orders Module</div>
            <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>This section is managed by the Orders module — integration in progress.</div>
          </div>
        )}

        {tab === 'marketplace' && (
          <div className="animate-fade card" style={{ textAlign: 'center', padding: '48px 36px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 14 }}>🏪</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', color: 'var(--green-deep)', marginBottom: 10 }}>Marketplace</div>
            <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Browse supplies and list your produce — integration in progress.</div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal open={editOpen} title="Edit My Profile" onClose={() => setEditOpen(false)} width={500}
        actions={<>
          <button className="btn btn-ghost" onClick={() => setEditOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </>}
      >
        <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', color: '#2d5a1b', marginBottom: 16 }}>
          🔒 Email and role cannot be changed. Contact admin for assistance.
        </div>
        {user.farmerIndex && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span style={{ background: 'linear-gradient(135deg, var(--green-deep), var(--green-mid))', color: 'white', fontSize: '0.8rem', fontWeight: 800, padding: '5px 16px', borderRadius: 20, letterSpacing: '2px' }}>👨‍🌾 ID: {user.farmerIndex}</span>
          </div>
        )}
        {/* Profile pic */}
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <div onClick={() => document.getElementById('farmerPicInput').click()} style={{ width: 80, height: 80, borderRadius: '50%', background: picPreview ? 'transparent' : 'linear-gradient(135deg, var(--accent), var(--green-mid))', border: '3px solid var(--green-bright)', overflow: 'hidden', cursor: 'pointer', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {picPreview ? <img src={picPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span style={{ fontSize: '2rem' }}>📷</span>}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>Click to change photo</div>
          <input id="farmerPicInput" type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={handlePic} />
        </div>
        {[['Full Name', 'name', 'text', 'Kamal Perera'], ['Phone Number', 'phone', 'tel', '0771234567'], ['NIC Number', 'nic', 'text', '123456789V']].map(([l, id, t, ph]) => (
          <div key={id} className="form-group">
            <label className="label">{l}</label>
            <input className="input" type={t} value={form[id] || ''} onChange={e => { setForm(f => ({ ...f, [id]: e.target.value })); setErrs(er => ({ ...er, [id]: '' })); }} placeholder={ph} />
            {errs[id] && <div className="field-err">{errs[id]}</div>}
          </div>
        ))}
        <div className="section-divider">Farm Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['Farm Size', 'farmSize', 'e.g. 5 acres'], ['Experience (yrs)', 'yearsOfExperience', '0']].map(([l, id, ph]) => (
            <div key={id} className="form-group">
              <label className="label">{l}</label>
              <input className="input" value={form[id] || ''} onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))} placeholder={ph} />
            </div>
          ))}
        </div>
        {[['Farm Location', 'farmLocation', 'e.g. Kandy'], ['Cultivated Vegetables', 'cultivatedVegetables', 'Tomato, Carrot, Cabbage']].map(([l, id, ph]) => (
          <div key={id} className="form-group">
            <label className="label">{l}</label>
            <input className="input" value={form[id] || ''} onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))} placeholder={ph} />
          </div>
        ))}
      </Modal>

      {/* Change Password Modal */}
      <Modal open={pwOpen} title="Change Password" onClose={() => setPwOpen(false)} width={420}
        actions={<>
          <button className="btn btn-ghost" onClick={() => setPwOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={changePassword} disabled={saving}>{saving ? 'Changing…' : 'Change Password'}</button>
        </>}
      >
        {[['Current Password', 'current', 'Your current password'], ['New Password', 'new', 'Min 6 chars, 1 letter, 1 special'], ['Confirm New Password', 'confirm', 'Repeat new password']].map(([l, id, ph]) => (
          <div key={id} className="form-group">
            <label className="label">{l}</label>
            <input className="input" type="password" value={pwForm[id] || ''} onChange={e => { setPwForm(f => ({ ...f, [id]: e.target.value })); setPwErrs(er => ({ ...er, [id]: '' })); }} placeholder={ph} />
            {pwErrs[id] && <div className="field-err">{pwErrs[id]}</div>}
          </div>
        ))}
      </Modal>
    </div>
  );
}
