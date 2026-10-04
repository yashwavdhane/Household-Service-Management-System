import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value: "customer", label: "Customer", icon: "🏠", desc: "Book home services" },
  { value: "provider", label: "Service Provider", icon: "🔧", desc: "Offer your skills" },
];

const Register = () => {
  const { register: registerUser, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const defaultRole = searchParams.get("role") === "provider" ? "provider" : "customer";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: defaultRole,
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
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
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (error) setError("");
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters";
    }
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.email = "Enter a valid email address";
    }
    if (!form.phone.trim() || !/^[0-9]{10}$/.test(form.phone.trim())) {
      errs.phone = "Phone number is required and must be exactly 10 digits";
    }
    if (!form.password || form.password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const newUser = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
      });
      const dashMap = {
        customer: "/dashboard/customer",
        provider: "/dashboard/provider",
      };
      navigate(dashMap[newUser.role] || "/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: `1px solid ${fieldErrors[field] ? "rgba(239,68,68,0.6)" : "var(--color-surface-2)"}`,
    backgroundColor: "rgba(15,23,42,0.6)",
    color: "var(--color-text)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  });

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--color-text-muted)",
    marginBottom: "7px",
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
      {/* Glow */}
      <div
        style={{
          position: "fixed", top: "10%", right: "25%",
          width: "350px", height: "350px", borderRadius: "50%",
          backgroundColor: "var(--color-secondary)", opacity: 0.06,
          filter: "blur(80px)", pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <Link
        to="/"
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          textDecoration: "none", marginBottom: "28px",
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
          maxWidth: "460px",
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
          Create your account
        </h1>
        <p
          style={{
            fontSize: "14px", color: "var(--color-text-muted)",
            textAlign: "center", marginBottom: "24px",
          }}
        >
          Join HomeServe and get started today
        </p>

        {/* Role Selector */}
        <div
          style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "10px", marginBottom: "24px",
          }}
        >
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, role: r.value }))}
              style={{
                padding: "14px 10px",
                borderRadius: "12px",
                border: `2px solid ${form.role === r.value ? "var(--color-primary)" : "var(--color-surface-2)"}`,
                backgroundColor: form.role === r.value
                  ? "rgba(99,102,241,0.15)"
                  : "rgba(15,23,42,0.4)",
                color: form.role === r.value ? "var(--color-text)" : "var(--color-text-muted)",
                cursor: "pointer",
                textAlign: "center",
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: "22px", marginBottom: "5px" }}>{r.icon}</div>
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>{r.label}</div>
              <div style={{ fontSize: "11px", opacity: 0.7 }}>{r.desc}</div>
            </button>
          ))}
        </div>

        {/* Global Error */}
        {error && (
          <div
            style={{
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: "18px",
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
          {/* Name */}
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="reg-name" style={labelStyle}>Full Name *</label>
            <input
              id="reg-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="John Doe"
              autoComplete="name"
              style={inputStyle("name")}
              onFocus={(e) => { if (!fieldErrors.name) e.target.style.borderColor = "var(--color-primary)"; }}
              onBlur={(e) => { if (!fieldErrors.name) e.target.style.borderColor = "var(--color-surface-2)"; }}
            />
            {fieldErrors.name && (
              <p style={{ fontSize: "11px", color: "#fca5a5", marginTop: "4px" }}>
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="reg-email" style={labelStyle}>Email Address *</label>
            <input
              id="reg-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              style={inputStyle("email")}
              onFocus={(e) => { if (!fieldErrors.email) e.target.style.borderColor = "var(--color-primary)"; }}
              onBlur={(e) => { if (!fieldErrors.email) e.target.style.borderColor = "var(--color-surface-2)"; }}
            />
            {fieldErrors.email && (
              <p style={{ fontSize: "11px", color: "#fca5a5", marginTop: "4px" }}>
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="reg-phone" style={labelStyle}>
              Phone Number *
            </label>
            <input
              id="reg-phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              autoComplete="tel"
              maxLength={10}
              style={inputStyle("phone")}
              onFocus={(e) => { if (!fieldErrors.phone) e.target.style.borderColor = "var(--color-primary)"; }}
              onBlur={(e) => { if (!fieldErrors.phone) e.target.style.borderColor = "var(--color-surface-2)"; }}
            />
            {fieldErrors.phone && (
              <p style={{ fontSize: "11px", color: "#fca5a5", marginTop: "4px" }}>
                {fieldErrors.phone}
              </p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="reg-password" style={labelStyle}>Password *</label>
            <div style={{ position: "relative" }}>
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                style={{ ...inputStyle("password"), paddingRight: "44px" }}
                onFocus={(e) => { if (!fieldErrors.password) e.target.style.borderColor = "var(--color-primary)"; }}
                onBlur={(e) => { if (!fieldErrors.password) e.target.style.borderColor = "var(--color-surface-2)"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                style={{
                  position: "absolute", right: "12px", top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none",
                  cursor: "pointer", fontSize: "15px",
                  color: "var(--color-text-muted)", padding: "0",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {fieldErrors.password && (
              <p style={{ fontSize: "11px", color: "#fca5a5", marginTop: "4px" }}>
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: "24px" }}>
            <label htmlFor="reg-confirm-password" style={labelStyle}>Confirm Password *</label>
            <input
              id="reg-confirm-password"
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              style={inputStyle("confirmPassword")}
              onFocus={(e) => { if (!fieldErrors.confirmPassword) e.target.style.borderColor = "var(--color-primary)"; }}
              onBlur={(e) => { if (!fieldErrors.confirmPassword) e.target.style.borderColor = "var(--color-surface-2)"; }}
            />
            {fieldErrors.confirmPassword && (
              <p style={{ fontSize: "11px", color: "#fca5a5", marginTop: "4px" }}>
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            id="register-submit"
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
                Creating account…
              </>
            ) : (
              `Create ${form.role === "provider" ? "Provider" : "Customer"} Account`
            )}
          </button>
        </form>

        <p
          style={{
            textAlign: "center", marginTop: "20px",
            fontSize: "13px", color: "var(--color-text-muted)",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "var(--color-primary-light)", fontWeight: 500, textDecoration: "none" }}
          >
            Sign in
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

export default Register;
