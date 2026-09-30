import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchProviders } from "../api/providerApi";
import { fetchCategories } from "../api/categoryApi";
import { LoadingSpinner, ErrorMessage, EmptyState, StarRating, Badge } from "../components/common/UIHelpers";

// ─── ProviderCard ─────────────────────────────────────────────────────────────
const ProviderCard = ({ provider }) => {
  const [hovered, setHovered] = useState(false);
  const user = provider.userId || {};
  const initials = user.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <Link to={`/providers/${provider._id}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: "var(--color-surface)",
          border: `1px solid ${hovered ? "var(--color-primary)" : "var(--color-surface-2)"}`,
          borderRadius: "16px",
          padding: "22px",
          cursor: "pointer",
          transition: "all 0.25s",
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
          boxShadow: hovered ? "0 8px 24px rgba(99,102,241,0.15)" : "none",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
          {/* Avatar */}
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initials
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "2px" }}>
              {user.name || "Provider"}
            </h3>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              {provider.experience > 0 ? `${provider.experience} yr${provider.experience !== 1 ? "s" : ""} experience` : "New provider"}
            </div>
          </div>

          {/* Availability badge */}
          <Badge
            color={provider.availability ? "#10b981" : "#94a3b8"}
            bg={provider.availability ? "rgba(16,185,129,0.1)" : "rgba(148,163,184,0.1)"}
          >
            {provider.availability ? "Available" : "Busy"}
          </Badge>
        </div>

        {/* Rating */}
        <div style={{ marginBottom: "10px" }}>
          <StarRating rating={provider.averageRating} totalReviews={provider.totalReviews} />
        </div>

        {/* Service Area */}
        {provider.serviceArea && (
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>📍</span> {provider.serviceArea}
          </div>
        )}

        {/* Category Tags */}
        {provider.serviceCategories?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {provider.serviceCategories.slice(0, 3).map((cat) => (
              <Badge key={cat._id || cat} color="var(--color-primary-light)">
                {cat.name || "Service"}
              </Badge>
            ))}
            {provider.serviceCategories.length > 3 && (
              <Badge color="var(--color-text-muted)">
                +{provider.serviceCategories.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Verified */}
        {provider.isVerified && (
          <div style={{ marginTop: "10px", fontSize: "11px", color: "#10b981", fontWeight: 600 }}>
            ✅ Verified Provider
          </div>
        )}
      </div>
    </Link>
  );
};

// ─── ProvidersPage ────────────────────────────────────────────────────────────
const ProvidersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    serviceArea: searchParams.get("serviceArea") || "",
    rating: searchParams.get("rating") || "",
    available: searchParams.get("available") || "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.serviceArea) params.serviceArea = filters.serviceArea;
      if (filters.rating) params.rating = filters.rating;
      if (filters.available) params.available = filters.available;

      const [pRes, cRes] = await Promise.all([
        fetchProviders(params),
        fetchCategories(),
      ]);
      setProviders(pRes.data.providers || []);
      setCategories(cRes.data.categories || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load providers.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const applyFilter = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    const sp = new URLSearchParams();
    Object.entries(updated).forEach(([k, v]) => { if (v) sp.set(k, v); });
    setSearchParams(sp);
  };

  const clearFilters = () => {
    setFilters({ category: "", serviceArea: "", rating: "", available: "" });
    setSearchParams({});
  };

  const activeCategory = categories.find((c) => c._id === filters.category);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg)" }}>
      {/* ── Navbar ────────────────────────────────────────────────────────── */}
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
        <nav style={{ display: "flex", gap: "8px" }}>
          <Link to="/services" style={{ fontSize: "13px", color: "var(--color-text-muted)", textDecoration: "none", padding: "6px 12px" }}>
            Services
          </Link>
          <Link to="/login" style={{ fontSize: "13px", color: "var(--color-text-muted)", textDecoration: "none", padding: "6px 12px" }}>
            Login
          </Link>
          <Link
            to="/register"
            style={{
              fontSize: "13px", fontWeight: 600, color: "#fff", textDecoration: "none",
              padding: "6px 14px", borderRadius: "8px",
              background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
            }}
          >
            Get Started
          </Link>
        </nav>
      </header>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Page title */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", marginBottom: "6px" }}>
            {activeCategory ? `${activeCategory.image || ""} ${activeCategory.name} Providers` : "All Service Providers"}
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>
            {loading ? "Searching…" : `${providers.length} provider${providers.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "24px", alignItems: "start" }}>
          {/* ── Filter Sidebar ──────────────────────────────────────────── */}
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-surface-2)",
              borderRadius: "16px",
              padding: "20px",
              position: "sticky",
              top: "76px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>Filters</span>
              {(filters.category || filters.serviceArea || filters.rating || filters.available) && (
                <button
                  onClick={clearFilters}
                  style={{
                    fontSize: "11px", color: "var(--color-primary-light)",
                    background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Category filter */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => applyFilter("category", e.target.value)}
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: "8px",
                  border: "1px solid var(--color-surface-2)",
                  backgroundColor: "rgba(15,23,42,0.6)",
                  color: "var(--color-text)", fontSize: "13px",
                  outline: "none", fontFamily: "inherit", cursor: "pointer",
                }}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.image} {c.name}</option>
                ))}
              </select>
            </div>

            {/* Area filter */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Service Area
              </label>
              <input
                type="text"
                value={filters.serviceArea}
                onChange={(e) => applyFilter("serviceArea", e.target.value)}
                placeholder="e.g. Mumbai, Pune…"
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: "8px",
                  border: "1px solid var(--color-surface-2)",
                  backgroundColor: "rgba(15,23,42,0.6)",
                  color: "var(--color-text)", fontSize: "13px",
                  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Min rating */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Min. Rating
              </label>
              <select
                value={filters.rating}
                onChange={(e) => applyFilter("rating", e.target.value)}
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: "8px",
                  border: "1px solid var(--color-surface-2)",
                  backgroundColor: "rgba(15,23,42,0.6)",
                  color: "var(--color-text)", fontSize: "13px",
                  outline: "none", fontFamily: "inherit", cursor: "pointer",
                }}
              >
                <option value="">Any rating</option>
                <option value="4">⭐⭐⭐⭐ 4+</option>
                <option value="3">⭐⭐⭐ 3+</option>
                <option value="2">⭐⭐ 2+</option>
              </select>
            </div>

            {/* Availability */}
            <div>
              <label style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Availability
              </label>
              <label
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  cursor: "pointer", fontSize: "13px", color: "var(--color-text)",
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.available === "true"}
                  onChange={(e) => applyFilter("available", e.target.checked ? "true" : "")}
                  style={{ accentColor: "var(--color-primary)" }}
                />
                Available now only
              </label>
            </div>
          </div>

          {/* ── Provider Grid ────────────────────────────────────────────── */}
          <div>
            {loading ? (
              <LoadingSpinner message="Finding providers…" />
            ) : error ? (
              <ErrorMessage message={error} onRetry={loadData} />
            ) : providers.length === 0 ? (
              <EmptyState
                icon="🔍"
                title="No providers found"
                message="Try adjusting your filters or search in a different area."
                action={
                  <button
                    onClick={clearFilters}
                    style={{
                      marginTop: "8px", padding: "8px 18px", borderRadius: "8px",
                      border: "1px solid var(--color-surface-2)",
                      backgroundColor: "transparent", color: "var(--color-text-muted)",
                      cursor: "pointer", fontFamily: "inherit", fontSize: "13px",
                    }}
                  >
                    Clear filters
                  </button>
                }
              />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: "16px",
                }}
              >
                {providers.map((p) => (
                  <ProviderCard key={p._id} provider={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvidersPage;
