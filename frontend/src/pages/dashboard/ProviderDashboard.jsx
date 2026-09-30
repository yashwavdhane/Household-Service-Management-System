import DashboardShell from "../../components/common/DashboardShell";

const ProviderDashboard = () => (
  <DashboardShell
    role="provider"
    accentColor="#06b6d4"
    icon="🔧"
    items={[
      { icon: "📥", label: "New Requests", value: "0" },
      { icon: "✅", label: "Completed Jobs", value: "0" },
      { icon: "⭐", label: "Avg. Rating", value: "—" },
      { icon: "💰", label: "Total Earned", value: "₹0" },
    ]}
  />
);

export default ProviderDashboard;
