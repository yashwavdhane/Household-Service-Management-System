import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchProviderStats, updateBookingStatus } from "../../api/bookingApi";
import { updateAvailability } from "../../api/providerApi";
import DashboardShell from "../../components/common/DashboardShell";
import { LoadingSpinner, ErrorMessage, StatusBadge, StarRating, Badge } from "../../components/common/UIHelpers";
import ReviewsSection from "../../components/common/ReviewsSection";


// ─── Stat Card ──────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, sub }) => (
  <div
    style={{
      backgroundColor: "var(--color-surface)",
      border: `1px solid ${color}33`,
      borderRadius: "18px",
      padding: "22px 20px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      position: "relative",
      overflow: "hidden",
      transition: "transform 0.18s, box-shadow 0.18s",
      cursor: "default",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = `0 8px 30px ${color}22`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    <div
      style={{
        position: "absolute", top: "-20px", right: "-20px",
        width: "80px", height: "80px",
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}28, transparent 70%)`,
        pointerEvents: "none",
      }}
    />
    <div
      style={{
        width: "40px", height: "40px", borderRadius: "12px",
        backgroundColor: `${color}1a`,
        border: `1px solid ${color}33`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "20px",
      }}
    >
      {icon}
    </div>
    <div>
      <div style={{ fontSize: "28px", fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>{label}</div>
      {sub && <div style={{ fontSize: "11px", color, marginTop: "2px", fontWeight: 600 }}>{sub}</div>}
    </div>
  </div>
);

// ─── Quick Action Link ──────────────────────────────────────────────────────────
const QuickAction = ({ to, icon, label, color }) => (
  <Link
    to={to}
    style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "14px 18px",
      backgroundColor: "var(--color-bg)",
      border: `1px solid ${color}33`,
      borderRadius: "14px",
      textDecoration: "none",
      color: "#fff",
      fontSize: "14px",
      fontWeight: 600,
      transition: "all 0.18s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = `${color}15`;
      e.currentTarget.style.borderColor = `${color}66`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = "var(--color-bg)";
      e.currentTarget.style.borderColor = `${color}33`;
    }}
  >
    <span
      style={{
        width: "36px", height: "36px", borderRadius: "10px",
        backgroundColor: `${color}20`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "18px", flexShrink: 0,
      }}
    >
      {icon}
    </span>
    {label}
    <span style={{ marginLeft: "auto", color: "var(--color-text-muted)", fontSize: "16px" }}>→</span>
  </Link>
);

// ─── Recent Request Row ─────────────────────────────────────────────────────────
const BOOKING_ACTIONS = {
  pending:     [{ label: "Accept", next: "accepted", color: "#10b981" }, { label: "Reject", next: "rejected", color: "#ef4444" }],
  accepted:    [{ label: "Start Job", next: "in_progress", color: "#8b5cf6" }],
  in_progress: [{ label: "Complete", next: "completed", color: "#06b6d4" }],
};

const RecentRequestRow = ({ booking, onAction, actioning }) => {
  const customer = booking.customerId || {};
  const category = booking.serviceCategoryId || {};
  const actions = BOOKING_ACTIONS[booking.status] || [];

  const fmt = (ds) => {
    if (!ds) return "—";
    try { return new Date(ds + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }
    catch { return ds; }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg)",
        border: "1px solid var(--color-surface-2)",
        borderRadius: "14px",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          width: "38px", height: "38px", borderRadius: "10px",
          backgroundColor: "rgba(6,182,212,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "16px", flexShrink: 0,
        }}
      >
        {category.image || "🔧"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {category.name || "Service"}
        </p>
        <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
          👤 {customer.name || "Customer"} &nbsp;·&nbsp; {fmt(booking.bookingDate)} {booking.bookingTime}
        </p>
      </div>
      <StatusBadge status={booking.status} />
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <Link
          to={`/bookings/${booking._id}`}
          style={{
            padding: "5px 11px", borderRadius: "7px",
            border: "1px solid var(--color-surface-2)",
            color: "var(--color-text-muted)", textDecoration: "none",
            fontSize: "11px", fontWeight: 600,
          }}
        >
          View
        </Link>
        {actions.map((action) => (
          <button
            key={action.next}
            disabled={actioning}
            onClick={() => onAction(booking._id, action.next)}
            style={{
              padding: "5px 11px", borderRadius: "7px",
              border: `1px solid ${action.color}44`,
              backgroundColor: `${action.color}15`,
              color: action.color,
              fontSize: "11px", fontWeight: 600,
              cursor: actioning ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: actioning ? 0.6 : 1,
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Main Dashboard ─────────────────────────────────────────────────────────────
const ProviderDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: res } = await fetchProviderStats();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAvailability = async () => {
    if (!data) return;
    setToggling(true);
    try {
      const newVal = !data.profile.availability;
      await updateAvailability(newVal);
      setData((prev) => ({ ...prev, profile: { ...prev.profile, availability: newVal } }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update availability.");
    } finally {
      setToggling(false);
    }
  };

  const handleAction = async (bookingId, newStatus) => {
    setActioning(true);
    setActionMsg("");
    try {
      await updateBookingStatus(bookingId, { status: newStatus });
      setActionMsg(`✅ Booking marked as ${newStatus.replace("_", " ")}`);
      setTimeout(() => setActionMsg(""), 3000);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
    } finally {
      setActioning(false);
    }
  };

  const stats = data?.stats || {};
  const profile = data?.profile || {};
  const requests = data?.recentRequests || [];

  return (
    <DashboardShell role="provider" accentColor="#06b6d4" icon="🔧" items={[]}>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          borderRadius: "22px",
          padding: "28px 32px",
          marginBottom: "28px",
          background: "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(99,102,241,0.08))",
          border: "1px solid rgba(6,182,212,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <span style={{ fontSize: "48px" }}>🔧</span>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>
              Welcome back, {user?.name?.split(" ")[0]}!
            </h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>
              Provider Dashboard &nbsp;·&nbsp;
              <span style={{ color: "#06b6d4" }}>{user?.email}</span>
              {profile.isVerified && (
                <> &nbsp;·&nbsp; <Badge color="#10b981">✅ Verified</Badge></>
              )}
            </p>
          </div>
        </div>

        {/* Availability Toggle */}
        {!loading && (
          <button
            id="availability-toggle"
            onClick={handleAvailability}
            disabled={toggling}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 20px",
              borderRadius: "12px",
              border: profile.availability
                ? "1px solid rgba(16,185,129,0.4)"
                : "1px solid rgba(148,163,184,0.3)",
              backgroundColor: profile.availability
                ? "rgba(16,185,129,0.12)"
                : "rgba(148,163,184,0.08)",
              color: profile.availability ? "#10b981" : "#94a3b8",
              fontSize: "13px", fontWeight: 700,
              cursor: toggling ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
              opacity: toggling ? 0.7 : 1,
            }}
          >
            <span
              style={{
                width: "10px", height: "10px", borderRadius: "50%",
                backgroundColor: profile.availability ? "#10b981" : "#64748b",
                boxShadow: profile.availability ? "0 0 8px #10b981" : "none",
                display: "inline-block",
              }}
            />
            {toggling ? "Updating…" : profile.availability ? "Available for Bookings" : "Currently Unavailable"}
          </button>
        )}
      </div>

      {/* ── Global Messages ──────────────────────────────────────────────────── */}
      {error && (
        <div style={{ marginBottom: "20px" }}>
          <ErrorMessage message={error} onRetry={load} />
        </div>
      )}
      {actionMsg && (
        <div
          style={{
            backgroundColor: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "20px",
            fontSize: "13px",
            color: "#6ee7b7",
          }}
        >
          {actionMsg}
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading dashboard…" />
      ) : (
        <>
          {/* ── Stats Grid ───────────────────────────────────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
              gap: "14px",
              marginBottom: "28px",
            }}
          >
            <StatCard icon="📋" label="Total Requests" value={stats.total ?? 0} color="#6366f1" />
            <StatCard
              icon="⏳" label="Pending" value={stats.pending ?? 0} color="#f59e0b"
              sub={stats.pending > 0 ? "Needs attention" : null}
            />
            <StatCard icon="✅" label="Accepted" value={stats.accepted ?? 0} color="#3b82f6" />
            <StatCard icon="🔧" label="In Progress" value={stats.in_progress ?? 0} color="#8b5cf6" />
            <StatCard
              icon="🎉" label="Completed" value={stats.completed ?? 0} color="#10b981"
              sub={stats.totalEarned > 0 ? `₹${stats.totalEarned.toLocaleString("en-IN")} earned` : null}
            />
            <StatCard
              icon="⭐" label="Avg. Rating"
              value={profile.totalReviews > 0 ? (profile.averageRating?.toFixed(1) ?? "—") : "—"}
              color="#f59e0b"
              sub={profile.totalReviews > 0
                ? `${profile.totalReviews} review${profile.totalReviews !== 1 ? "s" : ""}`
                : "No reviews yet"}
            />
          </div>

          {/* ── Two-column lower section ─────────────────────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
              alignItems: "start",
            }}
          >
            {/* ── LEFT: Recent Requests ──────────────────────────────────────── */}
            <div
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-surface-2)",
                borderRadius: "18px",
                padding: "22px",
              }}
            >
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "2px" }}>
                    Active Requests
                  </h2>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    Pending, accepted &amp; in-progress jobs
                  </p>
                </div>
                <Link
                  to="/provider/bookings"
                  style={{
                    fontSize: "12px", fontWeight: 600, color: "#06b6d4",
                    textDecoration: "none", padding: "5px 12px",
                    border: "1px solid rgba(6,182,212,0.3)",
                    borderRadius: "8px",
                  }}
                >
                  View All →
                </Link>
              </div>

              {requests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-muted)" }}>
                  <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text)", marginBottom: "6px" }}>
                    No active requests
                  </p>
                  <p style={{ fontSize: "13px", marginBottom: "16px" }}>
                    {profile.availability
                      ? "New booking requests will appear here."
                      : "Toggle availability to receive new booking requests."}
                  </p>
                  {!profile.availability && (
                    <button
                      onClick={handleAvailability}
                      style={{
                        padding: "8px 18px", borderRadius: "9px",
                        border: "1px solid rgba(6,182,212,0.4)",
                        backgroundColor: "rgba(6,182,212,0.1)",
                        color: "#06b6d4", fontSize: "13px", fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      Go Available
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {requests.map((b) => (
                    <RecentRequestRow
                      key={b._id}
                      booking={b}
                      onAction={handleAction}
                      actioning={actioning}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: Sidebar ─────────────────────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Rating Card */}
              <div
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-surface-2)",
                  borderRadius: "18px",
                  padding: "20px",
                }}
              >
                <h3 style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Your Rating
                </h3>
                {profile.totalReviews > 0 ? (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "44px", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                      {profile.averageRating?.toFixed(1)}
                    </div>
                    <div style={{ margin: "8px 0" }}>
                      <StarRating rating={profile.averageRating} size={18} />
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                      Based on {profile.totalReviews} review{profile.totalReviews !== 1 ? "s" : ""}
                    </p>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "12px 0" }}>
                    <div style={{ fontSize: "32px", marginBottom: "6px" }}>⭐</div>
                    <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                      Complete jobs to<br />earn your first rating
                    </p>
                  </div>
                )}
              </div>

              {/* All-time Breakdown */}
              <div
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-surface-2)",
                  borderRadius: "18px",
                  padding: "20px",
                }}
              >
                <h3 style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  All-Time Breakdown
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { label: "Cancelled", value: stats.cancelled ?? 0, color: "#94a3b8" },
                    { label: "Rejected", value: stats.rejected ?? 0, color: "#ef4444" },
                    { label: "Total Earned", value: `₹${(stats.totalEarned ?? 0).toLocaleString("en-IN")}`, color: "#10b981" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{label}</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Navigation */}
              <div
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-surface-2)",
                  borderRadius: "18px",
                  padding: "20px",
                }}
              >
                <h3 style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Quick Navigation
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <QuickAction to="/provider/bookings" icon="📋" label="Booking Requests" color="#06b6d4" />
                  <QuickAction to="/provider/profile" icon="👤" label="Edit My Profile" color="#6366f1" />
                </div>
              </div>

              {/* Profile Snapshot */}
              {(profile.serviceArea || profile.experience > 0 || profile.serviceCategories?.length > 0) && (
                <div
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-surface-2)",
                    borderRadius: "18px",
                    padding: "20px",
                  }}
                >
                  <h3 style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Profile Snapshot
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {profile.experience > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Experience</span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>
                          {profile.experience} yr{profile.experience !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                    {profile.serviceArea && (
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                        <span style={{ fontSize: "12px", color: "var(--color-text-muted)", flexShrink: 0 }}>Area</span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff", textAlign: "right" }}>
                          {profile.serviceArea}
                        </span>
                      </div>
                    )}
                    {profile.serviceCategories?.length > 0 && (
                      <div>
                        <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "6px" }}>
                          Services
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                          {profile.serviceCategories.map((cat) => (
                            <span
                              key={cat._id}
                              style={{
                                padding: "3px 9px", borderRadius: "999px",
                                backgroundColor: "rgba(6,182,212,0.12)",
                                border: "1px solid rgba(6,182,212,0.25)",
                                fontSize: "11px", color: "#06b6d4", fontWeight: 600,
                              }}
                            >
                              {cat.image} {cat.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

              {/* Recent Reviews (Compact) */}
              <div
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-surface-2)",
                  borderRadius: "18px",
                  padding: "20px",
                }}
              >
                <h3 style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Recent Reviews
                </h3>
                <ReviewsSection
                  providerId={data.profile._id}
                  profile={{ averageRating: profile.averageRating, totalReviews: profile.totalReviews }}
                  compact={true}
                />
              </div>

          </div>
        </>
      )}
    </DashboardShell>
  );
};

export default ProviderDashboard;
