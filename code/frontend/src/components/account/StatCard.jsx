export default function StatCard({ label, value, icon: Icon, color = "text-ink" }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 text-center">
      {Icon && <Icon size={24} className="mx-auto mb-2" />}
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}
