/**
 * ReviewForm — shown on the BookingDetailPage when:
 *   - The logged-in user is a customer
 *   - The booking status is "completed"
 *   - The customer hasn't already submitted a review
 *
 * Props:
 *   bookingId      : string
 *   providerId     : ProviderProfile._id
 *   onSubmitted    : () => void  (callback after successful submission)
 */
import { useState, useEffect } from "react";
import { submitReview, fetchBookingReview } from "../../api/reviewApi";
import { LoadingSpinner, StarRating } from "./UIHelpers";

// ─── Interactive Star Picker ────────────────────────────────────────────────────
const StarPicker = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: "none", border: "none", padding: 0,
            cursor: "pointer",
            fontSize: "32px",
            color: star <= (hovered || value) ? "#f59e0b" : "var(--color-surface-2)",
            transition: "color 0.1s, transform 0.1s",
            transform: star === (hovered || value) ? "scale(1.15)" : "scale(1)",
            lineHeight: 1,
          }}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <span style={{ fontSize: "13px", color: "#f59e0b", fontWeight: 600, marginLeft: "4px" }}>
          {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}
        </span>
      )}
    </div>
  );
};

// ─── Main ReviewForm ────────────────────────────────────────────────────────────
const ReviewForm = ({ bookingId, providerId, onSubmitted }) => {
  const [existing, setExisting] = useState(null); // existing review if any
  const [checking, setChecking] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const check = async () => {
      setChecking(true);
      try {
        const { data } = await fetchBookingReview(bookingId);
        setExisting(data.review);
      } catch {
        // If the check fails (e.g., 401), just show the form
        setExisting(null);
      } finally {
        setChecking(false);
      }
    };
    if (bookingId) check();
  }, [bookingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating."); return; }
    setSubmitting(true);
    setError("");
    try {
      const { data } = await submitReview({ bookingId, rating, comment });
      setExisting(data.review);
      setSuccess(true);
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) return <div style={{ padding: "20px 0" }}><LoadingSpinner message="Checking review status…" /></div>;

  // ── Already submitted ─────────────────────────────────────────────────────────
  if (existing) {
    return (
      <div
        style={{
          backgroundColor: "rgba(16,185,129,0.06)",
          border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: "14px",
          padding: "20px 22px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <span style={{ fontSize: "20px" }}>✅</span>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#6ee7b7", marginBottom: "2px" }}>Review Submitted</p>
            <StarRating rating={existing.rating} size={14} />
          </div>
        </div>
        {existing.comment && (
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            "{existing.comment}"
          </p>
        )}
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div
        style={{
          backgroundColor: "rgba(16,185,129,0.08)",
          border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: "14px",
          padding: "20px 22px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "36px", marginBottom: "8px" }}>🎉</div>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "#6ee7b7", marginBottom: "4px" }}>Thank you for your review!</p>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Your feedback helps other customers choose the right provider.</p>
      </div>
    );
  }

  // ── Review form ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-surface-2)",
        borderRadius: "16px",
        padding: "22px",
      }}
    >
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>⭐ Leave a Review</h3>
        <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Share your experience to help other customers.</p>
      </div>

      {error && (
        <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "13px", color: "#fca5a5" }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Star Picker */}
        <div>
          <label style={{ display: "block", fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Your Rating *
          </label>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        {/* Comment */}
        <div>
          <label style={{ display: "block", fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Your Comment (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was your experience? What went well? What could be improved?"
            maxLength={1000}
            rows={4}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid var(--color-surface-2)",
              backgroundColor: "rgba(15,23,42,0.7)",
              color: "var(--color-text)",
              fontSize: "13px",
              outline: "none",
              resize: "vertical",
              lineHeight: 1.6,
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
          <p style={{ fontSize: "11px", color: "var(--color-text-muted)", textAlign: "right", marginTop: "4px" }}>
            {comment.length}/1000
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || rating === 0}
          style={{
            padding: "11px",
            borderRadius: "10px",
            border: "none",
            background: submitting || rating === 0
              ? "rgba(99,102,241,0.3)"
              : "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 600,
            cursor: submitting || rating === 0 ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            transition: "opacity 0.2s",
          }}
        >
          {submitting ? "Submitting…" : "Submit Review"}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
