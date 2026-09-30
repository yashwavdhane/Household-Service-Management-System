import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { fetchCustomerStats } from "../../api/bookingApi";
import { fetchCategories } from "../../api/categoryApi";
import { useAuth } from "../../context/AuthContext";
import DashboardShell from "../../components/common/DashboardShell";
import { LoadingSpinner, ErrorMessage, StatusBadge } from "../../components/common/UIHelpers";

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, accent, subLabel, to }) => {
  const inner = (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: `1px solid ${accent}30`,
        borderRadius: "16px",
        padding: "20px",
        transition: "border-color 0.2s, transform 0.15s",
        cursor: to ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (to) {
          e.currentTarget.style.borderColor = accent;
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${accent}30`;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Glow accent */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: `linear-gradient(90deg, ${accent}, transparent)`,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {label}
          </p>
          <p style={{ fontSize: "28px", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
            {value}
          </p>
          {subLabel && (
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              {subLabel}
            </p>
          )}
        </div>
        <div
          style={{
            width: "42px", height: "42px", borderRadius: "12px",
            backgroundColor: `${accent}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "20px",
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  return to
    ? <Link to={to} style={{ textDecoration: "none" }}>{inner}</Link>
    : inner;
};

// ─── Quick Action Button ──────────────────────────────────────────────────────
const QuickAction = ({ to, icon, label, description, accent = "var(--color-primary)" }) => (
  <Link to={to} style={{ textDecoration: "none" }}>
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-surface-2)",
        borderRadius: "14px",
        padding: "18px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        transition: "border-color 0.2s, transform 0.15s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-surface-2)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          width: "44px", height: "44px", borderRadius: "12px",
          backgroundColor: `${accent}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px", flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "2px" }}>{label}</p>
        <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{description}</p>
      </div>
      <span style={{ marginLeft: "auto", color: "var(--color-text-muted)", fontSize: "16px" }}>›</span>
    </div>
  </Link>
);

// ─── Recent Booking Row ───────────────────────────────────────────────────────
const BookingRow = ({ booking }) => {
  const category = booking.serviceCategoryId || {};
  const provider = booking.providerId?.userId || {};
  const dateStr = booking.bookingDate
    ? (() => {
        try {
          return new Date(booking.bookingDate + "T00:00:00")
            .toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        } catch { return booking.bookingDate; }
      })()
    : "—";

  return (
    <Link to={`/bookings/${booking._id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "14px 18px",
          borderRadius: "12px",
          transition: "background 0.15s",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(30,41,59,0.7)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        {/* Category icon */}
        <div
          style={{
            width: "40px", height: "40px", borderRadius: "10px",
            backgroundColor: "rgba(99,102,241,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", flexShrink: 0,
          }}
        >
          {category.image || "🔧"}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "2px" }}>
            {category.name || "Service"}
          </p>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {provider.name || "Provider"} · {dateStr} at {booking.bookingTime}
          </p>
        </div>

        {/* Status + Price */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
          <StatusBadge status={booking.status} />
          {booking.finalPrice != null && (
            <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}>₹{booking.finalPrice}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

// ─── Category Pill ────────────────────────────────────────────────────────────
const CategoryPill = ({ category }) => (
  <Link to={`/providers?category=${category._id}`} style={{ textDecoration: "none" }}>
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-surface-2)",
        borderRadius: "12px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        transition: "border-color 0.2s, transform 0.15s",
        cursor: "pointer",
        textAlign: "center",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-primary)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-surface-2)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <span style={{ fontSize: "24px" }}>{category.image || "🔧"}</span>
      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text)", lineHeight: 1.2 }}>
        {category.name}
      </span>
    </div>
  </Link>
);

// ─── Main Dashboard Component ─────────────────────────────────────────────────
const CustomerDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, catsRes] = await Promise.all([
        fetchCustomerStats(),
        fetchCategories(),
      ]);
      setStats(statsRes.data.stats);
      setRecentBookings(statsRes.data.recentBookings || []);
      // Show first 8 active categories
      setCategories(
        (catsRes.data.categories || []).filter((c) => c.isActive).slice(0, 8)
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const activeBookings = (stats?.accepted || 0) + (stats?.in_progress || 0);

  return (
    <DashboardShell role="customer" accentColor="#6366f1" icon="🏠" items={[]}>
      {loading ? (
        <LoadingSpinner message="Loading your dashboard…" />
      ) : error ? (
        <ErrorMessage message={error} onRetry={load} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

          {/* ── Welcome Banner ─────────────────────────────────────────────── */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.1))",
              border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: "20px",
              padding: "24px 28px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background decoration */}
            <div style={{
              position: "absolute", top: "-30px", right: "-30px",
              width: "120px", height: "120px", borderRadius: "50%",
              background: "rgba(99,102,241,0.08)",
            }} />
            <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
              {greeting},
            </p>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>
              {user?.name || "Customer"} 👋
            </h1>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
              {stats?.total === 0
                ? "You haven't made any bookings yet. Browse services to get started!"
                : `You have ${stats?.pending || 0} pending and ${activeBookings} active booking${activeBookings !== 1 ? "s" : ""}.`}
            </p>
            {stats?.total === 0 && (
              <Link
                to="/services"
                style={{
                  display: "inline-block", marginTop: "14px",
                  padding: "10px 22px", borderRadius: "10px",
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                  color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: "13px",
                }}
              >
                Browse Services →
              </Link>
            )}
          </div>

          {/* ── Stat Cards Grid ────────────────────────────────────────────── */}
          <div>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Booking Overview
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "14px" }}>
              <StatCard
                icon="📋"
                label="Total Bookings"
                value={stats?.total ?? 0}
                accent="#6366f1"
                to="/my-bookings"
                subLabel="View all"
              />
              <StatCard
                icon="⏳"
                label="Pending"
                value={stats?.pending ?? 0}
                accent="#f59e0b"
                to="/my-bookings"
                subLabel="Awaiting provider"
              />
              <StatCard
                icon="🔧"
                label="Active"
                value={activeBookings}
                accent="#8b5cf6"
                to="/my-bookings"
                subLabel="Accepted + In Progress"
              />
              <StatCard
                icon="🎉"
                label="Completed"
                value={stats?.completed ?? 0}
                accent="#10b981"
                to="/my-bookings"
                subLabel="Successfully done"
              />
              <StatCard
                icon="❌"
                label="Cancelled"
                value={stats?.cancelled ?? 0}
                accent="#94a3b8"
                to="/my-bookings"
                subLabel="By you"
              />
              <StatCard
                icon="💰"
                label="Total Spent"
                value={`₹${stats?.totalSpent ?? 0}`}
                accent="#06b6d4"
                subLabel="On completed services"
              />
            </div>
          </div>

          {/* ── Quick Actions ──────────────────────────────────────────────── */}
          <div>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Quick Actions
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
              <QuickAction
                to="/services"
                icon="🔍"
                label="Browse Services"
                description="Explore all available service categories"
                accent="#6366f1"
              />
              <QuickAction
                to="/providers"
                icon="👷"
                label="Find a Provider"
                description="Search and filter service professionals"
                accent="#06b6d4"
              />
              <QuickAction
                to="/my-bookings"
                icon="📋"
                label="My Bookings"
                description="View and manage all your bookings"
                accent="#8b5cf6"
              />
              {stats?.pending > 0 && (
                <QuickAction
                  to="/my-bookings"
                  icon="⏳"
                  label="Pending Bookings"
                  description={`${stats.pending} booking${stats.pending !== 1 ? "s" : ""} awaiting provider response`}
                  accent="#f59e0b"
                />
              )}
            </div>
          </div>

          {/* ── Recent Bookings ────────────────────────────────────────────── */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Recent Bookings
              </h2>
              {recentBookings.length > 0 && (
                <Link
                  to="/my-bookings"
                  style={{ fontSize: "12px", color: "var(--color-primary-light)", textDecoration: "none", fontWeight: 600 }}
                >
                  View All →
                </Link>
              )}
            </div>

            <div
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-surface-2)",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              {recentBookings.length === 0 ? (
                <div
                  style={{
                    textAlign: "center", padding: "48px 24px",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text)", marginBottom: "6px" }}>
                    No bookings yet
                  </p>
                  <p style={{ fontSize: "13px", marginBottom: "16px" }}>
                    Book a service to see your history here.
                  </p>
                  <Link
                    to="/services"
                    style={{
                      display: "inline-block", padding: "9px 20px", borderRadius: "9px",
                      background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                      color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: "13px",
                    }}
                  >
                    Browse Services
                  </Link>
                </div>
              ) : (
                <div style={{ padding: "8px" }}>
                  {recentBookings.map((b, i) => (
                    <div key={b._id}>
                      <BookingRow booking={b} />
                      {i < recentBookings.length - 1 && (
                        <div style={{ height: "1px", backgroundColor: "rgba(51,65,85,0.4)", margin: "0 18px" }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Popular Categories ─────────────────────────────────────────── */}
          {categories.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Popular Services
                </h2>
                <Link
                  to="/services"
                  style={{ fontSize: "12px", color: "var(--color-primary-light)", textDecoration: "none", fontWeight: 600 }}
                >
                  See All →
                </Link>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" }}>
                {categories.map((cat) => (
                  <CategoryPill key={cat._id} category={cat} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </DashboardShell>
  );
};

export default CustomerDashboard;
