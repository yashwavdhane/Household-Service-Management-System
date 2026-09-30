/**
 * Shared UI helper components for Phase 3+
 * - PageShell: consistent page layout with header + back nav
 * - LoadingSpinner: centered spinner
 * - ErrorMessage: styled error box
 * - EmptyState: nothing-found placeholder
 * - Badge: small pill badge
 * - StarRating: read-only star display
 */

// ─── LoadingSpinner ───────────────────────────────────────────────────────────
export const LoadingSpinner = ({ message = "Loading…" }) => (
  <div
    style={{
      minHeight: "200px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
    }}
  >
    <div
      style={{
        width: "36px",
        height: "36px",
        border: "3px solid var(--color-surface-2)",
        borderTopColor: "var(--color-primary)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
    <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>{message}</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── ErrorMessage ─────────────────────────────────────────────────────────────
export const ErrorMessage = ({ message, onRetry }) => (
  <div
    style={{
      backgroundColor: "rgba(239,68,68,0.1)",
      border: "1px solid rgba(239,68,68,0.35)",
      borderRadius: "12px",
      padding: "16px 20px",
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
    }}
  >
    <span style={{ fontSize: "18px" }}>⚠️</span>
    <div style={{ flex: 1 }}>
      <p style={{ color: "#fca5a5", fontSize: "14px", marginBottom: onRetry ? "8px" : 0 }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: "none",
            border: "1px solid rgba(239,68,68,0.4)",
            color: "#fca5a5",
            borderRadius: "6px",
            padding: "4px 12px",
            fontSize: "12px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Retry
        </button>
      )}
    </div>
  </div>
);

// ─── EmptyState ───────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = "📭", title, message, action }) => (
  <div
    style={{
      textAlign: "center",
      padding: "60px 24px",
      color: "var(--color-text-muted)",
    }}
  >
    <div style={{ fontSize: "48px", marginBottom: "12px" }}>{icon}</div>
    {title && (
      <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text)", marginBottom: "6px" }}>
        {title}
      </p>
    )}
    {message && <p style={{ fontSize: "14px", marginBottom: action ? "20px" : 0 }}>{message}</p>}
    {action}
  </div>
);

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = ({ children, color = "var(--color-primary)", bg }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 10px",
      borderRadius: "999px",
      fontSize: "11px",
      fontWeight: 600,
      color,
      backgroundColor: bg || `${color}22`,
      border: `1px solid ${color}44`,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

// ─── StarRating ───────────────────────────────────────────────────────────────
export const StarRating = ({ rating = 0, totalReviews, size = 14 }) => {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const fill = i + 1 <= Math.round(rating) ? "#f59e0b" : "var(--color-surface-2)";
    return (
      <span key={i} style={{ color: fill, fontSize: `${size}px` }}>
        ★
      </span>
    );
  });
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
      {stars}
      {totalReviews !== undefined && (
        <span style={{ fontSize: `${size - 2}px`, color: "var(--color-text-muted)", marginLeft: "4px" }}>
          ({totalReviews})
        </span>
      )}
    </span>
  );
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:     { label: "Pending",     color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: "⏳" },
  accepted:    { label: "Accepted",    color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  icon: "✅" },
  in_progress: { label: "In Progress", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  icon: "🔧" },
  completed:   { label: "Completed",   color: "#10b981", bg: "rgba(16,185,129,0.12)",  icon: "🎉" },
  cancelled:   { label: "Cancelled",   color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  icon: "❌" },
  rejected:    { label: "Rejected",    color: "#ef4444", bg: "rgba(239,68,68,0.12)",   icon: "🚫" },
};

export const StatusBadge = ({ status, size = "sm" }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "#94a3b8", bg: "rgba(148,163,184,0.1)", icon: "•" };
  const pad = size === "lg" ? "6px 14px" : "4px 10px";
  const fs  = size === "lg" ? "13px" : "11px";
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: pad, borderRadius: "999px",
        fontSize: fs, fontWeight: 600,
        color: cfg.color,
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.color}44`,
        whiteSpace: "nowrap",
      }}
    >
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
};

// ─── ConfirmDialog (inline, no library needed) ───────────────────────────────
export const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, danger }) => {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-surface-2)",
          borderRadius: "16px",
          padding: "28px",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
          {title}
        </h3>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginBottom: "24px" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 18px", borderRadius: "8px",
              border: "1px solid var(--color-surface-2)",
              backgroundColor: "transparent",
              color: "var(--color-text-muted)",
              cursor: "pointer", fontFamily: "inherit", fontSize: "13px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 18px", borderRadius: "8px",
              border: "none",
              backgroundColor: danger ? "#ef4444" : "var(--color-primary)",
              color: "#fff",
              cursor: "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: 600,
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
