import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getRoleLabel } from "../utils/roles.js";

export function RoleHomePage({ role }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (user?.role !== role) {
    return (
      <main className="workspace-card">
        <h1>This account has a different role</h1>
        <p className="muted">Sign in with an account that can access this area.</p>
        <button className="button button-secondary" onClick={() => navigate(-1)}>Go back</button>
      </main>
    );
  }

  return (
    <main className="workspace-card">
      <header className="workspace-header">
        <span className="brand-wordmark">BOOKLY</span>
        <button className="button button-quiet" onClick={() => navigate("/logout")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-5" />
          </svg> Sign out
        </button>
      </header>
      <p className="muted workspace-role">{getRoleLabel(role)} workspace</p>
      <h1>Welcome, {user.name}</h1>
      <p className="muted">Your workspace is ready.</p>
    </main>
  );
}
