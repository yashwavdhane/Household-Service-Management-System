import { useState, useEffect, useCallback } from "react";
import {
  fetchMyServices,
  createProviderService,
  updateProviderService,
  deleteProviderService,
} from "../../api/providerServiceApi";
import { fetchCategories } from "../../api/categoryApi";
import DashboardShell from "../../components/common/DashboardShell";
import { LoadingSpinner, ErrorMessage, EmptyState } from "../../components/common/UIHelpers";

const PRICING_LABELS = {
  per_visit: "per visit",
  per_hour: "per hour",
  fixed: "fixed price",
};

const PRICING_OPTIONS = [
  { value: "per_visit", label: "Per Visit" },
  { value: "per_hour", label: "Per Hour" },
  { value: "fixed", label: "Fixed Price" },
];

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid var(--color-surface-2)",
  backgroundColor: "rgba(15,23,42,0.6)",
  color: "var(--color-text)",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--color-text-muted)",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

// ─── Service Form Modal ─────────────────────────────────────────────────────
const ServiceFormModal = ({ service, categories, onClose, onSave }) => {
  const isEditing = !!service?._id;
  const [form, setForm] = useState({
    serviceCategoryId: service?.serviceCategoryId?._id || service?.serviceCategoryId || "",
    serviceName: service?.serviceName || "",
    description: service?.description || "",
    price: service?.price?.toString() || "",
    pricingType: service?.pricingType || "per_visit",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.serviceCategoryId) { setError("Please select a service category."); return; }
    if (!form.serviceName.trim()) { setError("Service name is required."); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { setError("Please enter a valid price (₹0 or more)."); return; }

    setSaving(true);
    try {
      await onSave({
        serviceCategoryId: form.serviceCategoryId,
        serviceName: form.serviceName.trim(),
        description: form.description.trim(),
        price,
        pricingType: form.pricingType,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save service.");
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-surface-2)",
          borderRadius: "20px", padding: "28px",
          width: "100%", maxWidth: "520px",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#fff" }}>
            {isEditing ? "Edit Service Offering" : "Add New Service Offering"}
          </h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#fca5a5" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Category */}
          <div>
            <label style={labelStyle}>Service Category *</label>
            <select
              value={form.serviceCategoryId}
              onChange={(e) => setForm((p) => ({ ...p, serviceCategoryId: e.target.value }))}
              disabled={isEditing}
              style={{ ...inputStyle, cursor: isEditing ? "not-allowed" : "pointer", opacity: isEditing ? 0.6 : 1 }}
            >
              <option value="">Select a category…</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.image} {cat.name}
                </option>
              ))}
            </select>
            {isEditing && (
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                Category cannot be changed. Add a new offering for a different category.
              </p>
            )}
          </div>

          {/* Service Name */}
          <div>
            <label htmlFor="svc-name" style={labelStyle}>Service Name *</label>
            <input
              id="svc-name"
              type="text"
              value={form.serviceName}
              onChange={(e) => setForm((p) => ({ ...p, serviceName: e.target.value }))}
              placeholder="e.g. Bathroom Pipe Repair, AC Deep Cleaning…"
              style={inputStyle}
            />
          </div>

          {/* Price + Pricing Type */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label htmlFor="svc-price" style={labelStyle}>Price (₹) *</label>
              <input
                id="svc-price"
                type="number"
                min="0"
                step="10"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="e.g. 500"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="svc-pricing" style={labelStyle}>Pricing Type *</label>
              <select
                id="svc-pricing"
                value={form.pricingType}
                onChange={(e) => setForm((p) => ({ ...p, pricingType: e.target.value }))}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {PRICING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="svc-desc" style={labelStyle}>Description <span style={{ opacity: 0.5 }}>(optional)</span></label>
            <textarea
              id="svc-desc"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe what this service includes, tools used, duration, etc."
              rows={3}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: "11px", borderRadius: "9px",
                border: "1px solid var(--color-surface-2)",
                backgroundColor: "transparent", color: "var(--color-text-muted)",
                cursor: "pointer", fontFamily: "inherit", fontSize: "14px",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 2, padding: "11px", borderRadius: "9px", border: "none",
                background: saving ? "rgba(6,182,212,0.4)" : "linear-gradient(135deg, #06b6d4, #0891b2)",
                color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "inherit", fontSize: "14px", fontWeight: 600,
                opacity: saving ? 0.8 : 1,
              }}
            >
              {saving ? "Saving…" : isEditing ? "Update Service" : "Add Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Service Card ────────────────────────────────────────────────────────────
const ServiceCard = ({ service, onEdit, onToggle, onDelete, busy }) => {
  const cat = service.serviceCategoryId || {};
  const isActive = service.isActive;

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: `1px solid ${isActive ? "var(--color-surface-2)" : "rgba(148,163,184,0.2)"}`,
        borderRadius: "16px", padding: "20px",
        opacity: isActive ? 1 : 0.65,
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "40px", height: "40px", borderRadius: "10px",
              backgroundColor: "rgba(6,182,212,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", flexShrink: 0,
            }}
          >
            {cat.image || "🔧"}
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "2px" }}>
              {service.serviceName}
            </p>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              {cat.name}
            </p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "20px", fontWeight: 800, color: "#06b6d4" }}>₹{service.price.toLocaleString("en-IN")}</p>
          <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{PRICING_LABELS[service.pricingType]}</p>
        </div>
      </div>

      {service.description && (
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: "14px" }}>
          {service.description}
        </p>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <span
          style={{
            padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600,
            backgroundColor: isActive ? "rgba(16,185,129,0.12)" : "rgba(148,163,184,0.1)",
            color: isActive ? "#10b981" : "#94a3b8",
            border: `1px solid ${isActive ? "rgba(16,185,129,0.25)" : "rgba(148,163,184,0.2)"}`,
          }}
        >
          {isActive ? "● Active" : "○ Inactive"}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
          <button
            onClick={() => onEdit(service)}
            disabled={busy}
            style={{
              padding: "6px 14px", borderRadius: "8px",
              border: "1px solid rgba(99,102,241,0.4)",
              backgroundColor: "rgba(99,102,241,0.1)",
              color: "#a5b4fc", fontSize: "12px", fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit",
            }}
          >
            Edit
          </button>
          <button
            onClick={() => onToggle(service)}
            disabled={busy}
            style={{
              padding: "6px 14px", borderRadius: "8px",
              border: `1px solid ${isActive ? "rgba(245,158,11,0.4)" : "rgba(16,185,129,0.4)"}`,
              backgroundColor: isActive ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)",
              color: isActive ? "#f59e0b" : "#10b981",
              fontSize: "12px", fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit",
            }}
          >
            {isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => onDelete(service)}
            disabled={busy}
            style={{
              padding: "6px 14px", borderRadius: "8px",
              border: "1px solid rgba(239,68,68,0.35)",
              backgroundColor: "rgba(239,68,68,0.06)",
              color: "#ef4444", fontSize: "12px", fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit",
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ────────────────────────────────────────────────────
const DeleteConfirm = ({ service, onConfirm, onCancel, deleting }) => (
  <div
    style={{
      position: "fixed", inset: 0, zIndex: 2000,
      backgroundColor: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
    }}
  >
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-surface-2)",
        borderRadius: "18px", padding: "28px",
        width: "100%", maxWidth: "380px",
      }}
    >
      <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>Remove Service?</h3>
      <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "20px" }}>
        Remove <strong style={{ color: "#fff" }}>{service.serviceName}</strong>? If bookings exist for this service, it will be deactivated instead of deleted to preserve history.
      </p>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={onCancel}
          style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--color-surface-2)", backgroundColor: "transparent", color: "var(--color-text-muted)", cursor: "pointer", fontFamily: "inherit", fontSize: "13px" }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", backgroundColor: "#ef4444", color: "#fff", cursor: deleting ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: 600, opacity: deleting ? 0.7 : 1 }}
        >
          {deleting ? "Removing…" : "Remove"}
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────
const ProviderServicesPage = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null); // null = create
  const [deletingService, setDeletingService] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [svcRes, catRes] = await Promise.all([
        fetchMyServices(),
        fetchCategories(),
      ]);
      setServices(svcRes.data.services || []);
      const allCats = catRes.data.categories || [];
      setCategories(allCats.filter((c) => c.isActive));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load services.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (formData) => {
    if (editingService?._id) {
      await updateProviderService(editingService._id, formData);
      showSuccess("Service offering updated successfully!");
    } else {
      await createProviderService(formData);
      showSuccess("Service offering added successfully!");
    }
    setShowForm(false);
    setEditingService(null);
    await load();
  };

  const handleToggle = async (service) => {
    setBusy(true);
    try {
      await updateProviderService(service._id, { isActive: !service.isActive });
      showSuccess(`Service ${service.isActive ? "deactivated" : "activated"}.`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update service.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingService) return;
    setDeletingBusy(true);
    try {
      const { data } = await deleteProviderService(deletingService._id);
      showSuccess(data.message || "Service removed.");
      setDeletingService(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove service.");
      setDeletingService(null);
    } finally {
      setDeletingBusy(false);
    }
  };

  const activeServices = services.filter((s) => s.isActive);
  const inactiveServices = services.filter((s) => !s.isActive);

  return (
    <DashboardShell role="provider" accentColor="#06b6d4" icon="🔧" items={[]}>
      <div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>
              My Services
            </h1>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
              Manage your service offerings and set your own prices. Customers will see these when booking.
            </p>
          </div>
          <button
            onClick={() => { setEditingService(null); setShowForm(true); }}
            style={{
              padding: "10px 20px", borderRadius: "10px", border: "none",
              background: "linear-gradient(135deg, #06b6d4, #0891b2)",
              color: "#fff", fontSize: "13px", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: "8px",
              whiteSpace: "nowrap",
            }}
          >
            + Add Service
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#fca5a5" }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#6ee7b7" }}>
            ✅ {success}
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Loading your services…" />
        ) : services.length === 0 ? (
          <EmptyState
            icon="🔧"
            title="No service offerings yet"
            message="Add your first service offering so customers can see your prices and book specific services."
            action={
              <button
                onClick={() => { setEditingService(null); setShowForm(true); }}
                style={{
                  padding: "10px 22px", borderRadius: "10px", border: "none",
                  background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                  color: "#fff", fontWeight: 600, fontSize: "13px",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                + Add First Service
              </button>
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Active */}
            {activeServices.length > 0 && (
              <div>
                <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
                  Active — {activeServices.length} offering{activeServices.length !== 1 ? "s" : ""}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {activeServices.map((svc) => (
                    <ServiceCard
                      key={svc._id}
                      service={svc}
                      onEdit={(s) => { setEditingService(s); setShowForm(true); }}
                      onToggle={handleToggle}
                      onDelete={setDeletingService}
                      busy={busy}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inactive */}
            {inactiveServices.length > 0 && (
              <div>
                <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
                  Inactive — hidden from customers
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {inactiveServices.map((svc) => (
                    <ServiceCard
                      key={svc._id}
                      service={svc}
                      onEdit={(s) => { setEditingService(s); setShowForm(true); }}
                      onToggle={handleToggle}
                      onDelete={setDeletingService}
                      busy={busy}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Service Form Modal */}
      {showForm && (
        <ServiceFormModal
          service={editingService}
          categories={categories}
          onClose={() => { setShowForm(false); setEditingService(null); }}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirm */}
      {deletingService && (
        <DeleteConfirm
          service={deletingService}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingService(null)}
          deleting={deletingBusy}
        />
      )}
    </DashboardShell>
  );
};

export default ProviderServicesPage;
