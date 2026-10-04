import { useState } from "react";
import DashboardShell from "../../components/common/DashboardShell";
import { updateProfile } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import ProfileImageUpload from "../../components/common/ProfileImageUpload";

const AdminProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleImageUpload = async (url) => {
    try {
      const { data } = await updateProfile({ profileImage: url });
      updateUser(data.user);
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

    try {
      const { data } = await updateProfile({
        name: form.name,
        phone: form.phone,
        ...(form.newPassword && {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      console.log("UPDATE PROFILE RETURNED:", data);
      updateUser(data.user);
      setSuccess("Profile updated successfully!");
      setForm((p) => ({ ...p, currentPassword: "", newPassword: "", confirmPassword: "" }));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("DEBUG ERROR:", err);
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: "10px",
    border: "1px solid var(--color-surface-2)", backgroundColor: "rgba(15,23,42,0.6)",
    color: "var(--color-text)", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  const labelStyle = {
    display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)",
    marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.05em",
  };

  return (
    <DashboardShell role="admin" accentColor="#f43f5e" icon="🛡️" items={[]}>
      <div style={{ maxWidth: "800px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>Admin Settings</h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Update your account and password</p>
        </div>

        {error && <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#fca5a5" }}>⚠️ {error}</div>}
        {success && <div style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#6ee7b7" }}>✅ {success}</div>}

        <div style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-surface-2)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <label style={labelStyle}>Profile Image</label>
            <ProfileImageUpload currentImage={user?.profileImage} name={form.name} onImageUpload={handleImageUpload} />
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--color-surface-2)", margin: "0" }} />

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label htmlFor="ad-email" style={labelStyle}>Email (Cannot be changed)</label>
              <input id="ad-email" type="email" value={user?.email || ""} disabled style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} />
            </div>
            <div>
              <label htmlFor="ad-name" style={labelStyle}>Full Name</label>
              <input id="ad-name" type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required style={inputStyle} />
            </div>
            <div>
              <label htmlFor="ad-phone" style={labelStyle}>Phone Number</label>
              <input id="ad-phone" type="text" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} style={inputStyle} />
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--color-surface-2)", margin: "4px 0" }} />

            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginBottom: "0" }}>Change Password</h3>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "-12px", marginBottom: "16px" }}>Leave blank to keep your current password.</p>

            <div>
              <label htmlFor="ad-current-pwd" style={labelStyle}>Current Password</label>
              <input id="ad-current-pwd" type="password" value={form.currentPassword} onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label htmlFor="ad-new-pwd" style={labelStyle}>New Password</label>
                <input id="ad-new-pwd" type="password" value={form.newPassword} onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label htmlFor="ad-confirm-pwd" style={labelStyle}>Confirm New Password</label>
                <input id="ad-confirm-pwd" type="password" value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            <button type="submit" disabled={saving} style={{ padding: "12px", borderRadius: "10px", border: "none", background: saving ? "rgba(244,63,94,0.4)" : "linear-gradient(135deg, #f43f5e, #e11d48)", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: "8px" }}>
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
};
export default AdminProfilePage;
