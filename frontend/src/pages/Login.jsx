import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  if (isAuthenticated && user) {
    const dashMap = {
      customer: "/dashboard/customer",
      provider: "/dashboard/provider",
      admin: "/dashboard/admin",
    };
    navigate(dashMap[user.role] || "/", { replace: true });
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const loggedUser = await login(form.email, form.password);
      // Redirect to where they came from, or to their role dashboard
      const from = location.state?.from?.pathname;
      const dashMap = {
        customer: "/dashboard/customer",
        provider: "/dashboard/provider",
        admin: "/dashboard/admin",
      };
      navigate(from || dashMap[loggedUser.role] || "/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Glow background */}
      <div
        style={{
          position: "fixed", top: "20%", left: "30%",
          width: "400px", height: "400px", borderRadius: "50%",
          backgroundColor: "var(--color-primary)", opacity: 0.07,
          filter: "blur(90px)", pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <Link
        to="/"
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          textDecoration: "none", marginBottom: "32px",
        }}
      >
        <span style={{ fontSize: "26px" }}>🏠</span>
        <span style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>
          Home<span style={{ color: "var(--color-primary-light)" }}>Serve</span>
        </span>
      </Link>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-surface-2)",
          borderRadius: "20px",
          padding: "36px",
        }}
      >
        <h1
          style={{
            fontSize: "22px", fontWeight: 700, color: "#fff",
            marginBottom: "6px", textAlign: "center",
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            fontSize: "14px", color: "var(--color-text-muted)",
            textAlign: "center", marginBottom: "28px",
          }}
        >
          Sign in to your HomeServe account
        </p>

        {/* Error */}
        {error && (
          <div
            style={{
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: "20px",
              fontSize: "13px",
              color: "#fca5a5",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={{ marginBottom: "18px" }}>
            <label
              htmlFor="login-email"
              style={{
                display: "block", fontSize: "13px", fontWeight: 500,
                color: "var(--color-text-muted)", marginBottom: "7px",
              }}
            >
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              style={{
                width: "100%", padding: "11px 14px", borderRadius: "10px",
                border: "1px solid var(--color-surface-2)",
                backgroundColor: "rgba(15,23,42,0.6)",
                color: "var(--color-text)", fontSize: "14px",
                outline: "none", boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              onFocus={(e) => { e.target.style.borderColor = "var(--color-primary)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--color-surface-2)"; }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
              <label
                htmlFor="login-password"
                style={{
                  display: "block", fontSize: "13px", fontWeight: 500,
                  color: "var(--color-text-muted)",
                }}
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                style={{ fontSize: "12px", color: "var(--color-primary-light)", textDecoration: "none", fontWeight: 500 }}
              >
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: "100%", padding: "11px 44px 11px 14px", borderRadius: "10px",
                  border: "1px solid var(--color-surface-2)",
                  backgroundColor: "rgba(15,23,42,0.6)",
                  color: "var(--color-text)", fontSize: "14px",
                  outline: "none", boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--color-primary)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--color-surface-2)"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                style={{
                  position: "absolute", right: "12px", top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none",
                  cursor: "pointer", fontSize: "16px",
                  color: "var(--color-text-muted)",
                  padding: "0",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px",
              borderRadius: "10px", border: "none",
              background: loading
                ? "rgba(99,102,241,0.5)"
                : "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
              color: "#fff", fontSize: "15px", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              transition: "opacity 0.2s",
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: "16px", height: "16px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }}
                />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p
          style={{
            textAlign: "center", marginTop: "20px",
            fontSize: "13px", color: "var(--color-text-muted)",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            style={{ color: "var(--color-primary-light)", fontWeight: 500, textDecoration: "none" }}
          >
            Create one free
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #475569; }
      `}</style>
    </div>
  );
};

export default Login;
