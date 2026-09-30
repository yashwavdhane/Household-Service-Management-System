import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const Home = () => {
  const [apiStatus, setApiStatus] = useState("checking");
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const { data } = await axiosInstance.get("/health");
        setApiStatus("connected");
        setApiMessage(data.message);
      } catch {
        setApiStatus("disconnected");
        setApiMessage("Backend is not reachable. Start the backend server.");
      }
    };
    checkHealth();
  }, []);

  const features = [
    { icon: "🔧", title: "Expert Technicians", desc: "Verified professionals for every household need." },
    { icon: "📅", title: "Easy Scheduling", desc: "Book at your preferred date and time slot." },
    { icon: "⭐", title: "Trusted Reviews", desc: "Genuine ratings from verified customers." },
    { icon: "🔒", title: "Secure & Safe", desc: "Your data and transactions are always protected." },
    { icon: "⚡", title: "Fast Response", desc: "Quick matching and real-time booking updates." },
    { icon: "🏆", title: "Quality Assured", desc: "Every provider passes a strict verification." },
  ];

  const services = [
    { icon: "💧", name: "Plumbing" },
    { icon: "⚡", name: "Electrical" },
    { icon: "🧹", name: "Cleaning" },
    { icon: "🪟", name: "Carpentry" },
    { icon: "🎨", name: "Painting" },
    { icon: "❄️", name: "AC Repair" },
    { icon: "🌿", name: "Gardening" },
    { icon: "🛡️", name: "Security" },
  ];

  const statusColor =
    apiStatus === "connected"
      ? "var(--color-success)"
      : apiStatus === "disconnected"
      ? "var(--color-error)"
      : "var(--color-warning)";

  return (
    <div
      style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh", overflowX: "hidden" }}
    >
      {/* ── Navbar ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "rgba(15,23,42,0.9)",
          borderBottom: "1px solid var(--color-surface-2)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "22px" }}>🏠</span>
            <span style={{ fontSize: "17px", fontWeight: 700, color: "#fff" }}>
              Home<span style={{ color: "var(--color-primary-light)" }}>Serve</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <a
              href="/login"
              style={{
                padding: "7px 18px",
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--color-text-muted)",
                textDecoration: "none",
                borderRadius: "8px",
              }}
            >
              Login
            </a>
            <a
              href="/register"
              style={{
                padding: "7px 18px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#fff",
                textDecoration: "none",
                borderRadius: "8px",
                background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
              }}
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "60px 24px 50px",
          textAlign: "center",
        }}
      >
        {/* Glow blobs */}
        <div
          style={{
            position: "absolute", top: "-80px", left: "25%",
            width: "350px", height: "350px", borderRadius: "50%",
            backgroundColor: "var(--color-primary)", opacity: 0.12,
            filter: "blur(80px)", pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute", bottom: "-80px", right: "20%",
            width: "280px", height: "280px", borderRadius: "50%",
            backgroundColor: "var(--color-secondary)", opacity: 0.1,
            filter: "blur(70px)", pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative" }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "6px 16px", borderRadius: "999px",
              backgroundColor: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.35)",
              color: "var(--color-primary-light)",
              fontSize: "12px", fontWeight: 500,
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                width: "7px", height: "7px", borderRadius: "50%",
                backgroundColor: "var(--color-primary-light)",
                animation: "pulse 2s infinite",
              }}
            />
            India's #1 Home Services Platform
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.8rem)",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.15,
              marginBottom: "18px",
              letterSpacing: "-0.02em",
            }}
          >
            Your Home, Our{" "}
            <span
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--color-primary-light), var(--color-secondary))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Expertise
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "clamp(0.95rem, 2vw, 1.15rem)",
              color: "var(--color-text-muted)",
              maxWidth: "560px",
              margin: "0 auto 28px",
              lineHeight: 1.7,
            }}
          >
            Connect with verified household service professionals in minutes.
            Book, track, and review — all in one place.
          </p>

          {/* CTAs */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              justifyContent: "center",
              marginBottom: "28px",
            }}
          >
            <a
              href="/register"
              style={{
                padding: "12px 28px",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "15px",
                color: "#fff",
                textDecoration: "none",
                background:
                  "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                boxShadow: "0 0 24px rgba(99,102,241,0.35)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              Book a Service →
            </a>
            <a
              href="/register?role=provider"
              style={{
                padding: "12px 28px",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "15px",
                color: "var(--color-text)",
                textDecoration: "none",
                border: "1px solid var(--color-surface-2)",
                backgroundColor: "rgba(30,41,59,0.6)",
                transition: "transform 0.2s",
              }}
            >
              Become a Provider
            </a>
          </div>

          {/* API Status Badge */}
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 16px",
                borderRadius: "999px",
                backgroundColor: "rgba(30,41,59,0.85)",
                border: "1px solid var(--color-surface-2)",
                fontSize: "12px",
              }}
            >
              <span
                style={{
                  width: "7px", height: "7px", borderRadius: "50%",
                  backgroundColor: statusColor,
                  boxShadow: apiStatus === "connected" ? `0 0 8px ${statusColor}` : "none",
                }}
              />
              <span style={{ color: "var(--color-text-muted)" }}>
                API:{" "}
                <span style={{ color: statusColor, fontWeight: 600 }}>
                  {apiStatus === "checking"
                    ? "Connecting…"
                    : apiStatus === "connected"
                    ? "Connected ✓"
                    : "Disconnected ✗"}
                </span>
              </span>
            </div>
            {apiMessage && (
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {apiMessage}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Popular Services ── */}
      <section style={{ padding: "40px 24px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
              fontWeight: 700,
              color: "#fff",
              textAlign: "center",
              marginBottom: "6px",
            }}
          >
            Popular Services
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: "14px",
              marginBottom: "28px",
            }}
          >
            Everything your home needs, all in one place
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "14px",
            }}
          >
            {services.map((service) => (
              <button
                key={service.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  padding: "20px 12px",
                  borderRadius: "16px",
                  border: "1px solid var(--color-surface-2)",
                  backgroundColor: "var(--color-surface)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  color: "var(--color-text)",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-primary)";
                  e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-surface-2)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span style={{ fontSize: "30px" }}>{service.icon}</span>
                <span style={{ fontSize: "13px", fontWeight: 500 }}>{service.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "40px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
              fontWeight: 700,
              color: "#fff",
              textAlign: "center",
              marginBottom: "6px",
            }}
          >
            Why Choose HomeServe?
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: "14px",
              marginBottom: "28px",
            }}
          >
            Built for trust, speed, and convenience
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
            }}
          >
            {features.map((feature) => (
              <div
                key={feature.title}
                style={{
                  padding: "22px",
                  borderRadius: "16px",
                  border: "1px solid var(--color-surface-2)",
                  backgroundColor: "var(--color-surface)",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-surface-2)";
                }}
              >
                <div
                  style={{
                    width: "44px", height: "44px", borderRadius: "12px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "20px", marginBottom: "14px",
                    backgroundColor: "rgba(99,102,241,0.15)",
                  }}
                >
                  {feature.icon}
                </div>
                <h3
                  style={{ fontSize: "15px", fontWeight: 600, color: "#fff", marginBottom: "6px" }}
                >
                  {feature.title}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section style={{ padding: "40px 24px 50px" }}>
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            borderRadius: "24px",
            padding: "40px 32px",
            textAlign: "center",
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))",
            border: "1px solid rgba(99,102,241,0.25)",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
              fontWeight: 700,
              color: "#fff",
              marginBottom: "28px",
            }}
          >
            Trusted by Thousands
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px",
            }}
          >
            {[
              { value: "10K+", label: "Happy Customers" },
              { value: "500+", label: "Expert Providers" },
              { value: "50+", label: "Service Types" },
            ].map((stat) => (
              <div key={stat.label}>
                <div
                  style={{
                    fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                    fontWeight: 800,
                    marginBottom: "4px",
                    backgroundImage:
                      "linear-gradient(135deg, var(--color-primary-light), var(--color-secondary))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid var(--color-surface-2)",
          padding: "20px 24px",
          textAlign: "center",
          fontSize: "13px",
          color: "var(--color-text-muted)",
        }}
      >
        © {new Date().getFullYear()}{" "}
        <span style={{ color: "#fff", fontWeight: 500 }}>HomeServe</span> — Household
        Service Management System. Built with MERN stack.
      </footer>
    </div>
  );
};

export default Home;
