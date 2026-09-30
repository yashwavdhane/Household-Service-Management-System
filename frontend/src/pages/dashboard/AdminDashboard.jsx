import DashboardShell from "../../components/common/DashboardShell";

const AdminDashboard = () => (
  <DashboardShell
    role="admin"
    accentColor="#f59e0b"
    icon="🛡️"
    items={[
      { icon: "👥", label: "Total Users", value: "—" },
      { icon: "🔧", label: "Providers", value: "—" },
      { icon: "📋", label: "Bookings", value: "—" },
      { icon: "🏷️", label: "Categories", value: "—" },
    ]}
  />
);

export default AdminDashboard;
