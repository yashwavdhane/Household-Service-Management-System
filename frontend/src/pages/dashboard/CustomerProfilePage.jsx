import { useState, useEffect } from "react";
import DashboardShell from "../../components/common/DashboardShell";
import { updateProfile } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import ProfileImageUpload from "../../components/common/ProfileImageUpload";

const CustomerProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    profileImage: "",
    flatStreet: "",
    area: "",
    city: "",
    state: "",
    pinCode: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        profileImage: user.profileImage || "",
        flatStreet: user.address?.flatStreet || "",
        area: user.address?.area || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        pinCode: user.address?.pinCode || "",
      });
    }
  }, [user]);

  const handleImageUpload = async (url) => {
    try {
      const { data } = await updateProfile({ profileImage: url });
      updateUser(data.user);
      setForm((p) => ({ ...p, profileImage: url }));
      setSuccess("Profile image updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile image.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      // If trying to change password, check match
      if (form.newPassword) {
        if (form.newPassword !== form.confirmPassword) {
          setError("New passwords do not match.");
          setSaving(false);
          return;
        }
        if (form.newPassword.length < 6) {
          setError("New password must be at least 6 characters.");
          setSaving(false);
          return;
        }
      }

      const { data } = await updateProfile({
        name: form.name,
        phone: form.phone,
        flatStreet: form.flatStreet,
        area: form.area,
        city: form.city,
        state: form.state,
        pinCode: form.pinCode,
        ...(form.newPassword && {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      updateUser(data.user);
      setSuccess("Profile updated successfully!");
      setForm((p) => ({ ...p, currentPassword: "", newPassword: "", confirmPassword: "" }));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("CATCH BLOCK TRIGGERED. err:", err.message, "response data:", JSON.stringify(err.response?.data));
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid var(--color-surface-2)",
    backgroundColor: "rgba(15,23,42,0.6)",
    color: "var(--color-text)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--color-text-muted)",
    marginBottom: "7px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <DashboardShell role="customer" accentColor="#6366f1" icon="🏠" items={[]}>
      <div style={{ maxWidth: "800px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>
            My Profile
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
            Update your personal information
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#fca5a5" }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#6ee7b7" }}>
            ✅ {success}
          </div>
        )}

        <div
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-surface-2)",
            borderRadius: "16px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Profile Image */}
          <div>
            <label style={labelStyle}>Profile Image</label>
            <ProfileImageUpload
              currentImage={form.profileImage}
              name={form.name}
              onImageUpload={handleImageUpload}
            />
          </div>
          
          <hr style={{ border: "none", borderTop: "1px solid var(--color-surface-2)", margin: "0" }} />

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Email (Read only) */}
            <div>
              <label htmlFor="cp-email" style={labelStyle}>Email Address (Cannot be changed)</label>
              <input
                id="cp-email"
                type="email"
                value={user?.email || ""}
                disabled
                style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }}
              />
            </div>

            {/* Name */}
            <div>
              <label htmlFor="cp-name" style={labelStyle}>Full Name</label>
              <input
                id="cp-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                style={inputStyle}
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="cp-phone" style={labelStyle}>Phone Number</label>
              <input
                id="cp-phone"
                type="text"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--color-surface-2)", margin: "4px 0" }} />

            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginBottom: "0" }}>Address Details</h3>
            
            <div>
              <label htmlFor="cp-flat" style={labelStyle}>House / Flat Number & Street Address</label>
              <input
                id="cp-flat"
                type="text"
                value={form.flatStreet}
                onChange={(e) => setForm((p) => ({ ...p, flatStreet: e.target.value }))}
                placeholder="e.g. Flat 12, Shivaji Nagar Road"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label htmlFor="cp-area" style={labelStyle}>Area / Locality</label>
                <input
                  id="cp-area"
                  type="text"
                  value={form.area}
                  onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
                  placeholder="e.g. Andheri West"
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="cp-pincode" style={labelStyle}>PIN Code</label>
                <input
                  id="cp-pincode"
                  type="text"
                  maxLength={6}
                  value={form.pinCode}
                  onChange={(e) => setForm((p) => ({ ...p, pinCode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                  placeholder="6-digit PIN"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label htmlFor="cp-city" style={labelStyle}>City</label>
                <input
                  id="cp-city"
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder="e.g. Mumbai"
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="cp-state" style={labelStyle}>State</label>
                <input
                  id="cp-state"
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                  placeholder="e.g. Maharashtra"
                  style={inputStyle}
                />
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--color-surface-2)", margin: "4px 0" }} />

            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginBottom: "0" }}>Change Password</h3>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "-12px", marginBottom: "16px" }}>Leave blank to keep your current password.</p>

            <div>
              <label htmlFor="cp-current-pwd" style={labelStyle}>Current Password</label>
              <input
                id="cp-current-pwd"
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label htmlFor="cp-new-pwd" style={labelStyle}>New Password</label>
                <input
                  id="cp-new-pwd"
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="cp-confirm-pwd" style={labelStyle}>Confirm New Password</label>
                <input
                  id="cp-confirm-pwd"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Save button */}
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                background: saving
                  ? "rgba(99,102,241,0.4)"
                  : "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "8px"
              }}
            >
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
};

export default CustomerProfilePage;
