import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { fetchAdminAnalytics } from "../../api/adminApi";
import DashboardShell from "../../components/common/DashboardShell";
import { LoadingSpinner, ErrorMessage } from "../../components/common/UIHelpers";

// ─── Chart Card Wrapper ─────────────────────────────────────────────────────────
const ChartCard = ({ title, subtitle, children }) => (
  <div
    style={{
      backgroundColor: "var(--color-surface)",
      border: "1px solid var(--color-surface-2)",
      borderRadius: "18px",
      padding: "22px",
    }}
  >
    <div style={{ marginBottom: "18px" }}>
      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: "3px" }}>{title}</h3>
      {subtitle && <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

// ─── Custom Tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: "#1e293b", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "10px", padding: "10px 14px", fontSize: "12px" }}>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "6px", fontWeight: 600 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {prefix}{p.value.toLocaleString("en-IN")}{suffix}</p>
      ))}
    </div>
  );
};

// ─── Analytics Page ─────────────────────────────────────────────────────────────
const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data: res } = await fetchAdminAnalytics();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load analytics.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <DashboardShell role="admin" accentColor="#f59e0b" icon="🛡️" items={[]}>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>Platform Analytics</h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Last 6 months · All data from live database</p>
        </div>

        {error && <ErrorMessage message={error} onRetry={load} />}

        {loading ? <LoadingSpinner message="Crunching numbers…" /> : (
          <>
            {/* ── Row 1: Bookings + Revenue ─────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>

              {/* Bookings Over Time */}
              <ChartCard title="Bookings Over Time" subtitle="New bookings created per month">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data?.bookingTimeline || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradBookings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
                    <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <ReTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradBookings)" name="Bookings" dot={{ fill: "#6366f1", strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Revenue Over Time */}
              <ChartCard title="Revenue Trend" subtitle="Total earnings from completed bookings (₹)">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data?.revenueTimeline || []} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
                    <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <ReTooltip content={<CustomTooltip prefix="₹" />} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#gradRevenue)" name="Revenue" dot={{ fill: "#10b981", strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* ── Row 2: User Growth + Status Pie ──────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>

              {/* User Growth */}
              <ChartCard title="User Growth" subtitle="New customers and providers per month">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data?.userTimeline || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" />
                    <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <ReTooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8", paddingTop: "8px" }} />
                    <Bar dataKey="customers" fill="#06b6d4" name="Customers" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="providers" fill="#8b5cf6" name="Providers" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Status Distribution Pie */}
              <ChartCard title="Booking Status Distribution" subtitle="All-time breakdown by status">
                {(data?.statusDistribution || []).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted)" }}>
                    <div style={{ fontSize: "36px", marginBottom: "8px" }}>📊</div>
                    <p>No booking data yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data.statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >
                        {data.statusDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <ReTooltip
                        formatter={(value, name) => [value, name]}
                        contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "10px", fontSize: "12px" }}
                        labelStyle={{ color: "#94a3b8" }}
                        itemStyle={{ color: "#e2e8f0" }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>

            {/* ── Row 3: Category Breakdown ─────────────────────────────── */}
            <ChartCard title="Top Service Categories" subtitle="Bookings by service category (top 8)">
              {(data?.categoryBreakdown || []).length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-muted)" }}>
                  <div style={{ fontSize: "36px", marginBottom: "8px" }}>🏷️</div>
                  <p>No category data yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.categoryBreakdown} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.5)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: "#e2e8f0", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={110}
                      tickFormatter={(v) => v.length > 14 ? v.substring(0, 14) + "…" : v}
                    />
                    <ReTooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8", paddingTop: "8px" }} />
                    <Bar dataKey="count" fill="#6366f1" name="Total Bookings" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </>
        )}
      </div>
    </DashboardShell>
  );
};

export default AnalyticsPage;
