import { useState, useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { fetchBookingById, cancelBooking } from "../api/bookingApi";
import { LoadingSpinner, ErrorMessage, StatusBadge, Badge, ConfirmDialog } from "../components/common/UIHelpers";
import { useAuth } from "../context/AuthContext";
import ReviewForm from "../components/common/ReviewForm";

const BookingDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const justCreated = location.state?.justCreated;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const loadBooking = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await fetchBookingById(id);
      setBooking(data.booking);
    } catch (err) {
      setError(err.response?.data?.message || "Booking not found or access denied.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBooking(); }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { data } = await cancelBooking(id, cancelReason);
      setBooking(data.booking);
      setCancelOpen(false);
      setCancelReason("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel booking.");
      setCancelOpen(false);
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = user?.role === "customer" &&
    booking && ["pending", "accepted"].includes(booking.status);

  const back = user?.role === "provider"
    ? "/provider/bookings"
    : user?.role === "admin"
    ? "/admin/bookings"
    : "/my-bookings";

  const fmt = (dateStr) => {
    if (!dateStr) return "—";
    try { return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }); }
    catch { return dateStr; }
  };

  const fmtDt = (isoStr) => isoStr ? new Date(isoStr).toLocaleString("en-IN") : "—";

  const b = booking;
  const customer = b?.customerId || {};
  const provUser = b?.providerId?.userId || {};
  const category = b?.serviceCategoryId || {};

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg)" }}>
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
        <Link to={back} style={{ fontSize: "13px", color: "var(--color-text-muted)", textDecoration: "none" }}>
          ← Back to Bookings
        </Link>
      </header>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "36px 24px" }}>
        {/* Just Created success banner */}
        {justCreated && (
          <div style={{
            backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: "12px", padding: "14px 18px", marginBottom: "20px",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <span style={{ fontSize: "20px" }}>🎉</span>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#6ee7b7", marginBottom: "2px" }}>Booking Submitted!</p>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                Your booking is now <strong style={{ color: "#f59e0b" }}>Pending</strong> — the provider will review and accept or decline shortly.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Loading booking…" />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadBooking} />
        ) : b ? (
          <>
            {/* Header */}
            <div style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-surface-2)",
              borderRadius: "20px", padding: "28px",
              marginBottom: "16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>
                    {category.image} {category.name} Service
                  </h1>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    Booking ID: <span style={{ fontFamily: "monospace", color: "var(--color-text)" }}>{b._id}</span>
                  </p>
                </div>
                <StatusBadge status={b.status} size="lg" />
              </div>

              {/* Details Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                {[
                  { label: "Date", value: fmt(b.bookingDate), icon: "📅" },
                  { label: "Time", value: b.bookingTime, icon: "🕐" },
                  { label: "Address", value: b.address, icon: "📍" },
                  { label: "Booked On", value: fmtDt(b.createdAt), icon: "🗓️" },
                  ...(b.estimatedPrice != null ? [{ label: "Estimated Price (Pay on completion)", value: `₹${b.estimatedPrice}`, icon: "💰" }] : []),
                  ...(b.finalPrice != null ? [{ label: "Final Price (Cash on Delivery)", value: `₹${b.finalPrice}`, icon: "✅" }] : []),
                ].map((row) => (
                  <div key={row.label} style={{
                    backgroundColor: "rgba(15,23,42,0.4)", borderRadius: "10px", padding: "12px 14px",
                  }}>
                    <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>{row.icon} {row.label}</p>
                    <p style={{ fontSize: "14px", color: "var(--color-text)", fontWeight: 500 }}>{row.value}</p>
                  </div>
                ))}
              </div>

              {/* Payment Clarification */}
              <div style={{ marginTop: "16px", padding: "14px", backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "10px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#10b981", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>💵</span> Payment Method: Cash on Delivery (COD)
                </p>
                <p style={{ fontSize: "13px", color: "var(--color-text)", lineHeight: 1.5 }}>
                  Payments are settled directly between the customer and the provider <strong>after</strong> the service is successfully completed. Do not make any advance payments on this platform.
                </p>
              </div>

              {b.description && (
                <div style={{ marginTop: "14px", padding: "14px", backgroundColor: "rgba(15,23,42,0.4)", borderRadius: "10px" }}>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "6px" }}>📝 Description</p>
                  <p style={{ fontSize: "14px", color: "var(--color-text)", lineHeight: 1.6 }}>{b.description}</p>
                </div>
              )}

              {b.cancellationReason && (
                <div style={{ marginTop: "14px", padding: "14px", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px" }}>
                  <p style={{ fontSize: "11px", color: "#fca5a5", marginBottom: "6px" }}>❌ Cancellation Reason</p>
                  <p style={{ fontSize: "14px", color: "var(--color-text)", lineHeight: 1.6 }}>{b.cancellationReason}</p>
                </div>
              )}
            </div>

            {/* People Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "16px" }}>
              {/* Customer */}
              <div style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-surface-2)",
                borderRadius: "14px", padding: "18px",
              }}>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Customer</p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {customer.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>{customer.name || "—"}</p>
                    <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{customer.phone || customer.email || ""}</p>
                  </div>
                </div>
              </div>

              {/* Provider */}
              <div style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-surface-2)",
                borderRadius: "14px", padding: "18px",
              }}>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Provider</p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#06b6d4,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {provUser.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>{provUser.name || "—"}</p>
                    <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{provUser.phone || provUser.email || ""}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancel button */}
            {canCancel && (
              <button
                onClick={() => setCancelOpen(true)}
                style={{
                  width: "100%", padding: "12px", borderRadius: "10px",
                  border: "1px solid rgba(239,68,68,0.35)",
                  backgroundColor: "rgba(239,68,68,0.08)",
                  color: "#ef4444", fontSize: "14px", fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Cancel Booking
              </button>
            )}

            {/* ── Review Form (customer + completed bookings only) ─────── */}
            {user?.role === "customer" && b?.status === "completed" && (
              <div style={{ marginTop: "6px" }}>
                <ReviewForm
                  bookingId={b._id}
                  providerId={b.providerId?._id || b.providerId}
                  onSubmitted={loadBooking}
                />
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Cancel Confirm Dialog */}
      {cancelOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          backgroundColor: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
        }}>
          <div style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-surface-2)",
            borderRadius: "20px", padding: "28px",
            width: "100%", maxWidth: "420px",
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>Cancel Booking</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "16px" }}>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)…"
              rows={3}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "8px",
                border: "1px solid var(--color-surface-2)",
                backgroundColor: "rgba(15,23,42,0.6)",
                color: "var(--color-text)", fontSize: "13px",
                outline: "none", resize: "vertical", boxSizing: "border-box",
                fontFamily: "inherit", marginBottom: "16px",
              }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setCancelOpen(false)}
                style={{
                  flex: 1, padding: "10px", borderRadius: "8px",
                  border: "1px solid var(--color-surface-2)",
                  backgroundColor: "transparent", color: "var(--color-text-muted)",
                  cursor: "pointer", fontFamily: "inherit", fontSize: "13px",
                }}
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{
                  flex: 1, padding: "10px", borderRadius: "8px", border: "none",
                  backgroundColor: "#ef4444",
                  color: "#fff", cursor: "pointer", fontFamily: "inherit",
                  fontSize: "13px", fontWeight: 600,
                  opacity: cancelling ? 0.7 : 1,
                }}
              >
                {cancelling ? "Cancelling…" : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetailPage;
