import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../../shared/components/AuthLayout.jsx";
import { FormField } from "../../../shared/components/FormField.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getRolePath } from "../utils/roles.js";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const user = await signIn({ email: form.get("email"), password: form.get("password") });
      navigate(location.state?.from?.pathname || getRolePath(user.role), { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <header className="page-heading">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in to Bookly</h1>
        <p className="muted">Enter your details to access your account.</p>
      </header>
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="form-error" role="alert">{error}</p>}
        <FormField label="Email address" name="email" type="email" placeholder="you@example.com" required />
        <FormField label="Password" name="password" type="password" required />
        <button className="button button-primary" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="auth-footer">New to Bookly? <Link className="text-link" to="/register">Create an account</Link></p>
    </AuthLayout>
  );
}
