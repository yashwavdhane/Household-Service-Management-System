import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchMyBookings, updateBookingStatus } from "../../api/bookingApi";
import DashboardShell from "../../components/common/DashboardShell";
import { LoadingSpinner, ErrorMessage, EmptyState, StatusBadge, ConfirmDialog } from "../../components/common/UIHelpers";

const STATUS_TABS = ["all", "pending", "accepted", "in_progress", "completed", "cancelled", "rejected"];

// Status actions a provider can perform
const PROVIDER_ACTIONS = {
  pending:     [{ label: "Accept",      next: "accepted",    color: "#10b981" }, { label: "Reject", next: "rejected", color: "#ef4444" }],
  accepted:    [{ label: "Start Job",   next: "in_progress", color: "#8b5cf6" }, { label: "Reject", next: "rejected", color: "#ef4444" }],
  in_progress: [{ label: "Mark Complete", next: "completed", color: "#10b981" }],
  completed:   [],
  cancelled:   [],
  rejected:    [],
};

const ProviderBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [actionState, setActionState] = useState({ open: false, bookingId: null, next: null, label: "", finalPrice: "" });
  const [actioning, setActioning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = activeTab !== "all" ? { status: activeTab } : {};
      const { data } = await fetchMyBookings(params);
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load booking requests.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const openAction = (bookingId, next, label) =>
    setActionState({ open: true, bookingId, next, label, finalPrice: "" });

  const handleAction = async () => {
    setActioning(true);
    try {
      const payload = { status: actionState.next };
      if (actionState.next === "completed" && actionState.finalPrice) {
        payload.finalPrice = parseFloat(actionState.finalPrice);
      }
      await updateBookingStatus(actionState.bookingId, payload);
      setActionState({ open: false, bookingId: null, next: null, label: "", finalPrice: "" });
      load(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update booking.");
      setActionState({ open: false, bookingId: null, next: null, label: "", finalPrice: "" });
    } finally {
      setActioning(false);
    }
  };

  const fmt = (ds) => {
    if (!ds) return "—";
    try { return new Date(ds + "T00:00:00").toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }); }
    catch { return ds; }
  };

  return (
    <DashboardShell role="provider" accentColor="#06b6d4" icon="🔧" items={[]}>
      <div>
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>Booking Requests</h1>
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
                border: `1px solid ${activeTab === tab ? "#06b6d4" : "var(--color-surface-2)"}`,
                backgroundColor: activeTab === tab ? "rgba(6,182,212,0.2)" : "transparent",
                color: activeTab === tab ? "#fff" : "var(--color-text-muted)",
                fontSize: "12px", fontWeight: activeTab === tab ? 600 : 400,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
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
            title="No booking requests"
            message={activeTab === "all"
              ? "No bookings have been assigned to you yet. Make sure your profile and availability are set up."
              : `No ${activeTab.replace("_", " ")} bookings.`}
            action={
              <Link
                to="/provider/profile"
                style={{
                  display: "inline-block", padding: "10px 22px", borderRadius: "10px",
                  border: "1px solid #06b6d4", color: "#06b6d4",
                  textDecoration: "none", fontWeight: 600, fontSize: "13px",
                }}
              >
                Update Profile
              </Link>
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {bookings.map((b) => {
              const customer = b.customerId || {};
              const category = b.serviceCategoryId || {};
              const actions = PROVIDER_ACTIONS[b.status] || [];
              return (
                <div
                  key={b._id}
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-surface-2)",
                    borderRadius: "16px", padding: "20px",
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "10px",
                        backgroundColor: "rgba(6,182,212,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "18px", flexShrink: 0,
                      }}>
                        {category.image || "🔧"}
                      </div>
                      <div>
                        <p style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "2px" }}>
                          {category.name || "Service"}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                          👤 {customer.name || "Customer"} · {fmt(b.bookingDate)} at {b.bookingTime}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  {/* Address & Description */}
                  <div style={{ marginBottom: "14px", display: "flex", flexDirection: "column", gap: "5px" }}>
                    <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>📍 {b.address}</p>
                    {b.description && (
                      <p style={{ fontSize: "12px", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                        "{b.description.length > 100 ? b.description.slice(0, 100) + "…" : b.description}"
                      </p>
                    )}
                    {b.finalPrice != null && (
                      <p style={{ fontSize: "13px", color: "#10b981", fontWeight: 600 }}>Final: ₹{b.finalPrice}</p>
                    )}
                  </div>

                  {/* Actions + View */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    <Link
                      to={`/bookings/${b._id}`}
                      style={{
                        padding: "7px 14px", borderRadius: "8px",
                        border: "1px solid var(--color-surface-2)",
                        color: "var(--color-text-muted)", textDecoration: "none",
                        fontSize: "12px", fontWeight: 600,
                      }}
                    >
                      View Details
                    </Link>
                    {actions.map((action) => (
                      <button
                        key={action.next}
                        onClick={() => openAction(b._id, action.next, action.label)}
                        style={{
                          padding: "7px 14px", borderRadius: "8px",
                          border: `1px solid ${action.color}44`,
                          backgroundColor: `${action.color}18`,
                          color: action.color,
                          fontSize: "12px", fontWeight: 600,
                          cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Confirm Modal */}
      {actionState.open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          backgroundColor: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
        }}>
          <div style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-surface-2)",
            borderRadius: "20px", padding: "28px",
            width: "100%", maxWidth: "380px",
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
              {actionState.label}?
            </h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "16px" }}>
              Confirm that you want to mark this booking as <strong style={{ color: "#fff" }}>{actionState.next?.replace("_", " ")}</strong>.
            </p>

            {/* Final price input only for completing */}
            {actionState.next === "completed" && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "6px" }}>
                  Final Price (₹) — optional
                </label>
                <input
                  type="number"
                  min="0"
                  value={actionState.finalPrice}
                  onChange={(e) => setActionState((p) => ({ ...p, finalPrice: e.target.value }))}
                  placeholder="e.g. 800"
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: "8px",
                    border: "1px solid var(--color-surface-2)",
                    backgroundColor: "rgba(15,23,42,0.6)",
                    color: "var(--color-text)", fontSize: "13px",
                    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                  }}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setActionState({ open: false, bookingId: null, next: null, label: "", finalPrice: "" })}
                style={{
                  flex: 1, padding: "10px", borderRadius: "8px",
                  border: "1px solid var(--color-surface-2)",
                  backgroundColor: "transparent", color: "var(--color-text-muted)",
                  cursor: "pointer", fontFamily: "inherit", fontSize: "13px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={actioning}
                style={{
                  flex: 1, padding: "10px", borderRadius: "8px", border: "none",
                  backgroundColor: "#06b6d4",
                  color: "#fff", cursor: "pointer", fontFamily: "inherit",
                  fontSize: "13px", fontWeight: 600,
                  opacity: actioning ? 0.7 : 1,
                }}
              >
                {actioning ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default ProviderBookingsPage;
