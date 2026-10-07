import { Brand } from "./Brand.jsx";

export function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <Brand />
        <div className="auth-aside-copy">
          <div className="auth-art">
            <div className="auth-art-card">
              <p className="eyebrow muted">Your day, in good hands</p>
              <h2>Appointments that fit your life.</h2>
              <p className="muted">One simple place to book, manage, and grow.</p>
            </div>
          </div>
          <p className="aside-caption">A calmer way to manage every appointment.</p>
        </div>
        <p className="copyright">Copyright {new Date().getFullYear()} Bookly</p>
      </aside>
      <main className="auth-main">
        <div className="auth-content">{children}</div>
      </main>
    </div>
  );
}
