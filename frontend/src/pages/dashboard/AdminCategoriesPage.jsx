import { useState, useEffect } from "react";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../api/categoryApi";
import DashboardShell from "../../components/common/DashboardShell";
import {
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  ConfirmDialog,
} from "../../components/common/UIHelpers";

// ─── Category Form Modal ──────────────────────────────────────────────────────
const CategoryFormModal = ({ isOpen, onClose, onSave, initial }) => {
  const [form, setForm] = useState({ name: "", description: "", image: "", isActive: true });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || "",
        description: initial.description || "",
        image: initial.image || "",
        isActive: initial.isActive !== false,
      });
    } else {
      setForm({ name: "", description: "", image: "", isActive: true });
    }
    setErr("");
  }, [initial, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErr("Name is required"); return; }
    setSaving(true);
    setErr("");
    try {
      await onSave(form);
      onClose();
    } catch (error) {
      setErr(error.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid var(--color-surface-2)",
    backgroundColor: "rgba(15,23,42,0.7)",
    color: "var(--color-text)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        backgroundColor: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-surface-2)",
          borderRadius: "20px",
          padding: "32px",
          width: "100%",
          maxWidth: "480px",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "20px" }}>
          {initial ? "Edit Category" : "Add New Category"}
        </h2>

        {err && (
          <div
            style={{
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "16px",
              fontSize: "13px",
              color: "#fca5a5",
            }}
          >
            ⚠️ {err}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Name */}
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "6px", fontWeight: 600 }}>
              NAME *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Plumbing"
              style={inputStyle}
              autoFocus
            />
          </div>

          {/* Icon / Emoji */}
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "6px", fontWeight: 600 }}>
              ICON (emoji)
            </label>
            <input
              type="text"
              value={form.image}
              onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
              placeholder="e.g. 💧 or an image URL"
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "6px", fontWeight: 600 }}>
              DESCRIPTION
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of this service category…"
              rows={3}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
          </div>

          {/* isActive */}
          {initial && (
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "var(--color-text)" }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                style={{ accentColor: "var(--color-primary)" }}
              />
              Active (visible to customers)
            </label>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: "10px", borderRadius: "10px",
                border: "1px solid var(--color-surface-2)",
                backgroundColor: "transparent",
                color: "var(--color-text-muted)",
                cursor: "pointer", fontFamily: "inherit", fontSize: "13px",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1, padding: "10px", borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                color: "#fff",
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "inherit", fontSize: "13px", fontWeight: 600,
              }}
            >
              {saving ? "Saving…" : initial ? "Save Changes" : "Add Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Admin Categories Page ────────────────────────────────────────────────────
const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [success, setSuccess] = useState("");

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const loadCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await fetchCategories();
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const handleSave = async (formData) => {
    if (editTarget) {
      await updateCategory(editTarget._id, formData);
      flash("Category updated!");
    } else {
      await createCategory(formData);
      flash("Category created!");
    }
    loadCategories();
  };

  const handleDelete = async () => {
    try {
      await deleteCategory(deleteTarget._id);
      setDeleteTarget(null);
      flash("Category deleted.");
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed.");
      setDeleteTarget(null);
    }
  };

  return (
    <DashboardShell role="admin" accentColor="#f59e0b" icon="🛡️" items={[]}>
      <div>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>
              Service Categories
            </h1>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
              {categories.length} categories · manage what services customers can discover
            </p>
          </div>
          <button
            onClick={() => { setEditTarget(null); setModalOpen(true); }}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
              color: "#fff",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            + Add Category
          </button>
        </div>

        {success && (
          <div
            style={{
              backgroundColor: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "16px",
              fontSize: "13px",
              color: "#6ee7b7",
            }}
          >
            ✅ {success}
          </div>
        )}

        {error && <ErrorMessage message={error} onRetry={loadCategories} />}

        {loading ? (
          <LoadingSpinner />
        ) : categories.length === 0 ? (
          <EmptyState
            icon="🏷️"
            title="No categories yet"
            message="Click 'Add Category' to create the first service category."
          />
        ) : (
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-surface-2)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "52px 1fr 2fr 90px 90px",
                padding: "12px 20px",
                borderBottom: "1px solid var(--color-surface-2)",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <span>Icon</span>
              <span>Name</span>
              <span>Description</span>
              <span>Status</span>
              <span style={{ textAlign: "right" }}>Actions</span>
            </div>

            {/* Rows */}
            {categories.map((cat, idx) => (
              <div
                key={cat._id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "52px 1fr 2fr 90px 90px",
                  padding: "14px 20px",
                  alignItems: "center",
                  borderBottom: idx < categories.length - 1 ? "1px solid rgba(51,65,85,0.5)" : "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(30,41,59,0.6)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <span style={{ fontSize: "22px" }}>{cat.image || "🔧"}</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>{cat.name}</span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: 1.5,
                  }}
                >
                  {cat.description || "—"}
                </span>
                <span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: "999px",
                      backgroundColor: cat.isActive ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                      color: cat.isActive ? "#10b981" : "#ef4444",
                    }}
                  >
                    {cat.isActive ? "Active" : "Inactive"}
                  </span>
                </span>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                  <button
                    onClick={() => { setEditTarget(cat); setModalOpen(true); }}
                    style={{
                      padding: "5px 10px", borderRadius: "6px",
                      border: "1px solid var(--color-surface-2)",
                      backgroundColor: "transparent",
                      color: "var(--color-text-muted)",
                      fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat)}
                    style={{
                      padding: "5px 10px", borderRadius: "6px",
                      border: "1px solid rgba(239,68,68,0.3)",
                      backgroundColor: "transparent",
                      color: "#ef4444",
                      fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <CategoryFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        initial={editTarget}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </DashboardShell>
  );
};

export default AdminCategoriesPage;
