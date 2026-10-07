import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../../shared/components/AuthLayout.jsx";
import { FormField } from "../../../shared/components/FormField.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getRolePath } from "../utils/roles.js";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState("customer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const user = await register({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone") || undefined,
        password: form.get("password"),
      }, accountType);
      navigate(getRolePath(user.role), { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <header className="page-heading compact-heading">
        <p className="eyebrow">Get started</p>
        <h1>Create your account</h1>
        <p className="muted">Choose how you will use Bookly.</p>
      </header>
      <div className="account-type" role="group" aria-label="Account type">
        <button type="button" className={accountType === "customer" ? "type-option selected" : "type-option"} onClick={() => setAccountType("customer")}>Customer</button>
        <button type="button" className={accountType === "business-owner" ? "type-option selected" : "type-option"} onClick={() => setAccountType("business-owner")}>Business owner</button>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="form-error" role="alert">{error}</p>}
        <FormField label="Full name" name="name" placeholder="Your name" autoComplete="name" minLength={2} maxLength={100} required />
        <FormField label="Email address" name="email" type="email" placeholder="you@example.com" required />
        <FormField label="Phone number" name="phone" type="tel" placeholder="+15550000000" autoComplete="tel" pattern="^[0-9]{10}$" />
        <FormField label="Password" name="password" type="password" autoComplete="new-password" description="Use at least 8 characters." minLength={8} required />
        <button className="button button-primary" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="auth-footer">Already have an account? <Link className="text-link" to="/login">Sign in</Link></p>
    </AuthLayout>
  );
}
