import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchAdminCommunications } from "../../api/adminApi";
import DashboardShell from "../../components/common/DashboardShell";
import { LoadingSpinner, ErrorMessage, EmptyState } from "../../components/common/UIHelpers";

const AdminCommunications = () => {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await fetchAdminCommunications({ page, limit: 20 });
      setMessages(data.messages || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load communications.");
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const fmtDate = (d) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <DashboardShell role="admin" accentColor="#f59e0b" icon="🛡️" items={[]}>
      <div>
        <div style={{ marginBottom: "22px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>Communications & Support</h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
            Platform-wide booking messages and communications log
          </p>
        </div>

        {error && <div style={{ marginBottom: "16px" }}><ErrorMessage message={error} onRetry={load} /></div>}

        {loading ? <LoadingSpinner /> : messages.length === 0 ? (
          <EmptyState icon="💬" title="No messages yet" message="No communications have occurred on the platform." />
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {messages.map((msg) => (
                <div key={msg._id} style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-surface-2)", borderRadius: "14px", padding: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>
                        {msg.senderId?.name || "Unknown User"} 
                        <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginLeft: "8px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.1)" }}>
                          {msg.senderId?.role || "user"}
                        </span>
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{msg.senderId?.email || ""}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>{fmtDate(msg.createdAt)}</p>
                      <Link to={`/bookings/${msg.bookingId?._id}`} style={{ fontSize: "12px", color: "#f59e0b", textDecoration: "none", fontWeight: 600 }}>
                        View Booking →
                      </Link>
                    </div>
                  </div>
                  
                  <div style={{ padding: "12px", backgroundColor: "rgba(15,23,42,0.4)", borderRadius: "10px", border: "1px solid var(--color-surface-2)" }}>
                    <p style={{ fontSize: "14px", color: "var(--color-text)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                      {msg.content}
                    </p>
                  </div>
                  
                  {msg.bookingId && (
                    <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--color-text-muted)", display: "flex", gap: "10px" }}>
                      <span>Booking ID: <span style={{ fontFamily: "monospace" }}>{msg.bookingId._id}</span></span>
                      <span>Category: {msg.bookingId.serviceCategoryId?.name}</span>
                      <span>Status: {msg.bookingId.status}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "20px" }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--color-surface-2)", backgroundColor: "transparent", color: page === 1 ? "var(--color-text-muted)" : "#fff", cursor: page === 1 ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: "13px" }}>← Prev</button>
                <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Page {page} of {pagination.pages}</span>
                <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--color-surface-2)", backgroundColor: "transparent", color: page === pagination.pages ? "var(--color-text-muted)" : "#fff", cursor: page === pagination.pages ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: "13px" }}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
};

export default AdminCommunications;
