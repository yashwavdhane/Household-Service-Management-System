import { useState, useEffect } from "react";
import { fetchMyProviderProfile, updateProviderProfile, updateAvailability } from "../../api/providerApi";
import { fetchCategories } from "../../api/categoryApi";
import { updateProfile } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import DashboardShell from "../../components/common/DashboardShell";
import ProfileImageUpload from "../../components/common/ProfileImageUpload";
import { LoadingSpinner, ErrorMessage, StarRating, Badge } from "../../components/common/UIHelpers";


const ProviderProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    profileImage: "",
    serviceCategories: [],
    skills: "",
    experience: "",
    description: "",
    serviceArea: "",
    // Structured address
    flatStreet: "",
    area: "",
    city: "",
    state: "",
    pinCode: "",
    landmark: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
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
        name: user?.name || "",
        phone: user?.phone || "",
        profileImage: user?.profileImage || "",
        serviceCategories: p.serviceCategories?.map((c) =>
          typeof c === "object" && c !== null ? c._id || c.id : c
        ) || [],
        skills: p.skills?.join(", ") || "",
        experience: p.experience?.toString() || "",
        description: p.description || "",
        serviceArea: p.serviceArea || "",
        // Structured address
        flatStreet: p.address?.flatStreet || "",
        area: p.address?.area || "",
        city: p.address?.city || "",
        state: p.address?.state || "",
        pinCode: p.address?.pinCode || "",
        landmark: p.address?.landmark || "",
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
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    // PIN validation before submitting
    if (form.pinCode && !/^\d{6}$/.test(form.pinCode)) {
      setError("PIN code must be exactly 6 digits.");
      setSaving(false);
      return;
    }

    // Password validation
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
      // 1. Update basic user info
      const { data: authData } = await updateProfile({
        name: form.name,
        phone: form.phone,
        ...(form.newPassword && {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      updateUser(authData.user);

      // 2. Update provider specific info (including structured address)
      const { data: provData } = await updateProviderProfile({
        serviceCategories: form.serviceCategories,
        skills: form.skills,
        experience: form.experience ? parseInt(form.experience) : 0,
        description: form.description,
        serviceArea: form.serviceArea,
        // Structured address fields
        flatStreet: form.flatStreet,
        area: form.area,
        city: form.city,
        state: form.state,
        pinCode: form.pinCode,
        landmark: form.landmark,
      });

      const p = provData.provider;
      setProfile(p);

      // Full resync of all form fields from the server response
      setForm((prev) => ({
        ...prev,
        name: authData.user?.name || prev.name,
        phone: authData.user?.phone || prev.phone,
        serviceCategories:
          p.serviceCategories?.map((c) =>
            typeof c === "object" && c !== null ? c._id || c.id : c
          ) || [],
        skills: Array.isArray(p.skills) ? p.skills.join(", ") : prev.skills,
        experience: p.experience?.toString() || "",
        description: p.description || "",
        serviceArea: p.serviceArea || "",
        flatStreet: p.address?.flatStreet || "",
        area: p.address?.area || "",
        city: p.address?.city || "",
        state: p.address?.state || "",
        pinCode: p.address?.pinCode || "",
        landmark: p.address?.landmark || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

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

  const sectionHeadStyle = {
    fontSize: "13px",
    fontWeight: 700,
    color: "#06b6d4",
    marginBottom: "16px",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(6,182,212,0.2)",
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
                {/* ── Basic Info ── */}
                <p style={sectionHeadStyle}>Basic Information</p>

                <div>
                  <label style={labelStyle}>Profile Image</label>
                  <ProfileImageUpload
                    currentImage={form.profileImage}
                    name={form.name}
                    onImageUpload={handleImageUpload}
                  />
                </div>

                <div>
                  <label htmlFor="pp-email" style={labelStyle}>Email (Cannot be changed)</label>
                  <input
                    id="pp-email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }}
                  />
                </div>

                <div>
                  <label htmlFor="pp-name" style={labelStyle}>Full Name</label>
                  <input
                    id="pp-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="pp-phone" style={labelStyle}>Phone Number</label>
                  <input
                    id="pp-phone"
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="10-digit mobile number"
                    style={inputStyle}
                  />
                </div>

                <hr style={{ border: "none", borderTop: "1px solid var(--color-surface-2)", margin: "4px 0" }} />

                {/* ── Professional Info ── */}
                <p style={sectionHeadStyle}>Professional Information</p>

                {/* Service Categories */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label style={labelStyle}>Service Categories</label>
                    {/* Quick Save — just categories, inside this section */}
                    {form.serviceCategories.length > 0 && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={handleSave}
                        style={{
                          padding: "4px 12px", borderRadius: "7px",
                          border: "1px solid rgba(6,182,212,0.4)",
                          backgroundColor: "rgba(6,182,212,0.1)",
                          color: "#06b6d4", fontSize: "11px", fontWeight: 700,
                          cursor: saving ? "not-allowed" : "pointer",
                          fontFamily: "inherit",
                          opacity: saving ? 0.6 : 1,
                        }}
                      >
                        {saving ? "Saving…" : "Quick Save"}
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "12px", lineHeight: 1.6 }}>
                    Click a category to add or remove it from your profile. Changes apply when you click{" "}
                    <strong style={{ color: "#fff" }}>Save Profile</strong> or{" "}
                    <strong style={{ color: "#06b6d4" }}>Quick Save</strong> above.
                  </p>

                  {/* ── Selected categories (on your profile) ── */}
                  {(() => {
                    const selectedCats = categories.filter(
                      (cat) =>
                        form.serviceCategories.includes(cat._id) ||
                        form.serviceCategories.includes(cat.id)
                    );
                    const unselectedCats = categories.filter(
                      (cat) =>
                        !form.serviceCategories.includes(cat._id) &&
                        !form.serviceCategories.includes(cat.id)
                    );

                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                        {/* Selected group */}
                        <div>
                          <p style={{ fontSize: "11px", fontWeight: 700, color: "#10b981", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            ✓ On Your Profile ({selectedCats.length})
                          </p>
                          {selectedCats.length === 0 ? (
                            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", fontStyle: "italic", padding: "8px 0" }}>
                              No categories selected yet. Click the chips below to add some.
                            </p>
                          ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                              {selectedCats.map((cat) => (
                                <button
                                  key={cat._id}
                                  type="button"
                                  onClick={() => toggleCategory(cat._id)}
                                  title={`Click to remove ${cat.name} from your profile`}
                                  style={{
                                    padding: "6px 12px 6px 14px",
                                    borderRadius: "999px",
                                    border: "1px solid rgba(99,102,241,0.6)",
                                    backgroundColor: "rgba(99,102,241,0.18)",
                                    color: "#c7d2fe",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    transition: "all 0.15s",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  {cat.image} {cat.name}
                                  <span style={{
                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                    width: "14px", height: "14px", borderRadius: "50%",
                                    backgroundColor: "rgba(239,68,68,0.2)",
                                    color: "#fca5a5", fontSize: "10px", fontWeight: 900,
                                    lineHeight: 1, flexShrink: 0,
                                  }}>✕</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Available / unselected group */}
                        <div>
                          <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Available to Add ({unselectedCats.length})
                          </p>
                          {unselectedCats.length === 0 ? (
                            <p style={{ fontSize: "12px", color: "#10b981", fontStyle: "italic", padding: "4px 0" }}>
                              You have selected all available categories.
                            </p>
                          ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                              {unselectedCats.map((cat) => (
                                <button
                                  key={cat._id}
                                  type="button"
                                  onClick={() => toggleCategory(cat._id)}
                                  title={`Click to add ${cat.name} to your profile`}
                                  style={{
                                    padding: "6px 14px",
                                    borderRadius: "999px",
                                    border: "1px dashed var(--color-surface-2)",
                                    backgroundColor: "transparent",
                                    color: "var(--color-text-muted)",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    transition: "all 0.15s",
                                  }}
                                >
                                  + {cat.image} {cat.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Request new category info */}
                        <div
                          style={{
                            backgroundColor: "rgba(245,158,11,0.06)",
                            border: "1px solid rgba(245,158,11,0.2)",
                            borderRadius: "10px",
                            padding: "12px 14px",
                            display: "flex",
                            gap: "10px",
                            alignItems: "flex-start",
                          }}
                        >
                          <span style={{ fontSize: "16px", flexShrink: 0 }}>💡</span>
                          <div>
                            <p style={{ fontSize: "12px", fontWeight: 700, color: "#fbbf24", marginBottom: "3px" }}>
                              Need a category that isn't listed?
                            </p>
                            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                              Global service categories are managed by the platform Admin.
                              Contact your admin to request a new category be added.{" "}
                              Once added, it will appear above and you can select it for your profile.
                            </p>
                          </div>
                        </div>

                      </div>
                    );
                  })()}
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

                <hr style={{ border: "none", borderTop: "1px solid var(--color-surface-2)", margin: "4px 0" }} />

                {/* ── Service Location ── */}
                <p style={sectionHeadStyle}>Service Location & Address</p>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "-14px" }}>
                  Your service area helps customers find you. PIN code is used for location-based search.
                </p>

                {/* Legacy service area */}
                <div>
                  <label htmlFor="pp-area" style={labelStyle}>Service Area (General)</label>
                  <input
                    id="pp-area"
                    type="text"
                    value={form.serviceArea}
                    onChange={(e) => setForm((p) => ({ ...p, serviceArea: e.target.value }))}
                    placeholder="e.g. Mumbai, Thane, Navi Mumbai"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="pp-flat" style={labelStyle}>House / Flat Number & Street Address</label>
                  <input
                    id="pp-flat"
                    type="text"
                    value={form.flatStreet}
                    onChange={(e) => setForm((p) => ({ ...p, flatStreet: e.target.value }))}
                    placeholder="e.g. Flat 12, Shivaji Nagar Road"
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label htmlFor="pp-locality" style={labelStyle}>Area / Locality</label>
                    <input
                      id="pp-locality"
                      type="text"
                      value={form.area}
                      onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
                      placeholder="e.g. Andheri West"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="pp-pincode" style={labelStyle}>PIN Code</label>
                    <input
                      id="pp-pincode"
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
                    <label htmlFor="pp-city" style={labelStyle}>City</label>
                    <input
                      id="pp-city"
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                      placeholder="e.g. Mumbai"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="pp-state" style={labelStyle}>State</label>
                    <input
                      id="pp-state"
                      type="text"
                      value={form.state}
                      onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                      placeholder="e.g. Maharashtra"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="pp-landmark" style={labelStyle}>Landmark <span style={{ opacity: 0.5 }}>(optional)</span></label>
                  <input
                    id="pp-landmark"
                    type="text"
                    value={form.landmark}
                    onChange={(e) => setForm((p) => ({ ...p, landmark: e.target.value }))}
                    placeholder="e.g. Near Andheri Station"
                    style={inputStyle}
                  />
                </div>

                <hr style={{ border: "none", borderTop: "1px solid var(--color-surface-2)", margin: "4px 0" }} />

                <p style={sectionHeadStyle}>Change Password</p>
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "-14px", marginBottom: "16px" }}>Leave blank to keep your current password.</p>

                <div>
                  <label htmlFor="pp-current-pwd" style={labelStyle}>Current Password</label>
                  <input
                    id="pp-current-pwd"
                    type="password"
                    value={form.currentPassword}
                    onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label htmlFor="pp-new-pwd" style={labelStyle}>New Password</label>
                    <input
                      id="pp-new-pwd"
                      type="password"
                      value={form.newPassword}
                      onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="pp-confirm-pwd" style={labelStyle}>Confirm New Password</label>
                    <input
                      id="pp-confirm-pwd"
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
                    marginTop: "4px",
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
                  ) : (
                    "Save Profile"
                  )}
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
