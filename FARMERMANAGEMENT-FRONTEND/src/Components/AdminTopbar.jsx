import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export function AdminTopbar({ adminUser, farmers, onNavigate }) {
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const searchRef = useRef();
  const bellRef = useRef();

  const pending = farmers.filter(f => f.status === 'pending');

  // Search
  const allFarmers = farmers || [];
  const allCustomers = []; // passed in via prop if needed
  const q = searchVal.trim().toLowerCase();
  const fMatches = q ? allFarmers.filter(f =>
    (f.name || '').toLowerCase().includes(q) ||
    (f.email || '').toLowerCase().includes(q) ||
    (f.farmLocation || '').toLowerCase().includes(q)
  ).slice(0, 4) : [];

  useEffect(() => {
    function handler(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function logout() {
    sessionStorage.removeItem('loggedUser');
    navigate('/');
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 'var(--topbar-h)',
      background: 'var(--green-deep)', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 28px', zIndex: 100,
      boxShadow: '0 2px 16px rgba(0,0,0,0.25)'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 80 80" fill="none">
              <path d="M40 8C40 8,68 18,68 42C68 62,54 72,40 74C26 72,12 62,12 42C12 18,40 8,40 8Z" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
              <path d="M40 8L40 74" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M40 30L56 40M40 30L24 40" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>VegLife</span>
        </div>
        <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.75)', padding: '3px 10px', borderRadius: 20, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admin Panel</span>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Global Search */}
        <div style={{ position: 'relative' }} ref={searchRef}>
          <input
            style={{
              padding: '9px 16px 9px 36px', border: '1.5px solid rgba(255,255,255,0.2)',
              borderRadius: 22, fontSize: '0.85rem', width: searchVal || searchOpen ? 260 : 210,
              outline: 'none', background: 'rgba(255,255,255,0.1)', color: 'white',
              fontFamily: "'DM Sans', sans-serif", transition: 'width 0.3s'
            }}
            placeholder="Search farmers & users…"
            value={searchVal}
            onChange={e => { setSearchVal(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
          />
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>🔍</span>
          {searchOpen && q && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: 300, background: 'white', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 201, overflow: 'hidden' }}>
              {fMatches.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-light)', fontSize: '0.85rem' }}>No results for "{searchVal}"</div>
              ) : (
                <>
                  <div style={{ padding: '8px 16px 4px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-light)', background: '#f9fbf9' }}>👨‍🌾 Farmers</div>
                  {fMatches.map(f => (
                    <div key={f.id} onClick={() => { onNavigate('farmers', f.id); setSearchOpen(false); setSearchVal(''); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--green-pale)'}
                      onMouseOut={e => e.currentTarget.style.background = ''}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--green-mid))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>
                        {(f.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.87rem', color: 'var(--text-dark)' }}>{f.name} {f.farmerIndex && <span style={{ fontSize: '0.68rem', background: 'var(--green-light)', color: 'var(--green-mid)', borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>{f.farmerIndex}</span>}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-light)' }}>{f.email} · {f.status}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Bell */}
        <div style={{ position: 'relative' }} ref={bellRef}>
          <div onClick={() => setBellOpen(v => !v)} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.1rem', position: 'relative' }}>
            🔔
            {pending.length > 0 && <span style={{ position: 'absolute', top: 3, right: 3, width: 10, height: 10, background: 'var(--orange)', borderRadius: '50%', border: '2px solid var(--green-deep)' }} />}
          </div>
          {bellOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 320, background: 'white', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 201, overflow: 'hidden', animation: 'dropIn 0.18s ease' }}>
              <div style={{ padding: '13px 18px', background: 'var(--green-deep)', color: 'white', fontWeight: 700, fontSize: '0.88rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Notifications <span style={{ background: 'var(--orange)', color: 'white', fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>{pending.length}</span></span>
                <span style={{ fontSize: '0.74rem', opacity: 0.75, cursor: 'pointer' }} onClick={() => setBellOpen(false)}>Clear all</span>
              </div>
              {pending.length === 0 ? (
                <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-light)', fontSize: '0.85rem' }}>🎉 No new notifications</div>
              ) : (
                pending.slice(0, 8).map(f => (
                  <div key={f.id} onClick={() => { onNavigate('farmers', f.id); setBellOpen(false); }}
                    style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f0f5f0', cursor: 'pointer' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--green-pale)'}
                    onMouseOut={e => e.currentTarget.style.background = ''}>
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>👨‍🌾</span>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 500, color: 'var(--text-dark)', lineHeight: 1.4 }}><strong>{f.name}</strong> is awaiting approval</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: 2 }}>{f.farmLocation || 'Location not set'} · {f.farmerIndex || 'Pending'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Admin info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'white' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--green-bright))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.88rem', border: '2px solid rgba(255,255,255,0.3)' }}>
            {(adminUser?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{adminUser?.name || 'Admin'}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>System Administrator</div>
          </div>
        </div>
        <button onClick={logout} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
