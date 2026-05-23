import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { USER_API, NOTIF_API } from '../api/index';
import { showToast } from '../components/shared/Toast';
import { AdminTopbar }       from '../Components/AdminTopbar';
import { AdminSidebar }      from '../Components/AdminSidebar';
import { OverviewTab }       from '../Components/OverviewTab';
import { UserTile }          from '../Components/UserTile';
import { ProfileModal }      from '../Components/ProfileModal';
import { EditModal }         from '../Components/EditModal';
import { RejectModal }       from '../Components/RejectModal';
import { ActivityLogTab }    from '../Components/ActivityLogTab';
import { ReportsTab }        from '../Components/ReportsTab';
import { NotificationsTab }  from '../Components/NotificationsTab';

const STORAGE_LOG    = 'vl_activity_log';
const STORAGE_REJECT = 'vl_reject_reasons';

function PlaceholderTab({ icon, title, desc }) {
  return (
    <div className="animate-fade">
      <div className="card" style={{ textAlign: 'center', padding: '48px 36px' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>{icon}</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', color: 'var(--green-deep)', marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.7 }}>{desc}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--green-pale)', border: '1.5px solid #c8e6c9', borderRadius: 12, padding: '12px 22px', fontSize: '0.84rem', color: 'var(--green-mid)', fontWeight: 600 }}>
          🔗 Integration in progress — coming soon
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const adminUser = JSON.parse(sessionStorage.getItem('loggedUser') || 'null');

  const [tab, setTab] = useState('overview');
  const [farmers, setFarmers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [farmerFilter, setFarmerFilter] = useState('all');
  const [farmerSearch, setFarmerSearch] = useState('');
  const [custSearch, setCustSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [profileUser, setProfileUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [activityLog, setActivityLog] = useState(() => JSON.parse(localStorage.getItem(STORAGE_LOG) || '[]'));
  const [rejectionReasons, setRejectionReasons] = useState(() => JSON.parse(localStorage.getItem(STORAGE_REJECT) || '{}'));
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!adminUser || adminUser.role !== 'ADMIN') { navigate('/'); return; }
    loadData();
    fetchNotifCount();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [f, c] = await Promise.all([
        fetch(`${USER_API}/role/FARMER`).then(r => r.json()),
        fetch(`${USER_API}/role/CUSTOMER`).then(r => r.json()),
      ]);
      setFarmers(Array.isArray(f) ? f : []);
      setCustomers(Array.isArray(c) ? c : []);
    } catch { showToast('Failed to load data. Is the backend running?', true); }
    setLoading(false);
  }

  async function fetchNotifCount() {
    try {
      const res = await fetch(NOTIF_API);
      const list = await res.json();
      setNotifCount(list.length);
    } catch {}
  }

  // Activity log helpers
  function logAction(action, id, detail) {
    const u = [...farmers, ...customers].find(x => x.id === id);
    const name = u ? u.name : `ID ${id}`, role = u ? u.role : '';
    const texts = {
      approve: `Approved ${role} ${name}`, reject: `Rejected ${role} ${name}${detail ? ': ' + detail : ''}`,
      deactivate: `Deactivated ${role} ${name}`, activate: `Activated ${role} ${name}`, edit: `Edited profile of ${role} ${name}`,
    };
    const entry = { action, text: texts[action] || action, time: new Date().toLocaleString('en-LK'), id };
    setActivityLog(prev => {
      const next = [entry, ...prev].slice(0, 200);
      localStorage.setItem(STORAGE_LOG, JSON.stringify(next));
      return next;
    });
  }

  // API actions
  async function approveUser(id) {
    if (!confirm('Approve this farmer?')) return;
    try {
      const res = await fetch(`${USER_API}/approve/${id}`, { method: 'PUT' });
      if (res.ok) { logAction('approve', id); showToast('✅ Farmer approved!'); await loadData(); }
      else showToast('Failed: ' + await res.text(), true);
    } catch { showToast('Network error.', true); }
  }

  async function deactivateUser(id) {
    if (!confirm('Deactivate this user?')) return;
    try {
      const res = await fetch(`${USER_API}/deactivate/${id}`, { method: 'PUT' });
      if (res.ok) { logAction('deactivate', id); showToast('⏸ User deactivated.'); await loadData(); }
      else showToast('Failed: ' + await res.text(), true);
    } catch { showToast('Network error.', true); }
  }

  async function activateUser(id) {
    if (!confirm('Activate this user?')) return;
    try {
      const res = await fetch(`${USER_API}/approve/${id}`, { method: 'PUT' });
      if (res.ok) { logAction('activate', id); showToast('✅ User activated.'); await loadData(); }
      else showToast('Failed: ' + await res.text(), true);
    } catch { showToast('Network error.', true); }
  }

  async function confirmReject(id, reason) {
    try {
      const res = await fetch(`${USER_API}/deactivate/${id}`, { method: 'PUT' });
      if (res.ok) {
        const rr = { ...rejectionReasons, [id]: reason };
        setRejectionReasons(rr);
        localStorage.setItem(STORAGE_REJECT, JSON.stringify(rr));
        logAction('reject', id, reason);
        setRejectId(null);
        showToast('❌ Application rejected.');
        await loadData();
      } else showToast('Failed: ' + await res.text(), true);
    } catch { showToast('Network error.', true); }
  }

  async function saveEdit(id, data) {
    try {
      const res = await fetch(`${USER_API}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { logAction('edit', id); setEditUser(null); showToast('✅ User updated!'); await loadData(); }
      else showToast('Update failed: ' + await res.text(), true);
    } catch { showToast('Network error.', true); }
  }

  // Bulk
  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function bulkApprove() {
    const ids = [...selectedIds].filter(id => { const u = [...farmers, ...customers].find(x => x.id === id); return u?.status === 'pending'; });
    if (!ids.length || !confirm(`Approve ${ids.length} farmer(s)?`)) return;
    let ok = 0;
    for (const id of ids) { try { const r = await fetch(`${USER_API}/approve/${id}`, { method: 'PUT' }); if (r.ok) { ok++; logAction('approve', id); } } catch {} }
    showToast(`✅ ${ok} approved!`); setSelectedIds(new Set()); await loadData();
  }

  async function bulkDeactivate() {
    const ids = [...selectedIds];
    if (!confirm(`Deactivate ${ids.length} user(s)?`)) return;
    let ok = 0;
    for (const id of ids) { try { const r = await fetch(`${USER_API}/deactivate/${id}`, { method: 'PUT' }); if (r.ok) { ok++; logAction('deactivate', id); } } catch {} }
    showToast(`⏸ ${ok} deactivated.`); setSelectedIds(new Set()); await loadData();
  }

  function viewProfile(id) {
    const u = [...farmers, ...customers].find(x => x.id === id);
    if (u) setProfileUser(u);
  }

  // Filtered data
  const pendingCount = farmers.filter(f => f.status === 'pending').length;
  const allUsers = [...farmers, ...customers];
  let displayFarmers = farmers;
  if (farmerFilter !== 'all') displayFarmers = displayFarmers.filter(f => f.status === farmerFilter);
  if (farmerSearch) displayFarmers = displayFarmers.filter(f =>
    [f.name, f.email, f.farmLocation].some(s => (s || '').toLowerCase().includes(farmerSearch.toLowerCase()))
  );
  const displayCustomers = custSearch
    ? customers.filter(c => [c.name, c.email, c.phone].some(s => (s || '').toLowerCase().includes(custSearch.toLowerCase())))
    : customers;

  const hasPendingSelected = [...selectedIds].some(id => allUsers.find(u => u.id === id)?.status === 'pending');

  function renderTiles(data, isCustomer = false) {
    if (loading) return <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text-light)' }}>Loading…</div>;
    if (!data.length) return (
      <div className="empty-state">
        <div className="empty-icon">{isCustomer ? '🛒' : '👨‍🌾'}</div>
        <div className="empty-text">No {isCustomer ? 'customers' : 'farmers'} found</div>
        <div className="empty-sub">Try adjusting your filter or search</div>
      </div>
    );
    return data.map(u => (
      <UserTile key={u.id} user={u}
        selected={selectedIds.has(u.id)}
        onSelect={toggleSelect}
        onView={viewProfile}
        onApprove={approveUser}
        onReject={id => setRejectId(id)}
        onDeactivate={deactivateUser}
        onActivate={activateUser}
        rejectionReason={rejectionReasons[u.id]}
      />
    ));
  }

  const FILTER_CHIPS = [
    { val: 'all', label: 'All Farmers' }, { val: 'pending', label: '⏳ Pending' },
    { val: 'active', label: '✅ Active' }, { val: 'inactive', label: '⛔ Inactive' },
  ];

  return (
    <div>
      <AdminTopbar adminUser={adminUser} farmers={farmers} onNavigate={(t, id) => { setTab(t); if (id) setTimeout(() => viewProfile(id), 100); }} />
      <AdminSidebar active={tab} onSwitch={setTab} pendingCount={pendingCount} notifCount={notifCount} />

      <div style={{ marginTop: 'var(--topbar-h)', marginLeft: 'var(--sidebar-w)', padding: 28, minHeight: 'calc(100vh - var(--topbar-h))' }}>

        {tab === 'overview' && (
          <OverviewTab adminUser={adminUser} farmers={farmers} customers={customers} activityLog={activityLog}
            onNavigate={setTab} onApprove={approveUser} />
        )}

        {tab === 'farmers' && (
          <div className="animate-fade">
            <div className="page-header">
              <div><div className="page-title">Farmers</div><div className="page-sub">Review, approve and manage registered farmers</div></div>
              <div className="page-actions">
                <div className="search-box-wrap">
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: 'var(--text-light)' }}>🔍</span>
                  <input className="search-box" style={{ paddingLeft: 36 }} placeholder="Search farmers…" value={farmerSearch} onChange={e => setFarmerSearch(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="stats-row">
              {[['👨‍🌾', farmers.length, 'Total'], ['⏳', pendingCount, 'Pending', 'orange'], ['✅', farmers.filter(f=>f.status==='active').length, 'Active', 'blue'], ['⛔', farmers.filter(f=>f.status==='inactive').length, 'Inactive', 'red']].map(([icon, num, label, cls]) => (
                <div key={label} className={`stat-card${cls ? ' '+cls : ''}`}>
                  <div className="stat-icon">{icon}</div><div className="stat-num">{num}</div><div className="stat-label">{label} Farmers</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {FILTER_CHIPS.map(c => (
                <button key={c.val} className={`filter-chip${farmerFilter === c.val ? ' active' : ''}`} onClick={() => { setFarmerFilter(c.val); setSelectedIds(new Set()); }}>{c.label}</button>
              ))}
            </div>
            <div className="tiles-grid">{renderTiles(displayFarmers)}</div>
          </div>
        )}

        {tab === 'customers' && (
          <div className="animate-fade">
            <div className="page-header">
              <div><div className="page-title">Customers</div><div className="page-sub">View and manage all registered customers</div></div>
              <div className="page-actions">
                <div className="search-box-wrap">
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: 'var(--text-light)' }}>🔍</span>
                  <input className="search-box" style={{ paddingLeft: 36 }} placeholder="Search customers…" value={custSearch} onChange={e => setCustSearch(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="stats-row">
              {[['🛒', customers.length, 'Total'], ['✅', customers.filter(c=>c.status==='active').length, 'Active', 'blue'], ['⛔', customers.filter(c=>c.status==='inactive').length, 'Inactive', 'red']].map(([icon, num, label, cls]) => (
                <div key={label} className={`stat-card${cls ? ' '+cls : ''}`}>
                  <div className="stat-icon">{icon}</div><div className="stat-num">{num}</div><div className="stat-label">{label}</div>
                </div>
              ))}
            </div>
            <div className="tiles-grid">{renderTiles(displayCustomers, true)}</div>
          </div>
        )}

        {tab === 'stock' && <PlaceholderTab icon="📦" title="Stock Management" desc="Vegetable inventory and stock control — integration in progress." />}
        {tab === 'reports' && <ReportsTab farmers={farmers} customers={customers} activityLog={activityLog} rejectionReasons={rejectionReasons} />}
        {tab === 'activity' && <ActivityLogTab log={activityLog} allUsers={allUsers} onClear={() => { setActivityLog([]); localStorage.setItem(STORAGE_LOG, '[]'); }} />}
        {tab === 'notifications' && <NotificationsTab adminUser={adminUser} />}
        {tab === 'payments' && <PlaceholderTab icon="💳" title="Payment Dashboard" desc="This section is managed by the Payment Module." />}
        {tab === 'delivery' && <PlaceholderTab icon="🚚" title="Delivery Dashboard" desc="This section is managed by the Delivery Module." />}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bulk-bar">
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedIds.size} selected</span>
          {hasPendingSelected && <button className="btn" style={{ background: 'var(--green-bright)', color: 'white', padding: '8px 18px' }} onClick={bulkApprove}>✓ Approve All</button>}
          <button className="btn" style={{ background: 'var(--orange)', color: 'white', padding: '8px 18px' }} onClick={bulkDeactivate}>⏸ Deactivate All</button>
          <button className="btn btn-ghost" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 18px' }} onClick={() => setSelectedIds(new Set())}>✕ Cancel</button>
        </div>
      )}

      {/* Modals */}
      <ProfileModal user={profileUser} onClose={() => setProfileUser(null)}
        onApprove={approveUser} onReject={id => { setProfileUser(null); setRejectId(id); }}
        onDeactivate={deactivateUser} onActivate={activateUser}
        onEdit={u => setEditUser(u)} rejectionReason={rejectionReasons[profileUser?.id]} />

      <EditModal user={editUser} onClose={() => setEditUser(null)} onSave={saveEdit} />

      <RejectModal userId={rejectId} onClose={() => setRejectId(null)} onConfirm={confirmReject} />
    </div>
  );
}
