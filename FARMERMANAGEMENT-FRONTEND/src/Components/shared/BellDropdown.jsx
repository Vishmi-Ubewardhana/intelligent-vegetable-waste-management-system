import { useState, useEffect, useRef } from 'react';
import { NOTIF_API, fmtDate } from "../../api/index";

const STORAGE_KEY = (role) => `vl_${role.toLowerCase()}_read_notifs`;

export function BellDropdown({ role }) {
  const [notifs, setNotifs] = useState([]);
  const [readIds, setReadIds] = useState(() => new Set(JSON.parse(localStorage.getItem(STORAGE_KEY(role)) || '[]')));
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function load() {
    try {
      const res = await fetch(`${NOTIF_API}/for/${role}`);
      setNotifs(await res.json());
    } catch {}
  }

  function markAllRead() {
    setReadIds(prev => {
      const next = new Set([...prev, ...notifs.map(n => String(n.id))]);
      localStorage.setItem(STORAGE_KEY(role), JSON.stringify([...next]));
      return next;
    });
  }

  function handleOpen() {
    setOpen(v => !v);
    if (!open) setTimeout(markAllRead, 300);
  }

  const unreadCount = notifs.filter(n => !readIds.has(String(n.id))).length;

  const priClass = { INFO: 'tag-pri-info', WARNING: 'tag-pri-warning', URGENT: 'tag-pri-urgent' };
  const priLabel = { INFO: 'Info', WARNING: '⚠️ Warning', URGENT: '🚨 Urgent' };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={handleOpen} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.1rem', position: 'relative', transition: 'background 0.2s' }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
        🔔
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: -3, right: -3, background: '#c0392b', color: 'white', fontSize: '0.6rem', fontWeight: 800, minWidth: 17, height: 17, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '2px solid #1a3a0a' }}>
            {unreadCount}
          </span>
        )}
      </div>

      {open && (
        <div className="bell-dropdown">
          <div className="bell-dd-header">
            <span>🔔 Notifications {unreadCount > 0 && <span style={{ background: 'var(--orange)', fontSize: '0.68rem', padding: '1px 7px', borderRadius: 10, marginLeft: 6 }}>{unreadCount} new</span>}</span>
            <span style={{ fontSize: '0.72rem', opacity: 0.75, cursor: 'pointer' }} onClick={markAllRead}>Mark all read</span>
          </div>
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifs.length === 0
              ? <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-light)', fontSize: '0.85rem' }}>👍 No notifications yet</div>
              : notifs.map(n => {
                const isUnread = !readIds.has(String(n.id));
                return (
                  <div key={n.id} className={`bell-dd-item${isUnread ? ' unread' : ''}`}>
                    <div className="bell-dd-title">
                      {n.title}
                      <span className={`bell-pri ${priClass[n.priority] || 'tag-pri-info'}`}>{priLabel[n.priority] || n.priority}</span>
                    </div>
                    <div className="bell-dd-msg">{n.message}</div>
                    <div className="bell-dd-time">🕐 {fmtDate(n.sentAt)} · VegLife Admin</div>
                  </div>
                );
              })
            }
          </div>
        </div>
      )}
    </div>
  );
}
