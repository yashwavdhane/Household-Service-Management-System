import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchMyBookings } from "../../api/bookingApi";
import DashboardShell from "../../components/common/DashboardShell";
import { LoadingSpinner, ErrorMessage, EmptyState, StatusBadge } from "../../components/common/UIHelpers";

const STATUS_TABS = ["all", "pending", "accepted", "in_progress", "completed", "cancelled", "rejected"];

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = activeTab !== "all" ? { status: activeTab } : {};
      const { data } = await fetchMyBookings(params);
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const fmt = (ds) => {
    if (!ds) return "—";
    try { return new Date(ds + "T00:00:00").toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }); }
    catch { return ds; }
  };

  return (
    <DashboardShell role="customer" accentColor="#6366f1" icon="👤" items={[]}>
      <div>
        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>My Bookings</h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
            {loading ? "Loading…" : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Status Tabs */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "6px 14px", borderRadius: "999px",
                border: `1px solid ${activeTab === tab ? "var(--color-primary)" : "var(--color-surface-2)"}`,
                backgroundColor: activeTab === tab ? "rgba(99,102,241,0.2)" : "transparent",
                color: activeTab === tab ? "#fff" : "var(--color-text-muted)",
                fontSize: "12px", fontWeight: activeTab === tab ? 600 : 400,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                textTransform: tab === "in_progress" ? "none" : "capitalize",
              }}
            >
              {tab === "all" ? "All" : tab === "in_progress" ? "In Progress" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {error && <ErrorMessage message={error} onRetry={load} />}

        {loading ? (
          <LoadingSpinner />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No bookings yet"
            message={activeTab === "all"
              ? "You haven't made any bookings. Browse services to get started!"
              : `No ${activeTab.replace("_", " ")} bookings found.`}
            action={
              activeTab === "all" && (
                <Link
                  to="/services"
                  style={{
                    display: "inline-block", padding: "10px 22px", borderRadius: "10px",
                    background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                    color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: "13px",
                  }}
                >
                  Browse Services
                </Link>
              )
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {bookings.map((b) => {
              const provUser = b.providerId?.userId || {};
              const category = b.serviceCategoryId || {};
              return (
                <Link
                  key={b._id}
                  to={`/bookings/${b._id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-surface-2)",
                      borderRadius: "14px", padding: "18px 20px",
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", gap: "14px",
                      transition: "border-color 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--color-surface-2)"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                      {/* Category icon */}
                      <div style={{
                        width: "42px", height: "42px", borderRadius: "12px",
                        backgroundColor: "rgba(99,102,241,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "20px", flexShrink: 0,
                      }}>
                        {category.image || "🔧"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "3px" }}>
                          {category.name || "Service"}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                          {provUser.name || "Provider"} · {fmt(b.bookingDate)} at {b.bookingTime}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                      <StatusBadge status={b.status} />
                      {b.finalPrice != null && (
                        <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>₹{b.finalPrice}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default MyBookingsPage;
