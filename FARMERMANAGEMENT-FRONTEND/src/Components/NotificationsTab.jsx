import { useState, useEffect } from 'react';
import { NOTIF_API, fmtTime } from '../api/index';
import { showToast } from './shared/Toast';

export function NotificationsTab({ adminUser }) {
  const [target, setTarget] = useState('FARMER');
  const [priority, setPriority] = useState('INFO');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [notifs, setNotifs] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch(NOTIF_API);
      setNotifs(await res.json());
    } catch { setNotifs([]); }
  }

  async function send() {
    if (!title.trim()) { showToast('Please enter a title.', true); return; }
    if (!message.trim()) { showToast('Please enter a message.', true); return; }
    setSending(true);
    try {
      const res = await fetch(NOTIF_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, targetRole: target, priority, sentByName: adminUser?.name || 'Admin' })
      });
      if (res.ok) { showToast('✅ Notification sent!'); setTitle(''); setMessage(''); load(); }
      else showToast('Failed: ' + await res.text(), true);
    } catch { showToast('Network error.', true); }
    setSending(false);
  }

  async function del(id) {
    if (!confirm('Delete this notification?')) return;
    try {
      const res = await fetch(`${NOTIF_API}/${id}`, { method: 'DELETE' });
      if (res.ok) { showToast('Notification deleted.'); load(); }
      else showToast('Failed to delete.', true);
    } catch { showToast('Network error.', true); }
  }

  const targetLabels = { FARMER: 'Farmers', CUSTOMER: 'Customers', ALL: 'Everyone (Farmers + Customers)' };
  const dotClass = { INFO: 'dot-info', WARNING: 'dot-warning', URGENT: 'dot-urgent' };
  const tagClass = { FARMER: 'tag-farmer', CUSTOMER: 'tag-customer', ALL: 'tag-all' };
  const tagLabel = { FARMER: '👨‍🌾 Farmers', CUSTOMER: '🛒 Customers', ALL: '🌐 Everyone' };
  const priTagClass = { INFO: 'tag-pri-info', WARNING: 'tag-pri-warning', URGENT: 'tag-pri-urgent' };
  const priLabel = { INFO: 'ℹ️ Info', WARNING: '⚠️ Warning', URGENT: '🚨 Urgent' };

  const fCount = notifs.filter(n => n.targetRole === 'FARMER').length;
  const cCount = notifs.filter(n => n.targetRole === 'CUSTOMER').length;
  const aCount = notifs.filter(n => n.targetRole === 'ALL').length;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Notifications</div>
          <div className="page-sub">Send announcements and alerts to farmers, customers, or everyone</div>
        </div>
      </div>

      {/* Compose card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--green-deep)', marginBottom: 20 }}>✏️ Compose Notification</div>

        {/* Target */}
        <div style={{ marginBottom: 16 }}>
          <div className="label" style={{ marginBottom: 8 }}>Send To</div>
          <div className="notif-target-row">
            {['FARMER', 'CUSTOMER', 'ALL'].map(t => (
              <button key={t} onClick={() => setTarget(t)}
                className={`notif-target-btn${target === t ? ' t-' + t.toLowerCase() : ''}`}>
                {t === 'FARMER' ? '👨‍🌾 Farmers Only' : t === 'CUSTOMER' ? '🛒 Customers Only' : '🌐 Everyone'}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div style={{ marginBottom: 16 }}>
          <div className="label" style={{ marginBottom: 8 }}>Priority</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['INFO', 'WARNING', 'URGENT'].map(p => (
              <button key={p} onClick={() => setPriority(p)}
                className={`priority-chip p-${p.toLowerCase()}${priority === p ? ' sel' : ''}`}>
                {p === 'INFO' ? 'ℹ️ Info' : p === 'WARNING' ? '⚠️ Warning' : '🚨 Urgent'}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="label">Title</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Scheduled Maintenance on Saturday" maxLength={120} />
        </div>

        {/* Message */}
        <div className="form-group">
          <label className="label">Message</label>
          <textarea className="input" rows={3} style={{ resize: 'vertical' }}
            value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Write your notification message here…" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>
            Will be sent to: <strong style={{ color: 'var(--green-mid)' }}>{targetLabels[target]}</strong>
          </div>
          <button className="btn btn-primary" onClick={send} disabled={sending} style={{ padding: '12px 28px' }}>
            {sending ? '⏳ Sending…' : '🔔 Send Notification'}
          </button>
        </div>
      </div>

      {/* Sent list */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', background: 'var(--green-deep)', color: 'white', fontWeight: 700, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span>📨 Sent Notifications</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['tag-farmer', `${fCount} to Farmers`], ['tag-customer', `${cCount} to Customers`], ['tag-all', `${aCount} to All`]].map(([cls, label]) => (
              <span key={cls} className={`notif-meta-tag ${cls}`}>{label}</span>
            ))}
          </div>
        </div>

        {notifs.length === 0
          ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)', fontSize: '0.9rem' }}>ℹ️ No notifications sent yet.</div>
          : notifs.map(n => (
            <div key={n.id} className="notif-card">
              <div className={`notif-priority-dot ${dotClass[n.priority] || 'dot-info'}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.92rem', marginBottom: 4 }}>{n.title}</div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 8 }}>{n.message}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`notif-meta-tag ${tagClass[n.targetRole] || 'tag-all'}`}>{tagLabel[n.targetRole] || n.targetRole}</span>
                  <span className={`notif-meta-tag ${priTagClass[n.priority] || 'tag-pri-info'}`}>{priLabel[n.priority] || n.priority}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Sent {fmtTime(n.sentAt)} by {n.sentByName}</span>
                </div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => del(n.id)}>🗑 Delete</button>
            </div>
          ))
        }
      </div>
    </div>
  );
}
