import { CompletionBar } from './shared/CompletionBar';

export function UserTile({ user, selected, onSelect, onView, onApprove, onReject, onDeactivate, onActivate, rejectionReason }) {
  const isFarmer = user.role === 'FARMER';

  return (
    <div
      className={`tile${selected ? ' selected' : ''}`}
      id={`tile-${user.id}`}
    >
      {/* Checkbox */}
      <div
        className={`tile-check${selected ? ' checked' : ''}`}
        onClick={(e) => { e.stopPropagation(); onSelect(user.id); }}
      >
        {selected ? '✓' : ''}
      </div>

      {/* Pending dot */}
      {user.status === 'pending' && <div className="tile-pending-dot" />}

      {/* Main clickable area */}
      <div onClick={() => onView(user.id)}>
        {/* Avatar */}
        {user.profilePicture
          ? <img src={user.profilePicture} className="tile-avatar" alt={user.name} />
          : <div className="tile-avatar-ph">{(user.name || '?').charAt(0).toUpperCase()}</div>
        }

        {/* Farmer index badge */}
        {isFarmer && user.farmerIndex && (
          <div className="farmer-index-badge">{user.farmerIndex}</div>
        )}

        <div className="tile-name">{user.name}</div>
        <div className="tile-email">{user.email}</div>
        <span className={`status-badge status-${user.status}`}>{user.status}</span>

        <CompletionBar user={user} />

        {rejectionReason && (
          <div style={{ fontSize: '0.7rem', color: 'var(--red)', marginTop: 5, padding: '4px 8px', background: '#fff0f0', borderRadius: 6, textAlign: 'left' }}>
            Rejected: {rejectionReason.substring(0, 38)}…
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
        {user.status === 'pending' && <>
          <button className="btn btn-primary btn-sm" onClick={() => onApprove(user.id)}>✓</button>
          <button className="btn btn-danger btn-sm" onClick={() => onReject(user.id)}>✗ Reject</button>
        </>}
        {user.status === 'active' && (
          <button className="btn btn-orange btn-sm" onClick={() => onDeactivate(user.id)}>⏸</button>
        )}
        {user.status === 'inactive' && (
          <button className="btn btn-blue btn-sm" onClick={() => onActivate(user.id)}>▶</button>
        )}
      </div>
    </div>
  );
}
