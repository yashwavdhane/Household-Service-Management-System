import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchNotifications } from "../../api/notificationApi";


// ─── Per-role nav links ───────────────────────────────────────────────────────
const NAV_LINKS = {
  customer: [
    { to: "/dashboard/customer", label: "Dashboard", icon: "📊" },
    { to: "/services", label: "Browse Services", icon: "🔍" },
    { to: "/providers", label: "Find Providers", icon: "🔧" },
    { to: "/my-bookings", label: "My Bookings", icon: "📋" },
    { to: "/customer/profile", label: "My Profile", icon: "👤" },
  ],
  provider: [
    { to: "/dashboard/provider", label: "Dashboard", icon: "📊" },
    { to: "/provider/profile", label: "My Profile", icon: "👤" },
    { to: "/provider/bookings", label: "Booking Requests", icon: "📋" },
  ],
  admin: [
    { to: "/dashboard/admin", label: "Dashboard", icon: "📊" },
    { to: "/admin/users", label: "Users", icon: "👥" },
    { to: "/admin/providers", label: "Providers", icon: "🔧" },
    { to: "/admin/bookings", label: "Bookings", icon: "📋" },
    { to: "/admin/categories", label: "Categories", icon: "🏷️" },
    { to: "/admin/analytics", label: "Analytics", icon: "📈" },
  ],
};


const DashboardShell = ({ role, accentColor, icon, items, children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await fetchNotifications({ limit: 1 });
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        // ignore silently for shell
      }
    };
    if (user) fetchUnread();
  }, [user, location.pathname]); // re-fetch when navigation happens (e.g. leaving notifications page)

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const links = NAV_LINKS[role] || [];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <header
        style={{
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-surface-2)",
          padding: "0 24px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: "20px" }}>🏠</span>
            <span style={{ fontWeight: 700, color: "#fff", fontSize: "16px" }}>
              Home<span style={{ color: accentColor }}>Serve</span>
            </span>
          </Link>

          {/* Role badge */}
          <span
            style={{
              padding: "2px 10px",
              borderRadius: "999px",
              backgroundColor: `${accentColor}22`,
              color: accentColor,
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {role}
          </span>

          {/* Nav links — hidden on small screens */}
          <nav className="hide-on-mobile" style={{ alignItems: "center", gap: "4px" }}>
            {links.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    padding: "5px 12px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: active ? 600 : 400,
                    color: active ? "#fff" : "var(--color-text-muted)",
                    backgroundColor: active ? `${accentColor}33` : "transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <Link
            to="/notifications"
            style={{
              position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "36px", height: "36px", borderRadius: "50%",
              backgroundColor: "rgba(15,23,42,0.4)", border: "1px solid var(--color-surface-2)",
              textDecoration: "none", color: "var(--color-text-muted)",
              transition: "color 0.2s, background-color 0.2s"
            }}
          >
            <span style={{ fontSize: "16px" }}>🔔</span>
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: "-4px", right: "-4px",
                backgroundColor: "#ef4444", color: "#fff",
                fontSize: "10px", fontWeight: 700,
                minWidth: "16px", height: "16px", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 4px", border: "2px solid var(--color-surface)"
              }}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "8px" }}>
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--color-surface-2)" }}
              />
            ) : (
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--color-primary)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "11px", fontWeight: 700
              }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
              </div>
            )}
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
              {user?.name}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="hide-on-mobile"
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "1px solid var(--color-surface-2)",
              backgroundColor: "transparent",
              color: "var(--color-text-muted)",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Logout
          </button>
          
          <button
            className="show-on-mobile"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer", padding: "4px"
            }}
          >
            ☰
          </button>
        </div>
      </header>

      {/* ── Mobile Menu ──────────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="show-on-mobile"
          style={{
            flexDirection: "column",
            backgroundColor: "var(--color-surface)",
            borderBottom: "1px solid var(--color-surface-2)",
            padding: "16px 24px",
            gap: "10px",
          }}
        >
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px",
                borderRadius: "8px",
                textDecoration: "none",
                color: location.pathname === link.to ? "#fff" : "var(--color-text-muted)",
                backgroundColor: location.pathname === link.to ? `${accentColor}33` : "transparent",
                fontSize: "14px", fontWeight: location.pathname === link.to ? 600 : 400,
              }}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              textDecoration: "none",
              color: "#ef4444",
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "none",
              fontSize: "14px", fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
              marginTop: "10px",
            }}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      )}

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          padding: "36px 24px",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* If children provided, render those; otherwise render the default overview */}
        {children ? (
          children
        ) : (
          <>
            {/* Welcome Card */}
            <div
              style={{
                borderRadius: "20px",
                padding: "28px 32px",
                marginBottom: "24px",
                background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}08)`,
                border: `1px solid ${accentColor}33`,
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <span style={{ fontSize: "44px" }}>{icon}</span>
              <div>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>
                  Welcome, {user?.name}!
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>
                  {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard •{" "}
                  <span style={{ color: accentColor }}>{user?.email}</span>
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              {items?.map((item) => (
                <div
                  key={item.label}
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-surface-2)",
                    borderRadius: "16px",
                    padding: "20px",
                  }}
                >
                  <div style={{ fontSize: "26px", marginBottom: "10px" }}>{item.icon}</div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "#fff" }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Account Details */}
            <div
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-surface-2)",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#fff", marginBottom: "16px" }}>
                Account Details
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
                {[
                  { label: "Name", value: user?.name },
                  { label: "Email", value: user?.email },
                  { label: "Phone", value: user?.phone || "Not set" },
                  { label: "Role", value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) },
                  { label: "Status", value: user?.isActive ? "✅ Active" : "❌ Inactive" },
                  { label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—" },
                ].map((field) => (
                  <div key={field.label}>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "3px" }}>
                      {field.label}
                    </div>
                    <div style={{ fontSize: "14px", color: "var(--color-text)", fontWeight: 500 }}>
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardShell;
