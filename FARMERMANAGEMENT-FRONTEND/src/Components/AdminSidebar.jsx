export function AdminSidebar({ active, onSwitch, pendingCount, notifCount }) {
  const navItems = [
    { id: 'overview',       icon: '🏠', label: 'Overview',      section: 'Overview' },
    { id: 'farmers',        icon: '👨‍🌾', label: 'Farmers',       section: 'Management', badge: pendingCount },
    { id: 'customers',      icon: '🛒', label: 'Customers',     section: null },
    { id: 'stock',          icon: '📦', label: 'Stock Mgmt',    section: null },
    { id: 'reports',        icon: '📊', label: 'Reports',       section: 'Analytics' },
    { id: 'activity',       icon: '📋', label: 'Activity Log',  section: null },
    { id: 'notifications',  icon: '🔔', label: 'Notifications', section: null, badge: notifCount, badgeColor: 'var(--blue)' },
    { id: 'payments',       icon: '💳', label: 'Payments',      section: 'Integrations' },
    { id: 'delivery',       icon: '🚚', label: 'Delivery',      section: null },
  ];

  let lastSection = null;

  return (
    <div style={{
      position: 'fixed', top: 'var(--topbar-h)', left: 0, width: 'var(--sidebar-w)',
      bottom: 0, background: 'var(--white)', borderRight: '1px solid #e0e8e0',
      padding: '20px 0', zIndex: 90, overflowY: 'auto',
      boxShadow: '2px 0 8px rgba(0,0,0,0.04)'
    }}>
      {navItems.map(item => {
        const showSection = item.section && item.section !== lastSection;
        if (item.section) lastSection = item.section;
        return (
          <div key={item.id}>
            {showSection && (
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--text-light)', padding: '14px 20px 6px' }}>
                {item.section}
              </div>
            )}
            <div
              onClick={() => onSwitch(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                color: active === item.id ? 'var(--green-mid)' : 'var(--text-mid)',
                fontSize: '0.9rem', fontWeight: active === item.id ? 600 : 500,
                cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                borderLeft: active === item.id ? '3px solid var(--green-bright)' : '3px solid transparent',
                background: active === item.id ? 'var(--green-light)' : '',
              }}
              onMouseOver={e => { if (active !== item.id) { e.currentTarget.style.background = 'var(--green-pale)'; e.currentTarget.style.color = 'var(--green-mid)'; } }}
              onMouseOut={e => { if (active !== item.id) { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-mid)'; } }}
            >
              <span style={{ fontSize: '1.1rem', width: 22, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
              {item.badge > 0 && (
                <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: item.badgeColor || 'var(--orange)', color: 'white', fontSize: '0.68rem', fontWeight: 700, minWidth: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                  {item.badge}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
