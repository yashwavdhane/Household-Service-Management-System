import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchProviderById } from "../api/providerApi";
import { fetchCategories } from "../api/categoryApi";
import { createBooking } from "../api/bookingApi";
import { LoadingSpinner, ErrorMessage, Badge } from "../components/common/UIHelpers";
import { useAuth } from "../context/AuthContext";

// ─── Today's date in YYYY-MM-DD format ───────────────────────────────────────
const todayISO = () => new Date().toISOString().split("T")[0];

// ─── Time slot grid ───────────────────────────────────────────────────────────
const TIME_SLOTS = [
  "08:00","09:00","10:00","11:00","12:00",
  "13:00","14:00","15:00","16:00","17:00","18:00","19:00",
];

const BookingPage = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [provider, setProvider] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    serviceCategoryId: "",
    bookingDate: "",
    bookingTime: "",
    address: "",
    description: "",
    estimatedPrice: "",
  });

  const [step, setStep] = useState(1); // 1 = details, 2 = confirm

  // Load provider + available categories
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, cRes] = await Promise.all([
          fetchProviderById(providerId),
          fetchCategories(),
        ]);
        setProvider(pRes.data.provider);
        // Only categories this provider offers
        const providerCatIds = pRes.data.provider.serviceCategories?.map((c) => c._id) || [];
        const filtered = cRes.data.categories.filter((c) =>
          providerCatIds.includes(c._id)
        );
        setCategories(filtered);
        if (filtered.length === 1) setForm((p) => ({ ...p, serviceCategoryId: filtered[0]._id }));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load provider details.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [providerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.serviceCategoryId) { setError("Please select a service category."); return; }
    if (!form.bookingDate) { setError("Please select a date."); return; }
    if (!form.bookingTime) { setError("Please select a time slot."); return; }
    if (!form.address.trim()) { setError("Please enter the service address."); return; }

    if (step === 1) { setError(""); setStep(2); return; }

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        providerId,
        serviceCategoryId: form.serviceCategoryId,
        bookingDate: form.bookingDate,
        bookingTime: form.bookingTime,
        address: form.address.trim(),
        description: form.description.trim(),
      };
      if (form.estimatedPrice) payload.estimatedPrice = parseFloat(form.estimatedPrice);

      const { data } = await createBooking(payload);
      navigate(`/bookings/${data.booking._id}`, { state: { justCreated: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create booking.");
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  const pUser = provider?.userId || {};
  const initials = pUser.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  const selectedCategory = categories.find((c) => c._id === form.serviceCategoryId);

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: "10px",
    border: "1px solid var(--color-surface-2)",
    backgroundColor: "rgba(15,23,42,0.6)",
    color: "var(--color-text)", fontSize: "14px",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg)" }}>
      {/* Navbar */}
      <header style={{
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--color-surface-2)",
        padding: "0 24px", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px" }}>🏠</span>
          <span style={{ fontWeight: 700, color: "#fff", fontSize: "16px" }}>
            Home<span style={{ color: "var(--color-primary-light)" }}>Serve</span>
          </span>
        </Link>
        <Link
          to={`/providers/${providerId}`}
          style={{ fontSize: "13px", color: "var(--color-text-muted)", textDecoration: "none" }}
        >
          ← Back to Provider
        </Link>
      </header>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "36px 24px" }}>
        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "28px" }}>
          {[1, 2].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 700,
                backgroundColor: step >= s ? "var(--color-primary)" : "var(--color-surface-2)",
                color: step >= s ? "#fff" : "var(--color-text-muted)",
              }}>
                {s}
              </div>
              <span style={{ fontSize: "13px", color: step === s ? "#fff" : "var(--color-text-muted)", fontWeight: step === s ? 600 : 400 }}>
                {s === 1 ? "Booking Details" : "Confirm"}
              </span>
              {s < 2 && <div style={{ width: "32px", height: "1px", backgroundColor: "var(--color-surface-2)" }} />}
            </div>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner message="Loading provider details…" />
        ) : error && !provider ? (
          <ErrorMessage message={error} />
        ) : (
          <>
            {/* Provider Summary Card */}
            <div style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-surface-2)",
              borderRadius: "16px", padding: "20px",
              marginBottom: "20px",
              display: "flex", alignItems: "center", gap: "14px",
            }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "50%",
                background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>
                {pUser.profileImage
                  ? <img src={pUser.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                  : initials
                }
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "2px" }}>{pUser.name}</p>
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                  {provider?.experience > 0 ? `${provider.experience} yrs experience` : "New Provider"}
                  {provider?.serviceArea ? ` · 📍 ${provider.serviceArea}` : ""}
                </p>
              </div>
              <Badge color={provider?.availability ? "#10b981" : "#94a3b8"}>
                {provider?.availability ? "Available" : "Busy"}
              </Badge>
            </div>

            {error && <ErrorMessage message={error} />}

            <form onSubmit={handleSubmit}>
              {step === 1 ? (
                <div style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-surface-2)",
                  borderRadius: "16px", padding: "28px",
                  display: "flex", flexDirection: "column", gap: "22px",
                }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>Booking Details</h2>

                  {/* Service Category */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Service Category *
                    </label>
                    {categories.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "#fca5a5" }}>This provider has no service categories set.</p>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {categories.map((cat) => {
                          const sel = form.serviceCategoryId === cat._id;
                          return (
                            <button
                              key={cat._id}
                              type="button"
                              onClick={() => setForm((p) => ({ ...p, serviceCategoryId: cat._id }))}
                              style={{
                                padding: "8px 16px", borderRadius: "10px",
                                border: `1px solid ${sel ? "var(--color-primary)" : "var(--color-surface-2)"}`,
                                backgroundColor: sel ? "rgba(99,102,241,0.2)" : "transparent",
                                color: sel ? "#fff" : "var(--color-text-muted)",
                                fontSize: "13px", cursor: "pointer", fontFamily: "inherit",
                                transition: "all 0.15s",
                              }}
                            >
                              {cat.image} {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      min={todayISO()}
                      value={form.bookingDate}
                      onChange={(e) => setForm((p) => ({ ...p, bookingDate: e.target.value }))}
                      style={{ ...inputStyle, colorScheme: "dark" }}
                    />
                  </div>

                  {/* Time Slots */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Preferred Time *
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(76px,1fr))", gap: "8px" }}>
                      {TIME_SLOTS.map((t) => {
                        const sel = form.bookingTime === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, bookingTime: t }))}
                            style={{
                              padding: "8px", borderRadius: "8px",
                              border: `1px solid ${sel ? "var(--color-primary)" : "var(--color-surface-2)"}`,
                              backgroundColor: sel ? "rgba(99,102,241,0.2)" : "transparent",
                              color: sel ? "#fff" : "var(--color-text-muted)",
                              fontSize: "13px", cursor: "pointer", fontFamily: "inherit",
                              transition: "all 0.15s",
                            }}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Service Address *
                    </label>
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                      placeholder="Full address where service is needed…"
                      rows={2}
                      style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Problem Description <span style={{ opacity: 0.5 }}>(optional)</span>
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Describe the problem in detail so the provider can prepare…"
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      padding: "13px", borderRadius: "10px", border: "none",
                      background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                      color: "#fff", fontSize: "14px", fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Review Booking →
                  </button>
                </div>
              ) : (
                /* ── Step 2: Confirm ─────────────────────────────── */
                <div style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-surface-2)",
                  borderRadius: "16px", padding: "28px",
                }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "20px" }}>Confirm Booking</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
                    {[
                      { label: "Provider", value: pUser.name },
                      { label: "Service", value: `${selectedCategory?.image} ${selectedCategory?.name}` },
                      { label: "Date", value: new Date(form.bookingDate + "T00:00:00").toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" }) },
                      { label: "Time", value: form.bookingTime },
                      { label: "Address", value: form.address },
                      ...(form.description ? [{ label: "Notes", value: form.description }] : []),
                    ].map((row) => (
                      <div key={row.label} style={{ display: "flex", gap: "16px" }}>
                        <span style={{ minWidth: "90px", fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600, paddingTop: "1px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {row.label}
                        </span>
                        <span style={{ fontSize: "14px", color: "var(--color-text)", flex: 1 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      backgroundColor: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                      borderRadius: "10px", padding: "12px 16px", marginBottom: "24px",
                      fontSize: "12px", color: "var(--color-text-muted)",
                    }}
                  >
                    ℹ️ Your booking will start as <strong style={{ color: "#f59e0b" }}>Pending</strong>. The provider will review and accept or decline.
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={{
                        flex: 1, padding: "12px", borderRadius: "10px",
                        border: "1px solid var(--color-surface-2)",
                        backgroundColor: "transparent", color: "var(--color-text-muted)",
                        cursor: "pointer", fontFamily: "inherit", fontSize: "14px",
                      }}
                    >
                      ← Edit Details
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        flex: 2, padding: "12px", borderRadius: "10px", border: "none",
                        background: submitting
                          ? "rgba(99,102,241,0.4)"
                          : "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                        color: "#fff", fontSize: "14px", fontWeight: 600,
                        cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      }}
                    >
                      {submitting ? (
                        <>
                          <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                          Submitting…
                        </>
                      ) : "Confirm Booking 🚀"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default BookingPage;
