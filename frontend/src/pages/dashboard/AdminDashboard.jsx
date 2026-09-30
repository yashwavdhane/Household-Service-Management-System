import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchAdminDashboard } from "../../api/adminApi";
import DashboardShell from "../../components/common/DashboardShell";
import { LoadingSpinner, ErrorMessage, StatusBadge } from "../../components/common/UIHelpers";

// ─── Stat Card ──────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, sub, to }) => {
  const inner = (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: `1px solid ${color}33`,
        borderRadius: "16px",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.18s, box-shadow 0.18s",
        cursor: to ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 8px 28px ${color}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
          <p style={{ fontSize: "28px", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ fontSize: "11px", color, marginTop: "4px", fontWeight: 600 }}>{sub}</p>}
        </div>
        <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
          {icon}
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: "none" }}>{inner}</Link> : inner;
};

// ─── Quick Nav Card ─────────────────────────────────────────────────────────────
const NavCard = ({ to, icon, label, desc, color }) => (
  <Link to={to} style={{ textDecoration: "none" }}>
    <div
      style={{
        backgroundColor: "var(--color-surface)", border: `1px solid ${color}33`,
        borderRadius: "14px", padding: "18px",
        display: "flex", alignItems: "center", gap: "14px",
        transition: "all 0.18s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${color}10`; e.currentTarget.style.borderColor = `${color}66`; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--color-surface)"; e.currentTarget.style.borderColor = `${color}33`; }}
    >
      <div style={{ width: "42px", height: "42px", borderRadius: "11px", backgroundColor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "2px" }}>{label}</p>
        <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{desc}</p>
      </div>
      <span style={{ color: "var(--color-text-muted)" }}>→</span>
    </div>
  </Link>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data: res } = await fetchAdminDashboard();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const s = data?.stats;
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <DashboardShell role="admin" accentColor="#f59e0b" icon="🛡️" items={[]}>
      {/* Header */}
      <div style={{ borderRadius: "20px", padding: "26px 30px", marginBottom: "28px", background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(99,102,241,0.08))", border: "1px solid rgba(245,158,11,0.25)", display: "flex", alignItems: "center", gap: "18px" }}>
        <span style={{ fontSize: "46px" }}>🛡️</span>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>Admin Control Panel</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>Logged in as <span style={{ color: "#f59e0b" }}>{user?.email}</span> · Full platform access</p>
        </div>
      </div>

      {error && <div style={{ marginBottom: "20px" }}><ErrorMessage message={error} onRetry={load} /></div>}

      {loading ? <LoadingSpinner message="Loading platform stats…" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

          {/* ── User Stats ─────────────────────────────────────────────────── */}
          <div>
            <h2 style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>User Overview</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
              <StatCard icon="👥" label="Total Users" value={s?.users.total ?? 0} color="#6366f1" to="/admin/users" />
              <StatCard icon="🧑" label="Customers" value={s?.users.customers ?? 0} color="#06b6d4" to="/admin/users?role=customer" />
              <StatCard icon="🔧" label="Providers" value={s?.users.providers ?? 0} color="#8b5cf6" to="/admin/providers" />
              <StatCard icon="✅" label="Available" value={s?.users.activeProviders ?? 0} color="#10b981" sub="Accepting bookings" />
              <StatCard icon="✔️" label="Verified" value={s?.users.verifiedProviders ?? 0} color="#f59e0b" sub="Admin verified" />
            </div>
          </div>

          {/* ── Booking Stats ───────────────────────────────────────────────── */}
          <div>
            <h2 style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Booking Overview</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
              <StatCard icon="📋" label="Total Bookings" value={s?.bookings.total ?? 0} color="#6366f1" to="/admin/bookings" />
              <StatCard icon="⏳" label="Pending" value={s?.bookings.pending ?? 0} color="#f59e0b" to="/admin/bookings?status=pending" sub={s?.bookings.pending > 0 ? "Needs attention" : null} />
              <StatCard icon="🔧" label="In Progress" value={s?.bookings.in_progress ?? 0} color="#8b5cf6" />
              <StatCard icon="🎉" label="Completed" value={s?.bookings.completed ?? 0} color="#10b981" sub={s?.bookings.totalRevenue > 0 ? `₹${s.bookings.totalRevenue.toLocaleString("en-IN")}` : null} />
              <StatCard icon="❌" label="Cancelled" value={s?.bookings.cancelled ?? 0} color="#94a3b8" />
              <StatCard icon="🏷️" label="Categories" value={s?.categories.active ?? 0} color="#06b6d4" sub={`${s?.categories.inactive ?? 0} inactive`} to="/admin/categories" />
            </div>
          </div>

          {/* ── Two-column lower ─────────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", alignItems: "start" }}>

            {/* Recent Bookings */}
            <div style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-surface-2)", borderRadius: "18px", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid var(--color-surface-2)" }}>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>Recent Bookings</h2>
                <Link to="/admin/bookings" style={{ fontSize: "12px", color: "#f59e0b", textDecoration: "none", fontWeight: 600 }}>View All →</Link>
              </div>
              {data?.recentBookings?.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
                  <div style={{ fontSize: "36px", marginBottom: "8px" }}>📭</div>
                  <p>No bookings yet</p>
                </div>
              ) : (
                data?.recentBookings?.map((b, i) => (
                  <Link key={b._id} to={`/bookings/${b._id}`} style={{ textDecoration: "none" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 22px", borderBottom: i < (data.recentBookings.length - 1) ? "1px solid rgba(51,65,85,0.4)" : "none", transition: "background 0.15s" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(30,41,59,0.7)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <span style={{ fontSize: "20px" }}>{b.serviceCategoryId?.image || "🔧"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", marginBottom: "2px" }}>{b.serviceCategoryId?.name || "Service"}</p>
                        <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{b.customerId?.name} → {b.providerId?.userId?.name}</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
                        <StatusBadge status={b.status} />
                        <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{fmtDate(b.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Recent Users */}
              <div style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-surface-2)", borderRadius: "18px", padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Recent Users</h3>
                  <Link to="/admin/users" style={{ fontSize: "11px", color: "#f59e0b", textDecoration: "none" }}>View All</Link>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {data?.recentUsers?.map((u) => (
                    <div key={u._id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: u.role === "provider" ? "rgba(139,92,246,0.2)" : "rgba(6,182,212,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                        {u.role === "provider" ? "🔧" : u.role === "admin" ? "🛡️" : "🧑"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</p>
                        <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{u.role}</p>
                      </div>
                      <span style={{ fontSize: "10px", color: "var(--color-text-muted)", flexShrink: 0 }}>{fmtDate(u.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Nav */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <NavCard to="/admin/users" icon="👥" label="Manage Users" desc="Search, filter, activate" color="#06b6d4" />
                <NavCard to="/admin/providers" icon="🔧" label="Manage Providers" desc="Verify, view bookings" color="#8b5cf6" />
                <NavCard to="/admin/analytics" icon="📈" label="Analytics" desc="Charts & trends" color="#f59e0b" />
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default AdminDashboard;
