import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Enter Phone, 2: Enter OTP & New Password
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.post("/auth/forgot-password", { phone });
      setSuccessMsg(res.data.message || "OTP sent to your mobile number.");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setError("Please enter the OTP and a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axiosInstance.post("/auth/reset-password", { phone, otp, newPassword });
      setSuccessMsg("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Please check OTP.");
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
      <div
        style={{
          position: "fixed", top: "20%", left: "30%",
          width: "400px", height: "400px", borderRadius: "50%",
          backgroundColor: "var(--color-primary)", opacity: 0.07,
          filter: "blur(90px)", pointerEvents: "none",
        }}
      />

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
          Reset Password
        </h1>
        <p
          style={{
            fontSize: "14px", color: "var(--color-text-muted)",
            textAlign: "center", marginBottom: "28px",
          }}
        >
          {step === 1 ? "Enter your mobile number to receive an OTP" : "Enter the OTP sent to your phone"}
        </p>

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

        {successMsg && !error && (
          <div
            style={{
              backgroundColor: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.35)",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: "20px",
              fontSize: "13px",
              color: "#6ee7b7",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} noValidate>
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block", fontSize: "13px", fontWeight: 500,
                  color: "var(--color-text-muted)", marginBottom: "7px",
                }}
              >
                Mobile Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                maxLength={10}
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
            <button
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
              }}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} noValidate>
            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  display: "block", fontSize: "13px", fontWeight: 500,
                  color: "var(--color-text-muted)", marginBottom: "7px",
                }}
              >
                OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: "10px",
                  border: "1px solid var(--color-surface-2)",
                  backgroundColor: "rgba(15,23,42,0.6)",
                  color: "var(--color-text)", fontSize: "14px",
                  outline: "none", boxSizing: "border-box",
                  fontFamily: "inherit",
                  letterSpacing: "2px",
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--color-primary)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--color-surface-2)"; }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block", fontSize: "13px", fontWeight: 500,
                  color: "var(--color-text-muted)", marginBottom: "7px",
                }}
              >
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
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
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
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
              }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p
          style={{
            textAlign: "center", marginTop: "20px",
            fontSize: "13px", color: "var(--color-text-muted)",
          }}
        >
          Remembered your password?{" "}
          <Link
            to="/login"
            style={{ color: "var(--color-primary-light)", fontWeight: 500, textDecoration: "none" }}
          >
            Sign in
          </Link>
        </p>
      </div>

      <style>{\`
        input::placeholder { color: #475569; }
      \`}</style>
    </div>
  );
};

export default ForgotPassword;
