import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function LogoutPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    signOut().then(() => navigate("/login", { replace: true })).catch((requestError) => setError(requestError.message));
  }, [navigate, signOut]);

  return (
    <main className="logout-screen">
      {error ? <p className="form-error" role="alert">{error}</p> : <><span className="spinner" aria-hidden="true" /><p className="muted">Signing you out...</p></>}
    </main>
  );
}
