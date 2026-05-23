import { profileCompletion } from '../../api/index';

export function CompletionBar({ user }) {
  const pct = profileCompletion(user);
  const cls = pct >= 80 ? 'high' : pct >= 50 ? 'mid' : 'low';
  return (
    <div className="completion-wrap">
      <div className="completion-labels">
        <span>Profile</span><span>{pct}%</span>
      </div>
      <div className="completion-track">
        <div className={`completion-fill ${cls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function useCompletion(user) {
  return profileCompletion(user);
}
