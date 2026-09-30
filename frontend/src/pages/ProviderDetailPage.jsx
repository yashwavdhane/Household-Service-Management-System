import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchProviderById } from "../api/providerApi";
import { LoadingSpinner, ErrorMessage, StarRating, Badge } from "../components/common/UIHelpers";
import { useAuth } from "../context/AuthContext";
import ReviewsSection from "../components/common/ReviewsSection";

const ProviderDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProvider = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await fetchProviderById(id);
      setProvider(data.provider);
    } catch (err) {
      setError(err.response?.data?.message || "Provider not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProvider(); }, [id]);

  const pUser = provider?.userId || {};
  const initials = pUser.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg)" }}>
      {/* Navbar */}
      <header
        style={{
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-surface-2)",
          padding: "0 24px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px" }}>🏠</span>
          <span style={{ fontWeight: 700, color: "#fff", fontSize: "16px" }}>
            Home<span style={{ color: "var(--color-primary-light)" }}>Serve</span>
          </span>
        </Link>
        <Link to="/providers" style={{ fontSize: "13px", color: "var(--color-text-muted)", textDecoration: "none" }}>
          ← Back to Providers
        </Link>
      </header>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        {loading ? (
          <LoadingSpinner message="Loading provider profile…" />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadProvider} />
        ) : provider ? (
          <>
            {/* ── Profile Header ─────────────────────────────────────── */}
            <div
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-surface-2)",
                borderRadius: "20px",
                padding: "32px",
                marginBottom: "20px",
                display: "flex",
                gap: "24px",
                alignItems: "flex-start",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: "80px", height: "80px", flexShrink: 0,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "26px", fontWeight: 700, color: "#fff",
                  overflow: "hidden",
                }}
              >
                {pUser.profileImage ? (
                  <img src={pUser.profileImage} alt={pUser.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : initials}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                  <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff" }}>
                    {pUser.name || "Provider"}
                  </h1>
                  {provider.isVerified && <Badge color="#10b981">✅ Verified</Badge>}
                  <Badge
                    color={provider.availability ? "#10b981" : "#94a3b8"}
                    bg={provider.availability ? "rgba(16,185,129,0.1)" : "rgba(148,163,184,0.1)"}
                  >
                    {provider.availability ? "Available" : "Busy"}
                  </Badge>
                </div>

                <div style={{ marginBottom: "10px" }}>
                  <StarRating rating={provider.averageRating} totalReviews={provider.totalReviews} size={16} />
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "13px", color: "var(--color-text-muted)" }}>
                  {provider.experience > 0 && (
                    <span>🏆 {provider.experience} year{provider.experience !== 1 ? "s" : ""} experience</span>
                  )}
                  {provider.serviceArea && (
                    <span>📍 {provider.serviceArea}</span>
                  )}
                  {pUser.phone && <span>📞 {pUser.phone}</span>}
                </div>
              </div>

              {/* Book CTA */}
              <div>
                {!isAuthenticated ? (
                  <Link
                    to="/login"
                    style={{
                      display: "inline-block", padding: "12px 24px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                      color: "#fff", textDecoration: "none", fontWeight: 600,
                      fontSize: "14px", whiteSpace: "nowrap",
                    }}
                  >
                    Login to Book
                  </Link>
                ) : user?.role === "customer" ? (
                  <button
                    onClick={() => navigate(`/book/${id}`)}
                    disabled={!provider?.availability}
                    style={{
                      padding: "12px 24px", borderRadius: "10px", border: "none",
                      background: provider?.availability
                        ? "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))"
                        : "rgba(148,163,184,0.2)",
                      color: provider?.availability ? "#fff" : "var(--color-text-muted)",
                      fontWeight: 600, fontSize: "14px", whiteSpace: "nowrap",
                      cursor: provider?.availability ? "pointer" : "not-allowed",
                      fontFamily: "inherit",
                    }}
                  >
                    {provider?.availability ? "Book Now" : "Unavailable"}
                  </button>
                ) : null}
              </div>
            </div>

            {/* ── Detail Cards Grid ──────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              {/* About */}
              <div
                style={{
                  gridColumn: "1 / -1",
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-surface-2)",
                  borderRadius: "16px",
                  padding: "24px",
                }}
              >
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>About</h2>
                <p style={{ fontSize: "14px", color: "var(--color-text-muted)", lineHeight: 1.7 }}>
                  {provider.description || "This provider hasn't added a description yet."}
                </p>
              </div>

              {/* Services */}
              <div
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-surface-2)",
                  borderRadius: "16px",
                  padding: "24px",
                }}
              >
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>Services Offered</h2>
                {provider.serviceCategories?.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {provider.serviceCategories.map((cat) => (
                      <Badge key={cat._id} color="var(--color-primary-light)">
                        {cat.image} {cat.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No services listed yet.</p>
                )}
              </div>

              {/* Skills */}
              <div
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-surface-2)",
                  borderRadius: "16px",
                  padding: "24px",
                }}
              >
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "12px" }}>Skills</h2>
                {provider.skills?.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {provider.skills.map((skill) => (
                      <Badge key={skill} color="var(--color-secondary)">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No skills listed yet.</p>
                )}
              </div>
            </div>

            {/* ── Reviews Section ──────────────────────────────── */}
            <div
              style={{
                marginTop: "8px",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-surface-2)",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "3px" }}>Customer Reviews</h2>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    {provider.totalReviews > 0
                      ? `${provider.totalReviews} review${provider.totalReviews !== 1 ? "s" : ""} · ${provider.averageRating?.toFixed(1)} average`
                      : "No reviews yet"}
                  </p>
                </div>
              </div>
              <ReviewsSection
                providerId={provider._id}
                profile={{ averageRating: provider.averageRating, totalReviews: provider.totalReviews }}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ProviderDetailPage;
