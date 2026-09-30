import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchAdminBookings } from "../../api/adminApi";
import { fetchCategories } from "../../api/categoryApi";
import DashboardShell from "../../components/common/DashboardShell";
import { LoadingSpinner, ErrorMessage, EmptyState, StatusBadge } from "../../components/common/UIHelpers";

const STATUSES = ["pending", "accepted", "in_progress", "completed", "cancelled", "rejected"];

const ManageBookings = () => {
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("categoryId") || "");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = { page, limit: 25 };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.categoryId = categoryFilter;
      const { data } = await fetchAdminBookings(params);
      setBookings(data.bookings || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load bookings.");
    } finally { setLoading(false); }
  }, [statusFilter, categoryFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetchCategories().then(({ data }) => setCategories(data.categories || [])).catch(() => {});
  }, []);

  const fmtDate = (d) => {
    if (!d) return "—";
    try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return d; }
  };
  const fmtTs = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const inputStyle = { padding: "8px 12px", borderRadius: "9px", border: "1px solid var(--color-surface-2)", backgroundColor: "rgba(15,23,42,0.7)", color: "var(--color-text)", fontSize: "13px", outline: "none", fontFamily: "inherit" };

  return (
    <DashboardShell role="admin" accentColor="#f59e0b" icon="🛡️" items={[]}>
      <div>
        <div style={{ marginBottom: "22px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>Manage Bookings</h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{pagination.total} bookings · Filter by status and category</p>
        </div>

        {/* Status Tabs */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
          {["", ...STATUSES].map((s) => (
            <button
              key={s || "all"}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              style={{
                padding: "6px 14px", borderRadius: "999px", cursor: "pointer", fontFamily: "inherit", fontSize: "12px", fontWeight: statusFilter === s ? 600 : 400,
                border: statusFilter === s ? "1px solid #f59e0b" : "1px solid var(--color-surface-2)",
                backgroundColor: statusFilter === s ? "rgba(245,158,11,0.15)" : "transparent",
                color: statusFilter === s ? "#f59e0b" : "var(--color-text-muted)",
              }}
            >
              {s === "" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} style={inputStyle}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.image} {c.name}</option>)}
          </select>
          <button onClick={load} style={{ ...inputStyle, backgroundColor: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", cursor: "pointer", fontWeight: 600 }}>Refresh</button>
        </div>

        {error && <div style={{ marginBottom: "16px" }}><ErrorMessage message={error} onRetry={load} /></div>}

        {loading ? <LoadingSpinner /> : bookings.length === 0 ? (
          <EmptyState icon="📋" title="No bookings found" message="Try changing your filters." />
        ) : (
          <>
            <div style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-surface-2)", borderRadius: "16px", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 1fr 1fr 90px 80px 80px", padding: "11px 20px", gap: "10px", borderBottom: "1px solid var(--color-surface-2)", fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <span></span><span>Service</span><span>Customer</span><span>Provider</span><span>Date</span><span>Status</span><span style={{ textAlign: "right" }}>Price</span>
              </div>

              {bookings.map((b, i) => {
                const customer = b.customerId || {};
                const provider = b.providerId?.userId || {};
                const category = b.serviceCategoryId || {};
                return (
                  <Link key={b._id} to={`/bookings/${b._id}`} style={{ textDecoration: "none" }}>
                    <div
                      style={{ display: "grid", gridTemplateColumns: "36px 1fr 1fr 1fr 90px 80px 80px", padding: "13px 20px", gap: "10px", alignItems: "center", borderBottom: i < bookings.length - 1 ? "1px solid rgba(51,65,85,0.35)" : "none", transition: "background 0.15s" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(30,41,59,0.7)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <span style={{ fontSize: "18px" }}>{category.image || "🔧"}</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff", marginBottom: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{category.name || "—"}</p>
                        <p style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{fmtTs(b.createdAt)}</p>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "13px", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{customer.name || "—"}</p>
                        <p style={{ fontSize: "10px", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{customer.email}</p>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "13px", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{provider.name || "—"}</p>
                        <p style={{ fontSize: "10px", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{provider.email}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: "12px", color: "#fff" }}>{fmtDate(b.bookingDate)}</p>
                        <p style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{b.bookingTime}</p>
                      </div>
                      <StatusBadge status={b.status} />
                      <p style={{ fontSize: "12px", fontWeight: 600, color: b.finalPrice != null ? "#10b981" : "var(--color-text-muted)", textAlign: "right" }}>
                        {b.finalPrice != null ? `₹${b.finalPrice}` : b.estimatedPrice != null ? `~₹${b.estimatedPrice}` : "—"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

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

export default ManageBookings;
