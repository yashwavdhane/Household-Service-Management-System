import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchCategories } from "../api/categoryApi";
import { LoadingSpinner, ErrorMessage, EmptyState } from "../components/common/UIHelpers";

// Category emoji/icon map (matches seed data image field)
const CATEGORY_COLORS = [
  "#6366f1", "#06b6d4", "#10b981", "#f59e0b",
  "#ec4899", "#8b5cf6", "#14b8a6", "#f97316",
  "#3b82f6", "#84cc16",
];

const ServiceCard = ({ category, index }) => {
  const [hovered, setHovered] = useState(false);
  const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

  return (
    <Link
      to={`/providers?category=${category._id}`}
      style={{ textDecoration: "none" }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: "var(--color-surface)",
          border: `1px solid ${hovered ? color : "var(--color-surface-2)"}`,
          borderRadius: "16px",
          padding: "24px",
          cursor: "pointer",
          transition: "all 0.25s ease",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hovered ? `0 8px 24px ${color}22` : "none",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          height: "100%",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            backgroundColor: `${color}22`,
            border: `1px solid ${color}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "26px",
          }}
        >
          {category.image || "🔧"}
        </div>

        {/* Name */}
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: hovered ? "#fff" : "var(--color-text)",
            transition: "color 0.2s",
          }}
        >
          {category.name}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: "12px",
            color: "var(--color-text-muted)",
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            flex: 1,
          }}
        >
          {category.description || "Professional services for your home needs."}
        </p>

        {/* CTA */}
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color,
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          View Providers →
        </div>
      </div>
    </Link>
  );
};

const ServicesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await fetchCategories();
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load services.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

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
          <Link to="/providers" style={{ fontSize: "13px", color: "var(--color-text-muted)", textDecoration: "none", padding: "6px 12px" }}>
            Providers
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

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          textAlign: "center",
          padding: "64px 24px 48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
            width: "600px", height: "300px", borderRadius: "50%",
            backgroundColor: "var(--color-primary)", opacity: 0.06,
            filter: "blur(80px)", pointerEvents: "none",
          }}
        />
        <p style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.12em", color: "var(--color-primary-light)", textTransform: "uppercase", marginBottom: "12px" }}>
          What can we help with?
        </p>
        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 48px)",
            fontWeight: 800,
            color: "#fff",
            marginBottom: "16px",
            lineHeight: 1.2,
          }}
        >
          Professional Home Services
        </h1>
        <p style={{ fontSize: "16px", color: "var(--color-text-muted)", marginBottom: "32px", maxWidth: "500px", margin: "0 auto 32px" }}>
          Choose from {categories.length} service categories and connect with verified professionals near you.
        </p>

        {/* Search */}
        <div style={{ maxWidth: "420px", margin: "0 auto", position: "relative" }}>
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services…"
            style={{
              width: "100%",
              padding: "12px 14px 12px 42px",
              borderRadius: "12px",
              border: "1px solid var(--color-surface-2)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text)",
              fontSize: "14px",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        </div>
      </div>

      {/* ── Categories Grid ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 64px" }}>
        {loading ? (
          <LoadingSpinner message="Loading services…" />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadCategories} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No services found"
            message={`No services match "${search}". Try a different keyword.`}
            action={
              <button
                onClick={() => setSearch("")}
                style={{
                  marginTop: "8px", padding: "8px 18px", borderRadius: "8px",
                  border: "1px solid var(--color-surface-2)",
                  backgroundColor: "transparent", color: "var(--color-text-muted)",
                  cursor: "pointer", fontFamily: "inherit", fontSize: "13px",
                }}
              >
                Clear search
              </button>
            }
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "18px",
            }}
          >
            {filtered.map((cat, i) => (
              <ServiceCard key={cat._id} category={cat} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
