import { useState } from "react";
import {
  Home,
  Package,
  ShoppingBag,
  Store,
  MoreHorizontal,
  Bell,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Plus,
  Share2,
  BarChart2,
  Search,
  Filter,
  Phone,
  MessageCircle,
  Check,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  AlertCircle,
  Circle,
  Copy,
  ExternalLink,
  Image,
  Edit2,
  Eye,
  EyeOff,
  Star,
  MoreVertical,
  ArrowUpRight,
  Zap,
  Upload,
  Tag,
  Info,
  X,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type SellerPage =
  | "dashboard"
  | "orders"
  | "order-detail"
  | "products"
  | "product-detail"
  | "add-product"
  | "shop"
  | "more";

type OrderStatus =
  | "a_confirmer"
  | "paiement_attente"
  | "confirmee"
  | "preparation"
  | "livree"
  | "annulee";

type ProductStatus = "actif" | "rupture" | "inactif";

interface SellerOrder {
  id: string;
  client: string;
  phone: string;
  date: string;
  time: string;
  amount: number;
  status: OrderStatus;
  items: { name: string; qty: number; price: number; image: string }[];
  address: string;
}

interface SellerProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  status: ProductStatus;
  sales: number;
  image: string;
  category: string;
  description: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CHART_DATA = [
  { day: "L", value: 42000 },
  { day: "M", value: 58000 },
  { day: "M", value: 35000 },
  { day: "J", value: 72000 },
  { day: "V", value: 48000 },
  { day: "S", value: 91000 },
  { day: "D", value: 67000 },
];

const ORDERS: SellerOrder[] = [
  {
    id: "1042",
    client: "Jean Agossou",
    phone: "+229 01 97 45 12 88",
    date: "Aujourd'hui",
    time: "11:24",
    amount: 35000,
    status: "paiement_attente",
    address: "Fidjrossè, Cotonou — Près de la pharmacie Sainte-Croix",
    items: [
      { name: "Boubou Brodé Grand Bazin", qty: 1, price: 35000, image: "https://images.unsplash.com/photo-1687052093309-7a14efa58ecb?w=200&h=200&fit=crop&auto=format" },
    ],
  },
  {
    id: "1041",
    client: "Fatou Diallo",
    phone: "+229 01 66 23 40 11",
    date: "Aujourd'hui",
    time: "09:05",
    amount: 22500,
    status: "a_confirmer",
    address: "Cadjèhoun, Cotonou — Bâtiment C",
    items: [
      { name: "Pagne Wax Imprimé Ankara", qty: 1, price: 15000, image: "https://images.unsplash.com/photo-1552710307-537199cd41c0?w=200&h=200&fit=crop&auto=format" },
      { name: "Foulard Soie Imprimée", qty: 1, price: 7500, image: "https://images.unsplash.com/photo-1631620570575-486ce20df339?w=200&h=200&fit=crop&auto=format" },
    ],
  },
  {
    id: "1040",
    client: "Kofi Mensah",
    phone: "+229 01 55 78 90 33",
    date: "Hier",
    time: "16:47",
    amount: 45000,
    status: "preparation",
    address: "Haie Vive, Cotonou — Villa 12",
    items: [
      { name: "Boubou Brodé Grand Bazin", qty: 1, price: 45000, image: "https://images.unsplash.com/photo-1687052093309-7a14efa58ecb?w=200&h=200&fit=crop&auto=format" },
    ],
  },
  {
    id: "1039",
    client: "Aminata Sow",
    phone: "+229 01 44 12 65 77",
    date: "Hier",
    time: "10:20",
    amount: 8500,
    status: "livree",
    address: "Akpakpa, Cotonou",
    items: [
      { name: "Bazin Riche Blanc Cassé", qty: 1, price: 8500, image: "https://images.unsplash.com/photo-1768212566108-4ce4f329e4d2?w=200&h=200&fit=crop&auto=format" },
    ],
  },
  {
    id: "1038",
    client: "Boris Lokossou",
    phone: "+229 01 22 34 56 89",
    date: "3 juil.",
    time: "14:15",
    amount: 18000,
    status: "annulee",
    address: "Gbèto, Cotonou",
    items: [
      { name: "Chemise Homme Pagne Wax", qty: 1, price: 18000, image: "https://images.unsplash.com/photo-1776880471066-d43fc823b4ee?w=200&h=200&fit=crop&auto=format" },
    ],
  },
  {
    id: "1037",
    client: "Rose Ahouansou",
    phone: "+229 01 88 99 11 44",
    date: "3 juil.",
    time: "08:33",
    amount: 28000,
    status: "confirmee",
    address: "Cotonou Centre",
    items: [
      { name: "Robe Bogolan Moderne", qty: 1, price: 28000, image: "https://images.unsplash.com/photo-1611853904829-6d0f4034ce2f?w=200&h=200&fit=crop&auto=format" },
    ],
  },
];

const PRODUCTS: SellerProduct[] = [
  {
    id: 1,
    name: "Chemise Bazin Premium",
    price: 18000,
    stock: 12,
    status: "actif",
    sales: 47,
    image: "https://images.unsplash.com/photo-1776880471066-d43fc823b4ee?w=400&h=400&fit=crop&auto=format",
    category: "Vêtements",
    description: "Chemise homme taillée dans du bazin riche de qualité supérieure. Coupe droite élégante, idéale pour les cérémonies et occasions professionnelles.",
  },
  {
    id: 2,
    name: "Pagne Wax Ankara",
    price: 15000,
    stock: 34,
    status: "actif",
    sales: 92,
    image: "https://images.unsplash.com/photo-1552710307-537199cd41c0?w=400&h=400&fit=crop&auto=format",
    category: "Tissus",
    description: "Pagne wax 100% coton imprimé Ankara, couleurs vives et durables. Vendu au mètre.",
  },
  {
    id: 3,
    name: "Boubou Brodé Grand",
    price: 45000,
    stock: 5,
    status: "actif",
    sales: 28,
    image: "https://images.unsplash.com/photo-1687052093309-7a14efa58ecb?w=400&h=400&fit=crop&auto=format",
    category: "Vêtements",
    description: "Boubou grand bazin riche avec broderies artisanales faites main. Coupe généreuse et tissu de première qualité.",
  },
  {
    id: 4,
    name: "Foulard Soie Africaine",
    price: 6500,
    stock: 0,
    status: "rupture",
    sales: 63,
    image: "https://images.unsplash.com/photo-1631620570575-486ce20df339?w=400&h=400&fit=crop&auto=format",
    category: "Accessoires",
    description: "Foulard en soie naturelle, imprimé à motifs africains. Dimensions 150×50 cm.",
  },
  {
    id: 5,
    name: "Robe Bogolan Moderne",
    price: 28000,
    stock: 8,
    status: "actif",
    sales: 19,
    image: "https://images.unsplash.com/photo-1611853904829-6d0f4034ce2f?w=400&h=400&fit=crop&auto=format",
    category: "Vêtements",
    description: "Robe en tissu bogolan authentique, motifs géométriques traditionnels. Coupe moderne ajustée.",
  },
  {
    id: 6,
    name: "Sac Raphia Artisanal",
    price: 12000,
    stock: 3,
    status: "actif",
    sales: 35,
    image: "https://images.unsplash.com/photo-1534413340928-7bd74b65196f?w=400&h=400&fit=crop&auto=format",
    category: "Accessoires",
    description: "Sac à main artisanal en raphia tressé, doublure coton. Anses cuir naturel.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return n.toLocaleString("fr-FR").replace(/ /g, " ") + " F";
}

function orderStatusConfig(s: OrderStatus) {
  const map: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    a_confirmer:      { label: "À confirmer",         color: "#7C3AED", bg: "#F5F3FF", icon: <Clock size={11} /> },
    paiement_attente: { label: "Paiement en attente", color: "#D97706", bg: "#FFF7ED", icon: <AlertCircle size={11} /> },
    confirmee:        { label: "Confirmée",            color: "#0EA5E9", bg: "#F0F9FF", icon: <CheckCircle size={11} /> },
    preparation:      { label: "Préparation",          color: "#2563EB", bg: "#EFF6FF", icon: <Package size={11} /> },
    livree:           { label: "Livrée",               color: "#059669", bg: "#ECFDF5", icon: <CheckCircle size={11} /> },
    annulee:          { label: "Annulée",              color: "#DC2626", bg: "#FEF2F2", icon: <XCircle size={11} /> },
  };
  return map[s];
}

function productStatusConfig(s: ProductStatus) {
  const map: Record<ProductStatus, { label: string; color: string; dot: string }> = {
    actif:   { label: "Disponible", color: "#059669", dot: "bg-green-500" },
    rupture: { label: "Rupture",    color: "#DC2626", dot: "bg-red-500" },
    inactif: { label: "Inactif",    color: "#6B7280", dot: "bg-gray-400" },
  };
  return map[s];
}

// ─── Design System ────────────────────────────────────────────────────────────

function Btn({
  children, onClick, variant = "primary", size = "md", fullWidth = false, disabled = false,
}: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg"; fullWidth?: boolean; disabled?: boolean;
}) {
  const sz = { sm: "text-sm py-2.5 px-4", md: "text-sm py-3 px-5", lg: "text-base py-3.5 px-6" }[size];
  const va = disabled
    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
    : variant === "primary"   ? "bg-[#C99F08] hover:bg-[#A67C06] active:bg-[#8B6604] text-white"
    : variant === "secondary" ? "bg-[#FEF9E7] hover:bg-[#FDF0C0] text-[#8B6604] border border-[#C99F08]/30"
    : variant === "danger"    ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
    : variant === "outline"   ? "bg-white hover:bg-gray-50 text-[#374151] border border-black/15"
    : "bg-transparent hover:bg-black/5 text-[#374151]";
  return (
    <button disabled={disabled} onClick={onClick}
      className={`font-semibold rounded-[10px] transition-colors flex items-center justify-center gap-2 ${sz} ${va} ${fullWidth ? "w-full" : ""}`}>
      {children}
    </button>
  );
}

function Card({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick}
      className={`bg-white rounded-[16px] shadow-sm border border-black/[0.05] ${onClick ? "cursor-pointer active:scale-[0.99] transition-transform" : ""} ${className}`}>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = orderStatusConfig(status);
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${active ? "bg-[#C99F08] text-white" : "bg-white text-[#6B7280] border border-black/10 hover:border-[#C99F08]/50"}`}>
      {label}
    </button>
  );
}

function SearchBarEl({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full pl-9 pr-4 py-3 rounded-[12px] bg-[#F3F4F6] border border-transparent text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C99F08] focus:ring-2 focus:ring-[#C99F08]/15 focus:bg-white transition-all" />
    </div>
  );
}

function InputField({ label, placeholder, value, onChange, type = "text", hint }: {
  label: string; placeholder?: string; value: string; onChange: (v: string) => void; type?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#111827] mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-[12px] bg-white border border-black/12 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C99F08] focus:ring-2 focus:ring-[#C99F08]/15 transition-colors" />
      {hint && <p className="text-xs text-[#9CA3AF] mt-1.5">{hint}</p>}
    </div>
  );
}

function EmptyState({ icon, title, desc, cta, onCta }: { icon: React.ReactNode; title: string; desc: string; cta?: string; onCta?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-4 text-[#9CA3AF]">{icon}</div>
      <p className="font-bold text-[#111827] mb-1">{title}</p>
      <p className="text-sm text-[#6B7280] mb-5 leading-relaxed">{desc}</p>
      {cta && <Btn onClick={onCta} size="sm">{cta}</Btn>}
    </div>
  );
}

function Timeline({ events, currentStep }: { events: string[]; currentStep: number }) {
  return (
    <div>
      {events.map((label, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        const isLast = i === events.length - 1;
        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${done ? "bg-green-500 border-green-500" : active ? "bg-[#C99F08] border-[#C99F08]" : "bg-white border-black/15"}`}>
                {done ? <Check size={13} className="text-white" /> : active ? <div className="w-2 h-2 rounded-full bg-white" /> : <div className="w-2 h-2 rounded-full bg-black/10" />}
              </div>
              {!isLast && <div className={`w-0.5 flex-1 min-h-[28px] my-1 ${done ? "bg-green-300" : "bg-black/8"}`} />}
            </div>
            <div className="pb-5 flex-1">
              <p className={`text-sm font-semibold ${done ? "text-[#111827]" : active ? "text-[#C99F08]" : "text-[#9CA3AF]"}`}>{label}</p>
              {active && <span className="text-[10px] font-bold text-[#C99F08] bg-[#FEF9E7] px-1.5 py-0.5 rounded-full mt-1 inline-block">En cours</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav({ active, onNavigate }: { active: SellerPage; onNavigate: (p: SellerPage) => void }) {
  const items: { id: SellerPage; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "dashboard", label: "Accueil",   icon: <Home size={20} /> },
    { id: "products",  label: "Produits",  icon: <Package size={20} /> },
    { id: "orders",    label: "Commandes", icon: <ShoppingBag size={20} />, badge: 3 },
    { id: "shop",      label: "Boutique",  icon: <Store size={20} /> },
    { id: "more",      label: "Plus",      icon: <MoreHorizontal size={20} /> },
  ];
  const isActive = (id: SellerPage) =>
    id === "products" ? ["products", "product-detail", "add-product"].includes(active)
    : id === "orders" ? ["orders", "order-detail"].includes(active)
    : active === id;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/8 z-50 flex" style={{ maxWidth: 440, margin: "0 auto" }}>
      {items.map((item) => {
        const on = isActive(item.id);
        return (
          <button key={item.id} onClick={() => onNavigate(item.id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors relative ${on ? "text-[#C99F08]" : "text-[#9CA3AF]"}`}>
            {item.badge && (
              <span className="absolute top-2 left-1/2 ml-1.5 bg-red-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">{item.badge}</span>
            )}
            {item.icon}
            <span className="text-[10px] font-semibold leading-none">{item.label}</span>
            {on && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#C99F08] rounded-full" />}
          </button>
        );
      })}
    </nav>
  );
}

function Screen({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`min-h-screen bg-[#F4F4F8] pb-24 ${className}`}>{children}</div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

function DashboardScreen({ onNavigate }: { onNavigate: (p: SellerPage) => void }) {
  const [period, setPeriod] = useState<"7j" | "30j" | "3m">("7j");
  const [hideBalance, setHideBalance] = useState(false);

  return (
    <Screen>
      {/* Dark header */}
      <div className="bg-[#111827] px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/50 text-sm">Bonjour 👋</p>
            <h1 className="text-white font-bold text-xl mt-0.5">Boutique Ahouansou</h1>
          </div>
          <div className="relative">
            <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <Bell size={18} />
            </button>
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">3</span>
          </div>
        </div>

        {/* Revenue card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-[20px] p-5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">CA ce mois</p>
            <button onClick={() => setHideBalance(!hideBalance)} className="text-white/40 hover:text-white/70">
              {hideBalance ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          </div>
          <div className="flex items-end justify-between mb-1">
            <p className="text-white font-bold text-4xl tracking-tight">
              {hideBalance ? "••••••" : "245 000 F"}
            </p>
            <div className="text-right pb-1">
              <p className="text-white/50 text-xs">Aujourd'hui</p>
              <p className="text-white font-bold">{hideBalance ? "••••" : "57 500 F"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mb-5">
            <TrendingUp size={13} className="text-green-400" />
            <span className="text-green-400 text-xs font-bold">+18,4 %</span>
            <span className="text-white/40 text-xs">vs mois dernier</span>
          </div>

          {/* Period toggle */}
          <div className="flex gap-1 bg-black/20 rounded-full p-1 mb-4">
            {(["7j", "30j", "3m"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`flex-1 text-xs font-bold py-1.5 rounded-full transition-all ${period === p ? "bg-[#C99F08] text-white shadow-sm" : "text-white/50 hover:text-white/80"}`}>
                {p === "7j" ? "7 jours" : p === "30j" ? "30 jours" : "3 mois"}
              </button>
            ))}
          </div>

          {/* Area chart */}
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C99F08" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#C99F08" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1F2937", border: "none", borderRadius: 8, fontSize: 11, color: "#fff" }}
                  formatter={(v: number) => [formatPrice(v), "CA"]}
                  labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                />
                <Area type="monotone" dataKey="value" stroke="#C99F08" strokeWidth={2.5} fill="url(#gold)" dot={false} activeDot={{ r: 4, fill: "#C99F08", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 mt-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Commandes", value: "24", sub: "ce mois", color: "#2563EB", bg: "#EFF6FF" },
            { label: "Actifs", value: "5",  sub: "produits", color: "#059669", bg: "#ECFDF5" },
            { label: "En attente", value: "3", sub: "à traiter", color: "#D97706", bg: "#FFF7ED" },
          ].map((s) => (
            <Card key={s.label} className="p-4 text-center">
              <p className="font-bold text-2xl text-[#111827]">{s.value}</p>
              <p className="text-xs font-bold mt-0.5" style={{ color: s.color }}>{s.label}</p>
              <p className="text-[10px] text-[#9CA3AF]">{s.sub}</p>
            </Card>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-sm font-bold text-[#374151] mb-3 px-1">Actions rapides</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "+ Ajouter\nproduit", icon: <Plus size={22} />, bg: "bg-[#C99F08]", tc: "text-white", action: "add-product" as SellerPage },
              { label: "Commandes", icon: <ShoppingBag size={22} />, bg: "bg-[#EFF6FF]", tc: "text-blue-600", action: "orders" as SellerPage },
              { label: "Partager", icon: <Share2 size={22} />, bg: "bg-[#ECFDF5]", tc: "text-green-600", action: "shop" as SellerPage },
              { label: "Stats", icon: <BarChart2 size={22} />, bg: "bg-[#F5F3FF]", tc: "text-purple-600", action: null as null },
            ].map((qa) => (
              <button key={qa.label} onClick={() => qa.action && onNavigate(qa.action)} className="flex flex-col items-center gap-2 group">
                <div className={`w-14 h-14 rounded-[18px] ${qa.bg} flex items-center justify-center shadow-sm transition-transform group-active:scale-95`}>
                  <span className={qa.tc}>{qa.icon}</span>
                </div>
                <p className="text-[10px] font-semibold text-[#374151] text-center leading-snug whitespace-pre-line">{qa.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={17} className="text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-[#111827] text-sm leading-snug">3 commandes nécessitent votre attention</p>
              <div className="flex flex-col gap-0.5 mt-1">
                <span className="text-xs text-[#6B7280]">• 2 à confirmer</span>
                <span className="text-xs text-[#6B7280]">• 1 paiement en attente</span>
              </div>
            </div>
          </div>
          <button onClick={() => onNavigate("orders")} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-amber-100 hover:bg-amber-200 text-amber-700 text-sm font-bold transition-colors">
            Voir les commandes <ChevronRight size={15} />
          </button>
        </div>

        {/* Plan limits */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Votre offre</p>
              <p className="font-bold text-[#111827] mt-0.5">Gratuit</p>
            </div>
            <span className="text-[10px] font-bold bg-[#FEF9E7] text-[#8B6604] border border-[#C99F08]/25 px-2.5 py-1 rounded-full">GRATUIT</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "Produits", used: 6, max: 10 },
              { label: "Commandes / mois", used: 24, max: 30 },
            ].map((item) => {
              const pct = item.used / item.max;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#6B7280] font-medium">{item.label}</span>
                    <span className="font-bold text-[#111827]">{item.used} / {item.max}</span>
                  </div>
                  <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct > 0.8 ? "bg-amber-400" : "bg-[#C99F08]"}`} style={{ width: `${pct * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <button className="mt-3 text-xs font-bold text-[#C99F08] flex items-center gap-1 hover:underline">
            Voir les offres <ArrowUpRight size={12} />
          </button>
        </Card>

        {/* Recent activity */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-sm font-bold text-[#374151]">Activité récente</p>
            <button onClick={() => onNavigate("orders")} className="text-xs font-bold text-[#C99F08]">Tout voir</button>
          </div>
          <Card>
            {ORDERS.slice(0, 4).map((order, i) => {
              const cfg = orderStatusConfig(order.status);
              return (
                <div key={order.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < 3 ? "border-b border-black/[0.04]" : ""}`}>
                  <div className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] flex-shrink-0">
                    <ShoppingBag size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111827] truncate">#{order.id} — {order.client.split(" ")[0]}</p>
                    <p className="text-xs text-[#9CA3AF]">{order.date} · {order.time}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${order.status === "annulee" ? "text-[#9CA3AF] line-through" : "text-[#111827]"}`}>
                      {order.status !== "annulee" && "+"}{formatPrice(order.amount)}
                    </p>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: cfg.color }}>{cfg.label}</p>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    </Screen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ORDERS LIST
// ═══════════════════════════════════════════════════════════════════════════════

function OrdersScreen({ onNavigate, onSelectOrder }: { onNavigate: (p: SellerPage) => void; onSelectOrder: (o: SellerOrder) => void }) {
  const [filter, setFilter] = useState<"toutes" | "a_traiter" | "terminees">("toutes");
  const [search, setSearch] = useState("");

  const filtered = ORDERS.filter((o) => {
    const matchSearch = o.client.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search);
    const matchFilter = filter === "toutes" ? true
      : filter === "a_traiter" ? ["a_confirmer", "paiement_attente"].includes(o.status)
      : ["livree", "annulee"].includes(o.status);
    return matchSearch && matchFilter;
  });

  return (
    <Screen>
      <div className="bg-white px-5 pt-12 pb-4 border-b border-black/5 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[#111827]">Commandes</h1>
          <button className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#374151]"><Filter size={15} /></button>
        </div>
        <SearchBarEl placeholder="Client, numéro de commande..." value={search} onChange={setSearch} />
        <div className="flex gap-2 mt-3 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
          <FilterChip label="Toutes" active={filter === "toutes"} onClick={() => setFilter("toutes")} />
          <FilterChip label="À traiter" active={filter === "a_traiter"} onClick={() => setFilter("a_traiter")} />
          <FilterChip label="Terminées" active={filter === "terminees"} onClick={() => setFilter("terminees")} />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {filtered.length === 0 ? (
          <EmptyState icon={<ShoppingBag size={24} />} title="Aucune commande" desc="Les nouvelles commandes apparaîtront ici dès qu'un client passera commande." />
        ) : filtered.map((order) => (
          <Card key={order.id} className="p-4" onClick={() => { onSelectOrder(order); onNavigate("order-detail"); }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-[#111827]">#{order.id}</p>
                <p className="text-sm text-[#6B7280] mt-0.5">{order.client}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{order.date} à {order.time} · {order.items.length} art.</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-black/[0.04]">
              <p className={`font-bold text-xl ${order.status === "annulee" ? "text-[#9CA3AF] line-through" : "text-[#111827]"}`}>
                {formatPrice(order.amount)}
              </p>
              <ChevronRight size={18} className="text-[#9CA3AF]" />
            </div>
          </Card>
        ))}
      </div>
    </Screen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ORDER DETAIL
// ═══════════════════════════════════════════════════════════════════════════════

function OrderDetailScreen({ order, onBack }: { order: SellerOrder; onBack: () => void }) {
  const stepMap: Record<OrderStatus, number> = {
    a_confirmer: 0, paiement_attente: 0, confirmee: 1, preparation: 2, livree: 3, annulee: 0,
  };
  const currentStep = stepMap[order.status];
  const [confirmed, setConfirmed] = useState(false);
  const needsAction = ["a_confirmer", "paiement_attente"].includes(order.status);

  return (
    <Screen className="pb-32">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-0 border-b border-black/5">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center">
            <ChevronLeft size={18} className="text-[#374151]" />
          </button>
          <h1 className="font-bold text-[#111827] text-lg">Commande #{order.id}</h1>
        </div>

        {/* Amount hero */}
        <div className="bg-[#111827] rounded-[18px] p-5 mb-5">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Montant total</p>
          <p className="text-white font-bold text-4xl tracking-tight mb-3">{formatPrice(order.amount)}</p>
          <div className="flex items-center justify-between">
            <StatusBadge status={order.status} />
            <p className="text-white/40 text-xs">{order.date} · {order.time}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Timeline */}
        <Card className="p-5">
          <p className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
            <Truck size={15} className="text-[#C99F08]" />Suivi de la commande
          </p>
          <Timeline events={["Commande reçue", "Paiement confirmé", "Préparation", "Livrée"]} currentStep={currentStep} />
        </Card>

        {/* Client */}
        <Card className="p-5">
          <p className="text-sm font-bold text-[#111827] mb-3">Client</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-[#C99F08]/15 flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-[#C99F08]">{order.client.split(" ").map(n => n[0]).join("")}</span>
            </div>
            <div>
              <p className="font-semibold text-[#111827]">{order.client}</p>
              <p className="text-xs text-[#9CA3AF]">{order.phone}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" fullWidth><Phone size={14} />Appeler</Btn>
            <Btn size="sm" fullWidth><MessageCircle size={14} />WhatsApp</Btn>
          </div>
          <div className="flex items-start gap-2 mt-3 text-xs text-[#9CA3AF]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mt-0.5 flex-shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {order.address}
          </div>
        </Card>

        {/* Items */}
        <Card className="p-5">
          <p className="text-sm font-bold text-[#111827] mb-3">Articles ({order.items.length})</p>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-14 h-14 rounded-[10px] overflow-hidden bg-[#F3F4F6] flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#111827] leading-snug">{item.name}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Qté : {item.qty}</p>
                  <p className="font-bold text-[#111827] mt-1">{formatPrice(item.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Sticky CTA */}
      {needsAction && !confirmed && (
        <div className="fixed bottom-16 left-0 right-0 max-w-[440px] mx-auto px-4 py-3 bg-[#F4F4F8]/90 backdrop-blur-sm border-t border-black/5">
          <Btn fullWidth size="lg" onClick={() => setConfirmed(true)}>
            <Check size={16} />Confirmer la commande
          </Btn>
        </div>
      )}
      {confirmed && (
        <div className="fixed bottom-16 left-0 right-0 max-w-[440px] mx-auto px-4 py-3">
          <div className="bg-green-500 text-white rounded-[12px] py-3.5 px-5 flex items-center gap-2 justify-center font-bold shadow-lg">
            <CheckCircle size={16} />Commande confirmée !
          </div>
        </div>
      )}
    </Screen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PRODUCTS LIST
// ═══════════════════════════════════════════════════════════════════════════════

function ProductsScreen({ onNavigate, onSelectProduct }: { onNavigate: (p: SellerPage) => void; onSelectProduct: (p: SellerProduct) => void }) {
  const [filter, setFilter] = useState<"tous" | "actifs" | "rupture">("tous");
  const [search, setSearch] = useState("");
  const filtered = PRODUCTS.filter((p) => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase());
    const mf = filter === "tous" ? true : filter === "actifs" ? p.status === "actif" : p.status === "rupture";
    return ms && mf;
  });

  return (
    <Screen>
      <div className="bg-white px-5 pt-12 pb-4 border-b border-black/5 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[#111827]">Produits</h1>
          <Btn size="sm" onClick={() => onNavigate("add-product")}><Plus size={15} />Ajouter</Btn>
        </div>
        <SearchBarEl placeholder="Rechercher un produit..." value={search} onChange={setSearch} />
        <div className="flex gap-2 mt-3">
          <FilterChip label="Tous" active={filter === "tous"} onClick={() => setFilter("tous")} />
          <FilterChip label="Actifs" active={filter === "actifs"} onClick={() => setFilter("actifs")} />
          <FilterChip label="Rupture" active={filter === "rupture"} onClick={() => setFilter("rupture")} />
        </div>
      </div>

      <div className="px-4 pt-4">
        {filtered.length === 0 ? (
          <EmptyState icon={<Package size={24} />} title="Aucun produit" desc="Ajoutez votre premier produit pour commencer à vendre." cta="+ Ajouter un produit" onCta={() => onNavigate("add-product")} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((product) => {
              const sc = productStatusConfig(product.status);
              return (
                <Card key={product.id} className="overflow-hidden" onClick={() => { onSelectProduct(product); onNavigate("product-detail"); }}>
                  <div className="aspect-square relative">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                    {product.status === "rupture" && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-red-500 px-2 py-1 rounded-full">Rupture</span>
                      </div>
                    )}
                    <button className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical size={13} className="text-[#374151]" />
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-[#111827] text-sm leading-snug line-clamp-2 mb-1.5">{product.name}</p>
                    <p className="font-bold text-[#111827] text-base mb-2">{formatPrice(product.price)}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        <span className="text-[11px] font-semibold" style={{ color: sc.color }}>{sc.label}</span>
                      </div>
                      <span className="text-[10px] text-[#9CA3AF] font-medium">{product.sales} ventes</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Screen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. PRODUCT DETAIL
// ═══════════════════════════════════════════════════════════════════════════════

function ProductDetailScreen({ product, onBack }: { product: SellerProduct; onBack: () => void }) {
  const sc = productStatusConfig(product.status);

  return (
    <Screen className="pb-32">
      <div className="relative h-72 bg-[#F3F4F6]">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <button onClick={onBack} className="absolute top-12 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
          <ChevronLeft size={18} className="text-[#374151]" />
        </button>
        <button className="absolute top-12 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
          <MoreVertical size={16} className="text-[#374151]" />
        </button>
        <div className="absolute bottom-4 left-4">
          <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            <span className="text-white text-xs font-semibold">{sc.label}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        <div>
          <h1 className="font-bold text-[#111827] text-xl leading-tight">{product.name}</h1>
          <p className="text-[#9CA3AF] text-sm mt-1">{product.category}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Prix", value: formatPrice(product.price) },
            { label: "Stock", value: `${product.stock} unités` },
            { label: "Ventes", value: `${product.sales} total` },
          ].map((s) => (
            <Card key={s.label} className="p-3.5 text-center">
              <p className="font-bold text-[#111827] text-sm leading-tight">{s.value}</p>
              <p className="text-[10px] text-[#9CA3AF] mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <p className="text-sm font-bold text-[#111827] mb-2">Description</p>
          <p className="text-sm text-[#6B7280] leading-relaxed">{product.description}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm font-bold text-[#111827] mb-3">Performance (7 jours)</p>
          {[
            { label: "Vues", value: "234" },
            { label: "Taux de conversion", value: "6,8 %" },
            { label: "Revenus générés", value: formatPrice(product.sales * product.price) },
          ].map((stat) => (
            <div key={stat.label} className="flex justify-between py-2.5 border-b border-black/[0.04] last:border-0">
              <span className="text-sm text-[#6B7280]">{stat.label}</span>
              <span className="text-sm font-bold text-[#111827]">{stat.value}</span>
            </div>
          ))}
        </Card>
      </div>

      <div className="fixed bottom-16 left-0 right-0 max-w-[440px] mx-auto px-4 py-3 bg-[#F4F4F8]/90 backdrop-blur-sm border-t border-black/5">
        <div className="flex gap-3">
          <Btn variant="danger" size="lg" fullWidth><EyeOff size={16} />Désactiver</Btn>
          <Btn size="lg" fullWidth><Edit2 size={16} />Modifier</Btn>
        </div>
      </div>
    </Screen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. ADD PRODUCT
// ═══════════════════════════════════════════════════════════════════════════════

function AddProductScreen({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("unité");
  const [published, setPublished] = useState(false);

  const steps = ["Photo", "Infos", "Prix & Stock", "Publication"];
  const prev = () => setStep(s => Math.max(1, s - 1) as 1|2|3|4);
  const next = () => setStep(s => Math.min(4, s + 1) as 1|2|3|4);

  return (
    <Screen className="pb-32">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-black/5 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center"><ChevronLeft size={18} className="text-[#374151]" /></button>
          <h1 className="font-bold text-[#111827] text-lg flex-1">Ajouter un produit</h1>
          <p className="text-xs text-[#9CA3AF] font-medium">{step}/4</p>
        </div>

        {/* Step track */}
        <div className="flex gap-1 mb-2">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i < step ? "bg-[#C99F08]" : "bg-[#F3F4F6]"}`} />
          ))}
        </div>
        <p className="text-xs font-bold text-[#C99F08]">{steps[step - 1]}</p>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Step 1 */}
        {step === 1 && (
          <>
            <p className="text-sm text-[#6B7280]">Ajoutez des photos claires sur fond neutre. La 1ère sera la photo principale.</p>
            <div className="grid grid-cols-3 gap-3">
              <button className="col-span-2 aspect-square bg-white border-2 border-dashed border-[#C99F08]/40 rounded-[16px] flex flex-col items-center justify-center gap-3 hover:border-[#C99F08] hover:bg-[#FEF9E7]/40 transition-all group">
                <div className="w-14 h-14 rounded-full bg-[#FEF9E7] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload size={22} className="text-[#C99F08]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-[#374151]">Photo principale</p>
                  <p className="text-xs text-[#9CA3AF]">Touchez pour ajouter</p>
                </div>
              </button>
              {[2, 3].map((n) => (
                <button key={n} className="aspect-square bg-white border-2 border-dashed border-[#E5E7EB] rounded-[12px] flex flex-col items-center justify-center gap-1 hover:border-[#C99F08]/40 transition-colors">
                  <Plus size={18} className="text-[#9CA3AF]" />
                  <span className="text-[10px] text-[#9CA3AF]">Photo {n}</span>
                </button>
              ))}
              {[4, 5, 6].map((n) => (
                <button key={n} className="aspect-square bg-white border-2 border-dashed border-[#E5E7EB] rounded-[10px] flex items-center justify-center hover:border-[#C99F08]/40 transition-colors">
                  <Plus size={15} className="text-[#9CA3AF]" />
                </button>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-[12px] p-3.5 flex gap-2.5 text-xs text-blue-700">
              <Info size={14} className="flex-shrink-0 mt-0.5" />
              <span>Des photos de bonne qualité augmentent vos ventes jusqu'à 40 %. Privilégiez un fond blanc ou neutre.</span>
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <InputField label="Nom du produit" placeholder="Ex : Boubou Brodé Grand Bazin" value={name} onChange={setName} />
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Catégorie</label>
              <div className="flex gap-2 flex-wrap">
                {["Tissus", "Vêtements", "Accessoires"].map((cat) => (
                  <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-2.5 rounded-full text-sm font-semibold border transition-colors ${category === cat ? "bg-[#C99F08] text-white border-[#C99F08]" : "bg-white text-[#6B7280] border-black/10 hover:border-[#C99F08]/50"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1.5">Description <span className="font-normal text-[#9CA3AF]">(optionnel)</span></label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Matière, dimensions, couleurs disponibles..." rows={4}
                className="w-full px-4 py-3 rounded-[12px] bg-white border border-black/12 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C99F08] focus:ring-2 focus:ring-[#C99F08]/15 resize-none" />
            </div>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <InputField label="Prix de vente (FCFA)" type="number" placeholder="Ex : 15000" value={price} onChange={setPrice} hint="Prix affiché à vos clients sur la boutique." />
            <InputField label="Stock disponible" type="number" placeholder="Ex : 10" value={stock} onChange={setStock} hint="Nombre d'unités actuellement disponibles." />
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-2">Unité de vente</label>
              <div className="flex gap-2">
                {["unité", "mètre", "lot"].map((u) => (
                  <button key={u} onClick={() => setUnit(u)} className={`flex-1 py-3 rounded-[12px] border text-sm font-semibold transition-colors ${unit === u ? "bg-[#C99F08] text-white border-[#C99F08]" : "bg-white text-[#6B7280] border-black/10"}`}>
                    {u === "unité" ? "À l'unité" : u === "mètre" ? "Au mètre" : "Par lot"}
                  </button>
                ))}
              </div>
            </div>
            {price && (
              <Card className="p-4 border border-[#C99F08]/20 bg-[#FEF9E7]/40">
                <p className="text-xs font-semibold text-[#9CA3AF] mb-1">Aperçu financier</p>
                <p className="font-bold text-[#111827] text-2xl">{parseInt(price).toLocaleString("fr-FR")} FCFA</p>
                <div className="flex items-center justify-between mt-2 text-xs text-[#9CA3AF]">
                  <span>Commission ANIF (2%)</span>
                  <span className="font-medium">~{Math.round(parseInt(price) * 0.02).toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-[#059669] mt-1">
                  <span>Vous recevez</span>
                  <span>~{Math.round(parseInt(price) * 0.98).toLocaleString("fr-FR")} FCFA</span>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Step 4 */}
        {step === 4 && !published && (
          <>
            <Card className="overflow-hidden">
              <div className="h-40 bg-[#F3F4F6] flex items-center justify-center">
                <div className="text-center text-[#9CA3AF]"><Image size={28} className="mx-auto mb-1" /><p className="text-xs">Photo du produit</p></div>
              </div>
              <div className="p-4">
                <p className="font-bold text-[#111827]">{name || "Nom du produit"}</p>
                <p className="text-[#C99F08] font-bold mt-1 text-lg">{price ? parseInt(price).toLocaleString("fr-FR") + " FCFA" : "—"}</p>
                <div className="flex items-center gap-1 mt-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-xs text-green-600 font-semibold">Disponible</span></div>
              </div>
            </Card>
            <Card className="p-4 divide-y divide-black/[0.04]">
              {[
                { label: "Catégorie", value: category || "—" },
                { label: "Stock initial", value: stock ? `${stock} ${unit}(s)` : "—" },
                { label: "Visibilité", value: "Boutique publique" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm py-2.5 first:pt-0 last:pb-0">
                  <span className="text-[#6B7280]">{item.label}</span>
                  <span className="font-semibold text-[#111827]">{item.value}</span>
                </div>
              ))}
            </Card>
          </>
        )}

        {/* Published */}
        {step === 4 && published && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-200">
              <Check size={36} className="text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-bold text-[#111827] mb-2">Produit publié !</h2>
            <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">Votre produit est maintenant visible sur votre boutique en ligne.</p>
            <Btn fullWidth><Share2 size={15} />Partager ce produit</Btn>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-16 left-0 right-0 max-w-[440px] mx-auto px-4 py-3 bg-[#F4F4F8]/90 backdrop-blur-sm border-t border-black/5">
        {!published ? (
          <div className="flex gap-3">
            {step > 1 && <Btn variant="outline" size="lg" onClick={prev}><ChevronLeft size={16} /></Btn>}
            {step < 4 && <Btn fullWidth size="lg" onClick={next}>Continuer <ChevronRight size={16} /></Btn>}
            {step === 4 && <Btn fullWidth size="lg" onClick={() => setPublished(true)}><Zap size={16} />Publier le produit</Btn>}
          </div>
        ) : (
          <Btn fullWidth size="lg" variant="outline" onClick={onBack}>Retour aux produits</Btn>
        )}
      </div>
    </Screen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. BOUTIQUE / PARTAGE
// ═══════════════════════════════════════════════════════════════════════════════

function ShopScreen() {
  const [copied, setCopied] = useState(false);
  const shopUrl = "anifowoche.com/shop/boutique-ahouansou";

  return (
    <Screen>
      <div className="bg-[#111827] px-5 pt-12 pb-6">
        <h1 className="text-xl font-bold text-white mb-1">Votre boutique</h1>
        <p className="text-white/50 text-sm">Partagez et augmentez vos ventes</p>
        <div className="mt-5 bg-green-500/15 border border-green-400/20 rounded-[14px] p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={18} className="text-green-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Boutique en ligne et active</p>
            <p className="text-white/50 text-xs mt-0.5">Accessible 24h/24 à vos clients</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* URL */}
        <Card className="p-4">
          <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Lien de votre boutique</p>
          <div className="flex items-center gap-2 bg-[#F3F4F6] rounded-[10px] px-3 py-2.5 mb-3">
            <ExternalLink size={13} className="text-[#C99F08] flex-shrink-0" />
            <p className="text-sm text-[#374151] font-medium truncate flex-1">{shopUrl}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: copied ? "Copié !" : "Copier", icon: copied ? <Check size={13} /> : <Copy size={13} />, action: () => { setCopied(true); setTimeout(() => setCopied(false), 2000); }, variant: "primary" as const },
              { label: "Partager", icon: <Share2 size={13} />, action: () => {}, variant: "outline" as const },
              { label: "WhatsApp", icon: <MessageCircle size={13} />, action: () => {}, variant: "outline" as const },
            ].map((b) => (
              <Btn key={b.label} size="sm" fullWidth variant={b.variant} onClick={b.action}>
                {b.icon}{b.label}
              </Btn>
            ))}
          </div>
        </Card>

        {/* Preview */}
        <Card className="overflow-hidden">
          <div className="bg-[#1C1C1C] px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-white/10 rounded-full px-3 py-1 text-[10px] text-white/50 truncate">{shopUrl}</div>
          </div>
          <div className="bg-white p-3">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-[#111827] text-sm">ANIFOWOCHE</p>
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-[#F3F4F6] rounded-full" />
                <div className="w-6 h-6 bg-[#F3F4F6] rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {PRODUCTS.slice(0, 6).map((p) => (
                <div key={p.id} className="rounded-[6px] overflow-hidden aspect-square">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Visiteurs", period: "7 jours", value: "142", delta: "+12 %", up: true },
            { label: "Pages vues", period: "7 jours", value: "389", delta: "+8 %", up: true },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div className="flex items-center gap-1 mb-2">
                {s.up ? <TrendingUp size={12} className="text-green-500" /> : <TrendingDown size={12} className="text-red-500" />}
                <span className={`text-xs font-bold ${s.up ? "text-green-600" : "text-red-600"}`}>{s.delta}</span>
              </div>
              <p className="font-bold text-[#111827] text-2xl">{s.value}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{s.label} · {s.period}</p>
            </Card>
          ))}
        </div>

        {/* Social share */}
        <Card className="p-4">
          <p className="font-bold text-[#111827] text-sm mb-3">Partager sur</p>
          <div className="flex gap-2">
            {[
              { label: "WhatsApp", bg: "bg-green-500" },
              { label: "Facebook", bg: "bg-blue-600" },
              { label: "Instagram", bg: "bg-gradient-to-br from-purple-500 to-pink-500" },
            ].map((s) => (
              <button key={s.label} className={`flex-1 ${s.bg} rounded-[10px] py-3 flex flex-col items-center gap-1`}>
                <MessageCircle size={16} className="text-white" />
                <span className="text-[10px] text-white font-bold">{s.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </Screen>
  );
}

// ─── More ─────────────────────────────────────────────────────────────────────

function MoreScreen() {
  return (
    <Screen>
      <div className="px-5 pt-12 pb-5">
        <h1 className="text-xl font-bold text-[#111827]">Plus</h1>
      </div>
      <div className="px-4 space-y-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#C99F08]/15 flex items-center justify-center">
              <span className="font-bold text-[#C99F08] text-lg">A</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-[#111827]">Boutique Ahouansou</p>
              <p className="text-xs text-[#9CA3AF]">boutique.ahouansou@email.com</p>
            </div>
            <ChevronRight size={16} className="text-[#9CA3AF]" />
          </div>
        </Card>
        <Card className="divide-y divide-black/[0.04]">
          {[
            { icon: <BarChart2 size={17} />, label: "Statistiques avancées", desc: "Analyse détaillée de vos ventes", gold: false },
            { icon: <Tag size={17} />, label: "Promotions", desc: "Codes promo et réductions", gold: false },
            { icon: <Zap size={17} />, label: "Passer à l'offre Pro", desc: "Produits illimités, commission réduite", gold: true },
            { icon: <MessageCircle size={17} />, label: "Support", desc: "Chat avec notre équipe", gold: false },
            { icon: <Info size={17} />, label: "À propos", desc: "ANIF Seller — v1.4.2", gold: false },
          ].map((item) => (
            <button key={item.label} className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-[#FAFAFA] transition-colors">
              <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${item.gold ? "bg-[#FEF9E7] text-[#C99F08]" : "bg-[#F3F4F6] text-[#374151]"}`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <p className={`font-semibold text-sm ${item.gold ? "text-[#C99F08]" : "text-[#111827]"}`}>{item.label}</p>
                <p className="text-xs text-[#9CA3AF]">{item.desc}</p>
              </div>
              <ChevronRight size={15} className="text-[#9CA3AF]" />
            </button>
          ))}
        </Card>
      </div>
    </Screen>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [page, setPage] = useState<SellerPage>("dashboard");
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder>(ORDERS[0]);
  const [selectedProduct, setSelectedProduct] = useState<SellerProduct>(PRODUCTS[0]);

  const goto = (p: SellerPage) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="bg-[#E8E8EC] min-h-screen flex justify-center" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div className="relative w-full max-w-[440px] min-h-screen overflow-hidden">
        {page === "dashboard"      && <DashboardScreen onNavigate={goto} />}
        {page === "orders"         && <OrdersScreen onNavigate={goto} onSelectOrder={(o) => { setSelectedOrder(o); goto("order-detail"); }} />}
        {page === "order-detail"   && <OrderDetailScreen order={selectedOrder} onBack={() => goto("orders")} />}
        {page === "products"       && <ProductsScreen onNavigate={goto} onSelectProduct={(p) => { setSelectedProduct(p); goto("product-detail"); }} />}
        {page === "product-detail" && <ProductDetailScreen product={selectedProduct} onBack={() => goto("products")} />}
        {page === "add-product"    && <AddProductScreen onBack={() => goto("products")} />}
        {page === "shop"           && <ShopScreen />}
        {page === "more"           && <MoreScreen />}

        <BottomNav active={page} onNavigate={goto} />
      </div>
    </div>
  );
}
