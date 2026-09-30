import { useState, useEffect, useCallback } from "react";
import { fetchAdminProviders, updateProviderVerification } from "../../api/adminApi";
import { updateUserStatus } from "../../api/adminApi";
import DashboardShell from "../../components/common/DashboardShell";
import { LoadingSpinner, ErrorMessage, EmptyState, StarRating, Badge, ConfirmDialog } from "../../components/common/UIHelpers";

// ─── Provider Card ─────────────────────────────────────────────────────────────
const ProviderCard = ({ provider, onVerify, onToggleUser, verifying, toggling }) => {
  const u = provider.userId || {};
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-surface-2)",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        transition: "border-color 0.18s",
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--color-surface-2)"}
    >
      {/* Top: Avatar + Info */}
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "rgba(139,92,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>🔧</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", flexWrap: "wrap" }}>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>{u.name || "Unknown"}</p>
            {provider.isVerified && <Badge color="#10b981">✅ Verified</Badge>}
            {!u.isActive && <Badge color="#ef4444">⛔ Inactive</Badge>}
          </div>
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{u.email}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
          <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "999px", backgroundColor: provider.availability ? "rgba(16,185,129,0.15)" : "rgba(148,163,184,0.1)", color: provider.availability ? "#10b981" : "#94a3b8", fontWeight: 600 }}>
            {provider.availability ? "Available" : "Unavailable"}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
        {[
          { label: "Rating", value: provider.totalReviews > 0 ? provider.averageRating?.toFixed(1) : "—" },
          { label: "Reviews", value: provider.totalReviews },
          { label: "Experience", value: provider.experience > 0 ? `${provider.experience}yr` : "—" },
          { label: "Bookings", value: provider.bookingStats?.total ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} style={{ backgroundColor: "var(--color-bg)", borderRadius: "9px", padding: "8px", textAlign: "center" }}>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "3px" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Categories */}
      {provider.serviceCategories?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {provider.serviceCategories.map((cat) => (
            <span key={cat._id} style={{ padding: "2px 8px", borderRadius: "999px", backgroundColor: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", fontSize: "11px", color: "#06b6d4", fontWeight: 600 }}>
              {cat.image} {cat.name}
            </span>
          ))}
        </div>
      )}

      {/* Service area */}
      {provider.serviceArea && (
        <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>📍 {provider.serviceArea}</p>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "4px", borderTop: "1px solid rgba(51,65,85,0.4)" }}>
        <button
          onClick={() => onVerify(provider)}
          disabled={verifying === provider._id}
          style={{
            flex: 1, padding: "8px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            border: provider.isVerified ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(16,185,129,0.4)",
            backgroundColor: provider.isVerified ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
            color: provider.isVerified ? "#ef4444" : "#10b981",
            opacity: verifying === provider._id ? 0.6 : 1,
          }}
        >
          {verifying === provider._id ? "Updating…" : provider.isVerified ? "Unverify" : "✅ Verify Provider"}
        </button>
        <button
          onClick={() => onToggleUser(provider)}
          disabled={toggling === provider._id}
          style={{
            flex: 1, padding: "8px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            border: u.isActive ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(16,185,129,0.3)",
            backgroundColor: u.isActive ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.06)",
            color: u.isActive ? "#ef4444" : "#10b981",
            opacity: toggling === provider._id ? 0.6 : 1,
          }}
        >
          {toggling === provider._id ? "…" : u.isActive ? "Deactivate Account" : "Activate Account"}
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const ManageProviders = () => {
  const [providers, setProviders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [availFilter, setAvailFilter] = useState("");
  const [page, setPage] = useState(1);
  const [verifying, setVerifying] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [confirmVerify, setConfirmVerify] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = { page, limit: 12 };
      if (search.trim()) params.search = search.trim();
      if (verifiedFilter !== "") params.isVerified = verifiedFilter;
      if (availFilter !== "") params.availability = availFilter;
      const { data } = await fetchAdminProviders(params);
      setProviders(data.providers || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load providers.");
    } finally { setLoading(false); }
  }, [search, verifiedFilter, availFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async () => {
    if (!confirmVerify) return;
    setVerifying(confirmVerify._id);
    setConfirmVerify(null);
    try {
      await updateProviderVerification(confirmVerify._id, !confirmVerify.isVerified);
      flash(`Provider ${confirmVerify.isVerified ? "unverified" : "verified"} successfully.`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update verification.");
    } finally { setVerifying(null); }
  };

  const handleToggleUser = async () => {
    if (!confirmToggle) return;
    setToggling(confirmToggle._id);
    const u = confirmToggle.userId;
    setConfirmToggle(null);
    try {
      await updateUserStatus(u._id, !u.isActive);
      flash(`Provider account ${u.isActive ? "deactivated" : "activated"}.`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status.");
    } finally { setToggling(null); }
  };

  const inputStyle = { padding: "8px 12px", borderRadius: "9px", border: "1px solid var(--color-surface-2)", backgroundColor: "rgba(15,23,42,0.7)", color: "var(--color-text)", fontSize: "13px", outline: "none", fontFamily: "inherit" };

  return (
    <DashboardShell role="admin" accentColor="#f59e0b" icon="🛡️" items={[]}>
      <div>
        <div style={{ marginBottom: "22px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>Manage Providers</h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{pagination.total} providers · Verify, activate, and review provider profiles</p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
          <input type="text" placeholder="🔍 Search name or email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ ...inputStyle, minWidth: "220px", flex: 1 }} />
          <select value={verifiedFilter} onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1); }} style={inputStyle}>
            <option value="">All Verification</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
          <select value={availFilter} onChange={(e) => { setAvailFilter(e.target.value); setPage(1); }} style={inputStyle}>
            <option value="">All Availability</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </div>

        {success && <div style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", padding: "11px 16px", marginBottom: "16px", fontSize: "13px", color: "#6ee7b7" }}>✅ {success}</div>}
        {error && <div style={{ marginBottom: "16px" }}><ErrorMessage message={error} onRetry={load} /></div>}

        {loading ? <LoadingSpinner /> : providers.length === 0 ? (
          <EmptyState icon="🔧" title="No providers found" message="Try adjusting your search or filter." />
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              {providers.map((p) => (
                <ProviderCard
                  key={p._id}
                  provider={p}
                  onVerify={setConfirmVerify}
                  onToggleUser={setConfirmToggle}
                  verifying={verifying}
                  toggling={toggling}
                />
              ))}
            </div>

            {pagination.pages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--color-surface-2)", backgroundColor: "transparent", color: page === 1 ? "var(--color-text-muted)" : "#fff", cursor: page === 1 ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: "13px" }}>← Prev</button>
                <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Page {page} of {pagination.pages}</span>
                <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--color-surface-2)", backgroundColor: "transparent", color: page === pagination.pages ? "var(--color-text-muted)" : "#fff", cursor: page === pagination.pages ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: "13px" }}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmVerify}
        title={confirmVerify?.isVerified ? "Remove Verification?" : "Verify Provider?"}
        message={`This will ${confirmVerify?.isVerified ? "remove verification from" : "mark as verified"} "${confirmVerify?.userId?.name}".`}
        onConfirm={handleVerify}
        onCancel={() => setConfirmVerify(null)}
        danger={confirmVerify?.isVerified}
      />
      <ConfirmDialog
        isOpen={!!confirmToggle}
        title={confirmToggle?.userId?.isActive ? "Deactivate Provider?" : "Activate Provider?"}
        message={`This will ${confirmToggle?.userId?.isActive ? "deactivate" : "activate"} the account of "${confirmToggle?.userId?.name}".`}
        onConfirm={handleToggleUser}
        onCancel={() => setConfirmToggle(null)}
        danger={confirmToggle?.userId?.isActive}
      />
    </DashboardShell>
  );
};

export default ManageProviders;
