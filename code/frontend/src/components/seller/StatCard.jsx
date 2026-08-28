export default function StatCard({ label, value, sub, color = "text-gray-900", icon: Icon }) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-white p-3 text-center shadow-sm">
      {Icon && <Icon size={22} className={`mx-auto mb-1 ${color}`} />}
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className={`mt-0.5 text-xs font-bold ${color}`}>{label}</p>
      <p className="text-[10px] text-gray-400">{sub}</p>
    </div>
  );
}
