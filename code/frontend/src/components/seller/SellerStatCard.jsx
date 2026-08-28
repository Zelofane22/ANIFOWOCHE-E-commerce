import MiniBar from "./MiniBar.jsx";

export default function SellerStatCard({ label, value, max }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-700">
          {value}/{max}
        </span>
      </div>
      <MiniBar value={value} max={max} />
    </div>
  );
}
