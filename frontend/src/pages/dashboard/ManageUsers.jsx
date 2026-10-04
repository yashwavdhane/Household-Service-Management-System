import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchAdminUsers, updateUserStatus, deleteUser } from "../../api/adminApi";
import DashboardShell from "../../components/common/DashboardShell";
import { LoadingSpinner, ErrorMessage, EmptyState, ConfirmDialog } from "../../components/common/UIHelpers";

const ROLE_COLORS = { customer: "#06b6d4", provider: "#8b5cf6", admin: "#f59e0b" };
const ROLE_ICONS  = { customer: "🧑", provider: "🔧", admin: "🛡️" };

// ─── User Row ──────────────────────────────────────────────────────────────────
const UserRow = ({ user, onToggle, toggling }) => {
  const roleColor = ROLE_COLORS[user.role] || "#94a3b8";
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "44px 1fr 1fr 90px 90px 110px",
        padding: "14px 20px",
        alignItems: "center",
        borderBottom: "1px solid rgba(51,65,85,0.4)",
        gap: "12px",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(30,41,59,0.6)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      <div style={{ width: "34px", height: "34px", borderRadius: "9px", backgroundColor: `${roleColor}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", overflow: "hidden" }}>
        {user.profileImage ? (
          <img src={user.profileImage} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          ROLE_ICONS[user.role] || "👤"
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</p>
        <p style={{ fontSize: "11px", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</p>
      </div>
      <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{user.phone || "—"}</div>
      <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: `${roleColor}18`, color: roleColor, border: `1px solid ${roleColor}33`, whiteSpace: "nowrap" }}>
        {user.role}
      </span>
      <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{fmtDate(user.createdAt)}</div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => onToggle(user)}
          disabled={toggling === user._id}
          style={{
            padding: "5px 12px", borderRadius: "7px", fontSize: "11px", fontWeight: 600,
            border: user.isActive ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(16,185,129,0.4)",
            backgroundColor: user.isActive ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
            color: user.isActive ? "#ef4444" : "#10b981",
            cursor: toggling === user._id ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: toggling === user._id ? 0.6 : 1,
          }}
        >
          {toggling === user._id ? "…" : user.isActive ? "Deactivate" : "Activate"}
        </button>
        <button
          onClick={() => onToggle({ ...user, action: "delete" })}
          disabled={toggling === user._id}
          style={{
            padding: "5px 12px", borderRadius: "7px", fontSize: "11px", fontWeight: 600,
            border: "1px solid rgba(239,68,68,0.4)",
            backgroundColor: "rgba(239,68,68,0.1)",
            color: "#ef4444", marginLeft: "6px",
            cursor: toggling === user._id ? "not-allowed" : "pointer",
            fontFamily: "inherit", opacity: toggling === user._id ? 0.6 : 1,
          }}
        >
          {toggling === user._id ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const ManageUsers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [toggling, setToggling] = useState(null); // userId being toggled
  const [confirmUser, setConfirmUser] = useState(null);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("isActive") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== "") params.isActive = statusFilter;
      const { data } = await fetchAdminUsers(params);
      setUsers(data.users || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users.");
    } finally { setLoading(false); }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async () => {
    if (!confirmUser) return;
    setToggling(confirmUser._id);
    const isDelete = confirmUser.action === "delete";
    const userToProcess = confirmUser;
    setConfirmUser(null);
    try {
      if (isDelete) {
        const { data } = await deleteUser(userToProcess._id);
        flash(data.message || `User deleted successfully.`);
      } else {
        await updateUserStatus(userToProcess._id, !userToProcess.isActive);
        flash(`User ${userToProcess.isActive ? "deactivated" : "activated"} successfully.`);
      }
      load();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isDelete ? 'delete' : 'update'} user.`);
    } finally { setToggling(null); }
  };

  const inputStyle = { padding: "8px 12px", borderRadius: "9px", border: "1px solid var(--color-surface-2)", backgroundColor: "rgba(15,23,42,0.7)", color: "var(--color-text)", fontSize: "13px", outline: "none", fontFamily: "inherit" };

  return (
    <DashboardShell role="admin" accentColor="#f59e0b" icon="🛡️" items={[]}>
      <div>
        {/* Header */}
        <div style={{ marginBottom: "22px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>Manage Users</h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
            {pagination.total} total users · Search, filter, and manage account statuses
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="🔍 Search name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ ...inputStyle, minWidth: "220px", flex: 1 }}
          />
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} style={inputStyle}>
            <option value="">All Roles</option>
            <option value="customer">Customer</option>
            <option value="provider">Provider</option>
            <option value="admin">Admin</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={inputStyle}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button onClick={load} style={{ ...inputStyle, backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", cursor: "pointer", fontWeight: 600 }}>
            Refresh
          </button>
        </div>

        {success && <div style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", padding: "11px 16px", marginBottom: "16px", fontSize: "13px", color: "#6ee7b7" }}>✅ {success}</div>}
        {error && <div style={{ marginBottom: "16px" }}><ErrorMessage message={error} onRetry={load} /></div>}

        {loading ? <LoadingSpinner /> : users.length === 0 ? (
          <EmptyState icon="👥" title="No users found" message="Try adjusting your search or filter." />
        ) : (
          <>
            {/* Table */}
            <div style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-surface-2)", borderRadius: "16px", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 1fr 90px 90px 110px", padding: "11px 20px", gap: "12px", borderBottom: "1px solid var(--color-surface-2)", fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <span></span><span>User</span><span>Phone</span><span>Role</span><span>Joined</span><span style={{ textAlign: "right" }}>Action</span>
              </div>
              {users.map((u) => <UserRow key={u._id} user={u} onToggle={setConfirmUser} toggling={toggling} />)}
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

      <ConfirmDialog
        isOpen={!!confirmUser}
        title={confirmUser?.action === "delete" ? "Delete User?" : confirmUser?.isActive ? "Deactivate User?" : "Activate User?"}
        message={confirmUser?.action === "delete"
          ? `This will permanently delete or deactivate "${confirmUser?.name}" based on their history. This cannot be easily undone.`
          : `This will ${confirmUser?.isActive ? "deactivate" : "activate"} the account of "${confirmUser?.name}". ${confirmUser?.isActive ? "They will be immediately logged out of all sessions." : ""}`}
        onConfirm={handleToggle}
        onCancel={() => setConfirmUser(null)}
        danger={confirmUser?.action === "delete" || confirmUser?.isActive}
      />
    </DashboardShell>
  );
};

export default ManageUsers;
