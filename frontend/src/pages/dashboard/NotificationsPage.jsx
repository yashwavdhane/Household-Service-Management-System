import { useState, useEffect, useCallback } from "react";
import DashboardShell from "../../components/common/DashboardShell";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../../api/notificationApi";
import { LoadingSpinner, ErrorMessage } from "../../components/common/UIHelpers";

const NotificationIcon = ({ type }) => {
  const icons = {
    info: { char: "ℹ️", bg: "rgba(59,130,246,0.1)", color: "#3b82f6" },
    success: { char: "✅", bg: "rgba(16,185,129,0.1)", color: "#10b981" },
    warning: { char: "⚠️", bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
    error: { char: "❌", bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
    booking: { char: "📅", bg: "rgba(99,102,241,0.1)", color: "#6366f1" },
  };
  const { char, bg, color } = icons[type] || icons.info;
  
  return (
    <div style={{
      width: "36px", height: "36px", borderRadius: "50%",
      backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "16px", flexShrink: 0,
      border: `1px solid ${color}33`,
    }}>
      {char}
    </div>
  );
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchNotifications({ page, limit: 10 });
      setNotifications(data.notifications || []);
      setPagination(data.pagination || { page: 1, pages: 1 });
      setUnreadCount(data.unreadCount || 0);
      setError("");
    } catch (err) {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setMarking(false);
    }
  };

  const fmtDate = (d) => new Date(d).toLocaleString("en-IN", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });

  return (
    <DashboardShell title="Notifications">
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Header Options */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>All Notifications</h2>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
              {unreadCount > 0 ? `You have ${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}` : "You're all caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={marking}
              style={{
                padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--color-surface-2)",
                backgroundColor: "transparent", color: "var(--color-text)", cursor: "pointer",
                fontSize: "12px", fontWeight: 600, fontFamily: "inherit"
              }}
            >
              {marking ? "Marking..." : "Mark all as read"}
            </button>
          )}
        </div>

        {/* Content */}
        {loading && notifications.length === 0 ? (
          <LoadingSpinner message="Loading notifications..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "var(--color-surface)", border: "1px solid var(--color-surface-2)", borderRadius: "16px" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", marginBottom: "6px" }}>No notifications yet</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>When you get updates about your bookings, they will appear here.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {notifications.map((n) => (
              <div
                key={n._id}
                style={{
                  display: "flex", gap: "16px", padding: "18px",
                  backgroundColor: n.isRead ? "var(--color-surface)" : "var(--color-surface-light)",
                  border: `1px solid ${n.isRead ? "var(--color-surface-2)" : "rgba(99,102,241,0.3)"}`,
                  borderRadius: "14px",
                  transition: "background-color 0.2s",
                }}
              >
                <NotificationIcon type={n.type} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "6px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: n.isRead ? 600 : 700, color: n.isRead ? "var(--color-text)" : "#fff" }}>
                      {n.title}
                    </h4>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                      {fmtDate(n.createdAt)}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: n.isRead ? "var(--color-text-muted)" : "var(--color-text)", lineHeight: 1.5, marginBottom: n.isRead ? "0" : "10px" }}>
                    {n.message}
                  </p>
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n._id)}
                      style={{
                        padding: "0", border: "none", background: "none",
                        color: "var(--color-primary-light)", fontSize: "12px", fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit"
                      }}
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "14px", marginTop: "20px" }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--color-surface-2)",
                    backgroundColor: "transparent", color: page === 1 ? "var(--color-text-muted)" : "#fff",
                    cursor: page === 1 ? "not-allowed" : "pointer", fontSize: "13px"
                  }}
                >
                  ← Previous
                </button>
                <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  style={{
                    padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--color-surface-2)",
                    backgroundColor: "transparent", color: page === pagination.pages ? "var(--color-text-muted)" : "#fff",
                    cursor: page === pagination.pages ? "not-allowed" : "pointer", fontSize: "13px"
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default NotificationsPage;
