/**
 * ReviewsSection — reusable component that displays a provider's reviews.
 * Used in: ProviderDetailPage, ProviderDashboard
 *
 * Props:
 *   providerId  : ProviderProfile._id  (required)
 *   profile     : { averageRating, totalReviews }  (optional, for summary header)
 *   compact     : boolean — if true, shows fewer items and no rating summary bar
 */
import { useState, useEffect, useCallback } from "react";
import { fetchProviderReviews, deleteReview } from "../../api/reviewApi";
import { LoadingSpinner, StarRating, ConfirmDialog } from "./UIHelpers";
import { useAuth } from "../../context/AuthContext";

// ─── Rating Distribution Bar ───────────────────────────────────────────────────
const RatingBar = ({ star, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
      <span style={{ fontSize: "11px", color: "var(--color-text-muted)", width: "28px", textAlign: "right" }}>{star}★</span>
      <div style={{ flex: 1, height: "6px", borderRadius: "999px", backgroundColor: "var(--color-surface-2)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: "#f59e0b", borderRadius: "999px", transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: "11px", color: "var(--color-text-muted)", width: "26px" }}>{count}</span>
    </div>
  );
};

// ─── Single Review Card ─────────────────────────────────────────────────────────
const ReviewCard = ({ review, onDelete, deleting }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const customer = review.customerId || {};
  const initials = customer.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg)",
        border: "1px solid var(--color-surface-2)",
        borderRadius: "14px",
        padding: "16px 18px",
        display: "flex",
        gap: "14px",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #6366f1, #06b6d4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "13px", fontWeight: 700, color: "#fff",
          overflow: "hidden",
        }}
      >
        {customer.profileImage
          ? <img src={customer.profileImage} alt={customer.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : initials}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "3px" }}>{customer.name || "Customer"}</p>
            <StarRating rating={review.rating} size={12} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{fmtDate(review.createdAt)}</span>
            {isAdmin && (
              <button
                onClick={() => onDelete(review)}
                disabled={deleting === review._id}
                style={{
                  padding: "3px 9px", borderRadius: "6px", fontSize: "10px", fontWeight: 600,
                  border: "1px solid rgba(239,68,68,0.4)",
                  backgroundColor: "rgba(239,68,68,0.08)",
                  color: "#ef4444", cursor: "pointer", fontFamily: "inherit",
                  opacity: deleting === review._id ? 0.6 : 1,
                }}
              >
                {deleting === review._id ? "…" : "Remove"}
              </button>
            )}
          </div>
        </div>
        {review.comment && (
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6, marginTop: "6px" }}>
            {review.comment}
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Main ReviewsSection ────────────────────────────────────────────────────────
const ReviewsSection = ({ providerId, profile, compact = false }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteMsg, setDeleteMsg] = useState("");

  const limit = compact ? 5 : 10;

  const load = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    try {
      const { data } = await fetchProviderReviews(providerId, { page, limit });
      setReviews(data.reviews || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [providerId, page, limit]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(confirmDelete._id);
    setConfirmDelete(null);
    try {
      await deleteReview(confirmDelete._id);
      setDeleteMsg("Review removed.");
      setTimeout(() => setDeleteMsg(""), 3000);
      load();
    } catch (err) {
      setDeleteMsg(err.response?.data?.message || "Failed to delete review.");
    } finally {
      setDeleting(null);
    }
  };

  // Distribution map from current page of reviews (approximate for compact)
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const totalOnPage = reviews.length;

  const avg = profile?.averageRating ?? 0;
  const totalReviews = profile?.totalReviews ?? pagination.total;

  return (
    <div>
      {/* ── Rating Summary (full mode only) ──────────────────────────────── */}
      {!compact && totalReviews > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "24px",
            marginBottom: "24px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-surface-2)",
            borderRadius: "16px",
            padding: "20px 24px",
          }}
        >
          {/* Big number */}
          <div style={{ textAlign: "center", paddingRight: "24px", borderRight: "1px solid var(--color-surface-2)" }}>
            <div style={{ fontSize: "52px", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{avg.toFixed(1)}</div>
            <div style={{ margin: "8px 0 4px" }}><StarRating rating={avg} size={16} /></div>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{totalReviews} review{totalReviews !== 1 ? "s" : ""}</p>
          </div>
          {/* Bars */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {dist.map(({ star, count }) => (
              <RatingBar key={star} star={star} count={count} total={totalOnPage} />
            ))}
          </div>
        </div>
      )}

      {/* ── Delete message ────────────────────────────────────────────────── */}
      {deleteMsg && (
        <div style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", color: "#6ee7b7" }}>
          ✅ {deleteMsg}
        </div>
      )}

      {/* ── Review List ───────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSpinner message="Loading reviews…" />
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: compact ? "24px" : "48px 24px", color: "var(--color-text-muted)" }}>
          <div style={{ fontSize: compact ? "32px" : "40px", marginBottom: "8px" }}>⭐</div>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text)", marginBottom: "4px" }}>No reviews yet</p>
          <p style={{ fontSize: "13px" }}>Reviews from completed bookings will appear here.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {reviews.map((r) => (
              <ReviewCard key={r._id} review={r} onDelete={setConfirmDelete} deleting={deleting} />
            ))}
          </div>

          {/* Pagination (full mode) */}
          {!compact && pagination.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--color-surface-2)", backgroundColor: "transparent", color: page === 1 ? "var(--color-text-muted)" : "#fff", cursor: page === 1 ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: "13px" }}
              >
                ← Prev
              </button>
              <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Page {page} of {pagination.pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--color-surface-2)", backgroundColor: "transparent", color: page === pagination.pages ? "var(--color-text-muted)" : "#fff", cursor: page === pagination.pages ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: "13px" }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Remove Review?"
        message={`Are you sure you want to remove this review by "${confirmDelete?.customerId?.name}"? The provider's rating will be recalculated.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
        danger
      />
    </div>
  );
};

export default ReviewsSection;
