import React, { useMemo, useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpCircle,
  BarChart3,
  BellRing,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CookingPot,
  Download,
  Eye,
  FileDown,
  FileText,
  Filter,
  Gift,
  GlassWater,
  History,
  LayoutDashboard,
  LayoutGrid,
  List,
  LogOut,
  Mail,
  MapPin,
  Microwave,
  MoreHorizontal,
  Package,
  PackageMinus,
  PackagePlus,
  Paperclip,
  Pencil,
  Phone,
  Plus,
  Refrigerator,
  Rows3,
  Search,
  Sparkles,
  Tags,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  Upload,
  User,
  Utensils,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useLogout } from "@/hooks/useAuth";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  alertThreshold: number;
  manufactureDate: string;
  expiry: string;
  unit: string;
  image?: string;
  createdAt?: string; // date d'ajout de l'article, sert au badge "Nouveau"
  previousStatus?: "bon" | "alerte" | "rupture"; // utilisé pour déclencher l'animation de transition de statut
}

interface Category {
  id: string;
  name: string;
  image?: string;
}

interface KitchenEquipment {
  id: string;
  name: string;
  type: string; // "Vaisselle" | "Couverts" | "Ustensiles de cuisine" | "Électroménager"
  quantity: number;
  condition: "Bon état" | "Endommagé" | "Manquant";
}

interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: "Entrée" | "Sortie";
  quantity: number;
  unit: string;
  date: string;
  note?: string;
  reason?: string; // pour les sorties : Cuisine / Perte / Autre (ou Casse / Vol pour le matériel)
  documentName?: string;
  documentUrl?: string;
  groupId?: string; // regroupe les articles d'une même réception
  sourceType?: "article" | "materiel"; // origine de la sortie : article alimentaire ou matériel de cuisine
  zone?: string; // destination de la sortie : Cuisine / Salle / Cafétéria / Terrasse
}

interface UnitDef {
  id: string;
  name: string;
  symbol: string;
  type: string;
}

interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  city: string;
}

interface NotificationEntry {
  id: string;
  message: string;
  target: "Manager" | "Magasinier";
  time: string;
}

interface LossHistoryEntry {
  id: string;
  itemName: string;
  date: string;
  action: string;
  quantity: number;
  unit: string;
  valueSaved: number;
}

type SectionKey = "dashboard" | "articles" | "categories" | "alertes" | "expirations" | "analyses" | "fournisseurs" | "entrees" | "sorties";
type AnalysesPeriod = "jour" | "semaine" | "mois";
type ExpirationUrgency = "Critique" | "Imminent" | "À surveiller";

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`;

/* ------------------------------------------------------------------ */
/* Palette (couleurs adoucies)                                         */
/* ------------------------------------------------------------------ */

const PALETTE_STYLE = `
  :root {
    --bg:#f0f4fb;
    --surface:#ffffff;
    --surface2:#f4f7fc;
    --surface3:#eaf0fb;
    --border:#dde5f4;
    --border2:#c5d2ea;
    --blue:#6b9cf0;
    --blue2:#5a8ce8;
    --blue3:#7aa8f2;
    --blue-sidebar:#6b9cf0;
    --blue2-sidebar:#5a8ce8;
    --blue-soft:#e8f0fe;
    --text:#111827;
    --text2:#374151;
    --text3:#6b7280;
    --green:#4caf6e;
    --green-soft:#eafaf0;
    --red:#e2685f;
    --red-soft:#fdeeed;
    --red-border:#f3b8b2;
    --orange:#d3a13a;
    --orange-soft:#fdf7e6;
    --orange-border:#f0dba0;
    --purple:#9b7fe0;
    --purple-soft:#f2eefc;
    --cyan:#4bacc2;
    --cyan-soft:#e7f7fa;

    /* Palette d'avatars fournisseurs */
    --sup-0:#6b9cf0;
    --sup-1:#4caf6e;
    --sup-2:#d3a13a;
    --sup-3:#9b7fe0;
    --sup-4:#4bacc2;
    --sup-5:#e2685f;
  }

  @keyframes pulseAlerte {
    0%, 100% { box-shadow: 0 0 0 0 rgba(211,161,58,0.22); }
    50% { box-shadow: 0 0 0 6px rgba(211,161,58,0); }
  }
  @keyframes pulseRupture {
    0%, 100% { box-shadow: 0 0 0 0 rgba(226,104,95,0.24); }
    50% { box-shadow: 0 0 0 7px rgba(226,104,95,0); }
  }
  @keyframes statusFlash {
    0% { background-color: rgba(107,156,240,0.16); }
    100% { background-color: transparent; }
  }
  .status-pulse-alerte { animation: pulseAlerte 2.2s ease-in-out infinite; transition: background-color 0.6s ease, border-color 0.6s ease; }
  .status-pulse-rupture { animation: pulseRupture 2s ease-in-out infinite; transition: background-color 0.6s ease, border-color 0.6s ease; }
  .status-flash { animation: statusFlash 1.1s ease-out; }
  .density-compact .t-card { padding: 0.65rem !important; }
  .density-compact table td, .density-compact table th { padding-top: 0.4rem !important; padding-bottom: 0.4rem !important; }
`;

/* ------------------------------------------------------------------ */
/* Couleurs par fournisseur — utilitaires                              */
/* ------------------------------------------------------------------ */

const SUPPLIER_COLORS = ["var(--sup-0)", "var(--sup-1)", "var(--sup-2)", "var(--sup-3)", "var(--sup-4)", "var(--sup-5)"];
const supplierColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return SUPPLIER_COLORS[hash % SUPPLIER_COLORS.length];
};

const isNewSince = (dateStr?: string, days = 7) => {
  if (!dateStr) return false;
  const created = new Date(dateStr);
  const diff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
};

/* ------------------------------------------------------------------ */
/* Small shared UI primitives                                          */
/* ------------------------------------------------------------------ */

function Badge({ children, color }: { children: React.ReactNode; color: "green" | "red" | "orange" | "blue" | "gray" | "purple" }) {
  const map: Record<string, string> = {
    green: "bg-[var(--green-soft)] text-[var(--green)]",
    red: "bg-[var(--red-soft)] text-[var(--red)]",
    orange: "bg-[var(--orange-soft)] text-[var(--orange)]",
    blue: "bg-[var(--blue-soft)] text-[var(--blue)]",
    gray: "bg-surface3 text-black/60",
    purple: "bg-[var(--purple-soft)] text-[var(--purple)]",
  };

  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.72rem] font-extrabold uppercase tracking-wide ${map[color]}`}>{children}</span>;
}

function PrimaryButton({ children, onClick, className = "", type = "button" }: { children: React.ReactNode; onClick?: () => void; className?: string; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`t-std group inline-flex items-center justify-center gap-2 rounded-r2 bg-[var(--blue)] px-4 py-2.5 text-[0.85rem] font-extrabold text-black hover:opacity-90 ${className}`}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, className = "", type = "button" }: { children: React.ReactNode; onClick?: () => void; className?: string; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`t-std group inline-flex items-center justify-center gap-2 rounded-r2 border border-border bg-surface px-4 py-2.5 text-[0.85rem] font-extrabold text-black hover:border-blue hover:bg-blue hover:text-black ${className}`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[0.78rem] font-extrabold text-black/70">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full rounded-r2 border border-border bg-surface2 px-3 py-2 text-sm text-black outline-none focus:border-blue";

function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <div
        className={`t-card max-h-[88vh] w-full overflow-y-auto rounded-r3 border border-border bg-surface p-5 shadow-modal ${wide ? "max-w-2xl" : "max-w-md"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[1.05rem] font-black text-black">{title}</h3>
          <button onClick={onClose} className="t-std rounded-r2 p-1.5 text-black/50 hover:bg-surface2 hover:text-black">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-r2 bg-black px-4 py-3 text-[0.85rem] font-bold text-white shadow-modal">
      <Check size={16} className="text-[var(--green)]" />
      {message}
    </div>
  );
}

function DocumentPreview({ name, url }: { name?: string; url?: string }) {
  if (!url) {
    return <p className="text-[0.82rem] text-black/50">Aucun document joint.</p>;
  }
  const isImage = url.startsWith("data:image");
  const isPdf = url.startsWith("data:application/pdf") || (name ?? "").toLowerCase().endsWith(".pdf");
  if (isImage) {
    return <img src={url} alt={name} className="max-h-[65vh] w-full rounded-r2 border border-border object-contain bg-surface2" />;
  }
  if (isPdf) {
    return <iframe title={name || "document"} src={url} className="h-[65vh] w-full rounded-r2 border border-border bg-surface2" />;
  }
  return (
    <div className="flex items-center gap-2 rounded-r2 border border-dashed border-border bg-surface2 p-4 text-[0.82rem] text-black/60">
      <FileText size={16} /> {name || "Document joint"}
    </div>
  );
}

function FileDropInput({ label, fileName, onFile }: { label: string; fileName?: string; onFile: (name: string, dataUrl: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <span className="mb-1.5 block text-[0.78rem] font-extrabold text-black/70">{label}</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="t-std flex w-full items-center justify-center gap-2 rounded-r2 border border-dashed border-border bg-surface2 px-3 py-4 text-[0.82rem] font-bold text-black/60 hover:border-blue hover:text-blue"
      >
        <Upload size={16} />
        {fileName ? fileName : "Joindre une photo / un document (PDF, image)"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => onFile(file.name, reader.result as string);
          reader.readAsDataURL(file);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Graphiques interactifs (SVG maison, sans dépendance externe)        */
/* ------------------------------------------------------------------ */

const DONUT_COLORS = ["var(--blue)", "var(--green)", "var(--orange)", "var(--purple)", "var(--cyan)", "var(--red)"];

function DonutChart({ data, unitLabel = "DA" }: { data: { name: string; value: number; color?: string }[]; unitLabel?: string }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const total = Math.max(1, data.reduce((sum, d) => sum + d.value, 0));
  const size = 160;
  const radius = 58;
  const stroke = 20;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--surface3)" strokeWidth={stroke} />
          {data.map((d, i) => {
            const fraction = d.value / total;
            const dash = fraction * circumference;
            const offset = -cumulative * circumference;
            cumulative += fraction;
            const isHover = hoverIndex === i;
            return (
              <circle
                key={d.name}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={d.color ?? DONUT_COLORS[i % DONUT_COLORS.length]}
                strokeWidth={isHover ? stroke + 4 : stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${center} ${center})`}
                className="t-std cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex((prev) => (prev === i ? null : prev))}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {hoverIndex !== null ? (
            <>
              <span className="text-[0.68rem] font-extrabold text-black/60">{data[hoverIndex].name}</span>
              <span className="text-[0.95rem] font-black text-black">
                {data[hoverIndex].value.toLocaleString("fr-FR")} {unitLabel}
              </span>
            </>
          ) : (
            <>
              <span className="text-[0.68rem] font-extrabold text-black/60">Total</span>
              <span className="text-[0.95rem] font-black text-black">
                {total.toLocaleString("fr-FR")} {unitLabel}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        {data.map((d, i) => (
          <div
            key={d.name}
            className={`t-std flex items-center justify-between gap-2 rounded-r2 px-2 py-1.5 ${hoverIndex === i ? "bg-surface2" : ""}`}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex((prev) => (prev === i ? null : prev))}
          >
            <span className="flex min-w-0 items-center gap-1.5 truncate text-[0.72rem] font-bold text-black/70">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color ?? DONUT_COLORS[i % DONUT_COLORS.length] }} />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="shrink-0 text-[0.72rem] font-extrabold text-black">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ labels, values, unitLabel = "" }: { labels: string[]; values: number[]; unitLabel?: string }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const width = 560;
  const height = 160;
  const padding = 24;
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = Math.max(1, max - min);
  const stepX = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;
  const points = values.map((v, i) => ({
    x: padding + i * stepX,
    y: height - padding - ((v - min) / range) * (height - padding * 2),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1]?.x ?? padding} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 320 }}>
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--blue)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--blue)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={padding} x2={width - padding} y1={padding + f * (height - padding * 2)} y2={padding + f * (height - padding * 2)} stroke="var(--border)" strokeWidth={1} />
        ))}
        <path d={areaD} fill="url(#lineFill)" />
        <path d={pathD} fill="none" stroke="var(--blue)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="t-std" />
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoverIndex === i ? 6 : 4}
              fill="var(--surface)"
              stroke="var(--blue)"
              strokeWidth={2.5}
              className="t-std cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex((prev) => (prev === i ? null : prev))}
            />
            <rect x={p.x - stepX / 2} y={0} width={Math.max(stepX, 1)} height={height} fill="transparent" onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex((prev) => (prev === i ? null : prev))} className="cursor-pointer" />
            {hoverIndex === i && (
              <g>
                <rect x={Math.min(Math.max(p.x - 30, 0), width - 60)} y={Math.max(p.y - 34, 0)} width={60} height={24} rx={6} fill="black" />
                <text x={Math.min(Math.max(p.x, 30), width - 30)} y={Math.max(p.y - 34, 0) + 16} textAnchor="middle" fontSize={11} fontWeight={800} fill="white">
                  {values[i]}
                  {unitLabel}
                </text>
              </g>
            )}
          </g>
        ))}
        {labels.map((label, i) => (
          <text key={label + i} x={points[i]?.x ?? 0} y={height - 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--text3)">
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function TrendBadge({ deltaPercent }: { deltaPercent: number }) {
  const up = deltaPercent >= 0;
  const Icon = up ? ArrowUpCircle : ArrowDownCircle;
  return (
    <span className={`inline-flex items-center gap-1 text-[0.72rem] font-extrabold ${up ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
      <Icon size={13} />
      {up ? "+" : ""}
      {deltaPercent}% vs sem. dernière
    </span>
  );
}

/* Aperçu flottant au survol d'une ligne de tableau — infos clés sans clic.
   Le contenu flottant est rendu via un portail dans <body> pour ne jamais
   casser la structure d'un <table> (un <div> ne peut pas être un enfant direct
   de <tbody>, sinon le navigateur "sort" l'élément du tableau et décale les
   colonnes). L'élément passé en enfant (un <tr>) reste donc un enfant direct
   et légitime de <tbody>. */
function HoverPreview({ children, content }: { children: React.ReactElement; content: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const child = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setShow(true);
    },
    onMouseMove: (e: React.MouseEvent) => setPos({ x: e.clientX, y: e.clientY }),
    onMouseLeave: () => setShow(false),
  });

  return (
    <>
      {child}
      {show && typeof document !== "undefined"
        ? ReactDOM.createPortal(
            <div
              className="pointer-events-none fixed z-[70] w-56 rounded-r2 border border-border bg-surface p-3 shadow-modal"
              style={{ left: Math.min(pos.x + 14, window.innerWidth - 240), top: Math.min(pos.y + 14, window.innerHeight - 140) }}
            >
              {content}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

const navItems: Array<{ key: SectionKey; label: string; icon: React.ElementType }> = [
  { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { key: "articles", label: "Articles", icon: Package },
  { key: "categories", label: "Catégories & Matériel", icon: Tags },
  { key: "alertes", label: "Alertes stock", icon: BellRing },
  { key: "expirations", label: "Expirations", icon: Clock3 },
  { key: "analyses", label: "Analyses", icon: BarChart3 },
  { key: "fournisseurs", label: "Fournisseurs", icon: Truck },
  { key: "entrees", label: "Entrées", icon: PackagePlus },
  { key: "sorties", label: "Sorties", icon: PackageMinus },
];

/* Images (photos fournies par l'utilisateur, converties en base64) pour les catégories et articles */
const IMG = {
  DAIRY: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHCAkIBgoJCAkMCwoMDxoRDw4ODx8WGBMaJSEnJiQhJCMpLjsyKSw4LCMkM0Y0OD0/QkNCKDFITUhATTtBQj//2wBDAQsMDA8NDx4RER4/KiQqPz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz//wAARCAFNAfQDASIAAhEBAxEB/8QAGwABAAMBAQEBAAAAAAAAAAAAAAIDBAEFBgf/xABBEAACAgECAwQGBwcDAwUBAAAAAQIDEQQhBRIxE0FRYSIycYGR0QYUI0JSkqEVM1NUYnLBJDSxguHxJUODk7Lw/8QAGQEBAQEBAQEAAAAAAAAAAAAAAAECAwQF/8QAJhEBAQACAgICAQQDAQAAAAAAAAECEQMhEhMxQVEEImEUUjJxgZH/2gAMAwEAAhEDEQA/APfxc6wZzYNTGXt5t1qNsg5eKF9jYQaVAg+qxrgYjKQxdWXfP1zR6itVBEHIY/8Ax//Z",
  GROCERY_SHELF: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHCAkIBgoJCAkMCwoMDxoRDw4ODx8WGBMaJSEnJiQhJCMpLjsyKSw4LCMkM0Y0OD0/QkNCKDFITUhATTtBQj//2wBDAQsMDA8NDx4RER4/KiQqPz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz//wAARCAFNAfQDASIAAhEBAxEB/8QAHAAAAgIDAQEAAAAAAAAAAAAABQYDBAECBwAI/8QATBAAAgEDAwEGAwQIBAUCBAQHAQIDAAQRBRIhMQYTQVFhFCJxkTKBkqHRFSNCUmKD0uEHFrHB8CQzYzRygvEXQ3SzJTVTZKKys3P/xAAaAQEAAwEBAQAAAAAAAAAAAAAAAgQFAwYB/8QAMREAAgIDAAECBAQFBAMAAAAAAAECAwQRIQUSMRNBUSJhcYEUFTKRoUJSscHR8CP/2gAMAwEAAhEDEQA/AP34AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9k=",
  RAW_MEAT: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHCAkIBgoJCAkMCwoMDxoRDw4ODx8WGBMaJSEnJiQhJCMpLjsyKSw4LCMkM0Y0OD0/QkNCKDFITUhATTtBQj//2wBDAQsMDA8NDx4RER4/KiQqPz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz//wAARCAFNAfQDASIAAhEBAxEB/8QAGwAAAQUBAQAAAAAAAAAAAAAABAECAwUGAAf/xAA+EAACAQMDAgUFBgUDBAMBAQABAgMABBESITEFQRMiUWFxBjKBkaGxFCNCUpGx0RVCUpKxQ2LB4RYzcoLwJTVTouLxCP/EABkBAAMBAQEAAAAAAAAAAAAAAAABAgMEBf/EACERAQEBAAICAgMBAQAAAAAAAAABAhESITEDQRMiUWFx/9oADAMBAAIRAxEAPwD9ZgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9k=",
  VEG_SHELF: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHCAkIBgoJCAkMCwoMDxoRDw4ODx8WGBMaJSEnJiQhJCMpLjsyKSw4LCMkM0Y0OD0/QkNCKDFITUhATTtBQj//2wBDAQsMDA8NDx4RER4/KiQqPz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz//wAARCAF3AfQDASIAAhEBAxEB/8QAHAAAAgIDAQEAAAAAAAAAAAAABQACAwQGAQcI/8QAURAAAgEDAwEGAwQIBAUCBAQHAQIDAAQRBRIhMQYTQVFhFCJxkTKBkqHRFSNCUlNTVGKSscHR8CQzYzRygvEXQ3SzJTVTZKKys3P/xAAaAQEAAwEBAQAAAAAAAAAAAAAAAgQFAwYB/8QAMREAAgIBAwIEBQEIAwAAAAAAAAECEQMSITEEQRMiUWEFFDJxgUKR0eHwFSNSU/H/2gAMAwEAAhEDEQA/AP34AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9k=",
  TOMATOES: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHCAkIBgoJCAkMCwoMDxoRDw4ODx8WGBMaJSEnJiQhJCMpLjsyKSw4LCMkM0Y0OD0/QkNCKDFITUhATTtBQj//2wBDAQsMDA8NDx4RER4/KiQqPz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz//wAARCAKaAfQDASIAAhEBAxEB/8QAHAAAAgIDAQEAAAAAAAAAAAAABQYDBAECBwAI/8QAQRAAAgEDAwIEBQIFAwQDAAAAAQIDAAQRBRIhMQYTQVFhInGBkaGxFDLwFSNCwdHhFlJi8QcXcpKisiQzguL/xAAaAQEAAwEBAQAAAAAAAAAAAAAAAgQFAwYB/8QAMREAAgIDAAECBAQFBAMAAAAAAAECAwQRIQUSMRNBUSJhcYEUFTKRoUJSscHR8CP/2gAMAwEAAhEDEQA/AP34AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9k=",
  FARINE: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHCAkIBgoJCAkMCwoMDxoRDw4ODx8WGBMaJSEnJiQhJCMpLjsyKSw4LCMkM0Y0OD0/QkNCKDFITUhATTtBQj//2wBDAQsMDA8NDx4RER4/KiQqPz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz//wAARCAH0AfQDASIAAhEBAxEB/8QAHAAAAgIDAQEAAAAAAAAAAAAABAUDBgcCAQAI/8QAQhAAAQMDAgQEAwUFBQcFAAAAAQIDBAAFEQYhEjFBUQcTImEUcYEjMpGh0RVCUpKxQ2LB4RYzcoLwJTVTouLxCP/EABkBAAMBAQEAAAAAAAAAAAAAAAABAgMEBf/EACERAQEBAAICAgMBAQAAAAAAAAABAhESITEDQRMiUWFx/9oADAMBAAIRAxEAPwD9ZgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9k=",
  HUILE: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHCAkIBgoJCAkMCwoMDxoRDw4ODx8WGBMaJSEnJiQhJCMpLjsyKSw4LCMkM0Y0OD0/QkNCKDFITUhATTtBQj//2wBDAQsMDA8NDx4RER4/KiQqPz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz//wAARCAJnAfQDASIAAhEBAxEB/8QAHAABAAIDAQEBAAAAAAAAAAAAAAQFAQIDBgcI/8QASxAAAgEDAwEGAwQIBAUCBAQHAQIDAAQRBRIhMQYTQVFhFCJxkTKBkqHRFSNCUlNTVGKSscHR8CQzYzSCJUNykqIWo7Kz0uHwFyb/xAAaAQEAAwEBAQAAAAAAAAAAAAAAAgQFAwYB/8QANREAAgIBAwIEBQIFAwYAAAAAAAECAwQRIQUSMRNBUSJhcYEUFTKRoUJSscHR8CP/2gAMAwEAAhEDEQA/AP34AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9k=",
  CHICKEN: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHCAkIBgoJCAkMCwoMDxoRDw4ODx8WGBMaJSEnJiQhJCMpLjsyKSw4LCMkM0Y0OD0/QkNCKDFITUhATTtBQj//2wBDAQsMDA8NDx4RER4/KiQqPz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz//wAARCAKHAfQDASIAAhEBAxEB/8QAGwABAAMBAQEBAAAAAAAAAAAAAAIDBAEFBgf/xAA3EAACAgEDAwMDAgMAAQMCBwAAAQIDBBEFEiExBkFREyJhcRSBkQcVI6EyQlLB0eAkYnL/xAAYAQEBAQEBAAAAAAAAAAAAAAAAAQIDBP/EACERAQEBAAICAgMBAQAAAAAAAAABAhESITEDQRMiUWFx/9oADAMBAAIRAxEAPwD9ZgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9k=",
};

const CATEGORY_IMAGES: Record<string, string> = {
  "Viandes": IMG.RAW_MEAT,
  "Légumes": IMG.VEG_SHELF,
  "Épicerie": IMG.GROCERY_SHELF,
  "Produits laitiers": IMG.DAIRY,
};
const DEFAULT_CATEGORY_IMAGE = IMG.GROCERY_SHELF;

const ZONES = ["Cuisine", "Salle", "Cafétéria", "Terrasse"];

const consumptionData: Record<AnalysesPeriod, { labels: string[]; values: number[]; totalLabel: string; total: string }> = {
  jour: { labels: ["08h", "10h", "12h", "14h", "16h", "18h", "20h"], values: [30, 55, 90, 65, 40, 78, 92], totalLabel: "Consommation du jour", total: "18.4 kg" },
  semaine: { labels: ["L", "M", "M", "J", "V", "S", "D"], values: [62, 74, 55, 88, 95, 100, 82], totalLabel: "Consommation de la semaine", total: "126 kg" },
  mois: { labels: ["S1", "S2", "S3", "S4"], values: [70, 85, 60, 95], totalLabel: "Consommation du mois", total: "512 kg" },
};

/* Estimation du prix unitaire par catégorie, utilisée uniquement pour l'affichage
   de la "valeur à risque" dans la section Expirations (donnée non stockée ailleurs). */
const CATEGORY_UNIT_PRICE: Record<string, number> = {
  Viandes: 1800,
  Légumes: 250,
  Épicerie: 450,
  "Produits laitiers": 320,
};
const estimateUnitPrice = (category: string) => CATEGORY_UNIT_PRICE[category] ?? 400;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function MagasinierPage({ onBack }: { onBack: () => void }) {
  /* ---------------- core data ---------------- */
  const [categories, setCategories] = useState<Category[]>([
    { id: "c1", name: "Viandes", image: IMG.RAW_MEAT },
    { id: "c2", name: "Légumes", image: IMG.VEG_SHELF },
    { id: "c3", name: "Épicerie", image: IMG.GROCERY_SHELF },
    { id: "c4", name: "Produits laitiers", image: IMG.DAIRY },
  ]);
  const [units, setUnits] = useState<UnitDef[]>([
    { id: "u1", name: "Kilogramme", symbol: "kg", type: "Masse" },
    { id: "u2", name: "Litre", symbol: "L", type: "Volume" },
    { id: "u3", name: "Unité", symbol: "U", type: "Comptage" },
  ]);
  const [items, setItems] = useState<StockItem[]>([
    { id: "st1", name: "Tomates fraîches", category: "Légumes", quantity: 3, minStock: 5, alertThreshold: 5, manufactureDate: "2026-06-28", expiry: "2026-07-08", unit: "kg", image: IMG.TOMATOES, createdAt: "2026-06-28" },
    { id: "st2", name: "Farine T55", category: "Épicerie", quantity: 0, minStock: 10, alertThreshold: 15, manufactureDate: "2026-05-20", expiry: "2026-08-01", unit: "kg", image: IMG.FARINE, createdAt: "2026-05-20" },
    { id: "st3", name: "Huile d'olive", category: "Épicerie", quantity: 0, minStock: 5, alertThreshold: 8, manufactureDate: "2026-01-10", expiry: "2027-04-10", unit: "L", image: IMG.HUILE, createdAt: "2026-01-10" },
    { id: "st4", name: "Poulet entier", category: "Viandes", quantity: 12, minStock: 5, alertThreshold: 7, manufactureDate: "2026-06-30", expiry: "2026-07-06", unit: "kg", image: IMG.CHICKEN, createdAt: "2026-06-30" },
    { id: "st5", name: "Crème liquide 35%", category: "Produits laitiers", quantity: 8, minStock: 4, alertThreshold: 6, manufactureDate: "2026-06-25", expiry: "2026-07-07", unit: "L", image: IMG.DAIRY, createdAt: "2026-06-25" },
    { id: "st6", name: "Fromage de chèvre frais", category: "Produits laitiers", quantity: 6, minStock: 3, alertThreshold: 5, manufactureDate: "2026-06-27", expiry: "2026-07-10", unit: "kg", image: IMG.DAIRY, createdAt: "2026-06-27" },
  ]);
  const [movements, setMovements] = useState<StockMovement[]>([
    { id: uid("mv"), itemId: "st4", itemName: "Poulet entier", type: "Entrée", quantity: 12, unit: "kg", date: "2026-06-30", note: "Livraison fournisseur", groupId: "grp-init1" },
    { id: uid("mv"), itemId: "st1", itemName: "Tomates fraîches", type: "Sortie", quantity: 2, unit: "kg", date: "2026-07-01", note: "Utilisation cuisine", reason: "Cuisine", sourceType: "article", zone: "Cuisine" },
  ]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: "sp1", name: "Minoterie Sétif", contact: "M. Lakhdar", phone: "+213 660 111 222", email: "contact@minoterie-setif.dz", address: "Zone Industrielle, Sétif", city: "Sétif" },
    { id: "sp2", name: "Ifri Distribution", contact: "Mme. Salma", phone: "+213 670 333 444", email: "salma@ifri-distrib.dz", address: "Route Nationale 12, Béjaïa", city: "Béjaïa" },
    { id: "sp3", name: "Marché Ain Abid", contact: "M. Kamel", phone: "+213 550 987 654", email: "kamel@marche-ainabid.dz", address: "Marché de gros, Constantine", city: "Constantine" },
  ]);
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);

  /* ---------------- kitchen equipment (vaisselle, couverts, ustensiles) ---------------- */
  const [equipment, setEquipment] = useState<KitchenEquipment[]>([
    { id: "eq1", name: "Assiettes plates", type: "Vaisselle", quantity: 120, condition: "Bon état" },
    { id: "eq2", name: "Assiettes creuses", type: "Vaisselle", quantity: 80, condition: "Bon état" },
    { id: "eq3", name: "Verres à eau", type: "Vaisselle", quantity: 150, condition: "Bon état" },
    { id: "eq4", name: "Fourchettes", type: "Couverts", quantity: 200, condition: "Bon état" },
    { id: "eq5", name: "Couteaux de table", type: "Couverts", quantity: 180, condition: "Endommagé" },
    { id: "eq6", name: "Cuillères à soupe", type: "Couverts", quantity: 200, condition: "Bon état" },
    { id: "eq7", name: "Casseroles", type: "Ustensiles de cuisine", quantity: 15, condition: "Bon état" },
    { id: "eq8", name: "Poêles", type: "Ustensiles de cuisine", quantity: 10, condition: "Manquant" },
    { id: "eq9", name: "Robot mixeur", type: "Électroménager", quantity: 2, condition: "Bon état" },
  ]);
  const [equipmentModal, setEquipmentModal] = useState<{ mode: "create" | "edit"; item?: KitchenEquipment } | null>(null);
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState("Tous les types");

  /* ---------------- ui state ---------------- */
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [now, setNow] = useState(new Date());
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("Toutes catégories");
  const [analysesPeriod, setAnalysesPeriod] = useState<AnalysesPeriod>("semaine");
  const [docPreview, setDocPreview] = useState<{ name: string; url: string } | null>(null);
  const [categoriesTab, setCategoriesTab] = useState<"categories" | "materiel">("categories");
  const [sortiesTab, setSortiesTab] = useState<"tous" | "article" | "materiel">("tous");
  const [sortieViewId, setSortieViewId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [denseMode, setDenseMode] = useState(false);
  const [articlesView, setArticlesView] = useState<"grid" | "list">("grid");
  const [exportModal, setExportModal] = useState<{ scope: "entrees" | "sorties" } | null>(null);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");

  /* ---------------- expirations state ---------------- */
  const [expirationSearch, setExpirationSearch] = useState("");
  const [expirationUrgencyFilter, setExpirationUrgencyFilter] = useState<"Tous" | ExpirationUrgency | "Expiré">("Tous");
  const [expirationHistoryOpen, setExpirationHistoryOpen] = useState(false);
  const [lossHistory, setLossHistory] = useState<LossHistoryEntry[]>([
    { id: uid("lh"), itemName: "Yaourts nature", date: "2026-06-20", action: "Don association", quantity: 4, unit: "kg", valueSaved: 1280 },
    { id: uid("lh"), itemName: "Pain de mie", date: "2026-06-18", action: "Déstockage -30%", quantity: 6, unit: "U", valueSaved: 540 },
  ]);

  /* ---------------- modal state ---------------- */
  const [articleModal, setArticleModal] = useState<{ mode: "create" | "edit"; item?: StockItem } | null>(null);
  const [sortieModal, setSortieModal] = useState(false);
  const [sortieSourceType, setSortieSourceType] = useState<"article" | "materiel">("article");
  const [entreeModal, setEntreeModal] = useState(false);
  const [entreeViewKey, setEntreeViewKey] = useState<string | null>(null);
  const [entreeEditGroupKey, setEntreeEditGroupKey] = useState<string | null>(null);
  const [categoryModal, setCategoryModal] = useState<{ mode: "create" | "edit"; item?: Category } | null>(null);
  const [unitModal, setUnitModal] = useState<{ mode: "create" | "edit"; item?: UnitDef } | null>(null);
  const [supplierModal, setSupplierModal] = useState<{ mode: "create" | "edit"; item?: Supplier } | null>(null);
  const [unitsExpanded, setUnitsExpanded] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const notify = (message: string) => setToast(message);

  const logoutMutation = useLogout();

  const handleLogout = () => {
    if (window.confirm("Voulez-vous vraiment vous déconnecter ?")) {
      logoutMutation.mutate(undefined, {
        onSettled: () => {
          notify("Déconnexion réussie");
          onBack();
        },
      });
    }
  };

  const alertCount = useMemo(() => items.filter((item) => item.quantity <= item.alertThreshold).length, [items]);
  const ruptureItems = useMemo(() => items.filter((item) => item.quantity === 0), [items]);
  const nearRuptureItems = useMemo(() => items.filter((item) => item.quantity > 0 && item.quantity <= item.alertThreshold), [items]);

  const daysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const expiredItems = useMemo(() => items.filter((item) => item.expiry && daysUntil(item.expiry) < 0 && item.quantity > 0), [items]);

  const soonExpiringItems = useMemo(
    () => items.filter((item) => item.expiry && item.quantity > 0 && daysUntil(item.expiry) >= 0 && daysUntil(item.expiry) <= 7),
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "Toutes catégories" || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, filterCategory]);

  const equipmentTypes = useMemo(() => {
    const set = new Set(equipment.map((e) => e.type));
    return ["Tous les types", ...Array.from(set)];
  }, [equipment]);

  const filteredEquipment = useMemo(() => {
    return equipment.filter((eq) => equipmentTypeFilter === "Tous les types" || eq.type === equipmentTypeFilter);
  }, [equipment, equipmentTypeFilter]);

  const mostConsumed = [
    ["Poulet entier", "8.5 kg"],
    ["Tomates fraîches", "6.2 kg"],
    ["Huile de tournesol", "4.1 L"],
    ["Farine T55", "3.8 kg"],
  ];
  const leastConsumed = [
    ["Vinaigre blanc", "0.3 L"],
    ["Clous de girofle", "0.1 kg"],
    ["Sel fin", "0.6 kg"],
    ["Levure boulangère", "0.2 kg"],
  ];

  /* ------------------------------------------------------------------ */
  /* Dashboard — visuels agrégés                                         */
  /* ------------------------------------------------------------------ */

  const stockStatusCounts = useMemo(() => {
    const rupture = ruptureItems.length;
    const alerte = nearRuptureItems.length;
    const bon = Math.max(0, items.length - rupture - alerte);
    return { rupture, alerte, bon };
  }, [items, ruptureItems, nearRuptureItems]);

  const categoryBreakdown = useMemo(
    () => categories.map((cat) => ({ name: cat.name, count: items.filter((i) => i.category === cat.name).length })),
    [categories, items]
  );
  const maxCategoryCount = Math.max(1, ...categoryBreakdown.map((c) => c.count));

  /* Valeur du stock par catégorie — utilisée pour l'unique graphe du tableau de bord */
  const stockValueByCategory = useMemo(
    () =>
      categories.map((cat) => {
        const catItems = items.filter((i) => i.category === cat.name);
        const totalQty = catItems.reduce((sum, i) => sum + i.quantity, 0);
        const totalValue = catItems.reduce((sum, i) => sum + i.quantity * estimateUnitPrice(i.category), 0);
        return { name: cat.name, totalQty, totalValue };
      }),
    [categories, items]
  );
  const maxStockValue = Math.max(1, ...stockValueByCategory.map((c) => c.totalValue));
  const totalStockValue = useMemo(() => stockValueByCategory.reduce((sum, c) => sum + c.totalValue, 0), [stockValueByCategory]);

  /* ------------------------------------------------------------------ */
  /* Expirations — logique métier                                       */
  /* ------------------------------------------------------------------ */

  const urgencyOf = (item: StockItem): ExpirationUrgency | "Expiré" | null => {
    if (!item.expiry || item.quantity <= 0) return null;
    const remaining = daysUntil(item.expiry);
    if (remaining < 0) return "Expiré";
    if (remaining <= 1) return "Critique";
    if (remaining <= 3) return "Imminent";
    if (remaining <= 7) return "À surveiller";
    return null;
  };

  const urgencyBadgeColor = (urgency: ExpirationUrgency | "Expiré"): "red" | "orange" | "gray" =>
    urgency === "Expiré" || urgency === "Critique" ? "red" : urgency === "Imminent" ? "orange" : "gray";

  const expirationRows = useMemo(() => {
    return items
      .map((item) => ({ item, urgency: urgencyOf(item) }))
      .filter((row): row is { item: StockItem; urgency: ExpirationUrgency | "Expiré" } => row.urgency !== null)
      .map((row) => ({
        ...row,
        remainingDays: daysUntil(row.item.expiry),
        valueAtRisk: row.item.quantity * estimateUnitPrice(row.item.category),
      }))
      .sort((a, b) => a.remainingDays - b.remainingDays);
  }, [items]);

  const filteredExpirationRows = useMemo(() => {
    return expirationRows.filter((row) => {
      const matchesSearch = row.item.name.toLowerCase().includes(expirationSearch.toLowerCase());
      const matchesUrgency = expirationUrgencyFilter === "Tous" || row.urgency === expirationUrgencyFilter;
      return matchesSearch && matchesUrgency;
    });
  }, [expirationRows, expirationSearch, expirationUrgencyFilter]);

  const totalValueAtRisk = useMemo(() => expirationRows.reduce((sum, row) => sum + row.valueAtRisk, 0), [expirationRows]);
  const criticalCount = useMemo(() => expirationRows.filter((row) => row.urgency === "Critique" || row.urgency === "Expiré").length, [expirationRows]);
  const lossesAvoidedMonth = useMemo(() => lossHistory.reduce((sum, entry) => sum + entry.valueSaved, 0), [lossHistory]);

  /* ---------------- article handlers ---------------- */

  const [articleImage, setArticleImage] = useState<string | null>(null);
  const openCreateArticle = () => {
    setArticleImage(null);
    setArticleModal({ mode: "create" });
  };
  const openEditArticle = (item: StockItem) => {
    setArticleImage(item.image ?? null);
    setArticleModal({ mode: "edit", item });
  };

  const submitArticle = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: StockItem = {
      id: articleModal?.item?.id ?? uid("st"),
      name: String(form.get("name") || ""),
      category: String(form.get("category") || categories[0]?.name || ""),
      unit: String(form.get("unit") || units[0]?.symbol || ""),
      quantity: Number(form.get("quantity") || 0),
      minStock: Number(form.get("minStock") || 0),
      alertThreshold: Number(form.get("alertThreshold") || 0),
      manufactureDate: String(form.get("manufactureDate") || ""),
      expiry: String(form.get("expiry") || ""),
      image: articleImage ?? articleModal?.item?.image,
      createdAt: articleModal?.item?.createdAt ?? new Date().toISOString().slice(0, 10),
      previousStatus: articleModal?.item?.previousStatus, // conservé
    };
    if (articleModal?.mode === "edit") {
      const oldItem = items.find(it => it.id === payload.id);
      if (oldItem) {
        // déterminer l'ancien statut
        const oldStatus = oldItem.quantity === 0 ? "rupture" : oldItem.quantity <= oldItem.alertThreshold ? "alerte" : "bon";
        const newStatus = payload.quantity === 0 ? "rupture" : payload.quantity <= payload.alertThreshold ? "alerte" : "bon";
        payload.previousStatus = oldStatus; // pour animation
        // mettre à jour
        setItems((prev) => prev.map((it) => (it.id === payload.id ? payload : it)));
        notify(`Article "${payload.name}" modifié`);
      } else {
        setItems((prev) => prev.map((it) => (it.id === payload.id ? payload : it)));
        notify(`Article "${payload.name}" modifié`);
      }
    } else {
      setItems((prev) => [...prev, payload]);
      notify(`Article "${payload.name}" créé`);
    }
    setArticleModal(null);
  };

  const deleteArticle = (item: StockItem) => {
    if (!window.confirm(`Supprimer l'article "${item.name}" ?`)) return;
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    notify(`Article "${item.name}" supprimé`);
  };

  /* ---------------- entrées (réception de marchandise) ---------------- */

  interface EntreeLine {
    lineId: string;
    itemId: string;
    quantity: number;
  }

  const [entreeLines, setEntreeLines] = useState<EntreeLine[]>([{ lineId: uid("ln"), itemId: items[0]?.id ?? "", quantity: 0 }]);
  const [entreeDoc, setEntreeDoc] = useState<{ name: string; url: string } | null>(null);

  interface EntreeEditLine {
    lineId: string;
    itemId: string;
    quantity: number;
  }

  const [entreeEditLines, setEntreeEditLines] = useState<EntreeEditLine[]>([]);
  const [entreeEditDate, setEntreeEditDate] = useState("");
  const [entreeEditNote, setEntreeEditNote] = useState("");
  const [entreeEditDoc, setEntreeEditDoc] = useState<{ name: string; url: string } | null>(null);

  const openEntreeModal = () => {
    setEntreeLines([{ lineId: uid("ln"), itemId: items[0]?.id ?? "", quantity: 0 }]);
    setEntreeDoc(null);
    setEntreeModal(true);
  };

  const addEntreeLine = () => {
    setEntreeLines((prev) => [...prev, { lineId: uid("ln"), itemId: items[0]?.id ?? "", quantity: 0 }]);
  };

  const removeEntreeLine = (lineId: string) => {
    setEntreeLines((prev) => (prev.length > 1 ? prev.filter((l) => l.lineId !== lineId) : prev));
  };

  const updateEntreeLine = (lineId: string, field: "itemId" | "quantity", value: string) => {
    setEntreeLines((prev) =>
      prev.map((l) => (l.lineId === lineId ? { ...l, [field]: field === "quantity" ? Number(value) : value } : l))
    );
  };

  const submitEntree = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = String(form.get("date") || new Date().toISOString().slice(0, 10));
    const supplierId = String(form.get("supplierId") || "");
    const note = String(form.get("note") || "");
    const supplier = suppliers.find((s) => s.id === supplierId);

    const validLines = entreeLines.filter((l) => l.itemId && l.quantity > 0);
    if (validLines.length === 0) {
      notify("Ajoutez au moins un article avec une quantité.");
      return;
    }

    const groupId = uid("grp");

    // Mise à jour du stock avec transition de statut
    setItems((prev) =>
      prev.map((it) => {
        const total = validLines.filter((l) => l.itemId === it.id).reduce((sum, l) => sum + l.quantity, 0);
        if (total > 0) {
          const oldQty = it.quantity;
          const newQty = oldQty + total;
          const oldStatus = oldQty === 0 ? "rupture" : oldQty <= it.alertThreshold ? "alerte" : "bon";
          const newStatus = newQty === 0 ? "rupture" : newQty <= it.alertThreshold ? "alerte" : "bon";
          return { ...it, quantity: newQty, previousStatus: oldStatus !== newStatus ? oldStatus : undefined };
        }
        return it;
      })
    );

    const newMovements: StockMovement[] = validLines.map((line) => {
      const target = items.find((it) => it.id === line.itemId);
      return {
        id: uid("mv"),
        itemId: line.itemId,
        itemName: target?.name ?? "",
        type: "Entrée",
        quantity: line.quantity,
        unit: target?.unit ?? "",
        date,
        note: note || (supplier ? `Réception ${supplier.name}` : undefined),
        documentName: entreeDoc?.name,
        documentUrl: entreeDoc?.url,
        groupId,
      };
    });

    setMovements((prev) => [...newMovements, ...prev]);
    notify(`Réception enregistrée : ${validLines.length} article${validLines.length > 1 ? "s" : ""}`);
    setEntreeModal(false);
    setEntreeDoc(null);
  };

  const openEditEntree = (group: { key: string; movs: StockMovement[]; date: string; note?: string; documentName?: string; documentUrl?: string }) => {
    setEntreeEditGroupKey(group.key);
    setEntreeEditDate(group.date);
    setEntreeEditNote(group.note ?? "");
    setEntreeEditDoc(group.documentUrl ? { name: group.documentName ?? "Bon de commande", url: group.documentUrl } : null);
    setEntreeEditLines(group.movs.map((m) => ({ lineId: uid("ln"), itemId: m.itemId, quantity: m.quantity })));
  };

  const addEditEntreeLine = () => {
    setEntreeEditLines((prev) => [...prev, { lineId: uid("ln"), itemId: items[0]?.id ?? "", quantity: 0 }]);
  };

  const removeEditEntreeLine = (lineId: string) => {
    setEntreeEditLines((prev) => (prev.length > 1 ? prev.filter((l) => l.lineId !== lineId) : prev));
  };

  const updateEditEntreeLine = (lineId: string, field: "itemId" | "quantity", value: string) => {
    setEntreeEditLines((prev) =>
      prev.map((l) => (l.lineId === lineId ? { ...l, [field]: field === "quantity" ? Number(value) : value } : l))
    );
  };

  const submitEditEntree = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!entreeEditGroupKey) return;
    const form = new FormData(event.currentTarget);
    const date = String(form.get("date") || entreeEditDate);
    const note = String(form.get("note") || "");

    const validLines = entreeEditLines.filter((l) => l.itemId && l.quantity > 0);
    if (validLines.length === 0) {
      notify("Ajoutez au moins un article avec une quantité.");
      return;
    }

    const groupKey = entreeEditGroupKey;

    setItems((prev) =>
      prev.map((it) => {
        const oldTotal = movements
          .filter((m) => (m.groupId ?? m.id) === groupKey && m.itemId === it.id)
          .reduce((sum, m) => sum + m.quantity, 0);
        const newTotal = validLines.filter((l) => l.itemId === it.id).reduce((sum, l) => sum + l.quantity, 0);
        const diff = newTotal - oldTotal;
        if (diff !== 0) {
          const oldQty = it.quantity;
          const newQty = Math.max(0, oldQty + diff);
          const oldStatus = oldQty === 0 ? "rupture" : oldQty <= it.alertThreshold ? "alerte" : "bon";
          const newStatus = newQty === 0 ? "rupture" : newQty <= it.alertThreshold ? "alerte" : "bon";
          return { ...it, quantity: newQty, previousStatus: oldStatus !== newStatus ? oldStatus : undefined };
        }
        return it;
      })
    );

    setMovements((prev) => {
      const withoutGroup = prev.filter((m) => (m.groupId ?? m.id) !== groupKey);
      const newMovements: StockMovement[] = validLines.map((line) => {
        const target = items.find((it) => it.id === line.itemId);
        return {
          id: uid("mv"),
          itemId: line.itemId,
          itemName: target?.name ?? "",
          type: "Entrée",
          quantity: line.quantity,
          unit: target?.unit ?? "",
          date,
          note: note || undefined,
          documentName: entreeEditDoc?.name,
          documentUrl: entreeEditDoc?.url,
          groupId: groupKey,
        };
      });
      return [...newMovements, ...withoutGroup];
    });

    notify("Réception modifiée");
    setEntreeEditGroupKey(null);
  };

  /* ---------------- sorties (cuisine / perte, articles ou matériel) ---------------- */

  const openSortieModal = () => {
    setSortieSourceType("article");
    setSortieModal(true);
  };

  const submitSortie = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const sourceType = (String(form.get("sourceType") || "article") as "article" | "materiel");
    const itemId = String(form.get("itemId"));
    const qty = Number(form.get("quantity") || 0);
    const reason = String(form.get("reason") || (sourceType === "materiel" ? "Casse" : "Cuisine"));
    const zone = String(form.get("zone") || "Cuisine");
    const note = String(form.get("note") || "");
    const date = new Date().toISOString().slice(0, 10);

    if (sourceType === "materiel") {
      const target = equipment.find((eq) => eq.id === itemId);
      setEquipment((prev) => prev.map((eq) => (eq.id === itemId ? { ...eq, quantity: Math.max(0, eq.quantity - qty) } : eq)));
      setMovements((prev) => [
        { id: uid("mv"), itemId, itemName: target?.name ?? "", type: "Sortie", quantity: qty, unit: "unité(s)", date, reason, zone, note, sourceType: "materiel" },
        ...prev,
      ]);
      notify(`Sortie de ${qty} unité(s) enregistrée pour "${target?.name}" (${zone})`);
    } else {
      const target = items.find((it) => it.id === itemId);
      setItems((prev) =>
        prev.map((it) => {
          if (it.id === itemId) {
            const oldQty = it.quantity;
            const newQty = Math.max(0, oldQty - qty);
            const oldStatus = oldQty === 0 ? "rupture" : oldQty <= it.alertThreshold ? "alerte" : "bon";
            const newStatus = newQty === 0 ? "rupture" : newQty <= it.alertThreshold ? "alerte" : "bon";
            return { ...it, quantity: newQty, previousStatus: oldStatus !== newStatus ? oldStatus : undefined };
          }
          return it;
        })
      );
      setMovements((prev) => [
        { id: uid("mv"), itemId, itemName: target?.name ?? "", type: "Sortie", quantity: qty, unit: target?.unit ?? "", date, reason, zone, note, sourceType: "article" },
        ...prev,
      ]);
      notify(`Sortie de ${qty} ${target?.unit ?? ""} enregistrée pour "${target?.name}" (${zone})`);
    }
    setSortieModal(false);
  };

  /* ---------------- category / unit handlers ---------------- */

  const [categoryImage, setCategoryImage] = useState<string | null>(null);

  const submitCategory = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    if (!name) return;
    const image = categoryImage ?? categoryModal?.item?.image;
    if (categoryModal?.mode === "edit" && categoryModal.item) {
      setCategories((prev) => prev.map((c) => (c.id === categoryModal.item!.id ? { ...c, name, image } : c)));
    } else {
      setCategories((prev) => [...prev, { id: uid("cat"), name, image }]);
    }
    notify(`Catégorie "${name}" enregistrée`);
    setCategoryModal(null);
    setCategoryImage(null);
  };

  const deleteCategory = (category: Category) => {
    if (!window.confirm(`Supprimer la catégorie "${category.name}" ?`)) return;
    setCategories((prev) => prev.filter((c) => c.id !== category.id));
    notify(`Catégorie "${category.name}" supprimée`);
  };

  const submitUnit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      symbol: String(form.get("symbol") || ""),
      type: String(form.get("type") || ""),
    };
    if (unitModal?.mode === "edit" && unitModal.item) {
      setUnits((prev) => prev.map((u) => (u.id === unitModal.item!.id ? { ...u, ...payload } : u)));
    } else {
      setUnits((prev) => [...prev, { id: uid("unit"), ...payload }]);
    }
    notify(`Unité "${payload.name}" enregistrée`);
    setUnitModal(null);
  };

  const deleteUnit = (unitDef: UnitDef) => {
    if (!window.confirm(`Supprimer l'unité "${unitDef.name}" ?`)) return;
    setUnits((prev) => prev.filter((u) => u.id !== unitDef.id));
    notify(`Unité "${unitDef.name}" supprimée`);
  };

  /* ---------------- kitchen equipment handlers ---------------- */

  const equipmentConditionColor = (condition: KitchenEquipment["condition"]) =>
    condition === "Bon état" ? "green" : condition === "Endommagé" ? "orange" : "red";

  const equipmentTypeIcon = (type: string): React.ElementType => {
    switch (type) {
      case "Vaisselle":
        return GlassWater;
      case "Couverts":
        return Utensils;
      case "Ustensiles de cuisine":
        return CookingPot;
      case "Électroménager":
        return Refrigerator;
      default:
        return UtensilsCrossed;
    }
  };

  const submitEquipment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: KitchenEquipment = {
      id: equipmentModal?.item?.id ?? uid("eq"),
      name: String(form.get("name") || ""),
      type: String(form.get("type") || "Vaisselle"),
      quantity: Number(form.get("quantity") || 0),
      condition: String(form.get("condition") || "Bon état") as KitchenEquipment["condition"],
    };
    if (equipmentModal?.mode === "edit") {
      setEquipment((prev) => prev.map((e) => (e.id === payload.id ? payload : e)));
      notify(`Matériel "${payload.name}" modifié`);
    } else {
      setEquipment((prev) => [...prev, payload]);
      notify(`Matériel "${payload.name}" ajouté`);
    }
    setEquipmentModal(null);
  };

  const deleteEquipment = (eq: KitchenEquipment) => {
    if (!window.confirm(`Supprimer "${eq.name}" du matériel de cuisine ?`)) return;
    setEquipment((prev) => prev.filter((e) => e.id !== eq.id));
    notify(`Matériel "${eq.name}" supprimé`);
  };

  /* ---------------- alerts / notifications ---------------- */

  const sendAllNotifications = () => {
    const time = new Date().toLocaleString("fr-FR");
    const entries: NotificationEntry[] = [];
    [...ruptureItems, ...nearRuptureItems].forEach((item) => {
      const message = item.quantity === 0 ? `Rupture de stock : "${item.name}"` : `Seuil d'alerte atteint : "${item.name}" (${item.quantity} ${item.unit})`;
      entries.push({ id: uid("ntf"), message, target: "Manager", time });
    });
    if (entries.length === 0) {
      notify("Aucune alerte à notifier pour le moment.");
      return;
    }
    setNotifications((prev) => [...entries, ...prev]);
    notify(`${entries.length} notification${entries.length > 1 ? "s" : ""} envoyée${entries.length > 1 ? "s" : ""} au manager`);
  };

  /* ---------------- suppliers ---------------- */

  const submitSupplier = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Supplier = {
      id: supplierModal?.item?.id ?? uid("sp"),
      name: String(form.get("name") || ""),
      contact: String(form.get("contact") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || ""),
      address: String(form.get("address") || ""),
      city: String(form.get("city") || ""),
    };
    if (supplierModal?.mode === "edit") {
      setSuppliers((prev) => prev.map((s) => (s.id === payload.id ? payload : s)));
      notify(`Fournisseur "${payload.name}" modifié`);
    } else {
      setSuppliers((prev) => [...prev, payload]);
      notify(`Fournisseur "${payload.name}" ajouté`);
    }
    setSupplierModal(null);
  };

  const deleteSupplier = (supplier: Supplier) => {
    if (!window.confirm(`Supprimer le fournisseur "${supplier.name}" ?`)) return;
    setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));
    notify(`Fournisseur "${supplier.name}" supprimé`);
  };

  /* ------------------------------------------------------------------ */
  /* Renderers                                                            */
  /* ------------------------------------------------------------------ */

  // Helper pour obtenir le statut courant et les classes CSS d'animation
  const getStatusInfo = (item: StockItem) => {
    const status = item.quantity === 0 ? "rupture" : item.quantity <= item.alertThreshold ? "alerte" : "bon";
    let pulseClass = "";
    if (status === "alerte") pulseClass = "status-pulse-alerte";
    else if (status === "rupture") pulseClass = "status-pulse-rupture";
    let flashClass = "";
    if (item.previousStatus && item.previousStatus !== status) {
      flashClass = "status-flash";
    }
    return { status, pulseClass, flashClass };
  };

  const renderDashboard = () => {
    const stockStatusData = [
      { name: "Bon", value: stockStatusCounts.bon, color: "var(--green)" },
      { name: "Alerte", value: stockStatusCounts.alerte, color: "var(--orange)" },
      { name: "Rupture", value: stockStatusCounts.rupture, color: "var(--red)" },
    ];
    const donutData = stockValueByCategory.map(cat => ({ name: cat.name, value: Math.round(cat.totalValue) }));

    return (
      <div className="space-y-5">
        {/* Infos importantes en avant */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="t-card rounded-r3 border border-border bg-surface p-4 shadow-card hover:shadow-modal hover:-translate-y-0.5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--blue-soft)] text-blue">
              <Package size={18} />
            </div>
            <p className="text-[1.35rem] font-black text-black">{items.length}</p>
            <div className="flex items-center gap-2">
              <p className="text-[0.8rem] font-extrabold text-black">Articles en stock</p>
              <TrendBadge deltaPercent={dashboardTrends.items} />
            </div>
          </div>
          <div className="t-card rounded-r3 border border-[var(--red-border)] bg-[var(--red-soft)] p-4 shadow-card hover:shadow-modal hover:-translate-y-0.5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--red-soft)] text-[var(--red)]">
              <AlertTriangle size={18} />
            </div>
            <p className="text-[1.35rem] font-black text-black">{ruptureItems.length}</p>
            <div className="flex items-center gap-2">
              <p className="text-[0.8rem] font-extrabold text-black">Ruptures de stock</p>
              <TrendBadge deltaPercent={dashboardTrends.ruptures} />
            </div>
          </div>
          <div className="t-card rounded-r3 border border-[var(--orange-border)] bg-[var(--orange-soft)] p-4 shadow-card hover:shadow-modal hover:-translate-y-0.5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--orange-soft)] text-[var(--orange)]">
              <BellRing size={18} />
            </div>
            <p className="text-[1.35rem] font-black text-black">{alertCount}</p>
            <div className="flex items-center gap-2">
              <p className="text-[0.8rem] font-extrabold text-black">Proches du seuil</p>
              <TrendBadge deltaPercent={dashboardTrends.alertes} />
            </div>
          </div>
          <div className="t-card rounded-r3 border border-[var(--green-soft)] bg-[var(--green-soft)] p-4 shadow-card hover:shadow-modal hover:-translate-y-0.5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--green-soft)] text-[var(--green)]">
              <TrendingUp size={18} />
            </div>
            <p className="text-[1.35rem] font-black text-[var(--green)]">{totalStockValue.toLocaleString("fr-FR")} DA</p>
            <div className="flex items-center gap-2">
              <p className="text-[0.8rem] font-extrabold text-black">Valeur totale du stock</p>
              <TrendBadge deltaPercent={dashboardTrends.value} />
            </div>
          </div>
        </div>

        {/* Graphiques : camembert pour valeur stock, statut stock, etc. */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="t-card rounded-r3 border border-border bg-surface p-4 shadow-card hover:shadow-modal">
            <h2 className="mb-2 text-[0.9rem] font-black text-black">Répartition de la valeur du stock</h2>
            <DonutChart data={donutData} unitLabel="DA" />
          </div>
          <div className="t-card rounded-r3 border border-border bg-surface p-4 shadow-card hover:shadow-modal">
            <h2 className="mb-2 text-[0.9rem] font-black text-black">État du stock</h2>
            <DonutChart data={stockStatusData} unitLabel="articles" />
          </div>
        </div>

        {/* Alertes actives + expirations */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="t-card rounded-r3 border border-border bg-surface p-4 shadow-card hover:shadow-modal">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[0.9rem] font-black text-black">Alertes actives</h2>
              <Badge color="red">Urgent</Badge>
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {ruptureItems.map((item) => {
                const { pulseClass, flashClass } = getStatusInfo(item);
                return (
                  <div key={item.id} className={`t-std flex items-center justify-between rounded-r2 border border-[var(--red-border)] bg-[var(--red-soft)] p-2.5 hover:-translate-y-0.5 hover:shadow-card ${pulseClass} ${flashClass}`}>
                    <div className="min-w-0">
                      <p className="truncate text-[0.82rem] font-extrabold text-black">{item.name}</p>
                      <p className="text-[0.7rem] text-black">0 {item.unit} / min {item.minStock} {item.unit}</p>
                    </div>
                    <Badge color="red">Rupture</Badge>
                  </div>
                );
              })}
              {nearRuptureItems.map((item) => {
                const { pulseClass, flashClass } = getStatusInfo(item);
                return (
                  <div key={item.id} className={`t-std flex items-center justify-between rounded-r2 border border-[var(--orange-border)] bg-[var(--orange-soft)] p-2.5 hover:-translate-y-0.5 hover:shadow-card ${pulseClass} ${flashClass}`}>
                    <div className="min-w-0">
                      <p className="truncate text-[0.82rem] font-extrabold text-black">{item.name}</p>
                      <p className="text-[0.7rem] text-black">{item.quantity} {item.unit} / seuil {item.alertThreshold} {item.unit}</p>
                    </div>
                    <Badge color="orange">Alerte</Badge>
                  </div>
                );
              })}
              {ruptureItems.length === 0 && nearRuptureItems.length === 0 && <p className="text-[0.82rem] text-black">Aucune alerte active.</p>}
            </div>
          </div>

          <div className="t-card rounded-r3 border border-border bg-surface p-4 shadow-card hover:shadow-modal">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[0.9rem] font-black text-black">Expirations proches</h2>
              <SecondaryButton className="!px-2.5 !py-1.5 !text-[0.72rem]" onClick={() => setActiveSection("expirations")}>
                Voir tout
                <ArrowRight size={13} className="t-std group-hover:translate-x-0.5" />
              </SecondaryButton>
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {expiredItems.map((item) => (
                <div key={item.id} className="t-std flex items-center justify-between rounded-r2 border border-[var(--red-border)] bg-[var(--red-soft)] p-2.5 hover:-translate-y-0.5 hover:shadow-card">
                  <div className="flex min-w-0 items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0 text-[var(--red)]" />
                    <div className="min-w-0">
                      <p className="truncate text-[0.82rem] font-extrabold text-black">{item.name}</p>
                      <p className="text-[0.7rem] text-black">Expiré depuis {Math.abs(daysUntil(item.expiry))}j</p>
                    </div>
                  </div>
                  <Badge color="red">Expiré</Badge>
                </div>
              ))}
              {soonExpiringItems.map((item) => {
                const remaining = daysUntil(item.expiry);
                return (
                  <div key={item.id} className="t-std flex items-center justify-between rounded-r2 border border-[var(--orange-border)] bg-[var(--orange-soft)] p-2.5 hover:-translate-y-0.5 hover:shadow-card">
                    <div className="flex min-w-0 items-center gap-2">
                      <Clock3 size={14} className="shrink-0 text-[var(--orange)]" />
                      <div className="min-w-0">
                        <p className="truncate text-[0.82rem] font-extrabold text-black">{item.name}</p>
                        <p className="text-[0.7rem] text-black">Expire dans {remaining}j</p>
                      </div>
                    </div>
                    <Badge color="orange">Bientôt</Badge>
                  </div>
                );
              })}
              {expiredItems.length === 0 && soonExpiringItems.length === 0 && (
                <p className="text-[0.82rem] text-black">Aucun produit expiré ou proche de l'expiration.</p>
              )}
            </div>
          </div>
        </div>

        {/* Tableau stock avec aperçu rapide */}
        <div className="t-card rounded-r3 border border-border bg-surface p-5 shadow-card hover:shadow-modal">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[1rem] font-black text-black">Stock en temps réel</h2>
            <SecondaryButton onClick={() => setActiveSection("articles")}>
              Voir tout
              <ArrowRight size={15} className="t-std group-hover:translate-x-0.5" />
            </SecondaryButton>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[22%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border text-[0.78rem] font-extrabold uppercase tracking-[1px] text-black">
                  <th className="pb-3 pr-4">Article</th>
                  <th className="pb-3 pr-4">Catégorie</th>
                  <th className="pb-3 pr-4">Stock</th>
                  <th className="pb-3 pr-4">Seuil</th>
                  <th className="pb-3 pr-4">Statut</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const { status, pulseClass, flashClass } = getStatusInfo(item);
                  return (
                    <HoverPreview
                      key={item.id}
                      content={
                        <div className="space-y-1">
                          <p className="font-extrabold text-black">{item.name}</p>
                          <p className="text-[0.7rem] text-black/60">Catégorie : {item.category}</p>
                          <p className="text-[0.7rem] text-black/60">Stock : {item.quantity} {item.unit}</p>
                          <p className="text-[0.7rem] text-black/60">Seuil : {item.alertThreshold} {item.unit}</p>
                          <p className="text-[0.7rem] text-black/60">Expire : {item.expiry || "—"}</p>
                        </div>
                      }
                    >
                      <tr className={`t-std border-b border-border/70 text-black hover:bg-surface2 ${pulseClass} ${flashClass}`}>
                        <td className="truncate py-3 pr-4 font-extrabold">
                          <span className="inline-flex items-center gap-2">
                            <span className="truncate">{item.name}</span>
                            {isNewSince(item.createdAt) && <Badge color="blue">Nouveau</Badge>}
                          </span>
                        </td>
                        <td className="truncate py-3 pr-4">{item.category}</td>
                        <td className="py-3 pr-4">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 pr-4">
                          {item.alertThreshold} {item.unit}
                        </td>
                        <td className="py-3 pr-4">
                          {status === "rupture" ? <Badge color="red">Rupture</Badge> :
                            status === "alerte" ? <Badge color="orange">Alerte</Badge> :
                              <Badge color="green">Bon</Badge>}
                        </td>
                      </tr>
                    </HoverPreview>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-black/50">
                      Aucun article en stock.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderArticles = () => {
    const filtered = filteredItems;
    const gridView = articlesView === "grid";

    return (
      <div className="space-y-4">
        <div className="t-card flex flex-wrap items-center justify-between gap-3 rounded-r3 border border-border bg-surface p-4 shadow-card hover:shadow-modal">
          <div>
            <h2 className="text-[1rem] font-black text-black">Gestion des articles</h2>
            <p className="text-[0.8rem] text-black/60">Ajoutez, modifiez et gérez vos références de stock.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 rounded-r2 border border-border bg-surface2 p-1">
              <button
                onClick={() => setArticlesView("grid")}
                className={`t-std rounded-r2 px-2 py-1.5 ${articlesView === "grid" ? "bg-blue text-black" : "text-black/60 hover:text-blue"}`}
                title="Vue grille"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setArticlesView("list")}
                className={`t-std rounded-r2 px-2 py-1.5 ${articlesView === "list" ? "bg-blue text-black" : "text-black/60 hover:text-blue"}`}
                title="Vue liste"
              >
                <List size={16} />
              </button>
            </div>
            <PrimaryButton onClick={openCreateArticle}>
              <Plus size={16} /> Nouvel article
            </PrimaryButton>
          </div>
        </div>

        <div className="t-card rounded-r3 border border-border bg-surface p-4 shadow-card hover:shadow-modal">
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="t-std flex items-center gap-2 rounded-r2 border border-border bg-surface2 px-3 py-2 focus-within:border-blue">
              <Search size={16} className="text-black/50" />
              <input
                className="bg-transparent text-sm outline-none"
                placeholder="Rechercher un article"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select className="t-std rounded-r2 border border-border bg-surface2 px-3 py-2 text-sm outline-none hover:border-blue" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option>Toutes catégories</option>
              {categories.map((c) => (
                <option key={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {gridView ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => {
                const { status, pulseClass, flashClass } = getStatusInfo(item);
                const statusBadge = status === "rupture" ? <Badge color="red">Rupture</Badge> :
                                    status === "alerte" ? <Badge color="orange">Alerte</Badge> :
                                    <Badge color="green">Bon</Badge>;
                return (
                  <div key={item.id} className={`t-card overflow-hidden rounded-r3 border border-border bg-surface shadow-card hover:shadow-modal hover:-translate-y-0.5 ${pulseClass} ${flashClass}`}>
                    <div className="relative h-36 w-full overflow-hidden bg-surface3">
                      <img
                        src={item.image || CATEGORY_IMAGES[item.category] || DEFAULT_CATEGORY_IMAGE}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute right-2 top-2">{statusBadge}</div>
                      {isNewSince(item.createdAt) && (
                        <div className="absolute left-2 top-2">
                          <Badge color="blue">Nouveau</Badge>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-extrabold text-black">{item.name}</p>
                          <p className="text-[0.78rem] font-bold text-black">
                            {item.category} • {item.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[0.82rem]">
                        <span className="font-bold text-black">Stock</span>
                        <span className="font-extrabold text-black">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[0.82rem]">
                        <span className="font-bold text-black">Seuil d'alerte</span>
                        <span className="font-extrabold text-black">
                          {item.alertThreshold} {item.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[0.78rem] font-bold text-black">
                        <span>Fabrication : {item.manufactureDate || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between text-[0.78rem] font-bold text-black">
                        <span>Expire : {item.expiry || "—"}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <SecondaryButton className="flex-1" onClick={() => openEditArticle(item)}>
                          <Pencil size={15} /> Modifier
                        </SecondaryButton>
                        <button className="t-std rounded-r2 border border-[var(--red-border)] px-3 py-2 text-[var(--red)] hover:bg-[var(--red)] hover:text-black" onClick={() => deleteArticle(item)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="col-span-full py-6 text-center font-bold text-black">Aucun article ne correspond à la recherche.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[26%]" />
                  <col className="w-[18%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border text-[0.78rem] font-extrabold uppercase tracking-[1px] text-black">
                    <th className="pb-3 pr-4">Article</th>
                    <th className="pb-3 pr-4">Catégorie</th>
                    <th className="pb-3 pr-4">Stock</th>
                    <th className="pb-3 pr-4">Seuil</th>
                    <th className="pb-3 pr-4">Statut</th>
                    <th className="pb-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const { status, pulseClass, flashClass } = getStatusInfo(item);
                    return (
                      <HoverPreview
                        key={item.id}
                        content={
                          <div className="space-y-1">
                            <p className="font-extrabold text-black">{item.name}</p>
                            <p className="text-[0.7rem] text-black/60">Catégorie : {item.category}</p>
                            <p className="text-[0.7rem] text-black/60">Stock : {item.quantity} {item.unit}</p>
                            <p className="text-[0.7rem] text-black/60">Seuil : {item.alertThreshold} {item.unit}</p>
                            <p className="text-[0.7rem] text-black/60">Expire : {item.expiry || "—"}</p>
                          </div>
                        }
                      >
                        <tr className={`t-std border-b border-border/70 text-black hover:bg-surface2 ${pulseClass} ${flashClass}`}>
                          <td className="truncate py-3 pr-4 font-extrabold">
                            <span className="inline-flex items-center gap-2">
                              <span className="truncate">{item.name}</span>
                              {isNewSince(item.createdAt) && <Badge color="blue">Nouveau</Badge>}
                            </span>
                          </td>
                          <td className="truncate py-3 pr-4">{item.category}</td>
                          <td className="py-3 pr-4">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-3 pr-4">
                            {item.alertThreshold} {item.unit}
                          </td>
                          <td className="py-3 pr-4">
                            {status === "rupture" ? <Badge color="red">Rupture</Badge> :
                              status === "alerte" ? <Badge color="orange">Alerte</Badge> :
                                <Badge color="green">Bon</Badge>}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex gap-2">
                              <button className="t-std rounded-r2 border border-border p-2 hover:border-blue hover:text-blue" onClick={() => openEditArticle(item)}>
                                <Pencil size={15} />
                              </button>
                              <button className="t-std rounded-r2 border border-[var(--red-border)] p-2 text-[var(--red)] hover:bg-[var(--red)] hover:text-black" onClick={() => deleteArticle(item)}>
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </HoverPreview>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-black/50">
                        Aucun article ne correspond à la recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCategoriesTabBlock = () => (
    <div className="flex flex-col items-start gap-5 xl:flex-row">
      <div className="t-card w-full min-w-0 flex-1 rounded-r3 border border-border bg-surface p-5 shadow-card hover:shadow-modal">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[1rem] font-black text-black">Catégories</h2>
          <PrimaryButton onClick={() => { setCategoryImage(null); setCategoryModal({ mode: "create" }); }}>
            <Plus size={16} /> Nouvelle catégorie
          </PrimaryButton>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((category) => (
            <div key={category.id} className="t-std overflow-hidden rounded-r2 border border-border bg-surface2 hover:-translate-y-0.5 hover:border-blue hover:shadow-card">
              <div className="h-44 w-full overflow-hidden bg-surface3">
                <img
                  src={category.image || CATEGORY_IMAGES[category.name] || DEFAULT_CATEGORY_IMAGE}
                  alt={category.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <div>
                  <p className="font-extrabold text-black">{category.name}</p>
                  <p className="text-[0.78rem] text-black/60">{items.filter((i) => i.category === category.name).length} articles</p>
                </div>
                <div className="flex gap-2">
                  <button className="t-std rounded-r2 border border-border p-2 hover:border-blue hover:text-blue" onClick={() => { setCategoryImage(category.image ?? null); setCategoryModal({ mode: "edit", item: category }); }}>
                    <Pencil size={15} />
                  </button>
                  <button className="t-std rounded-r2 border border-[var(--red-border)] p-2 text-[var(--red)] hover:bg-[var(--red)] hover:text-black" onClick={() => deleteCategory(category)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`t-std shrink-0 overflow-hidden rounded-r3 border border-border bg-surface shadow-card transition-all duration-300 ease-in-out hover:shadow-modal ${
          unitsExpanded ? "w-full p-5 xl:w-[340px]" : "w-full p-3 xl:w-16"
        }`}
      >
        {unitsExpanded ? (
          <>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-[1rem] font-black text-black">
                Unités de mesure
                <span className="rounded-full bg-surface3 px-2 py-0.5 text-[0.72rem] font-extrabold text-black/60">{units.length}</span>
              </h2>
              <button
                className="t-std shrink-0 rounded-r2 border border-border p-2 text-black/70 hover:border-blue hover:text-blue"
                onClick={() => setUnitsExpanded(false)}
                title="Réduire le panneau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <PrimaryButton className="mb-4 w-full" onClick={() => setUnitModal({ mode: "create" })}>
              <Plus size={16} /> Nouvelle unité
            </PrimaryButton>
            <div className="space-y-2">
              {units.map((unitDef) => (
                <div key={unitDef.id} className="t-std flex items-center justify-between rounded-r2 border border-border bg-surface2 px-3 py-3 hover:border-blue">
                  <div>
                    <p className="font-extrabold text-black">{unitDef.name}</p>
                    <p className="text-[0.78rem] text-black/60">
                      {unitDef.symbol} • {unitDef.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color="blue">{unitDef.type}</Badge>
                    <button className="t-std rounded-r2 border border-border p-2 hover:border-blue hover:text-blue" onClick={() => setUnitModal({ mode: "edit", item: unitDef })}>
                      <Pencil size={15} />
                    </button>
                    <button className="t-std rounded-r2 border border-[var(--red-border)] p-2 text-[var(--red)] hover:bg-[var(--red)] hover:text-black" onClick={() => deleteUnit(unitDef)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <button
            className="t-std flex w-full flex-col items-center gap-3 py-2 text-black/70 hover:text-blue"
            onClick={() => setUnitsExpanded(true)}
            title="Déplier les unités de mesure"
          >
            <ChevronLeft size={16} />
            <Tags size={18} />
            <span className="rounded-full bg-surface3 px-2 py-0.5 text-[0.7rem] font-extrabold text-black/60">{units.length}</span>
            <span className="[writing-mode:vertical-rl] text-[0.78rem] font-extrabold tracking-wide text-black/70">Unités</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderMaterielTabBlock = () => (
    <div className="t-card rounded-r3 border border-border bg-surface p-5 shadow-card hover:shadow-modal">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--purple-soft)] text-[var(--purple)]">
            <UtensilsCrossed size={18} />
          </div>
          <div>
            <h2 className="text-[1rem] font-black text-black">Matériel de cuisine</h2>
            <p className="text-[0.8rem] text-black/60">Vaisselle, couverts, ustensiles et électroménager — indépendant du stock alimentaire.</p>
          </div>
        </div>
        <PrimaryButton onClick={() => setEquipmentModal({ mode: "create" })}>
          <Plus size={16} /> Nouveau matériel
        </PrimaryButton>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {equipmentTypes.map((type) => {
          const TypeIcon = type === "Tous les types" ? UtensilsCrossed : equipmentTypeIcon(type);
          return (
            <button
              key={type}
              onClick={() => setEquipmentTypeFilter(type)}
              className={`t-std flex items-center gap-1.5 rounded-r2 border px-3 py-1.5 text-[0.78rem] font-extrabold ${
                equipmentTypeFilter === type ? "border-blue bg-blue text-black" : "border-border bg-surface2 text-black/60 hover:border-blue hover:text-blue"
              }`}
            >
              <TypeIcon size={14} />
              {type}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredEquipment.map((eq) => {
          const EqIcon = equipmentTypeIcon(eq.type);
          return (
          <div key={eq.id} className="t-std rounded-r2 border border-border bg-surface2 p-4 hover:-translate-y-0.5 hover:border-blue hover:shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--purple-soft)] text-[var(--purple)]">
                <EqIcon size={18} />
              </div>
              <Badge color={equipmentConditionColor(eq.condition)}>{eq.condition}</Badge>
            </div>
            <p className="font-extrabold text-black">{eq.name}</p>
            <p className="mb-3 text-[0.78rem] font-bold text-black/60">{eq.type}</p>
            <div className="flex items-center justify-between text-[0.82rem]">
              <span className="font-bold text-black">Quantité</span>
              <span className="font-extrabold text-black">{eq.quantity}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <SecondaryButton className="flex-1" onClick={() => setEquipmentModal({ mode: "edit", item: eq })}>
                <Pencil size={15} /> Modifier
              </SecondaryButton>
              <button
                className="t-std rounded-r2 border border-[var(--red-border)] px-3 py-2 text-[var(--red)] hover:bg-[var(--red)] hover:text-black"
                onClick={() => deleteEquipment(eq)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          );
        })}
        {filteredEquipment.length === 0 && (
          <p className="col-span-full py-6 text-center font-bold text-black/50">Aucun matériel ne correspond à ce filtre.</p>
        )}
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className="space-y-5">
      <div className="t-card inline-flex w-fit items-center gap-1 rounded-r3 border border-border bg-surface p-1.5 shadow-card hover:shadow-modal">
        <button
          onClick={() => setCategoriesTab("categories")}
          className={`t-std flex items-center gap-2 rounded-r2 px-4 py-2 text-[0.85rem] font-extrabold ${
            categoriesTab === "categories" ? "bg-blue text-black" : "text-black/60 hover:text-blue"
          }`}
        >
          <Tags size={16} /> Catégories
        </button>
        <button
          onClick={() => setCategoriesTab("materiel")}
          className={`t-std flex items-center gap-2 rounded-r2 px-4 py-2 text-[0.85rem] font-extrabold ${
            categoriesTab === "materiel" ? "bg-blue text-black" : "text-black/60 hover:text-blue"
          }`}
        >
          <UtensilsCrossed size={16} /> Matériel
        </button>
      </div>

      {categoriesTab === "categories" ? renderCategoriesTabBlock() : renderMaterielTabBlock()}
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-4">
      <div className="t-card flex flex-wrap items-center justify-between gap-3 rounded-r3 border border-border bg-surface p-4 shadow-card hover:shadow-modal">
        <p className="text-[0.85rem] font-semibold text-black/70">Prévenir le manager de toutes les alertes en cours ({ruptureItems.length + nearRuptureItems.length}).</p>
        <PrimaryButton onClick={sendAllNotifications}>
          <BellRing size={16} /> Notifier le manager
        </PrimaryButton>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="t-card rounded-r3 border border-[var(--red-border)] bg-[var(--red-soft)] p-4 shadow-card hover:shadow-modal hover:-translate-y-0.5">
          <p className="text-[1.1rem] font-black text-[var(--red)]">{ruptureItems.length} rupture{ruptureItems.length > 1 ? "s" : ""}</p>
          <p className="text-[0.8rem] text-black/60">Articles à réapprovisionner immédiatement</p>
        </div>
        <div className="t-card rounded-r3 border border-[var(--orange-border)] bg-[var(--orange-soft)] p-4 shadow-card hover:shadow-modal hover:-translate-y-0.5">
          <p className="text-[1.1rem] font-black text-[var(--orange)]">{alertCount} seuils</p>
          <p className="text-[0.8rem] text-black/60">Articles proches du niveau d'alerte</p>
        </div>
      </div>

      <div className="t-card rounded-r3 border border-border bg-surface p-5 shadow-card hover:shadow-modal">
        <h2 className="mb-4 text-[1rem] font-black text-black">Ruptures de stock</h2>
        <div className="space-y-3">
          {ruptureItems.map((item) => {
            const { pulseClass, flashClass } = getStatusInfo(item);
            return (
              <div key={item.id} className={`t-std flex flex-wrap items-center justify-between gap-3 rounded-r2 border border-[var(--red-border)] bg-[var(--red-soft)] p-3 hover:-translate-y-0.5 hover:shadow-card ${pulseClass} ${flashClass}`}>
                <div>
                  <p className="font-extrabold text-black">{item.name}</p>
                  <p className="text-[0.78rem] text-black/60">Stock : 0 {item.unit} • Min : {item.minStock} {item.unit}</p>
                </div>
                <Badge color="red">Rupture</Badge>
              </div>
            );
          })}
          {ruptureItems.length === 0 && <p className="text-[0.85rem] text-black/50">Aucune rupture en cours.</p>}
        </div>
      </div>

      <div className="t-card rounded-r3 border border-border bg-surface p-5 shadow-card hover:shadow-modal">
        <h2 className="mb-4 text-[1rem] font-black text-black">Proches de la rupture</h2>
        <div className="space-y-3">
          {nearRuptureItems.map((item) => {
            const { pulseClass, flashClass } = getStatusInfo(item);
            return (
              <div key={item.id} className={`t-std flex flex-wrap items-center justify-between gap-3 rounded-r2 border border-[var(--orange-border)] bg-[var(--orange-soft)] p-3 hover:-translate-y-0.5 hover:shadow-card ${pulseClass} ${flashClass}`}>
                <div>
                  <p className="font-extrabold text-black">{item.name}</p>
                  <p className="text-[0.78rem] text-black/60">Stock : {item.quantity} {item.unit} • Seuil : {item.alertThreshold} {item.unit}</p>
                </div>
                <div className="w-36">
                  <div className="h-2 rounded-full bg-white">
                    <div className="t-std h-2 rounded-full bg-[var(--orange)]" style={{ width: `${Math.min(100, (item.quantity / item.alertThreshold) * 100)}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
          {nearRuptureItems.length === 0 && <p className="text-[0.85rem] text-black/50">Aucun article proche du seuil.</p>}
        </div>
      </div>

      <div className="t-card rounded-r3 border border-border bg-surface p-5 shadow-card hover:shadow-modal">
        <h2 className="mb-4 text-[1rem] font-black text-black">Notifications envoyées</h2>
        <div className="space-y-2">
          {notifications.length === 0 && <p className="text-[0.85rem] text-black/50">Aucune notification envoyée pour le moment.</p>}
          {notifications.slice(0, 10).map((n) => (
            <div key={n.id} className="t-std flex items-center justify-between rounded-r2 border border-border bg-surface2 px-3 py-2.5 hover:border-blue">
              <div className="flex items-center gap-2">
                <BellRing size={15} className="text-blue" />
                <span className="text-[0.85rem] font-semibold text-black">{n.message}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={n.target === "Manager" ? "blue" : "gray"}>{n.target}</Badge>
                <span className="text-[0.72rem] text-black/50">{n.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /* Expirations — rendu (inspiré de la maquette)                        */
  /* ------------------------------------------------------------------ */

  const renderExpirations = () => {
    return (
      <div className="space-y-5">
        {/* Stat cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="t-card rounded-r3 border border-[var(--red-border)] bg-[var(--red-soft)] p-4 shadow-card hover:shadow-modal hover:-translate-y-0.5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[0.78rem] font-extrabold text-black/70">Valeur totale à risque</span>
              <TrendingDown size={18} className="text-[var(--red)]" />
            </div>
            <p className="text-[1.35rem] font-black text-[var(--red)]">{totalValueAtRisk.toLocaleString("fr-FR")} DA</p>
            <p className="text-[0.75rem] font-bold text-black/50">Sur {expirationRows.length} article{expirationRows.length > 1 ? "s" : ""} concerné{expirationRows.length > 1 ? "s" : ""}</p>
          </div>
          <div className="t-card rounded-r3 border border-[var(--orange-border)] bg-[var(--orange-soft)] p-4 shadow-card hover:shadow-modal hover:-translate-y-0.5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[0.78rem] font-extrabold text-black/70">Produits critiques (&lt; 2j)</span>
              <AlertTriangle size={18} className="text-[var(--orange)]" />
            </div>
            <p className="text-[1.35rem] font-black text-black">{criticalCount}</p>
            <p className="text-[0.75rem] font-bold text-black/50">Action immédiate requise</p>
          </div>
          <div className="t-card rounded-r3 border border-[var(--green-soft)] bg-[var(--green-soft)] p-4 shadow-card hover:shadow-modal hover:-translate-y-0.5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[0.78rem] font-extrabold text-black/70">Pertes évitées (mois)</span>
              <Check size={18} className="text-[var(--green)]" />
            </div>
            <p className="text-[1.35rem] font-black text-[var(--green)]">{lossesAvoidedMonth.toLocaleString("fr-FR")} DA</p>
            <p className="text-[0.75rem] font-bold text-black/50">Efficacité gestion : 92%</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="t-card flex flex-wrap items-center gap-2 rounded-r3 border border-border bg-surface p-4 shadow-card hover:shadow-modal">
          <div className="t-std flex min-w-[220px] flex-1 items-center gap-2 rounded-r2 border border-border bg-surface2 px-3 py-2 focus-within:border-blue">
            <Search size={16} className="text-black/50" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Rechercher un produit..."
              value={expirationSearch}
              onChange={(e) => setExpirationSearch(e.target.value)}
            />
          </div>
          <div className="t-std flex items-center gap-2 rounded-r2 border border-border bg-surface2 px-3 py-2">
            <Filter size={15} className="text-black/50" />
            <select
              className="bg-transparent text-sm font-semibold outline-none"
              value={expirationUrgencyFilter}
              onChange={(e) => setExpirationUrgencyFilter(e.target.value as typeof expirationUrgencyFilter)}
            >
              <option value="Tous">Filtrer par urgence</option>
              <option value="Expiré">Expiré</option>
              <option value="Critique">Critique</option>
              <option value="Imminent">Imminent</option>
              <option value="À surveiller">À surveiller</option>
            </select>
          </div>
          <SecondaryButton onClick={() => setExpirationHistoryOpen(true)}>
            <History size={15} /> Historique des pertes
          </SecondaryButton>
        </div>

        {/* Table */}
        <div className="t-card overflow-hidden rounded-r3 border border-border bg-surface shadow-card hover:shadow-modal">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[26%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-surface2 text-[0.72rem] font-extrabold uppercase tracking-[0.5px] text-black/60">
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3">Stock actuel</th>
                  <th className="px-4 py-3">Expiration</th>
                  <th className="px-4 py-3">Statut urgence</th>
                  <th className="px-4 py-3">Valeur à risque</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpirationRows.map((row) => (
                  <HoverPreview
                    key={row.item.id}
                    content={
                      <div className="space-y-1">
                        <p className="font-extrabold text-black">{row.item.name}</p>
                        <p className="text-[0.7rem] text-black/60">Catégorie : {row.item.category}</p>
                        <p className="text-[0.7rem] text-black/60">Stock : {row.item.quantity} {row.item.unit}</p>
                        <p className="text-[0.7rem] text-black/60">Expire le : {row.item.expiry}</p>
                        <p className="text-[0.7rem] text-black/60">Valeur : {row.valueAtRisk.toLocaleString("fr-FR")} DA</p>
                      </div>
                    }
                  >
                    <tr className="t-std border-b border-border/70 hover:bg-surface2">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={row.item.image || CATEGORY_IMAGES[row.item.category] || DEFAULT_CATEGORY_IMAGE}
                            alt={row.item.name}
                            className="h-10 w-10 shrink-0 rounded-r2 object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-black">{row.item.name}</p>
                            <p className="truncate text-[0.72rem] font-bold text-black/50">{row.item.id.toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color="gray">{row.item.category}</Badge>
                      </td>
                      <td className="px-4 py-3 font-extrabold text-black">
                        {row.item.quantity} {row.item.unit}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-black">{row.item.expiry}</p>
                        <p className="text-[0.72rem] text-black/50">Fabriqué le {row.item.manufactureDate || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={urgencyBadgeColor(row.urgency)}>
                          {row.urgency === "Expiré"
                            ? `Expiré (${Math.abs(row.remainingDays)}j)`
                            : `${row.urgency} (${row.remainingDays}j)`}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-black text-[var(--red)]">{row.valueAtRisk.toLocaleString("fr-FR")} DA</td>
                    </tr>
                  </HoverPreview>
                ))}
                {filteredExpirationRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center font-bold text-black/50">
                      Aucun produit ne correspond à cette recherche/filtre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalyses = () => {
    const data = consumptionData[analysesPeriod];
    const wasteData = wasteByCategory.length ? wasteByCategory : [{ name: "Aucune perte", value: 0 }];

    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { value: data.total, label: data.totalLabel, tone: "border-border bg-surface", color: "text-black" },
            { value: "12", label: "Sorties effectuées", tone: "border-border bg-surface", color: "text-black" },
            { value: "3", label: "Pertes détectées", tone: "border-[var(--red-border)] bg-[var(--red-soft)]", color: "text-[var(--red)]" },
            { value: "97%", label: "Disponibilité", tone: "border-border bg-surface", color: "text-black" },
          ].map((stat) => (
            <div key={stat.label} className={`t-card rounded-r3 border p-4 shadow-card hover:shadow-modal hover:-translate-y-0.5 ${stat.tone}`}>
              <p className={`text-[1.2rem] font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[0.8rem] text-black/60">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="t-card rounded-r3 border border-border bg-surface p-5 shadow-card hover:shadow-modal">
            <h2 className="mb-4 text-[1rem] font-black text-black">Évolution de la consommation</h2>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1 rounded-r2 border border-border bg-surface2 p-1">
                {(["jour", "semaine", "mois"] as AnalysesPeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setAnalysesPeriod(period)}
                    className={`t-std rounded-r2 px-3 py-1.5 text-[0.78rem] font-extrabold capitalize ${analysesPeriod === period ? "bg-blue text-black" : "text-black/60 hover:text-black"}`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <LineChart labels={data.labels} values={data.values} unitLabel="" />
          </div>

          <div className="t-card rounded-r3 border border-border bg-surface p-5 shadow-card hover:shadow-modal">
            <h2 className="mb-4 text-[1rem] font-black text-black">Pertes par catégorie (valeur)</h2>
            <DonutChart data={wasteData} unitLabel="DA" />
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="t-card rounded-r3 border border-border bg-surface p-5 shadow-card hover:shadow-modal">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue" />
              <h2 className="text-[1rem] font-black text-black">Produits les plus consommés</h2>
            </div>
            <div className="space-y-2">
              {mostConsumed.map(([name, value]) => (
                <div key={name} className="t-std flex items-center justify-between rounded-r2 bg-surface2 px-3 py-3 hover:bg-[var(--blue-soft)]">
                  <span className="font-semibold text-black">{name}</span>
                  <span className="font-extrabold text-[var(--blue)]">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="t-card rounded-r3 border border-border bg-surface p-5 shadow-card hover:shadow-modal">
            <div className="mb-4 flex items-center gap-2">
              <TrendingDown size={16} className="text-black/50" />
              <h2 className="text-[1rem] font-black text-black">Produits les moins consommés</h2>
            </div>
            <div className="space-y-2">
              {leastConsumed.map(([name, value]) => (
                <div key={name} className="t-std flex items-center justify-between rounded-r2 bg-surface2 px-3 py-3 hover:bg-surface3">
                  <span className="font-semibold text-black">{name}</span>
                  <span className="font-extrabold text-black/60">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="t-card rounded-r3 border border-border bg-surface p-5 shadow-card hover:shadow-modal">
          <h2 className="mb-4 text-[1rem] font-black text-black">Pertes & anomalies</h2>
          <div className="space-y-2">
            {[
              ["Lait frais", "2 L", "Expiration"],
              ["Tomates fraîches", "1.5 kg", "Avarie"],
              ["Poulet entier", "0.8 kg", "Inventaire"],
            ].map(([name, qty, reason]) => (
              <div key={name} className="t-std rounded-r2 border border-[var(--red-border)] bg-[var(--red-soft)] px-3 py-3 hover:-translate-y-0.5 hover:shadow-card">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-black">{name}</span>
                  <span className="font-extrabold text-[var(--red)]">{qty}</span>
                </div>
                <p className="mt-1 text-[0.78rem] text-black/60">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSuppliers = () => (
    <div className="space-y-4">
      <div className="t-card flex flex-wrap items-center justify-between gap-3 rounded-r3 border border-border bg-surface p-4 shadow-card hover:shadow-modal">
        <div>
          <h2 className="text-[1rem] font-black text-black">Fournisseurs</h2>
          <p className="text-[0.8rem] text-black/60">Gérez vos partenaires et leurs coordonnées complètes.</p>
        </div>
        <PrimaryButton onClick={() => setSupplierModal({ mode: "create" })}>
          <Plus size={16} /> Ajouter un fournisseur
        </PrimaryButton>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {suppliers.map((supplier) => {
          const color = supplierColor(supplier.name);
          return (
            <div key={supplier.id} className="t-card rounded-r3 border border-border bg-surface p-5 shadow-card hover:shadow-modal hover:-translate-y-0.5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-black text-white" style={{ backgroundColor: color }}>
                  {supplier.name.charAt(0)}
                </div>
                <div>
                  <p className="font-extrabold text-black">{supplier.name}</p>
                  <p className="text-[0.78rem] font-bold text-black">{supplier.city}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-[0.85rem] font-bold text-black">
                <p className="flex items-center gap-2">
                  <Phone size={14} /> {supplier.phone}
                </p>
                <p className="flex items-center gap-2">
                  <User size={14} /> {supplier.contact}
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={14} /> {supplier.email || "—"}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={14} /> {supplier.address || supplier.city}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <SecondaryButton className="flex-1" onClick={() => setSupplierModal({ mode: "edit", item: supplier })}>
                  Modifier
                </SecondaryButton>
                <button className="t-std rounded-r2 border border-[var(--red-border)] px-3 py-2 text-[0.8rem] font-extrabold text-[var(--red)] hover:bg-[var(--red)] hover:text-black" onClick={() => deleteSupplier(supplier)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const entreeGroups = useMemo(() => {
    const groups: Record<string, StockMovement[]> = {};
    movements
      .filter((m) => m.type === "Entrée")
      .forEach((m) => {
        const key = m.groupId ?? m.id;
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
      });
    return Object.entries(groups)
      .map(([key, movs]) => ({
        key,
        movs,
        date: movs[0].date,
        note: movs[0].note,
        documentName: movs[0].documentName,
        documentUrl: movs[0].documentUrl,
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [movements]);

  /* ------------------------------------------------------------------ */
  /* Export des rapports (Entrées / Sorties) — CSV (Excel) & PDF (impression) */
  /* ------------------------------------------------------------------ */

  const supplierNameForGroup = (group: { note?: string }) => {
    const found = suppliers.find((s) => group.note?.includes(s.name));
    return found?.name ?? "—";
  };

  const buildExportRows = (scope: "entrees" | "sorties", from: string, to: string) => {
    if (scope === "entrees") {
      return entreeGroups
        .filter((g) => (!from || g.date >= from) && (!to || g.date <= to))
        .flatMap((g) =>
          g.movs.map((m) => {
            const target = items.find((it) => it.id === m.itemId);
            const unitPrice = target ? estimateUnitPrice(target.category) : 0;
            return {
              date: g.date,
              article: m.itemName,
              quantite: `${m.quantity} ${m.unit}`,
              fournisseur: supplierNameForGroup(g),
              prixUnitaire: unitPrice,
              total: unitPrice * m.quantity,
              note: g.note ?? "",
            };
          })
        );
    }
    return movements
      .filter((m) => m.type === "Sortie")
      .filter((m) => (!from || m.date >= from) && (!to || m.date <= to))
      .map((m) => {
        const target = items.find((it) => it.id === m.itemId);
        const unitPrice = target ? estimateUnitPrice(target.category) : 0;
        return {
          date: m.date,
          article: m.itemName,
          quantite: `${m.quantity} ${m.unit}`,
          fournisseur: "—",
          prixUnitaire: unitPrice,
          total: unitPrice * m.quantity,
          note: `${m.reason ?? ""}${m.zone ? " • " + m.zone : ""}`,
        };
      });
  };

  const exportToCSV = (scope: "entrees" | "sorties", from: string, to: string) => {
    const rows = buildExportRows(scope, from, to);
    const header = ["Date", "Article", "Quantité", "Fournisseur", "Prix unitaire (DA)", "Total (DA)", "Note"];
    const csvLines = [
      header.join(";"),
      ...rows.map((r) => [r.date, r.article, r.quantite, r.fournisseur, r.prixUnitaire, r.total, r.note].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")),
    ];
    const blob = new Blob(["\uFEFF" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-${scope}-${from || "debut"}-${to || "fin"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Export Excel (CSV) généré : ${rows.length} ligne${rows.length > 1 ? "s" : ""}`);
  };

  const exportToPDF = (scope: "entrees" | "sorties", from: string, to: string) => {
    const rows = buildExportRows(scope, from, to);
    const total = rows.reduce((sum, r) => sum + r.total, 0);
    const win = window.open("", "_blank");
    if (!win) {
      notify("Autorisez les fenêtres pop-up pour exporter en PDF.");
      return;
    }
    win.document.write(`
      <html>
        <head>
          <title>Rapport ${scope === "entrees" ? "des entrées" : "des sorties"}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            p.meta { color: #6b7280; font-size: 12px; margin-top: 0; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #dde5f4; padding: 6px 8px; text-align: left; }
            th { background: #f4f7fc; }
            tfoot td { font-weight: bold; background: #f4f7fc; }
          </style>
        </head>
        <body>
          <h1>Rapport ${scope === "entrees" ? "des entrées de stock" : "des sorties de stock"}</h1>
          <p class="meta">Période : ${from || "début"} → ${to || "aujourd'hui"} • Généré le ${new Date().toLocaleDateString("fr-FR")}</p>
          <table>
            <thead>
              <tr><th>Date</th><th>Article</th><th>Quantité</th><th>Fournisseur</th><th>Prix unitaire</th><th>Total</th><th>Note</th></tr>
            </thead>
            <tbody>
              ${rows.map((r) => `<tr><td>${r.date}</td><td>${r.article}</td><td>${r.quantite}</td><td>${r.fournisseur}</td><td>${r.prixUnitaire.toLocaleString("fr-FR")} DA</td><td>${r.total.toLocaleString("fr-FR")} DA</td><td>${r.note}</td></tr>`).join("")}
            </tbody>
            <tfoot>
              <tr><td colspan="5">Total</td><td>${total.toLocaleString("fr-FR")} DA</td><td></td></tr>
            </tfoot>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  /* Pertes par catégorie — pour le graphique dédié dans Analyses */
  const wasteByCategory = useMemo(() => {
    const wasteMock: { name: string; category: string; qty: number }[] = [
      { name: "Lait frais", category: "Produits laitiers", qty: 2 },
      { name: "Tomates fraîches", category: "Légumes", qty: 1.5 },
      { name: "Poulet entier", category: "Viandes", qty: 0.8 },
    ];
    const byCategory: Record<string, number> = {};
    wasteMock.forEach((w) => {
      byCategory[w.category] = (byCategory[w.category] ?? 0) + w.qty * estimateUnitPrice(w.category);
    });
    return Object.entries(byCategory).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, []);

  /* Tendances (mock, comparaison à la semaine dernière) affichées sur le tableau de bord */
  const dashboardTrends = {
    items: 4,
    ruptures: -12,
    alertes: 8,
    value: 6,
  };

  /* Résultats de la recherche globale (articles, fournisseurs, matériel) */
  const globalSearchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return { articles: [] as StockItem[], suppliersR: [] as Supplier[], equipmentR: [] as KitchenEquipment[] };
    return {
      articles: items.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 5),
      suppliersR: suppliers.filter((s) => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)).slice(0, 5),
      equipmentR: equipment.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 5),
    };
  }, [globalSearch, items, suppliers, equipment]);

  const renderEntrees = () => (
    <div className="space-y-4">
      <div className="t-card flex flex-wrap items-center justify-between gap-3 rounded-r3 border border-border bg-surface p-4 shadow-card hover:shadow-modal">
        <div>
          <h2 className="text-[1rem] font-black text-black">Entrées de stock</h2>
          <p className="text-[0.8rem] text-black/60">Réceptionnez vos livraisons : produits, quantités et bon de commande.</p>
        </div>
        <div className="flex gap-2">
          <PrimaryButton onClick={openEntreeModal}>
            <PackagePlus size={16} /> Nouvelle entrée
          </PrimaryButton>
          <SecondaryButton onClick={() => { setExportModal({ scope: "entrees" }); setExportFrom(""); setExportTo(""); }}>
            <FileDown size={16} /> Exporter
          </SecondaryButton>
        </div>
      </div>

      <div className="t-card rounded-r3 border border-[var(--green-soft)] bg-[var(--green-soft)] p-4 shadow-card hover:shadow-modal hover:-translate-y-0.5">
        <p className="text-[1.1rem] font-black text-[var(--green)]">
          {entreeGroups.length} réception{entreeGroups.length > 1 ? "s" : ""} enregistrée{entreeGroups.length > 1 ? "s" : ""}
        </p>
        <p className="text-[0.8rem] text-black/60">Historique des marchandises reçues</p>
      </div>

      <div className="space-y-4">
        {entreeGroups.map((group) => {
          const supplierName = supplierNameForGroup(group);
          const color = supplierName !== "—" ? supplierColor(supplierName) : "var(--blue-soft)";
          return (
            <div key={group.key} className="t-card rounded-r3 border border-border bg-surface p-5 shadow-card hover:shadow-modal hover:-translate-y-0.5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-white font-black" style={{ backgroundColor: color }}>
                    {supplierName !== "—" ? supplierName.charAt(0) : "?"}
                  </div>
                  <div>
                    <p className="font-extrabold text-black">{group.date}</p>
                    {group.note && <p className="text-[0.78rem] text-black/60">{group.note}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SecondaryButton onClick={() => setEntreeViewKey(group.key)}>
                    <Eye size={15} /> Voir détails
                  </SecondaryButton>
                  <SecondaryButton onClick={() => openEditEntree(group)}>
                    <Pencil size={15} /> Modifier
                  </SecondaryButton>
                </div>
              </div>
              <div className="space-y-2">
                {group.movs.map((m) => (
                  <div key={m.id} className="t-std flex items-center justify-between rounded-r2 bg-surface2 px-3 py-2.5">
                    <span className="font-bold text-black">{m.itemName}</span>
                    <span className="font-extrabold text-[var(--green)]">
                      + {m.quantity} {m.unit}
                    </span>
                  </div>
                ))}
              </div>
              {group.documentName && (
                <p className="mt-2 flex items-center gap-1.5 text-[0.78rem] text-black/50">
                  <Paperclip size={13} /> {group.documentName}
                </p>
              )}
            </div>
          );
        })}
        {entreeGroups.length === 0 && (
          <div className="t-card rounded-r3 border border-border bg-surface p-8 text-center shadow-card">
            <p className="font-bold text-black/50">Aucune entrée de stock enregistrée.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSorties = () => {
    const allSorties = movements.filter((m) => m.type === "Sortie").sort((a, b) => (a.date < b.date ? 1 : -1));
    const sorties = allSorties.filter((m) => {
      if (sortiesTab === "tous") return true;
      const type = m.sourceType ?? "article";
      return type === sortiesTab;
    });
    const articleSortiesCount = allSorties.filter((m) => (m.sourceType ?? "article") === "article").length;
    const materielSortiesCount = allSorties.filter((m) => m.sourceType === "materiel").length;

    const reasonColor = (reason?: string) => (reason === "Perte" || reason === "Casse" || reason === "Vol" ? "red" : "orange");

    return (
      <div className="space-y-4">
        <div className="t-card flex flex-wrap items-center justify-between gap-3 rounded-r3 border border-border bg-surface p-4 shadow-card hover:shadow-modal">
          <div>
            <h2 className="text-[1rem] font-black text-black">Sorties de stock</h2>
            <p className="text-[0.8rem] text-black/60">Saisissez ce qui part en cuisine — articles alimentaires ou matériel de cuisine.</p>
          </div>
          <div className="flex gap-2">
            <PrimaryButton onClick={openSortieModal}>
              <PackageMinus size={16} /> Nouvelle sortie
            </PrimaryButton>
            <SecondaryButton onClick={() => { setExportModal({ scope: "sorties" }); setExportFrom(""); setExportTo(""); }}>
              <FileDown size={16} /> Exporter
            </SecondaryButton>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="t-card rounded-r3 border border-[var(--red-border)] bg-[var(--red-soft)] p-4 shadow-card hover:shadow-modal hover:-translate-y-0.5">
            <p className="text-[1.1rem] font-black text-[var(--red)]">{articleSortiesCount} sortie{articleSortiesCount > 1 ? "s" : ""} d'articles</p>
            <p className="text-[0.8rem] text-black/60">Consommations cuisine et pertes alimentaires</p>
          </div>
          <div className="t-card rounded-r3 border border-[var(--purple-soft)] bg-[var(--purple-soft)] p-4 shadow-card hover:shadow-modal hover:-translate-y-0.5">
            <p className="text-[1.1rem] font-black text-[var(--purple)]">{materielSortiesCount} sortie{materielSortiesCount > 1 ? "s" : ""} de matériel</p>
            <p className="text-[0.8rem] text-black/60">Casse, perte ou vol de matériel de cuisine</p>
          </div>
        </div>

        <div className="t-card rounded-r3 border border-border bg-surface p-5 shadow-card hover:shadow-modal">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[1rem] font-black text-black">Historique des sorties</h2>
            <div className="flex gap-1 rounded-r2 border border-border bg-surface2 p-1">
              {([
                { key: "tous", label: "Tous" },
                { key: "article", label: "Articles" },
                { key: "materiel", label: "Matériel" },
              ] as { key: "tous" | "article" | "materiel"; label: string }[]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSortiesTab(tab.key)}
                  className={`t-std rounded-r2 px-3 py-1.5 text-[0.78rem] font-extrabold ${sortiesTab === tab.key ? "bg-blue text-black" : "text-black/60 hover:text-black"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border text-[0.78rem] font-extrabold uppercase tracking-[1px] text-black/55">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Origine</th>
                  <th className="pb-3 pr-4">Article / Matériel</th>
                  <th className="pb-3 pr-4">Quantité</th>
                  <th className="pb-3 pr-4">Zone</th>
                  <th className="pb-3 pr-4">Raison</th>
                  <th className="pb-3 pr-4">Note</th>
                  <th className="pb-3 pr-4">Détails</th>
                </tr>
              </thead>
              <tbody>
                {sorties.map((m) => (
                  <HoverPreview
                    key={m.id}
                    content={
                      <div className="space-y-1">
                        <p className="font-extrabold text-black">{m.itemName}</p>
                        <p className="text-[0.7rem] text-black/60">Date : {m.date}</p>
                        <p className="text-[0.7rem] text-black/60">Quantité : {m.quantity} {m.unit}</p>
                        <p className="text-[0.7rem] text-black/60">Zone : {m.zone || "—"}</p>
                        <p className="text-[0.7rem] text-black/60">Raison : {m.reason || "—"}</p>
                        <p className="text-[0.7rem] text-black/60">Note : {m.note || "—"}</p>
                      </div>
                    }
                  >
                    <tr className="t-std border-b border-border/70 text-black/80 hover:bg-surface2">
                      <td className="truncate py-3 pr-4">{m.date}</td>
                      <td className="py-3 pr-4">
                        <Badge color={m.sourceType === "materiel" ? "blue" : "gray"}>
                          {m.sourceType === "materiel" ? "Matériel" : "Article"}
                        </Badge>
                      </td>
                      <td className="truncate py-3 pr-4 font-extrabold">{m.itemName}</td>
                      <td className="truncate py-3 pr-4 font-extrabold text-[var(--red)]">
                        - {m.quantity} {m.unit}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge color="blue">{m.zone || "—"}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge color={reasonColor(m.reason)}>{m.reason || (m.sourceType === "materiel" ? "Casse" : "Cuisine")}</Badge>
                      </td>
                      <td className="truncate py-3 pr-4 text-black/60">{m.note || "—"}</td>
                      <td className="py-3 pr-4">
                        <button
                          className="t-std rounded-r2 border border-border p-2 text-black/60 hover:border-blue hover:text-blue"
                          onClick={() => setSortieViewId(m.id)}
                          title="Voir tous les détails"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  </HoverPreview>
                ))}
                {sorties.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-black/50">
                      Aucune sortie de stock enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const sectionTitles: Record<SectionKey, string> = {
    dashboard: "Tableau de bord",
    articles: "Gestion des articles",
    categories: "Catégories & Matériel",
    alertes: "Alertes stock",
    expirations: "Suivi des expirations proches",
    analyses: "Analyses",
    fournisseurs: "Fournisseurs",
    entrees: "Entrées de stock",
    sorties: "Sorties de stock",
  };

  const contentMap: Record<SectionKey, React.ReactNode> = {
    dashboard: renderDashboard(),
    articles: renderArticles(),
    categories: renderCategories(),
    alertes: renderAlerts(),
    expirations: renderExpirations(),
    analyses: renderAnalyses(),
    fournisseurs: renderSuppliers(),
    entrees: renderEntrees(),
    sorties: renderSorties(),
  };

  const sortieViewMovement = sortieViewId ? movements.find((m) => m.id === sortieViewId) : null;

  /* ------------------------------------------------------------------ */
  /* Layout                                                               */
  /* ------------------------------------------------------------------ */

  return (
    <div className="flex min-h-screen bg-bg text-black">
      <style>{PALETTE_STYLE}</style>

      <aside
        className={`t-std flex shrink-0 flex-col overflow-hidden text-black transition-all duration-300 ease-in-out ${sidebarCollapsed ? "w-[76px]" : "w-[260px]"}`}
        style={{
          background: "linear-gradient(180deg, #eef3fc 0%, #e2ebf9 100%)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <div className={`flex items-center border-b border-border2/50 py-4 ${sidebarCollapsed ? "flex-col gap-2 px-2" : "justify-between px-4"}`}>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-r2 text-white"
              style={{ background: "linear-gradient(135deg, var(--blue-sidebar), var(--blue2-sidebar))" }}
            >
              <Package size={18} />
            </div>
            {!sidebarCollapsed && (
              <div>
                <p className="text-[0.95rem] font-black text-black">Mourad Hamidi</p>
                <p className="text-[0.72rem] font-bold text-black">Magasinier</p>
              </div>
            )}
          </div>
          <button
            className="t-std shrink-0 rounded-r2 p-2 text-black hover:bg-white/60"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            title={sidebarCollapsed ? "Déplier le menu" : "Réduire le menu"}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            const badgeCount = item.key === "alertes" ? alertCount : item.key === "expirations" ? criticalCount : 0;
            return (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                style={isActive ? { backgroundColor: "var(--blue-sidebar)" } : undefined}
                className={`t-std flex w-full items-center gap-3 rounded-r2 px-3 py-2.5 text-left text-[0.9rem] font-bold ${
                  isActive ? "text-black shadow-glow" : "text-black hover:bg-white/60"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
              >
                <Icon size={18} className="shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
                {!sidebarCollapsed && badgeCount > 0 ? (
                  <span className="ml-auto rounded-full bg-red px-2 py-0.5 text-[0.7rem] font-black text-white">{badgeCount}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-border2/50 px-3 py-3">
          <button
            className={`t-std flex w-full items-center gap-3 rounded-r2 px-3 py-2 text-left text-[0.9rem] font-bold text-red hover:bg-[var(--red-soft)] ${sidebarCollapsed ? "justify-center" : ""}`}
            onClick={onBack}
          >
            <ArrowLeft size={18} className="shrink-0" />
            {!sidebarCollapsed && <span>Retour</span>}
          </button>
          <button
            className={`t-std flex w-full items-center gap-3 rounded-r2 px-3 py-2 text-left text-[0.9rem] font-bold text-black hover:bg-white/60 ${sidebarCollapsed ? "justify-center" : ""}`}
            onClick={handleLogout}
            title="Déconnexion"
          >
            <LogOut size={18} className="shrink-0" />
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-4 py-2.5 md:px-6">
          <h1 className="text-[1.05rem] font-black text-black">{sectionTitles[activeSection]}</h1>
          <div className="flex flex-1 items-center justify-end gap-2">
            <div className="relative w-full max-w-xs">
              <div className="t-std flex items-center gap-2 rounded-r2 border border-border bg-surface2 px-3 py-1.5 focus-within:border-blue">
                <Search size={15} className="shrink-0 text-black/50" />
                <input
                  className="w-full bg-transparent text-[0.8rem] outline-none"
                  placeholder="Recherche globale : articles, fournisseurs…"
                  value={globalSearch}
                  onChange={(e) => { setGlobalSearch(e.target.value); setGlobalSearchOpen(true); }}
                  onFocus={() => setGlobalSearchOpen(true)}
                  onBlur={() => window.setTimeout(() => setGlobalSearchOpen(false), 150)}
                />
                {globalSearch && (
                  <button onClick={() => setGlobalSearch("")} className="t-std shrink-0 text-black/40 hover:text-black">
                    <X size={14} />
                  </button>
                )}
              </div>
              {globalSearchOpen && globalSearch && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-full min-w-[280px] rounded-r2 border border-border bg-surface p-2 shadow-modal">
                  {globalSearchResults.articles.length === 0 && globalSearchResults.suppliersR.length === 0 && globalSearchResults.equipmentR.length === 0 && (
                    <p className="px-2 py-2 text-[0.78rem] text-black/50">Aucun résultat pour "{globalSearch}".</p>
                  )}
                  {globalSearchResults.articles.length > 0 && (
                    <div className="mb-1.5">
                      <p className="px-2 pb-1 text-[0.68rem] font-extrabold uppercase text-black/40">Articles</p>
                      {globalSearchResults.articles.map((a) => (
                        <button key={a.id} className="t-std flex w-full items-center gap-2 rounded-r2 px-2 py-1.5 text-left text-[0.8rem] font-bold text-black hover:bg-surface2" onClick={() => { setActiveSection("articles"); setSearchQuery(a.name); setGlobalSearch(""); }}>
                          <Package size={13} className="text-blue" /> {a.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {globalSearchResults.suppliersR.length > 0 && (
                    <div className="mb-1.5">
                      <p className="px-2 pb-1 text-[0.68rem] font-extrabold uppercase text-black/40">Fournisseurs</p>
                      {globalSearchResults.suppliersR.map((s) => (
                        <button key={s.id} className="t-std flex w-full items-center gap-2 rounded-r2 px-2 py-1.5 text-left text-[0.8rem] font-bold text-black hover:bg-surface2" onClick={() => { setActiveSection("fournisseurs"); setGlobalSearch(""); }}>
                          <Truck size={13} className="text-blue" /> {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {globalSearchResults.equipmentR.length > 0 && (
                    <div>
                      <p className="px-2 pb-1 text-[0.68rem] font-extrabold uppercase text-black/40">Matériel</p>
                      {globalSearchResults.equipmentR.map((eq) => (
                        <button key={eq.id} className="t-std flex w-full items-center gap-2 rounded-r2 px-2 py-1.5 text-left text-[0.8rem] font-bold text-black hover:bg-surface2" onClick={() => { setActiveSection("categories"); setCategoriesTab("materiel"); setGlobalSearch(""); }}>
                          <UtensilsCrossed size={13} className="text-blue" /> {eq.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              className={`t-std flex shrink-0 items-center gap-1.5 rounded-r2 border px-3 py-1.5 text-[0.78rem] font-extrabold ${denseMode ? "border-blue bg-blue text-black" : "border-border bg-surface2 text-black/60 hover:border-blue hover:text-blue"}`}
              onClick={() => setDenseMode((prev) => !prev)}
              title="Basculer la densité d'affichage"
            >
              <Rows3 size={15} /> Compact
            </button>
            <div className="flex shrink-0 items-center gap-2 rounded-r2 border border-border bg-surface2 px-3 py-1.5 text-[0.8rem] font-semibold text-black">
              <Clock3 size={15} className="text-blue" />
              <span>{now.toLocaleTimeString("fr-FR")}</span>
            </div>
          </div>
        </header>
        <main className={`flex-1 overflow-y-auto bg-bg p-4 md:p-6 ${denseMode ? "density-compact" : ""}`}>
          {contentMap[activeSection]}
        </main>
      </div>

      {/* ---------------- Modals ---------------- */}

      {articleModal && (
        <Modal title={articleModal.mode === "edit" ? "Modifier l'article" : "Nouvel article"} onClose={() => setArticleModal(null)} wide>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitArticle}>
            <div className="sm:col-span-2">
              <FileDropInput
                label="Photo de l'article"
                fileName={articleImage ? "Photo sélectionnée" : undefined}
                onFile={(_name, url) => setArticleImage(url)}
              />
              {(articleImage || articleModal.item?.image) && (
                <img
                  src={articleImage || articleModal.item?.image}
                  alt="Aperçu"
                  className="mt-2 h-20 w-20 rounded-r2 object-cover shadow-card"
                />
              )}
            </div>
            <Field label="Nom de l'article">
              <input name="name" defaultValue={articleModal.item?.name} required className={inputCls} />
            </Field>
            <Field label="Catégorie">
              <select name="category" defaultValue={articleModal.item?.category ?? categories[0]?.name} className={inputCls}>
                {categories.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Unité de mesure">
              <select name="unit" defaultValue={articleModal.item?.unit ?? units[0]?.symbol} className={inputCls}>
                {units.map((u) => (
                  <option key={u.id} value={u.symbol}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantité en stock">
              <input name="quantity" type="number" min={0} step="0.1" defaultValue={articleModal.item?.quantity ?? 0} required className={inputCls} />
            </Field>
            <Field label="Stock minimum">
              <input name="minStock" type="number" min={0} step="0.1" defaultValue={articleModal.item?.minStock ?? 0} required className={inputCls} />
            </Field>
            <Field label="Seuil d'alerte">
              <input name="alertThreshold" type="number" min={0} step="0.1" defaultValue={articleModal.item?.alertThreshold ?? 0} required className={inputCls} />
            </Field>
            <Field label="Date de fabrication">
              <input name="manufactureDate" type="date" defaultValue={articleModal.item?.manufactureDate} className={inputCls} />
            </Field>
            <Field label="Date d'expiration">
              <input name="expiry" type="date" defaultValue={articleModal.item?.expiry} className={inputCls} />
            </Field>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <SecondaryButton onClick={() => setArticleModal(null)}>Annuler</SecondaryButton>
              <PrimaryButton type="submit">{articleModal.mode === "edit" ? "Enregistrer" : "Créer l'article"}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {entreeModal && (
        <Modal title="Nouvelle entrée de stock" onClose={() => { setEntreeModal(false); setEntreeDoc(null); }} wide>
          <form className="space-y-4" onSubmit={submitEntree}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date de réception">
                <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} />
              </Field>
              <Field label="Fournisseur (optionnel)">
                <select name="supplierId" className={inputCls} defaultValue="">
                  <option value="">— Aucun —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="space-y-3">
              <span className="block text-[0.78rem] font-extrabold text-black/70">Articles reçus</span>
              {entreeLines.map((line) => (
                <div key={line.lineId} className="flex flex-wrap items-end gap-2 rounded-r2 border border-border bg-surface2 p-3">
                  <div className="min-w-[160px] flex-1">
                    <select
                      className={inputCls}
                      value={line.itemId}
                      onChange={(e) => updateEntreeLine(line.lineId, "itemId", e.target.value)}
                    >
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28">
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      placeholder="Quantité"
                      className={inputCls}
                      value={line.quantity || ""}
                      onChange={(e) => updateEntreeLine(line.lineId, "quantity", e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEntreeLine(line.lineId)}
                    className="t-std rounded-r2 border border-[var(--red-border)] p-2.5 text-[var(--red)] hover:bg-[var(--red)] hover:text-black"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <SecondaryButton onClick={addEntreeLine}>
                <Plus size={15} /> Ajouter un article
              </SecondaryButton>
            </div>

            <Field label="Note (optionnel)">
              <input name="note" placeholder="Ex : livraison partielle, remarque…" className={inputCls} />
            </Field>

            <FileDropInput label="Photo du bon de commande" fileName={entreeDoc?.name} onFile={(name, url) => setEntreeDoc({ name, url })} />
            {entreeDoc && (
              <div>
                <span className="mb-1.5 block text-[0.78rem] font-extrabold text-black/70">Aperçu du document joint</span>
                <DocumentPreview name={entreeDoc.name} url={entreeDoc.url} />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => { setEntreeModal(false); setEntreeDoc(null); }}>Annuler</SecondaryButton>
              <PrimaryButton type="submit">Valider la réception</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {entreeViewKey && (() => {
        const group = entreeGroups.find((g) => g.key === entreeViewKey);
        if (!group) return null;
        return (
          <Modal title="Détails de la réception" onClose={() => setEntreeViewKey(null)} wide>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 text-[0.85rem]">
                <div>
                  <span className="font-extrabold text-black/60">Date : </span>
                  <span className="font-bold text-black">{group.date}</span>
                </div>
                {group.note && (
                  <div>
                    <span className="font-extrabold text-black/60">Note : </span>
                    <span className="font-bold text-black">{group.note}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <span className="block text-[0.78rem] font-extrabold text-black/70">Articles reçus</span>
                {group.movs.map((m) => (
                  <div key={m.id} className="t-std flex items-center justify-between rounded-r2 bg-surface2 px-3 py-2.5">
                    <span className="font-bold text-black">{m.itemName}</span>
                    <span className="font-extrabold text-[var(--green)]">
                      + {m.quantity} {m.unit}
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <span className="mb-1.5 block text-[0.78rem] font-extrabold text-black/70">Bon de commande</span>
                <DocumentPreview name={group.documentName} url={group.documentUrl} />
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {group.documentUrl && (
                  <a
                    href={group.documentUrl}
                    download={group.documentName || "bon-de-commande"}
                    className="t-std inline-flex items-center gap-2 rounded-r2 border border-border bg-surface px-4 py-2.5 text-[0.85rem] font-extrabold text-black hover:border-blue hover:bg-blue hover:text-black"
                  >
                    Télécharger le document
                  </a>
                )}
                <PrimaryButton
                  onClick={() => {
                    setEntreeViewKey(null);
                    openEditEntree(group);
                  }}
                >
                  <Pencil size={15} /> Modifier cette réception
                </PrimaryButton>
              </div>
            </div>
          </Modal>
        );
      })()}

      {entreeEditGroupKey && (
        <Modal title="Modifier la réception" onClose={() => setEntreeEditGroupKey(null)} wide>
          <form className="space-y-4" onSubmit={submitEditEntree}>
            <Field label="Date de réception">
              <input name="date" type="date" required defaultValue={entreeEditDate} className={inputCls} />
            </Field>

            <div className="space-y-3">
              <span className="block text-[0.78rem] font-extrabold text-black/70">Articles reçus</span>
              {entreeEditLines.map((line) => (
                <div key={line.lineId} className="flex flex-wrap items-end gap-2 rounded-r2 border border-border bg-surface2 p-3">
                  <div className="min-w-[160px] flex-1">
                    <select
                      className={inputCls}
                      value={line.itemId}
                      onChange={(e) => updateEditEntreeLine(line.lineId, "itemId", e.target.value)}
                    >
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28">
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      placeholder="Quantité"
                      className={inputCls}
                      value={line.quantity || ""}
                      onChange={(e) => updateEditEntreeLine(line.lineId, "quantity", e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEditEntreeLine(line.lineId)}
                    className="t-std rounded-r2 border border-[var(--red-border)] p-2.5 text-[var(--red)] hover:bg-[var(--red)] hover:text-black"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <SecondaryButton onClick={addEditEntreeLine}>
                <Plus size={15} /> Ajouter un article
              </SecondaryButton>
            </div>

            <Field label="Note (optionnel)">
              <input name="note" defaultValue={entreeEditNote} placeholder="Ex : livraison partielle, remarque…" className={inputCls} />
            </Field>

            <FileDropInput label="Photo du bon de commande" fileName={entreeEditDoc?.name} onFile={(name, url) => setEntreeEditDoc({ name, url })} />
            {entreeEditDoc && (
              <div>
                <span className="mb-1.5 block text-[0.78rem] font-extrabold text-black/70">Aperçu du document joint</span>
                <DocumentPreview name={entreeEditDoc.name} url={entreeEditDoc.url} />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => setEntreeEditGroupKey(null)}>Annuler</SecondaryButton>
              <PrimaryButton type="submit">Enregistrer les modifications</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {sortieModal && (
        <Modal title="Sortie de stock" onClose={() => setSortieModal(false)}>
          <form className="space-y-4" onSubmit={submitSortie}>
            <div>
              <span className="mb-1.5 block text-[0.78rem] font-extrabold text-black/70">Type de sortie</span>
              <div className="inline-flex w-full items-center gap-1 rounded-r2 border border-border bg-surface2 p-1">
                <button
                  type="button"
                  onClick={() => setSortieSourceType("article")}
                  className={`t-std flex flex-1 items-center justify-center gap-1.5 rounded-r2 px-3 py-2 text-[0.8rem] font-extrabold ${
                    sortieSourceType === "article" ? "bg-blue text-black" : "text-black/60 hover:text-blue"
                  }`}
                >
                  <Package size={14} /> Article alimentaire
                </button>
                <button
                  type="button"
                  onClick={() => setSortieSourceType("materiel")}
                  className={`t-std flex flex-1 items-center justify-center gap-1.5 rounded-r2 px-3 py-2 text-[0.8rem] font-extrabold ${
                    sortieSourceType === "materiel" ? "bg-blue text-black" : "text-black/60 hover:text-blue"
                  }`}
                >
                  <UtensilsCrossed size={14} /> Matériel de cuisine
                </button>
              </div>
              <input type="hidden" name="sourceType" value={sortieSourceType} />
            </div>

            {sortieSourceType === "article" ? (
              <Field label="Article">
                <select name="itemId" key="article-select" className={inputCls} required>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.quantity} {item.unit} dispo.)
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Matériel">
                <select name="itemId" key="materiel-select" className={inputCls} required>
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.quantity} dispo. • {eq.type})
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Quantité sortie">
              <input
                name="quantity"
                type="number"
                min={sortieSourceType === "materiel" ? 1 : 0.1}
                step={sortieSourceType === "materiel" ? 1 : 0.1}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Zone / Destination">
              <select name="zone" className={inputCls} defaultValue="Cuisine">
                {ZONES.map((zone) => (
                  <option key={zone}>{zone}</option>
                ))}
              </select>
            </Field>
            <Field label="Raison">
              <select name="reason" key={`reason-${sortieSourceType}`} className={inputCls} defaultValue={sortieSourceType === "materiel" ? "Casse" : "Cuisine"}>
                {sortieSourceType === "article" ? (
                  <>
                    <option>Cuisine</option>
                    <option>Perte</option>
                    <option>Autre</option>
                  </>
                ) : (
                  <>
                    <option>Casse</option>
                    <option>Perte</option>
                    <option>Vol</option>
                    <option>Autre</option>
                  </>
                )}
              </select>
            </Field>
            <Field label="Note (optionnel)">
              <input name="note" placeholder="Ex : service du midi, produit avarié, verre cassé…" className={inputCls} />
            </Field>
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => setSortieModal(false)}>Annuler</SecondaryButton>
              <PrimaryButton type="submit">Valider la sortie</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {sortieViewMovement && (
        <Modal title="Détails de la sortie" onClose={() => setSortieViewId(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-[0.85rem]">
              <div className="rounded-r2 border border-border bg-surface2 p-3">
                <p className="text-[0.72rem] font-extrabold uppercase text-black/50">Date</p>
                <p className="font-bold text-black">{sortieViewMovement.date}</p>
              </div>
              <div className="rounded-r2 border border-border bg-surface2 p-3">
                <p className="text-[0.72rem] font-extrabold uppercase text-black/50">Origine</p>
                <Badge color={sortieViewMovement.sourceType === "materiel" ? "blue" : "gray"}>
                  {sortieViewMovement.sourceType === "materiel" ? "Matériel" : "Article"}
                </Badge>
              </div>
              <div className="col-span-2 rounded-r2 border border-border bg-surface2 p-3">
                <p className="text-[0.72rem] font-extrabold uppercase text-black/50">Article / Matériel</p>
                <p className="font-extrabold text-black">{sortieViewMovement.itemName}</p>
              </div>
              <div className="rounded-r2 border border-border bg-surface2 p-3">
                <p className="text-[0.72rem] font-extrabold uppercase text-black/50">Quantité sortie</p>
                <p className="font-extrabold text-[var(--red)]">
                  - {sortieViewMovement.quantity} {sortieViewMovement.unit}
                </p>
              </div>
              <div className="rounded-r2 border border-border bg-surface2 p-3">
                <p className="text-[0.72rem] font-extrabold uppercase text-black/50">Zone / Destination</p>
                <Badge color="blue">{sortieViewMovement.zone || "—"}</Badge>
              </div>
              <div className="rounded-r2 border border-border bg-surface2 p-3">
                <p className="text-[0.72rem] font-extrabold uppercase text-black/50">Raison</p>
                <Badge color={sortieViewMovement.reason === "Perte" || sortieViewMovement.reason === "Casse" || sortieViewMovement.reason === "Vol" ? "red" : "orange"}>
                  {sortieViewMovement.reason || (sortieViewMovement.sourceType === "materiel" ? "Casse" : "Cuisine")}
                </Badge>
              </div>
              <div className="col-span-2 rounded-r2 border border-border bg-surface2 p-3">
                <p className="text-[0.72rem] font-extrabold uppercase text-black/50">Note</p>
                <p className="font-semibold text-black">{sortieViewMovement.note || "—"}</p>
              </div>
            </div>
            {sortieViewMovement.documentUrl && (
              <div>
                <span className="mb-1.5 block text-[0.78rem] font-extrabold text-black/70">Document joint</span>
                <DocumentPreview name={sortieViewMovement.documentName} url={sortieViewMovement.documentUrl} />
              </div>
            )}
            <div className="flex justify-end">
              <SecondaryButton onClick={() => setSortieViewId(null)}>Fermer</SecondaryButton>
            </div>
          </div>
        </Modal>
      )}

      {categoryModal && (
        <Modal title={categoryModal.mode === "edit" ? "Modifier la catégorie" : "Nouvelle catégorie"} onClose={() => setCategoryModal(null)}>
          <form className="space-y-4" onSubmit={submitCategory}>
            <FileDropInput
              label="Photo de la catégorie"
              fileName={categoryImage ? "Photo sélectionnée" : undefined}
              onFile={(_name, url) => setCategoryImage(url)}
            />
            {(categoryImage || categoryModal.item?.image) && (
              <img src={categoryImage || categoryModal.item?.image} alt="Aperçu" className="h-28 w-full rounded-r2 object-cover shadow-card" />
            )}
            <Field label="Nom de la catégorie">
              <input name="name" defaultValue={categoryModal.item?.name} required className={inputCls} />
            </Field>
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => { setCategoryModal(null); setCategoryImage(null); }}>Annuler</SecondaryButton>
              <PrimaryButton type="submit">Enregistrer</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {unitModal && (
        <Modal title={unitModal.mode === "edit" ? "Modifier l'unité" : "Nouvelle unité"} onClose={() => setUnitModal(null)}>
          <form className="space-y-4" onSubmit={submitUnit}>
            <Field label="Nom de l'unité">
              <input name="name" defaultValue={unitModal.item?.name} required className={inputCls} />
            </Field>
            <Field label="Symbole">
              <input name="symbol" defaultValue={unitModal.item?.symbol} required className={inputCls} />
            </Field>
            <Field label="Type">
              <input name="type" defaultValue={unitModal.item?.type} placeholder="Masse, Volume, Comptage…" className={inputCls} />
            </Field>
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => setUnitModal(null)}>Annuler</SecondaryButton>
              <PrimaryButton type="submit">Enregistrer</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {equipmentModal && (
        <Modal
          title={equipmentModal.mode === "edit" ? "Modifier le matériel" : "Nouveau matériel de cuisine"}
          onClose={() => setEquipmentModal(null)}
        >
          <form className="space-y-4" onSubmit={submitEquipment}>
            <Field label="Nom du matériel">
              <input name="name" defaultValue={equipmentModal.item?.name} required className={inputCls} />
            </Field>
            <Field label="Type">
              <select name="type" defaultValue={equipmentModal.item?.type ?? "Vaisselle"} className={inputCls}>
                <option>Vaisselle</option>
                <option>Couverts</option>
                <option>Ustensiles de cuisine</option>
                <option>Électroménager</option>
              </select>
            </Field>
            <Field label="Quantité">
              <input name="quantity" type="number" min={0} defaultValue={equipmentModal.item?.quantity ?? 0} required className={inputCls} />
            </Field>
            <Field label="État">
              <select name="condition" defaultValue={equipmentModal.item?.condition ?? "Bon état"} className={inputCls}>
                <option>Bon état</option>
                <option>Endommagé</option>
                <option>Manquant</option>
              </select>
            </Field>
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => setEquipmentModal(null)}>Annuler</SecondaryButton>
              <PrimaryButton type="submit">{equipmentModal.mode === "edit" ? "Enregistrer" : "Ajouter"}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {supplierModal && (
        <Modal title={supplierModal.mode === "edit" ? "Modifier le fournisseur" : "Ajouter un fournisseur"} onClose={() => setSupplierModal(null)} wide>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitSupplier}>
            <Field label="Nom du fournisseur">
              <input name="name" defaultValue={supplierModal.item?.name} required className={inputCls} />
            </Field>
            <Field label="Personne de contact">
              <input name="contact" defaultValue={supplierModal.item?.contact} className={inputCls} />
            </Field>
            <Field label="Téléphone">
              <input name="phone" defaultValue={supplierModal.item?.phone} className={inputCls} />
            </Field>
            <Field label="E-mail">
              <input name="email" type="email" defaultValue={supplierModal.item?.email} className={inputCls} />
            </Field>
            <Field label="Ville">
              <input name="city" defaultValue={supplierModal.item?.city} className={inputCls} />
            </Field>
            <Field label="Adresse complète">
              <input name="address" defaultValue={supplierModal.item?.address} className={inputCls} />
            </Field>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <SecondaryButton onClick={() => setSupplierModal(null)}>Annuler</SecondaryButton>
              <PrimaryButton type="submit">{supplierModal.mode === "edit" ? "Enregistrer" : "Ajouter"}</PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {docPreview && (
        <Modal title={docPreview.name} onClose={() => setDocPreview(null)} wide>
          <div className="flex flex-col items-center gap-3">
            <DocumentPreview name={docPreview.name} url={docPreview.url} />
            <a href={docPreview.url} download={docPreview.name} className="t-std inline-flex items-center gap-2 rounded-r2 bg-[var(--blue)] px-4 py-2.5 text-[0.85rem] font-extrabold text-black hover:opacity-90">
              Télécharger le document
            </a>
          </div>
        </Modal>
      )}

      {expirationHistoryOpen && (
        <Modal title="Historique des pertes" onClose={() => setExpirationHistoryOpen(false)} wide>
          <div className="space-y-2">
            {lossHistory.length === 0 && <p className="text-[0.85rem] text-black/50">Aucune action enregistrée pour le moment.</p>}
            {lossHistory.map((entry) => (
              <div key={entry.id} className="t-std flex items-center justify-between rounded-r2 border border-border bg-surface2 px-3 py-3">
                <div>
                  <p className="font-extrabold text-black">{entry.itemName}</p>
                  <p className="text-[0.78rem] text-black/60">
                    {entry.date} • {entry.quantity} {entry.unit} • {entry.action}
                  </p>
                </div>
                <Badge color="green">+{entry.valueSaved.toLocaleString("fr-FR")} DA économisés</Badge>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Modal d'export */}
      {exportModal && (
        <Modal title={`Exporter les ${exportModal.scope === "entrees" ? "entrées" : "sorties"}`} onClose={() => setExportModal(null)} wide>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date de début">
                <input type="date" className={inputCls} value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
              </Field>
              <Field label="Date de fin">
                <input type="date" className={inputCls} value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
              </Field>
            </div>
            <div className="flex gap-2 justify-end">
              <SecondaryButton onClick={() => exportToCSV(exportModal.scope, exportFrom, exportTo)}>
                <FileDown size={16} /> Export Excel (CSV)
              </SecondaryButton>
              <PrimaryButton onClick={() => exportToPDF(exportModal.scope, exportFrom, exportTo)}>
                <FileText size={16} /> Export PDF
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}