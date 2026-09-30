import { useState, useEffect } from "react";
import DashboardShell from "../../components/common/DashboardShell";
import { updateProfile } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import ProfileImageUpload from "../../components/common/ProfileImageUpload";

const CustomerProfilePage = () => {
  const { user, setUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    profileImage: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        profileImage: user.profileImage || "",
      });
    }
  }, [user]);

  const handleImageUpload = async (url) => {
    try {
      const { data } = await updateProfile({ profileImage: url });
      setUser(data.user);
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
      const { data } = await updateProfile({
        name: form.name,
        phone: form.phone,
      });
      setUser(data.user);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
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
