import { greeting } from '../api/index';

export function OverviewTab({ adminUser, farmers, customers, activityLog, onNavigate, onApprove }) {
  const tf = farmers.length, tc = customers.length;
  const pf = farmers.filter(f => f.status === 'pending').length;
  const af = farmers.filter(f => f.status === 'active').length;
  const ac = customers.filter(c => c.status === 'active').length;
  const pending = farmers.filter(f => f.status === 'pending');
  const recent = activityLog.slice(0, 6);
  const dotClass = { approve: '#4a9e3f', reject: 'var(--red)', deactivate: 'var(--orange)', activate: 'var(--blue)', edit: '#4a9e3f' };

  return (
    <div className="animate-fade">
      {/* Welcome banner */}
      <div style={{ background: 'linear-gradient(135deg, var(--green-deep), var(--green-mid))', borderRadius: 20, padding: '28px 32px', color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>
            Good {greeting()}, {(adminUser?.name || 'Admin').split(' ')[0]} 👋
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.75 }}>Here's what's happening on VegLife today</div>
        </div>
        <div style={{ fontSize: '3rem' }}>🌿</div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card clickable" onClick={() => onNavigate('farmers')}>
          <div className="stat-icon">👨‍🌾</div><div className="stat-num">{tf}</div><div className="stat-label">Total Farmers</div>
        </div>
        <div className="stat-card orange clickable" onClick={() => onNavigate('farmers')}>
          <div className="stat-icon">⏳</div><div className="stat-num">{pf}</div><div className="stat-label">Pending Approvals</div>
        </div>
        <div className="stat-card blue clickable" onClick={() => onNavigate('customers')}>
          <div className="stat-icon">🛒</div><div className="stat-num">{tc}</div><div className="stat-label">Total Customers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div><div className="stat-num">{af + ac}</div><div className="stat-label">Active Users</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Pending approvals */}
        <div className="card">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--green-deep)', marginBottom: 16 }}>⏳ Pending Farmer Approvals</div>
          {pending.length === 0
            ? <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-light)', fontSize: '0.85rem' }}>🎉 No pending approvals</div>
            : <>
              {pending.slice(0, 5).map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f0f5f0' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--green-mid))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                    {(f.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {f.name}
                      {f.farmerIndex && <span style={{ fontSize: '0.68rem', background: 'var(--green-light)', color: 'var(--green-mid)', borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>{f.farmerIndex}</span>}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-light)' }}>{f.email}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onApprove(f.id)}>✓ Approve</button>
                </div>
              ))}
              {pending.length > 5 && (
                <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                  +{pending.length - 5} more — <span style={{ color: 'var(--green-mid)', cursor: 'pointer', fontWeight: 600 }} onClick={() => onNavigate('farmers')}>View all</span>
                </div>
              )}
            </>
          }
        </div>

        {/* Recent activity */}
        <div className="card">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--green-deep)', marginBottom: 16 }}>📋 Recent Activity</div>
          {recent.length === 0
            ? <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-light)', fontSize: '0.85rem' }}>No recent activity</div>
            : recent.map((l, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < recent.length - 1 ? '1px solid #f0f5f0' : '' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 6, background: dotClass[l.action] || 'var(--green-bright)' }} />
                <div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-dark)', lineHeight: 1.4 }}>{l.text}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: 2 }}>{l.time}</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
