import { useState } from 'react';
import { profileCompletion } from '../api/index';

export function ReportsTab({ farmers, customers, activityLog, rejectionReasons }) {
  const [type, setType] = useState('overview');

  const now = new Date().toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' });

  const reportCards = [
    { id: 'overview',   icon: '📋', title: 'Platform Overview',  desc: 'Full system summary & KPIs' },
    { id: 'farmers',    icon: '👨‍🌾', title: 'Farmer Analytics', desc: 'Approval rates & farm insights' },
    { id: 'customers',  icon: '🛒', title: 'Customer Analytics', desc: 'Registrations & activity data' },
  ];

  function renderContent() {
    if (type === 'overview') {
      const tf = farmers.length, tc = customers.length;
      const af = farmers.filter(f => f.status === 'active').length;
      const pf = farmers.filter(f => f.status === 'pending').length;
      const ac = customers.filter(c => c.status === 'active').length;
      const total = tf + tc, aRate = total ? Math.round((af + ac) / total * 100) : 0;
      return <>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.2rem', color: 'var(--green-deep)', marginBottom: 4 }}>📋 Platform Overview Report</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: 20 }}>Generated on {now} · VegLife · Sri Lanka</div>
        <div className="report-kpis">
          {[['Total Users', total], ['Farmers', tf], ['Customers', tc], ['Active Rate', `${aRate}%`]].map(([l, v]) => (
            <div key={l} className="report-kpi"><div className="report-kpi-val">{v}</div><div className="report-kpi-label">{l}</div></div>
          ))}
        </div>
        <div className="report-row"><span>Farmers Pending Approval</span><span className={`report-row-val${pf > 0 ? ' warn' : ''}`}>{pf}</span></div>
        <div className="report-row"><span>Active Farmers</span><span className="report-row-val">{af}</span></div>
        <div className="report-row"><span>Active Customers</span><span className="report-row-val">{ac}</span></div>
        <div className="report-row"><span>Total Actions Logged</span><span className="report-row-val">{activityLog.length}</span></div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-mid)', marginBottom: 6 }}><span>Platform Active Rate</span><span>{aRate}%</span></div>
          <div className="report-progress-track"><div className="report-progress-fill" style={{ width: `${aRate}%` }} /></div>
        </div>
        {pf > 0 && <div className="alert-box"><span>⚠️</span><div><strong>{pf} farmer(s) awaiting approval.</strong></div></div>}
      </>;
    }

    if (type === 'farmers') {
      const active = farmers.filter(f => f.status === 'active');
      const pending = farmers.filter(f => f.status === 'pending');
      const inactive = farmers.filter(f => f.status === 'inactive');
      const avgExp = active.length ? (active.reduce((s, f) => s + (f.yearsOfExperience || 0), 0) / active.length).toFixed(1) : 'N/A';
      const approvalRate = farmers.length ? Math.round(active.length / farmers.length * 100) : 0;
      const avgComp = farmers.length ? Math.round(farmers.reduce((s, f) => s + profileCompletion(f), 0) / farmers.length) : 0;
      const vegCounts = {};
      farmers.forEach(f => { if (f.cultivatedVegetables) f.cultivatedVegetables.split(',').forEach(v => { v = v.trim(); vegCounts[v] = (vegCounts[v] || 0) + 1; }); });
      const topVeg = Object.entries(vegCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      return <>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.2rem', color: 'var(--green-deep)', marginBottom: 4 }}>👨‍🌾 Farmer Analytics Report</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: 20 }}>Generated on {now} · VegLife · Sri Lanka</div>
        <div className="report-kpis">
          {[['Total', farmers.length], ['Active', active.length], ['Pending', pending.length], ['Inactive', inactive.length]].map(([l, v]) => (
            <div key={l} className="report-kpi"><div className="report-kpi-val">{v}</div><div className="report-kpi-label">{l}</div></div>
          ))}
        </div>
        <div className="report-row"><span>Approval Rate</span><span className="report-row-val">{approvalRate}%</span></div>
        <div className="report-row"><span>Avg. Experience (Active)</span><span className="report-row-val">{avgExp} yrs</span></div>
        <div className="report-row"><span>Avg. Profile Completion</span><span className="report-row-val">{avgComp}%</span></div>
        <div className="report-row"><span>Rejected Applications</span><span className="report-row-val">{Object.keys(rejectionReasons).length}</span></div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-mid)', marginBottom: 6 }}><span>Approval Rate</span><span>{approvalRate}%</span></div>
          <div className="report-progress-track"><div className="report-progress-fill" style={{ width: `${approvalRate}%` }} /></div>
        </div>
        {topVeg.length > 0 && <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-mid)', marginBottom: 8 }}>TOP CULTIVATED VEGETABLES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {topVeg.map(([v, c]) => <span key={v} className="veg-tag">{v} ({c})</span>)}
          </div>
        </div>}
        {pending.length > 0 && <div className="alert-box" style={{ marginTop: 16 }}><span>⚠️</span><div><strong>{pending.length} farmer(s) pending review.</strong></div></div>}
      </>;
    }

    if (type === 'customers') {
      const active = customers.filter(c => c.status === 'active');
      const inactive = customers.filter(c => c.status === 'inactive');
      const withAddr = customers.filter(c => c.deliveryAddress?.trim());
      const activeRate = customers.length ? Math.round(active.length / customers.length * 100) : 0;
      const avgComp = customers.length ? Math.round(customers.reduce((s, c) => s + profileCompletion(c), 0) / customers.length) : 0;
      return <>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.2rem', color: 'var(--green-deep)', marginBottom: 4 }}>🛒 Customer Analytics Report</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: 20 }}>Generated on {now} · VegLife · Sri Lanka</div>
        <div className="report-kpis">
          {[['Total', customers.length], ['Active', active.length], ['Inactive', inactive.length], ['Active Rate', `${activeRate}%`]].map(([l, v]) => (
            <div key={l} className="report-kpi"><div className="report-kpi-val">{v}</div><div className="report-kpi-label">{l}</div></div>
          ))}
        </div>
        <div className="report-row"><span>With Delivery Address</span><span className="report-row-val">{withAddr.length}</span></div>
        <div className="report-row"><span>Missing Address</span><span className={`report-row-val${(customers.length - withAddr.length) > 0 ? ' warn' : ''}`}>{customers.length - withAddr.length}</span></div>
        <div className="report-row"><span>Avg. Profile Completion</span><span className="report-row-val">{avgComp}%</span></div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-mid)', marginBottom: 6 }}><span>Active Rate</span><span>{activeRate}%</span></div>
          <div className="report-progress-track"><div className="report-progress-fill" style={{ width: `${activeRate}%` }} /></div>
        </div>
      </>;
    }
  }

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div><div className="page-title">Reports</div><div className="page-sub">Analytics and insights for VegLife platform</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
        {reportCards.map(r => (
          <div key={r.id} onClick={() => setType(r.id)}
            style={{ background: 'var(--white)', border: `2px solid ${type === r.id ? 'var(--green-bright)' : '#e0e8e0'}`, borderRadius: 16, padding: '20px', cursor: 'pointer', textAlign: 'center', background: type === r.id ? 'var(--green-pale)' : 'var(--white)', transition: 'all 0.2s' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>{r.icon}</div>
            <div style={{ fontWeight: 700, color: 'var(--green-deep)', fontSize: '0.95rem' }}>{r.title}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: 4 }}>{r.desc}</div>
          </div>
        ))}
      </div>

      <div className="card">{renderContent()}</div>
    </div>
  );
}
