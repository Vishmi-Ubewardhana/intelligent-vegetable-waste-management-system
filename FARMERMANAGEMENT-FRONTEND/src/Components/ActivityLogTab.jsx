import { useState } from 'react';
import { showToast } from './shared/Toast';

const FILTERS = ['all', 'approve', 'reject', 'deactivate', 'activate', 'edit'];
const FILTER_LABELS = { all: 'All', approve: '✅ Approvals', reject: '❌ Rejections', deactivate: '⏸ Deactivations', activate: '▶ Activations', edit: '✏ Edits' };
const ACTION_BADGE = { approve: 'log-approve', reject: 'log-reject', deactivate: 'log-deactivate', activate: 'log-activate', edit: 'log-edit' };
const ACTION_LABEL = { approve: 'Approved', reject: 'Rejected', deactivate: 'Deactivated', activate: 'Activated', edit: 'Edited' };

export function ActivityLogTab({ log, allUsers, onClear }) {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? log : log.filter(l => l.action === filter);

  function clear() {
    if (!confirm('Clear all activity log entries?')) return;
    onClear();
    showToast('Activity log cleared.');
  }

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Activity Log</div>
          <div className="page-sub">All admin actions recorded</div>
        </div>
        <div className="page-actions">
          <button onClick={clear} style={{ padding: '8px 16px', background: '#f8d7da', color: 'var(--red)', border: '1.5px solid #f5c6cb', borderRadius: 9, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>🗑 Clear Log</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button key={f} className={`filter-chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="log-table-wrap">
        <table className="log-table">
          <thead>
            <tr><th>Time</th><th>Action</th><th>User</th><th>Details</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>No activity recorded yet</td></tr>
              : filtered.map((l, i) => {
                const u = allUsers.find(x => x.id === l.id);
                return (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-light)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{l.time}</td>
                    <td><span className={`log-action-badge ${ACTION_BADGE[l.action] || ''}`}>{ACTION_LABEL[l.action] || l.action}</span></td>
                    <td>
                      <strong>{u ? u.name : 'Unknown'}</strong>
                      <br /><span style={{ fontSize: '0.74rem', color: 'var(--text-light)' }}>{u ? u.email : ''}</span>
                    </td>
                    <td style={{ color: 'var(--text-mid)', fontSize: '0.84rem' }}>{l.text}</td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
