import { useState, useEffect } from "react";
import { fetchMyProviderProfile, updateProviderProfile, updateAvailability } from "../../api/providerApi";
import { fetchCategories } from "../../api/categoryApi";
import DashboardShell from "../../components/common/DashboardShell";
import { LoadingSpinner, ErrorMessage, StarRating, Badge } from "../../components/common/UIHelpers";

const ProviderProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    serviceCategories: [],
    skills: "",
    experience: "",
    description: "",
    serviceArea: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, catsRes] = await Promise.all([
        fetchMyProviderProfile(),
        fetchCategories(),
      ]);
      const p = profileRes.data.provider;
      setProfile(p);
      setCategories(catsRes.data.categories || []);
      setForm({
        serviceCategories: p.serviceCategories?.map((c) => c._id || c) || [],
        skills: p.skills?.join(", ") || "",
        experience: p.experience?.toString() || "",
        description: p.description || "",
        serviceArea: p.serviceArea || "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const toggleCategory = (catId) => {
    setForm((prev) => ({
      ...prev,
      serviceCategories: prev.serviceCategories.includes(catId)
        ? prev.serviceCategories.filter((id) => id !== catId)
        : [...prev.serviceCategories, catId],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await updateProviderProfile({
        serviceCategories: form.serviceCategories,
        skills: form.skills,
        experience: form.experience ? parseInt(form.experience) : 0,
        description: form.description,
        serviceArea: form.serviceArea,
      });
      setProfile(data.provider);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    try {
      const newVal = !profile?.availability;
      await updateAvailability(newVal);
      setProfile((prev) => ({ ...prev, availability: newVal }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update availability.");
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
    <DashboardShell role="provider" accentColor="#06b6d4" icon="🔧" items={[]}>
      <div style={{ maxWidth: "800px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>
            My Professional Profile
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
            Complete your profile to attract more customers
          </p>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {error && <ErrorMessage message={error} />}

            {success && (
              <div
                style={{
                  backgroundColor: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#6ee7b7",
                }}
              >
                ✅ {success}
              </div>
            )}

            {/* Availability toggle */}
            <div
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-surface-2)",
                borderRadius: "14px",
                padding: "18px 22px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "2px" }}>
                  Availability Status
                </p>
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                  {profile?.availability ? "You are visible to customers" : "You are hidden from customers"}
                </p>
              </div>
              <button
                onClick={handleAvailabilityToggle}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: profile?.availability ? "rgba(16,185,129,0.2)" : "rgba(148,163,184,0.15)",
                  color: profile?.availability ? "#10b981" : "#94a3b8",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                {profile?.availability ? "✅ Available" : "⏸️ Unavailable"}
              </button>
            </div>

            {/* Ratings summary */}
            {profile?.totalReviews > 0 && (
              <div
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-surface-2)",
                  borderRadius: "14px",
                  padding: "18px 22px",
                  marginBottom: "20px",
                  display: "flex",
                  gap: "24px",
                  alignItems: "center",
                }}
              >
                <div>
                  <p style={{ fontSize: "30px", fontWeight: 800, color: "#fff" }}>
                    {profile.averageRating?.toFixed(1)}
                  </p>
                  <StarRating rating={profile.averageRating} size={16} />
                </div>
                <div>
                  <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                    Based on {profile.totalReviews} review{profile.totalReviews !== 1 ? "s" : ""}
                  </p>
                  {profile.isVerified && <Badge color="#10b981">✅ Verified Provider</Badge>}
                </div>
              </div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleSave}>
              <div
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-surface-2)",
                  borderRadius: "16px",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {/* Service Categories */}
                <div>
                  <label style={labelStyle}>Service Categories</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {categories.map((cat) => {
                      const selected = form.serviceCategories.includes(cat._id);
                      return (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() => toggleCategory(cat._id)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "999px",
                            border: `1px solid ${selected ? "var(--color-primary)" : "var(--color-surface-2)"}`,
                            backgroundColor: selected ? "rgba(99,102,241,0.2)" : "transparent",
                            color: selected ? "#fff" : "var(--color-text-muted)",
                            fontSize: "12px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            transition: "all 0.15s",
                          }}
                        >
                          {cat.image} {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label htmlFor="pp-skills" style={labelStyle}>
                    Skills <span style={{ fontSize: "10px", opacity: 0.6 }}>(comma-separated)</span>
                  </label>
                  <input
                    id="pp-skills"
                    type="text"
                    value={form.skills}
                    onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))}
                    placeholder="e.g. Pipe fitting, Leak repair, Tap installation"
                    style={inputStyle}
                  />
                </div>

                {/* Experience */}
                <div>
                  <label htmlFor="pp-experience" style={labelStyle}>Years of Experience</label>
                  <input
                    id="pp-experience"
                    type="number"
                    min="0"
                    max="60"
                    value={form.experience}
                    onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}
                    placeholder="e.g. 5"
                    style={inputStyle}
                  />
                </div>

                {/* Service Area */}
                <div>
                  <label htmlFor="pp-area" style={labelStyle}>Service Area</label>
                  <input
                    id="pp-area"
                    type="text"
                    value={form.serviceArea}
                    onChange={(e) => setForm((p) => ({ ...p, serviceArea: e.target.value }))}
                    placeholder="e.g. Mumbai, Thane, Navi Mumbai"
                    style={inputStyle}
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="pp-desc" style={labelStyle}>About / Description</label>
                  <textarea
                    id="pp-desc"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Describe your experience, specializations, and what makes you stand out…"
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
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
                      ? "rgba(6,182,212,0.4)"
                      : "linear-gradient(135deg, #06b6d4, #0891b2)",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {saving ? (
                    <>
                      <span
                        style={{
                          width: "14px", height: "14px",
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "#fff",
                          borderRadius: "50%",
                          animation: "spin 0.7s linear infinite",
                          display: "inline-block",
                        }}
                      />
                      Saving…
                    </>
                  ) : "Save Profile"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardShell>
  );
};

export default ProviderProfilePage;
