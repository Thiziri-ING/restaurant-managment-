import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useZones, useTables, useCreateTable, useUpdateTable, useDeleteTable, useUpdateTableStatus } from "@/hooks/useTables";
import { useMenuCategories, useMenuItems } from "@/hooks/useMenu";
import { useLogout } from "@/hooks/useAuth";
import { useReservations as useApiReservations } from "@/hooks/useReservations";
import {
  LayoutGrid,
  UtensilsCrossed,
  History,
  CalendarClock,
  ShoppingBag,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  X,
  Trash2,
  StickyNote,
  Percent,
  Gift,
  Undo2,
  AlertTriangle,
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  Layers,
  Users,
  Check,
  Pencil,
  Lock,
  Unlock,
  ArrowLeftRight,
  Merge,
  Clock,
  MapPin,
  Phone,
  Calendar as CalendarIcon,
  ListFilter,
  Receipt,
  PackageCheck,
  ChevronDown,
  Home,
  ArrowRight,
  LogOut,
} from "lucide-react";

/* ============================================================================
   1. TYPES
============================================================================ */
/* ============================================================================
   1. TYPES
============================================================================ */

type Zone = string;
type TableStatus = "libre" | "occupee" | "reservee";

interface TableData {
  id: string;
  number: string;
  zone: Zone;
  capacity: number;
  status: TableStatus;
  mergedInto?: string; // if merged, points to host table id
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
  desc: string;
  image?: string;
}

interface CartItem {
  uid: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
  offered?: boolean;
  returned?: boolean;
  returnReason?: string;
  personIndex?: number; // undefined = plat commun/partagé, sinon index de la personne (0, 1, 2...)
}

interface Order {
  tableId?: string; // undefined for takeaway
  guestName?: string;
  items: CartItem[];
  clientNote?: string;
  discountPercent?: number;
  createdAt: number;
  guests?: number;
}

interface Reservation {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  date: string;
  heure: string;
  personnes: number;
  duree: number;
  notes?: string;
  tableId?: string;
  methodePaiement?: string;
  statut: "confirmee" | "annulee" | "decalee" | "honoree";
  annulationRaison?: string;
  decaleeDate?: string;
  decaleeHeure?: string;
}

type PaymentMethod = "especes" | "carte" | "cib" | "mixte";

interface HistoryEntry {
  id: string;
  type: "sur_place" | "emporter";
  tableLabel?: string;
  items: CartItem[];
  total: number;
  method: PaymentMethod;
  closedAt: number;
}

type ViewKey = "plan" | "pos" | "reservations" | "historique" | "emporter";

/* ============================================================================
   2. MOCK DATA
============================================================================ */
/* ============================================================================
   2. MOCK DATA
============================================================================ */

// NOTE : ces tableaux servent de valeurs par défaut (hors-ligne / premier rendu).
// Ils sont remplacés en mémoire par les vraies données de l'API (catégories & articles du menu)
// dès que celles-ci sont chargées — voir `applyMenuData()` et son appel dans CaissierPage.
let CATEGORIES: string[] = ["Entrées", "Plats", "Pizzas", "Boissons", "Desserts"];

let PRODUCTS: Product[] = [
  { id: "p1", name: "Salade César", price: 650, category: "Entrées", emoji: "🥗", desc: "Romaine, poulet grillé, parmesan", image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500&h=400&fit=crop&q=80" },
  { id: "p2", name: "Soupe à l'oignon", price: 450, category: "Entrées", emoji: "🍲", desc: "Gratinée au fromage", image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&h=400&fit=crop&q=80" },
  { id: "p3", name: "Bruschetta", price: 380, category: "Entrées", emoji: "🥖", desc: "Tomate, basilic, ail", image: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=500&h=400&fit=crop&q=80" },
  { id: "p4", name: "Carpaccio de bœuf", price: 780, category: "Entrées", emoji: "🥩", desc: "Copeaux de parmesan, roquette", image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500&h=400&fit=crop&q=80" },
  { id: "p5", name: "Entrecôte grillée", price: 1450, category: "Plats", emoji: "🥩", desc: "Frites maison, sauce au poivre", image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=500&h=400&fit=crop&q=80" },
  { id: "p6", name: "Poulet rôti", price: 980, category: "Plats", emoji: "🍗", desc: "Légumes de saison", image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&h=400&fit=crop&q=80" },
  { id: "p7", name: "Pâtes Carbonara", price: 750, category: "Plats", emoji: "🍝", desc: "Lardons, crème, parmesan", image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&h=400&fit=crop&q=80" },
  { id: "p8", name: "Saumon grillé", price: 1250, category: "Plats", emoji: "🐟", desc: "Riz pilaf, sauce citron", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&h=400&fit=crop&q=80" },
  { id: "p9", name: "Pizza Margherita", price: 650, category: "Pizzas", emoji: "🍕", desc: "Tomate, mozzarella, basilic", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&h=400&fit=crop&q=80" },
  { id: "p10", name: "Pizza 4 Fromages", price: 850, category: "Pizzas", emoji: "🍕", desc: "Mozzarella, gorgonzola, chèvre, parmesan", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=400&fit=crop&q=80" },
  { id: "p11", name: "Pizza Pepperoni", price: 800, category: "Pizzas", emoji: "🍕", desc: "Pepperoni épicé, mozzarella", image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&h=400&fit=crop&q=80" },
  { id: "p12", name: "Coca-Cola 33cl", price: 150, category: "Boissons", emoji: "🥤", desc: "Canette fraîche", image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500&h=400&fit=crop&q=80" },
  { id: "p13", name: "Eau minérale", price: 100, category: "Boissons", emoji: "💧", desc: "50cl", image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=500&h=400&fit=crop&q=80" },
  { id: "p14", name: "Jus d'orange frais", price: 280, category: "Boissons", emoji: "🍊", desc: "Pressé minute", image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&h=400&fit=crop&q=80" },
  { id: "p15", name: "Café expresso", price: 120, category: "Boissons", emoji: "☕", desc: "", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=400&fit=crop&q=80" },
  { id: "p16", name: "Tiramisu", price: 420, category: "Desserts", emoji: "🍰", desc: "Maison", image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&h=400&fit=crop&q=80" },
  { id: "p17", name: "Fondant au chocolat", price: 450, category: "Desserts", emoji: "🍫", desc: "Cœur coulant, glace vanille", image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500&h=400&fit=crop&q=80" },
  { id: "p18", name: "Crème brûlée", price: 380, category: "Desserts", emoji: "🍮", desc: "", image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=500&h=400&fit=crop&q=80" },
];

/** Remplace en place le contenu de CATEGORIES / PRODUCTS avec les vraies données du menu (API). */
function applyMenuData(categories: string[], products: Product[]) {
  if (categories.length) {
    CATEGORIES.length = 0;
    CATEGORIES.push(...categories);
  }
  if (products.length) {
    PRODUCTS.length = 0;
    PRODUCTS.push(...products);
  }
}

const CATEGORY_EMOJI: Record<string, string> = {
  entrée: "🥗", entrees: "🥗", entrées: "🥗",
  plat: "🍽️", plats: "🍽️",
  pizza: "🍕", pizzas: "🍕",
  boisson: "🥤", boissons: "🥤",
  dessert: "🍰", desserts: "🍰",
};
function emojiForCategory(name: string) {
  return CATEGORY_EMOJI[name.trim().toLowerCase()] ?? "🍽️";
}

const INITIAL_TABLES: TableData[] = [
  { id: "t1", number: "T1", zone: "Salle", capacity: 2, status: "libre" },
  { id: "t2", number: "T2", zone: "Salle", capacity: 2, status: "occupee" },
  { id: "t3", number: "T3", zone: "Salle", capacity: 4, status: "libre" },
  { id: "t4", number: "T4", zone: "Salle", capacity: 4, status: "reservee" },
  { id: "t5", number: "T5", zone: "Salle", capacity: 6, status: "libre" },
  { id: "t6", number: "T6", zone: "Salle", capacity: 4, status: "occupee" },
  { id: "t7", number: "T7", zone: "Salle", capacity: 2, status: "libre" },
  { id: "t8", number: "T8", zone: "Salle", capacity: 8, status: "libre" },
  { id: "t9", number: "T9", zone: "Terrasse", capacity: 2, status: "libre" },
  { id: "t10", number: "T10", zone: "Terrasse", capacity: 4, status: "occupee" },
  { id: "t11", number: "T11", zone: "Terrasse", capacity: 4, status: "libre" },
  { id: "t12", number: "T12", zone: "Terrasse", capacity: 6, status: "libre" },
  { id: "t13", number: "T13", zone: "Terrasse", capacity: 2, status: "reservee" },
  { id: "t14", number: "T14", zone: "Terrasse", capacity: 4, status: "libre" },
  { id: "t15", number: "T15", zone: "Cafeteria", capacity: 2, status: "libre" },
  { id: "t16", number: "T16", zone: "Cafeteria", capacity: 4, status: "libre" },
];

const SAMPLE_ORDERS: Record<string, Order> = {
  t2: {
    tableId: "t2",
    guests: 2,
    createdAt: Date.now() - 1000 * 60 * 22,
    items: [
      { uid: "u1", productId: "p5", name: "Entrecôte grillée", price: 1450, qty: 1 },
      { uid: "u2", productId: "p9", name: "Pizza Margherita", price: 650, qty: 1 },
      { uid: "u3", productId: "p12", name: "Coca-Cola 33cl", price: 150, qty: 2 },
    ],
  },
  t10: {
    tableId: "t10",
    guests: 4,
    createdAt: Date.now() - 1000 * 60 * 8,
    items: [
      { uid: "u4", productId: "p1", name: "Salade César", price: 650, qty: 2 },
      { uid: "u5", productId: "p8", name: "Saumon grillé", price: 1250, qty: 2 },
    ],
  },
  t6: {
    tableId: "t6",
    guests: 4,
    createdAt: Date.now() - 1000 * 60 * 35,
    items: [
      { uid: "u6", productId: "p7", name: "Pâtes Carbonara", price: 750, qty: 4 },
      { uid: "u7", productId: "p16", name: "Tiramisu", price: 420, qty: 4 },
    ],
  },
};

const SAMPLE_RESERVATIONS: Reservation[] = [
  {
    id: "r1",
    nom: "Boudiaf",
    prenom: "Karim",
    telephone: "0556 12 34 56",
    date: new Date().toISOString().slice(0, 10),
    heure: "20:00",
    personnes: 4,
    duree: 90,
    notes: "Anniversaire, table près de la fenêtre",
    tableId: "t4",
    methodePaiement: "carte",
    statut: "confirmee",
  },
  {
    id: "r2",
    nom: "Haddad",
    prenom: "Sara",
    telephone: "0661 98 76 54",
    date: new Date().toISOString().slice(0, 10),
    heure: "21:30",
    personnes: 2,
    duree: 60,
    tableId: "t13",
    statut: "confirmee",
  },
];

const SAMPLE_HISTORY: HistoryEntry[] = [
  {
    id: "h1",
    type: "sur_place",
    tableLabel: "T3",
    items: [{ uid: "x1", productId: "p9", name: "Pizza Margherita", price: 650, qty: 2 }],
    total: 1300,
    method: "especes",
    closedAt: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: "h2",
    type: "emporter",
    items: [{ uid: "x2", productId: "p11", name: "Pizza Pepperoni", price: 800, qty: 1 }],
    total: 800,
    method: "cib",
    closedAt: Date.now() - 1000 * 60 * 60 * 26,
  },
];

/* ============================================================================
   3. UTILITAIRES
============================================================================ */
/* ============================================================================
   3. UTILITAIRES
============================================================================ */

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} DA`;

const uid = () => Math.random().toString(36).slice(2, 10);

/* ---- correspondance entre le statut réel de l'API (FREE/OCCUPIED/RESERVED)
   et le statut utilisé par l'interface caissier (libre/occupee/reservee) ---- */
const apiStatusToLocal: Record<string, TableStatus> = {
  FREE: "libre",
  OCCUPIED: "occupee",
  RESERVED: "reservee",
};
const localStatusToApi: Record<TableStatus, "FREE" | "OCCUPIED" | "RESERVED"> = {
  libre: "FREE",
  occupee: "OCCUPIED",
  reservee: "RESERVED",
};

function apiTableToLocal(t: {
  id: string;
  name: string;
  capacity: number;
  status: string;
  zone?: { name: string };
}): TableData {
  return {
    id: t.id,
    number: t.name,
    zone: t.zone?.name ?? "Salle",
    capacity: t.capacity,
    status: apiStatusToLocal[t.status] ?? "libre",
  };
}

const orderTotal = (order: Order | undefined) => {
  if (!order) return 0;
  const gross = order.items
    .filter((i) => !i.returned)
    .reduce((sum, i) => sum + (i.offered ? 0 : i.price * i.qty), 0);
  const discount = order.discountPercent ? (gross * order.discountPercent) / 100 : 0;
  return Math.max(0, gross - discount);
};

const timeAgo = (ts: number) => {
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  return `il y a ${h} h ${min % 60} min`;
};

const productEmoji = (productId: string) => PRODUCTS.find((p) => p.id === productId)?.emoji ?? "🍽️";

/* ============================================================================
   4. PETITS COMPOSANTS UI
============================================================================ */

function Badge({ children, color }: { children: React.ReactNode; color: "green" | "red" | "orange" | "blue" | "gray" }) {
  const map: Record<string, string> = {
    green: "bg-[var(--green-soft)] text-[var(--green)]",
    red: "bg-[var(--red-soft)] text-[var(--red)]",
    orange: "bg-[var(--orange-soft)] text-[var(--orange)]",
    blue: "bg-[var(--blue-soft)] text-[var(--blue)]",
    gray: "bg-surface3 text-black",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[20px] text-[1rem] font-extrabold uppercase tracking-wide ${map[color]}`}>
      {children}
    </span>
  );
}

function IconBtn({
  icon,
  onClick,
  title,
  variant = "default",
  disabled,
  bold,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  title?: string;
  variant?: "default" | "danger" | "primary" | "ghost";
  disabled?: boolean;
  bold?: boolean;
}) {
  const styles: Record<string, string> = {
    default: "bg-surface2 hover:bg-surface3 text-black border border-border",
    danger: "bg-[var(--red-soft)] hover:bg-red/20 text-black border border-transparent",
    primary: "bg-blue hover:bg-blue2 text-black border border-transparent shadow-glow",
    ghost: "bg-transparent hover:bg-surface2 text-black border border-transparent",
  };
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`t-std w-9 h-9 rounded-r flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${
        bold ? "border-2 font-black" : ""
      }`}
    >
      {icon}
    </button>
  );
}

function Btn({
  children,
  onClick,
  variant = "default",
  full,
  disabled,
  small,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger" | "success" | "ghost" | "warning";
  full?: boolean;
  disabled?: boolean;
  small?: boolean;
}) {
  const styles: Record<string, string> = {
    default: "bg-surface2 hover:bg-surface3 text-black border border-border",
    primary: "bg-blue hover:bg-blue2 text-black shadow-glow",
    danger: "bg-red hover:bg-red/90 text-black",
    success: "bg-green hover:bg-green/90 text-black",
    warning: "bg-orange hover:bg-orange/90 text-black",
    ghost: "bg-transparent hover:bg-surface2 text-black",
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`t-std rounded-r font-extrabold disabled:opacity-40 disabled:cursor-not-allowed ${
        small ? "px-3 py-2 text-[0.98rem]" : "px-4 py-3 text-[1.08rem]"
      } ${full ? "w-full" : ""} ${styles[variant]} flex items-center justify-center gap-2`}
    >
      {children}
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
  width = 520,
  icon,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-surface rounded-r3 shadow-modal animate-modal-in w-full max-h-[88vh] overflow-y-auto"
        style={{ maxWidth: width }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-surface z-10">
          <h2 className="text-[1.3rem] font-black flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <IconBtn icon={<X size={18} />} onClick={onClose} variant="ghost" />
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[1rem] font-extrabold uppercase text-black">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-r border border-border bg-surface2 focus:bg-surface focus:border-blue outline-none text-[1.08rem] font-semibold t-std";

function Toast({ toasts }: { toasts: { id: string; msg: string; kind: "success" | "error" | "info" }[] }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-toast-in px-4 py-3 rounded-r2 shadow-modal font-bold text-[1.02rem] flex items-center gap-2 text-white ${
            t.kind === "success" ? "bg-green" : t.kind === "error" ? "bg-red" : "bg-blue"
          }`}
        >
          {t.kind === "success" && <Check size={16} />}
          {t.kind === "error" && <AlertTriangle size={16} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function Topbar({ now }: { now: Date }) {
  const clock = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  return (
    <div className="w-full flex items-center justify-start gap-2 px-4 py-1.5 border-b border-border bg-surface">
      <Clock size={13} className="text-black" />
      <span className="font-mono font-bold text-[0.82rem] text-black">{clock}</span>
      <span className="text-[0.82rem] text-black font-semibold capitalize">{dateStr}</span>
    </div>
  );
}
/* ============================================================================
   6. PAGE CAISSIER
============================================================================ */

export function CaissierPage({ onBack }: { onBack: () => void }) {
  /* ---- connexion aux vraies données (backend) ---- */
  const { data: apiZones } = useZones();
  const { data: apiTables } = useTables();
  const { data: apiCategories } = useMenuCategories();
  const { data: apiMenuItems } = useMenuItems({ available: true });
  const createTableMutation = useCreateTable();
  const updateTableMutation = useUpdateTable();
  const deleteTableMutation = useDeleteTable();
  const updateTableStatusMutation = useUpdateTableStatus();
  const logoutMutation = useLogout();
  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: apiReservations } = useApiReservations(todayStr);

  /* ---- état global ---- */
  const [view, setView] = useState<ViewKey>("plan");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("rm_sidebar") === "1");
  const [tables, setTables] = useState<TableData[]>(INITIAL_TABLES);
  const [tablesLoadedFromApi, setTablesLoadedFromApi] = useState(false);
  const [menuVersion, setMenuVersion] = useState(0);
  const [orders, setOrders] = useState<Record<string, Order>>(SAMPLE_ORDERS);
  const [reservations, setReservations] = useState<Reservation[]>(SAMPLE_RESERVATIONS);
  const [history, setHistory] = useState<HistoryEntry[]>(SAMPLE_HISTORY);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [takeawayOrder, setTakeawayOrder] = useState<Order>({ items: [], createdAt: Date.now(), guestName: "" });
  const [now, setNow] = useState(new Date());
  const [toasts, setToasts] = useState<{ id: string; msg: string; kind: "success" | "error" | "info" }[]>([]);
  const [loggedOut, setLoggedOut] = useState(false);
  const [confirmArrivalTable, setConfirmArrivalTable] = useState<TableData | null>(null);

  /* ---- gestion des tables (déclenchée depuis la sidebar, appliquée dans le Plan de Salle) ---- */
  const [pickMode, setPickMode] = useState<"edit" | "delete" | null>(null);
  const [creatingTable, setCreatingTable] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);

  /* ---- chargement des vraies tables depuis l'API (une seule fois, puis on garde l'état local
     pour rester réactif comme prévu par le design ; les actions CRUD ci-dessous répercutent
     ensuite chaque changement vers le backend) ---- */
  useEffect(() => {
    if (apiTables && apiTables.length && !tablesLoadedFromApi) {
      setTables(apiTables.map(apiTableToLocal));
      setTablesLoadedFromApi(true);
    }
  }, [apiTables, tablesLoadedFromApi]);

  const zoneNames = useMemo(
    () => (apiZones && apiZones.length ? apiZones.map((z: any) => z.name) : Array.from(new Set(tables.map((t) => t.zone)))),
    [apiZones, tables]
  );

  /* ---- chargement du vrai menu (catégories + articles) depuis l'API ---- */
  useEffect(() => {
    if (apiCategories?.length && apiMenuItems?.data?.length) {
      const cats = [...apiCategories].sort((a, b) => a.sortOrder - b.sortOrder).map((c) => c.name);
      const catNameById = new Map(apiCategories.map((c) => [c.id, c.name]));
      const prods: Product[] = apiMenuItems.data.map((item) => {
        const catName = catNameById.get(item.categoryId) ?? cats[0] ?? "Autres";
        return {
          id: item.id,
          name: item.name,
          price: item.price,
          category: catName,
          emoji: emojiForCategory(catName),
          desc: item.description ?? "",
          image: item.imageUrl,
        };
      });
      applyMenuData(cats, prods);
      setMenuVersion((v) => v + 1);
    }
  }, [apiCategories, apiMenuItems]);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    localStorage.setItem("rm_sidebar", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (apiReservations && apiReservations.length) {
      const statusMap: Record<string, Reservation["statut"]> = {
        CONFIRMED: "confirmee",
        CANCELLED: "annulee",
        COMPLETED: "honoree",
      };
      const mapped: Reservation[] = apiReservations.map((r) => {
        const dt = new Date(r.dateTime);
        const [prenom, ...rest] = r.clientName.split(" ");
        return {
          id: r.id,
          nom: rest.join(" ") || r.clientName,
          prenom: rest.length ? prenom : "",
          telephone: r.phone ?? "",
          date: dt.toISOString().slice(0, 10),
          heure: dt.toTimeString().slice(0, 5),
          personnes: r.guestCount,
          duree: r.durationMin,
          notes: r.notes,
          tableId: r.tableId,
          statut: statusMap[r.status] ?? "confirmee",
        };
      });
      setReservations(mapped);
    }
  }, [apiReservations]);

  const pushToast = (msg: string, kind: "success" | "error" | "info" = "success") => {
    const id = uid();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };

  /* ---- navigation table -> POS ---- */
  const openTable = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    if (table.status === "reservee") {
      // Table réservée : on bloque l'ouverture directe et on demande de confirmer l'arrivée du client
      setConfirmArrivalTable(table);
      return;
    }
    if (!orders[tableId]) {
      setOrders((o) => ({ ...o, [tableId]: { tableId, items: [], createdAt: Date.now(), guests: table.capacity } }));
    }
    setTables((ts) => ts.map((t) => (t.id === tableId && t.status !== "occupee" ? { ...t, status: "occupee" } : t)));
    if (table.status !== "occupee") updateTableStatusMutation.mutate({ id: tableId, status: "OCCUPIED" });
    setActiveTableId(tableId);
    setView("pos");
  };

  /* ---- confirmation d'arrivée client sur une table réservée ---- */
  const confirmArrival = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    if (!orders[tableId]) {
      setOrders((o) => ({ ...o, [tableId]: { tableId, items: [], createdAt: Date.now(), guests: table.capacity } }));
    }
    setTables((ts) => ts.map((t) => (t.id === tableId ? { ...t, status: "occupee" } : t)));
    updateTableStatusMutation.mutate({ id: tableId, status: "OCCUPIED" });
    setActiveTableId(tableId);
    setView("pos");
    setConfirmArrivalTable(null);
    pushToast(`Client accueilli — commande ouverte sur ${table.number}`);
  };

  const currentOrder: Order | undefined = activeTableId ? orders[activeTableId] : takeawayOrder;

  const updateCurrentOrder = (updater: (o: Order) => Order) => {
    if (activeTableId) {
      setOrders((all) => ({ ...all, [activeTableId]: updater(all[activeTableId] ?? { tableId: activeTableId, items: [], createdAt: Date.now() }) }));
    } else {
      setTakeawayOrder((o) => updater(o));
    }
  };

  if (loggedOut) {
    return (
      <div className="rm-app min-h-screen bg-bg flex items-center justify-center font-sans text-black p-6">
        <div className="bg-surface rounded-r3 border border-border shadow-modal p-10 flex flex-col items-center gap-4 text-center max-w-sm">
          <div
            className="w-14 h-14 rounded-r2 flex items-center justify-center text-white font-black shrink-0"
            style={{ background: "linear-gradient(135deg, var(--blue), var(--blue2))" }}
          >
            🍽
          </div>
          <h2 className="text-[1.2rem] font-black">Vous êtes déconnecté</h2>
          <p className="text-[0.98rem] font-semibold text-black">
            Merci d'avoir utilisé RestauManager. À bientôt !
          </p>
          <Btn
            variant="primary"
            onClick={() => {
              setLoggedOut(false);
              setView("plan");
              setActiveTableId(null);
              onBack();
            }}
          >
            <LogOut size={16} className="rotate-180" /> Se reconnecter
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="rm-app min-h-screen bg-bg flex font-sans text-black">
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        view={view}
        setView={(v) => {
          if (v !== "pos" && activeTableId) {
            const ord = orders[activeTableId];
            const isEmpty = !ord || ord.items.length === 0;
            const table = tables.find((t) => t.id === activeTableId);
            if (isEmpty && table && table.status === "occupee") {
              setTables((ts) => ts.map((t) => (t.id === activeTableId ? { ...t, status: "libre" } : t)));
              updateTableStatusMutation.mutate({ id: activeTableId, status: "FREE" });
              setOrders((all) => {
                const copy = { ...all };
                delete copy[activeTableId];
                return copy;
              });
            }
          }
          setView(v);
          if (v !== "pos") setActiveTableId(null);
        }}
        now={now}
        onLogout={() => {
          logoutMutation.mutate();
          setLoggedOut(true);
        }}
        onAddTable={() => setCreatingTable(true)}
        onEditTable={() => setPickMode("edit")}
        onDeleteTable={() => setPickMode("delete")}
        pickMode={pickMode}
        onCancelPick={() => setPickMode(null)}
      />

      <div
        className="flex-1 flex flex-col min-w-0"
        style={{ marginLeft: sidebarCollapsed ? 72 : 250 }}
        key={menuVersion}
      >
        <Topbar now={now} />
        <main className="flex-1 min-w-0 relative">
          {view === "plan" && (
            <PlanDeSalle
              tables={tables}
              setTables={setTables}
              orders={orders}
              reservations={reservations}
              openTable={openTable}
              pushToast={pushToast}
              pickMode={pickMode}
              setPickMode={setPickMode}
              creating={creatingTable}
              setCreating={setCreatingTable}
              editTable={editingTable}
              setEditTable={setEditingTable}
              zones={apiZones && apiZones.length ? apiZones : zoneNames.map((n) => ({ id: "", name: n }))}
              createTableMutation={createTableMutation}
              updateTableMutation={updateTableMutation}
              deleteTableMutation={deleteTableMutation}
              updateTableStatusMutation={updateTableStatusMutation}
            />
          )}

          {view === "pos" && activeTableId && (
            <POSView
              table={tables.find((t) => t.id === activeTableId)!}
              tables={tables}
              order={currentOrder ?? { items: [], createdAt: Date.now() }}
              updateOrder={updateCurrentOrder}
              onCloseTable={(freeTable) => {
                setView("plan");
                setActiveTableId(null);
                if (freeTable) {
                  setTables((ts) => ts.map((t) => (t.id === activeTableId ? { ...t, status: "libre" } : t)));
                  updateTableStatusMutation.mutate({ id: activeTableId, status: "FREE" });
                  setOrders((all) => {
                    const copy = { ...all };
                    delete copy[activeTableId];
                    return copy;
                  });
                }
              }}
              onTransfer={(destId) => {
                setOrders((all) => {
                  const o = all[activeTableId];
                  const merged = { ...all };
                  delete merged[activeTableId];
                  merged[destId] = { ...o, tableId: destId };
                  return merged;
                });
                setTables((ts) =>
                  ts.map((t) => {
                    if (t.id === activeTableId) return { ...t, status: "libre" };
                    if (t.id === destId) return { ...t, status: "occupee" };
                    return t;
                  })
                );
                updateTableStatusMutation.mutate({ id: activeTableId, status: "FREE" });
                updateTableStatusMutation.mutate({ id: destId, status: "OCCUPIED" });
                pushToast("Commande transférée avec succès");
                setActiveTableId(destId);
              }}
              onPay={(entry) => {
                setHistory((h) => [{ ...entry, id: uid(), closedAt: Date.now() }, ...h]);
              }}
              pushToast={pushToast}
            />
          )}

          {view === "pos" && !activeTableId && (
            <MenuBrowseView tables={tables} openTable={openTable} onGoEmporter={() => setView("emporter")} />
          )}

          {view === "emporter" && (
            <POSView
              table={null}
              tables={tables}
              order={takeawayOrder}
              updateOrder={updateCurrentOrder}
              onCloseTable={() => {
                setTakeawayOrder({ items: [], createdAt: Date.now(), guestName: "" });
              }}
              onTransfer={() => {}}
              onPay={(entry) => {
                setHistory((h) => [{ ...entry, id: uid(), closedAt: Date.now() }, ...h]);
                setTakeawayOrder({ items: [], createdAt: Date.now(), guestName: "" });
              }}
              pushToast={pushToast}
            />
          )}

          {view === "reservations" && (
            <ReservationsView
              reservations={reservations}
              setReservations={setReservations}
              tables={tables}
              pushToast={pushToast}
            />
          )}

          {view === "historique" && (
            <HistoriqueView
              history={history}
              tables={tables}
              pushToast={pushToast}
              onReopen={(entry) => {
                const target = tables.find((t) => t.number === entry.tableLabel);
                if (!target) {
                  pushToast("Table introuvable pour cette commande", "error");
                  return;
                }
                if (target.status === "occupee") {
                  pushToast(`La table ${target.number} est déjà occupée`, "error");
                  return;
                }
                setOrders((all) => ({
                  ...all,
                  [target.id]: {
                    tableId: target.id,
                    items: entry.items.filter((i) => !i.returned).map((i) => ({ ...i, uid: uid() })),
                    createdAt: Date.now(),
                    guests: target.capacity,
                  },
                }));
                setTables((ts) => ts.map((t) => (t.id === target.id ? { ...t, status: "occupee" } : t)));
                setActiveTableId(target.id);
                setView("pos");
                pushToast(`Commande réouverte sur ${target.number}`);
              }}
            />
          )}
        </main>
      </div>

      {confirmArrivalTable && (
        <ArrivalConfirmModal
          table={confirmArrivalTable}
          reservation={reservations.find(
            (r) => r.tableId === confirmArrivalTable.id && r.statut === "confirmee"
          )}
          onCancel={() => setConfirmArrivalTable(null)}
          onConfirm={() => confirmArrival(confirmArrivalTable.id)}
        />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
/* ============================================================================
   6bis. CONFIRMATION D'ARRIVÉE CLIENT (table réservée)
============================================================================ */

function ArrivalConfirmModal({
  table,
  reservation,
  onCancel,
  onConfirm,
}: {
  table: TableData;
  reservation?: Reservation;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={`Table ${table.number} — Réservée`} onClose={onCancel} width={440} icon={<CalendarClock size={18} />}>
      <p className="text-[1rem] font-semibold text-black mb-4">
        Cette table est réservée. Confirmez-vous l'arrivée du client pour ouvrir la commande&nbsp;?
      </p>

      {reservation ? (
        <div className="rounded-r2 border border-border bg-surface2 p-4 flex flex-col gap-1.5 mb-5">
          <p className="font-extrabold text-[1.05rem] text-black">
            {reservation.prenom} {reservation.nom}
          </p>
          <p className="text-[0.98rem] font-semibold text-black flex items-center gap-1.5">
            <Clock size={13} /> {reservation.heure} · {reservation.duree} min
          </p>
          <p className="text-[0.98rem] font-semibold text-black flex items-center gap-1.5">
            <Users size={13} /> {reservation.personnes} pers.
          </p>
          <p className="text-[0.98rem] font-semibold text-black flex items-center gap-1.5">
            <Phone size={13} /> {reservation.telephone}
          </p>
          {reservation.notes && <p className="text-[0.95rem] text-black italic">📝 {reservation.notes}</p>}
        </div>
      ) : (
        <p className="text-[0.95rem] font-semibold text-black mb-5">
          Aucun détail de réservation trouvé pour cette table.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Btn variant="default" onClick={onCancel}>
          Annuler
        </Btn>
        <Btn variant="success" onClick={onConfirm}>
          <Check size={16} /> Client arrivé
        </Btn>
      </div>
    </Modal>
  );
}

/* ============================================================================
   6ter. SIDEBAR
============================================================================ */

function Sidebar({
  collapsed,
  setCollapsed,
  view,
  setView,
  now,
  onLogout,
  onAddTable,
  onEditTable,
  onDeleteTable,
  pickMode,
  onCancelPick,
}: {
  collapsed: boolean;
  setCollapsed: (b: boolean) => void;
  view: ViewKey;
  setView: (v: ViewKey) => void;
  now: Date; // kept for prop compatibility, no longer displayed here
  onLogout: () => void;
  onAddTable: () => void;
  onEditTable: () => void;
  onDeleteTable: () => void;
  pickMode: "edit" | "delete" | null;
  onCancelPick: () => void;
}) {
  const items: { key: ViewKey; label: string; image: string }[] = [
    { key: "plan", label: "Plan de Salle", image: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png" },
    { key: "pos", label: "Menu / POS", image: "https://cdn-icons-png.flaticon.com/512/3480/3480618.png" },
    { key: "emporter", label: "À Emporter", image: "https://cdn-icons-png.flaticon.com/512/3144/3144456.png" },
    { key: "reservations", label: "Réservations", image: "https://cdn-icons-png.flaticon.com/512/2693/2693507.png" },
    { key: "historique", label: "Historique", image: "https://cdn-icons-png.flaticon.com/512/2088/2088617.png" },
  ];

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [showTableOptions, setShowTableOptions] = useState(false);
  const tableOptionsRef = useRef<HTMLDivElement>(null);
  const collapsedBtnRef = useRef<HTMLButtonElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const [flyoutPos, setFlyoutPos] = useState<{ top: number; left: number } | null>(null);

  const openCollapsedFlyout = () => {
    if (collapsedBtnRef.current) {
      const r = collapsedBtnRef.current.getBoundingClientRect();
      setFlyoutPos({ top: r.top, left: r.right + 10 });
    }
    setShowTableOptions((v) => !v);
  };

  useEffect(() => {
    if (!showTableOptions) return;
    const handler = (e: MouseEvent) => {
      const inSidebarBox = tableOptionsRef.current && tableOptionsRef.current.contains(e.target as Node);
      const inFlyout = flyoutRef.current && flyoutRef.current.contains(e.target as Node);
      if (!inSidebarBox && !inFlyout) {
        setShowTableOptions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTableOptions]);

  // Recalcule la position du flyout si la fenêtre est redimensionnée pendant qu'il est ouvert
  useEffect(() => {
    if (!showTableOptions) return;
    const reposition = () => {
      if (collapsedBtnRef.current) {
        const r = collapsedBtnRef.current.getBoundingClientRect();
        setFlyoutPos({ top: r.top, left: r.right + 10 });
      }
    };
    window.addEventListener("resize", reposition);
    return () => window.removeEventListener("resize", reposition);
  }, [showTableOptions]);

  return (
    <aside
      className="fixed left-0 top-0 h-screen t-std flex flex-col z-30"
      style={{
        width: collapsed ? 72 : 250,
        background: "linear-gradient(180deg, #e8f0fe 0%, #d4e4fa 100%)",
        borderRight: "1px solid var(--border)",
      }}
    >
      <div className="flex flex-col gap-2.5 px-4 py-3 border-b border-border2/50">
        <div className="flex items-center gap-2.5 justify-center">
          <div
            className="w-9 h-9 rounded-r2 flex items-center justify-center text-white font-black shrink-0"
            style={{ background: "linear-gradient(135deg, var(--blue), var(--blue2))" }}
          >
            🍽
          </div>
          {!collapsed && <span className="text-[1.2rem] font-black tracking-tight text-black">RestauManager</span>}
        </div>

        {!collapsed ? (
          <div className="flex items-center gap-2 px-0.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-[1.02rem] shrink-0"
              style={{ background: "linear-gradient(135deg, var(--blue), var(--blue2))" }}
            >
              CA
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold text-[1.05rem] text-black">Caissier</span>
              <span className="text-[0.95rem] text-black font-semibold">Poste 1</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-[1rem] shrink-0"
              title="Caissier — Poste 1"
              style={{ background: "linear-gradient(135deg, var(--blue), var(--blue2))" }}
            >
              CA
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2.5 flex flex-col gap-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-2 pb-1 text-[1rem] font-extrabold uppercase tracking-[2px] text-black">
            Caisse
          </div>
        )}
        {items.map((it) => {
          const active = view === it.key;
          return (
            <button
              key={it.key}
              onClick={() => setView(it.key)}
              title={collapsed ? it.label : undefined}
              className={`t-std flex items-center gap-3 px-3 py-3 rounded-r2 font-extrabold text-[1.05rem] text-black ${
                active ? "bg-blue shadow-glow" : "hover:bg-white/60"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <img src={it.image} alt={it.label} className="w-5 h-5 object-contain shrink-0" />
              {!collapsed && <span>{it.label}</span>}
            </button>
          );
        })}

        {/* Gestion des tables */}
        <div className="mt-3 relative" ref={tableOptionsRef}>
          {!collapsed && (
            <div className="px-2 pb-1 text-[1rem] font-extrabold uppercase tracking-[2px] text-black">
              Gestion
            </div>
          )}

          {collapsed ? (
            <div className="relative flex justify-center">
              <button
                ref={collapsedBtnRef}
                onClick={openCollapsedFlyout}
                title="Options Tables"
                className={`t-std w-9 h-9 rounded-r flex items-center justify-center border ${
                  showTableOptions || pickMode
                    ? "bg-[var(--blue-soft)] border-blue text-black"
                    : "bg-surface2 hover:bg-surface3 border-border text-black"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="5" cy="12" r="2" fill="currentColor" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                  <circle cx="19" cy="12" r="2" fill="currentColor" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowTableOptions((v) => !v)}
                className="t-std w-full flex items-center gap-3 px-3 py-3 rounded-r2 font-extrabold text-[1.05rem] text-black hover:bg-white/60"
              >
                <LayoutGrid size={18} className="shrink-0" />
                <span>Options Tables</span>
              </button>

              {pickMode && (
                <div className="mx-1 mt-1 px-2.5 py-2 rounded-r2 bg-[var(--orange-soft)] border border-orange/30 flex items-center justify-between gap-2">
                  <span className="font-bold text-[0.85rem] text-orange">
                    Mode {pickMode === "edit" ? "modification" : "suppression"} actif
                  </span>
                  <button onClick={onCancelPick} className="font-bold text-[0.85rem] text-black underline shrink-0">
                    Annuler
                  </button>
                </div>
              )}

              {showTableOptions && (
                <div className="absolute z-40 left-1 right-1 top-[calc(100%+4px)] w-56 bg-surface rounded-r2 border border-border shadow-modal py-1.5 flex flex-col overflow-hidden">
                  <button
                    onClick={() => {
                      setView("plan");
                      onAddTable();
                      setShowTableOptions(false);
                    }}
                    className="t-std w-full px-3.5 py-2.5 text-left text-[0.98rem] font-bold flex items-center gap-2.5 hover:bg-surface2 text-black"
                  >
                    <Plus size={15} /> Ajouter une table
                  </button>
                  <button
                    onClick={() => {
                      setView("plan");
                      onEditTable();
                      setShowTableOptions(false);
                    }}
                    className="t-std w-full px-3.5 py-2.5 text-left text-[0.98rem] font-bold flex items-center gap-2.5 hover:bg-surface2 text-black"
                  >
                    <Pencil size={15} /> Modifier une table
                  </button>
                  <button
                    onClick={() => {
                      setView("plan");
                      onDeleteTable();
                      setShowTableOptions(false);
                    }}
                    className="t-std w-full px-3.5 py-2.5 text-left text-[0.98rem] font-bold flex items-center gap-2.5 hover:bg-[var(--red-soft)] text-black"
                  >
                    <Trash2 size={15} /> Supprimer une table
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Flyout des options Tables en mode réduit — position fixed pour sortir de la sidebar, jamais coupé par le scroll du nav */}
      {collapsed && showTableOptions && flyoutPos && (
        <div
          ref={flyoutRef}
          style={{ position: "fixed", top: flyoutPos.top, left: flyoutPos.left }}
          className="z-[100] flex items-center gap-1 bg-surface rounded-r2 border border-border shadow-modal p-1.5"
        >
          <IconBtn
            icon={<Plus size={16} />}
            title="Ajouter une table"
            onClick={() => {
              setView("plan");
              onAddTable();
              setShowTableOptions(false);
            }}
          />
          <IconBtn
            icon={<Pencil size={16} />}
            title="Modifier une table"
            variant={pickMode === "edit" ? "primary" : "default"}
            onClick={() => {
              setView("plan");
              onEditTable();
              setShowTableOptions(false);
            }}
          />
          <IconBtn
            icon={<Trash2 size={16} />}
            title="Supprimer une table"
            variant={pickMode === "delete" ? "danger" : "default"}
            onClick={() => {
              setView("plan");
              onDeleteTable();
              setShowTableOptions(false);
            }}
          />
        </div>
      )}

      {/* Bouton déconnexion */}
      <div className="px-2.5 pt-1 pb-1 border-t border-border2/50">
        {confirmLogout && !collapsed ? (
          <div className="flex flex-col gap-1.5 px-1 pb-1.5 pt-1.5">
            <span className="text-[1rem] font-bold text-black text-center">Confirmer la déconnexion ?</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setConfirmLogout(false)}
                className="t-std flex-1 py-2 rounded-r2 bg-surface2 hover:bg-surface3 text-black font-extrabold text-[1.05rem]"
              >
                Annuler
              </button>
              <button
                onClick={onLogout}
                className="t-std flex-1 py-2 rounded-r2 bg-red hover:bg-red/90 text-black font-extrabold text-[0.98rem]"
              >
                Quitter
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => (collapsed ? onLogout() : setConfirmLogout(true))}
            title={collapsed ? "Déconnexion" : undefined}
            className={`t-std w-full flex items-center gap-2.5 px-3 py-2.5 rounded-r2 font-extrabold text-[0.98rem] text-black hover:bg-[var(--red-soft)] ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={16} />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        )}
      </div>

      <div className="p-2.5 border-t border-border2/50">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="t-std w-full flex items-center justify-center gap-2 py-2.5 rounded-r2 hover:bg-white/60 text-black font-bold text-[0.98rem]"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Réduire</span>}
        </button>
      </div>
    </aside>
  );
}

/* ============================================================================
   7bis. MENU BROWSE — vue "consultation seule" du menu, sans panier
============================================================================ */

function MenuBrowseView({
  tables,
  openTable,
  onGoEmporter,
}: {
  tables: TableData[];
  openTable: (id: string) => void;
  onGoEmporter: () => void;
}) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [search, setSearch] = useState("");

  const products = PRODUCTS.filter(
    (p) => p.category === category && p.name.toLowerCase().includes(search.toLowerCase())
  );

  const freeTables = tables.filter((t) => t.status === "libre" && !t.mergedInto);

  return (
    <div className="flex flex-col h-screen p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className={`${inputCls} pl-10 text-black`}
          />
        </div>
        <Btn small onClick={onGoEmporter}>
          <ShoppingBag size={15} /> Commande à emporter
        </Btn>
      </div>

      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`t-std shrink-0 px-4 py-2.5 rounded-r2 font-extrabold text-[1rem] border ${
              category === c ? "bg-[var(--blue-soft)] text-black border-blue shadow-glow" : "bg-surface border-border text-black hover:bg-surface3"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div
        className="grid gap-3 overflow-y-auto pr-1 flex-1"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}
      >
        {products.map((p) => (
          <div
            key={p.id}
            className="t-card bg-surface rounded-r2 border border-border shadow-card overflow-hidden flex flex-col"
            style={{ height: 260 }}
          >
            <div className="flex-1 min-h-[120px] flex items-center justify-center bg-surface3 relative overflow-hidden">
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[3.4rem] leading-none">{p.emoji}</span>
              )}
            </div>
            <div className="p-3 flex flex-col gap-1 bg-surface border-t border-border text-center">
              <span className="font-extrabold text-[1.02rem] leading-tight text-black">{p.name}</span>
              {p.desc && <span className="text-[1rem] text-black font-semibold leading-tight">{p.desc}</span>}
              <span className="font-mono font-black text-blue text-[1rem]">{fmt(p.price)}</span>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-16 text-black font-bold">Aucun produit trouvé.</div>
        )}
      </div>

      {freeTables.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-[1.05rem] font-extrabold uppercase text-black mb-2">Tables libres — cliquez pour commander</p>
          <div className="flex gap-2 flex-wrap">
            {freeTables.map((t) => (
              <button
                key={t.id}
                onClick={() => openTable(t.id)}
                className="t-std px-4 py-2 rounded-r2 border border-green bg-[var(--green-soft)] font-extrabold text-[0.98rem] text-black hover:-translate-y-0.5"
              >
                {t.number} <span className="text-black font-semibold">({t.zone})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   8. PLAN DE SALLE
============================================================================ */

const STATUS_LABEL: Record<TableStatus, string> = {
  libre: "Libre",
  occupee: "Occupée",
  reservee: "Réservée",
};
const STATUS_COLOR: Record<TableStatus, "green" | "blue" | "orange" | "red"> = {
  libre: "green",
  occupee: "blue",
  reservee: "red",
};
const STATUS_BORDER: Record<TableStatus, string> = {
  libre: "border-green",
  occupee: "border-blue",
  reservee: "border-red",
};

function PlanDeSalle({
  tables,
  setTables,
  orders,
  reservations,
  openTable,
  pushToast,
  pickMode,
  setPickMode,
  creating,
  setCreating,
  editTable,
  setEditTable,
  zones,
  createTableMutation,
  updateTableMutation,
  deleteTableMutation,
  updateTableStatusMutation,
}: {
  tables: TableData[];
  setTables: React.Dispatch<React.SetStateAction<TableData[]>>;
  orders: Record<string, Order>;
  reservations: Reservation[];
  openTable: (id: string) => void;
  pushToast: (m: string, k?: "success" | "error" | "info") => void;
  pickMode: "edit" | "delete" | null;
  setPickMode: (m: "edit" | "delete" | null) => void;
  creating: boolean;
  setCreating: (b: boolean) => void;
  editTable: TableData | null;
  setEditTable: (t: TableData | null) => void;
  zones: { id: string; name: string }[];
  createTableMutation: ReturnType<typeof useCreateTable>;
  updateTableMutation: ReturnType<typeof useUpdateTable>;
  deleteTableMutation: ReturnType<typeof useDeleteTable>;
  updateTableStatusMutation: ReturnType<typeof useUpdateTableStatus>;
}) {
  const [zoneFilter, setZoneFilter] = useState<"Toutes" | Zone>("Toutes");
  const [statusFilter, setStatusFilter] = useState<"Tous" | TableStatus>("Tous");
  const [search, setSearch] = useState("");
  const [transferFrom, setTransferFrom] = useState<TableData | null>(null);
  const [mergeFrom, setMergeFrom] = useState<TableData | null>(null);
  const [hoverReserved, setHoverReserved] = useState<{ tableId: string; top: number; left: number } | null>(null);

  const showReservedPreview = (e: React.MouseEvent<HTMLDivElement>, tableId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 248;
    const spaceRight = window.innerWidth - rect.right;
    const placeRight = spaceRight >= tooltipWidth + 16;
    const left = placeRight ? rect.right + 10 : Math.max(10, rect.left - tooltipWidth - 10);
    const top = Math.min(Math.max(rect.top + rect.height / 2, 90), window.innerHeight - 90);
    setHoverReserved({ tableId, top, left });
  };

  const filtered = tables.filter((t) => {
    if (zoneFilter !== "Toutes" && t.zone !== zoneFilter) return false;
    if (statusFilter !== "Tous" && t.status !== statusFilter) return false;
    if (search && !t.number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const deleteTable = (id: string) => {
    setTables((ts) => ts.filter((t) => t.id !== id));
    deleteTableMutation.mutate(id);
    pushToast("Table supprimée", "info");
  };

  const releaseTable = (id: string) => {
    setTables((ts) => ts.map((t) => (t.id === id ? { ...t, status: "libre" } : t)));
    updateTableStatusMutation.mutate({ id, status: "FREE" });
    pushToast("Table libérée");
  };

  const reserveTable = (id: string) => {
    setTables((ts) => ts.map((t) => (t.id === id ? { ...t, status: "reservee" } : t)));
    updateTableStatusMutation.mutate({ id, status: "RESERVED" });
    pushToast("Table marquée comme réservée");
  };

  const doTransfer = (toId: string) => {
    if (!transferFrom) return;
    setTables((ts) =>
      ts.map((t) => {
        if (t.id === transferFrom.id) return { ...t, status: "libre" };
        if (t.id === toId) return { ...t, status: "occupee" };
        return t;
      })
    );
    updateTableStatusMutation.mutate({ id: transferFrom.id, status: "FREE" });
    updateTableStatusMutation.mutate({ id: toId, status: "OCCUPIED" });
    pushToast(`Commande de ${transferFrom.number} transférée vers ${tables.find((t) => t.id === toId)?.number}`);
    setTransferFrom(null);
  };

  const doMerge = (toId: string) => {
    if (!mergeFrom) return;
    setTables((ts) => ts.map((t) => (t.id === mergeFrom.id ? { ...t, mergedInto: toId, status: "libre" } : t)));
    updateTableStatusMutation.mutate({ id: toId, status: "OCCUPIED" });
    pushToast(`Table ${mergeFrom.number} fusionnée avec ${tables.find((t) => t.id === toId)?.number}`);
    setMergeFrom(null);
  };

  return (
    <div className="p-6">
      {/* barre filtres */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Recherche rapide d'une table (ex: T5)"
            className={`${inputCls} pl-10 text-black`}
          />
        </div>

        <div className="flex items-center gap-1.5 bg-surface2 p-1 rounded-r2 border border-border">
          {(["Toutes", ...zones.map((z) => z.name)] as string[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoneFilter(z)}
              className={`t-std px-3.5 py-2 rounded-r font-extrabold text-[1.08rem] ${
                zoneFilter === z ? "bg-[var(--blue-soft)] text-black border border-blue" : "text-black hover:bg-surface3"
              }`}
            >
              {z}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 bg-surface2 p-1 rounded-r2 border border-border">
          <ListFilter size={15} className="ml-1.5 text-black" />
          {(["Tous", "libre", "occupee", "reservee"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`t-std px-3 py-2 rounded-r font-extrabold text-[1.05rem] ${
                statusFilter === s ? "bg-[var(--blue-soft)] text-black border border-blue" : "text-black hover:bg-surface3"
              }`}
            >
              {s === "Tous" ? "Tous" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {pickMode && (
        <div className="mb-4 px-4 py-3 rounded-r2 bg-[var(--orange-soft)] border border-orange/30 flex items-center justify-between">
          <span className="font-bold text-[1rem] text-orange flex items-center gap-2">
            {pickMode === "edit" ? <Pencil size={16} /> : <Trash2 size={16} />}
            Cliquez sur la table à {pickMode === "edit" ? "modifier" : "supprimer"}
          </span>
          <button onClick={() => setPickMode(null)} className="font-bold text-[0.95rem] text-black underline">
            Annuler
          </button>
        </div>
      )}

      {(transferFrom || mergeFrom) && (
        <div className="mb-4 px-4 py-3 rounded-r2 bg-[var(--blue-soft)] border border-blue/30 flex items-center justify-between">
          <span className="font-bold text-[1rem] text-black flex items-center gap-2">
            {transferFrom ? <ArrowLeftRight size={16} /> : <Merge size={16} />}
            {transferFrom
              ? `Sélectionnez la table de destination pour le transfert depuis ${transferFrom.number}`
              : `Sélectionnez la table cible pour fusionner avec ${mergeFrom?.number}`}
          </span>
          <button
            onClick={() => {
              setTransferFrom(null);
              setMergeFrom(null);
            }}
            className="font-bold text-[0.95rem] text-black underline"
          >
            Annuler
          </button>
        </div>
      )}

      {/* légende */}
      <div className="flex items-center gap-4 mb-5 text-[1.05rem] font-bold text-black">
        {(Object.keys(STATUS_LABEL) as TableStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_BORDER[s].replace("border-", "bg-")}`} />
            {STATUS_LABEL[s]}
          </span>
        ))}
      </div>

      {/* grille des tables */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
        {filtered.filter((t) => !t.mergedInto).map((table) => {
          const order = orders[table.id];
          const total = orderTotal(order);
          const isTransferTarget = !!transferFrom && table.id !== transferFrom.id;
          const isMergeTarget = !!mergeFrom && table.id !== mergeFrom.id;
          const isLocked = table.status === "occupee" && !pickMode && !transferFrom && !mergeFrom;
          const isOccupied = table.status === "occupee";
          const isFree = table.status === "libre";
          const isReserved = table.status === "reservee";

          return (
            <div
              key={table.id}
              onClick={() => {
                if (pickMode === "edit") {
                  setEditTable(table);
                  setPickMode(null);
                  return;
                }
                if (pickMode === "delete") {
                  deleteTable(table.id);
                  setPickMode(null);
                  return;
                }
                if (transferFrom) return isTransferTarget && doTransfer(table.id);
                if (mergeFrom) return isMergeTarget && doMerge(table.id);
                if (table.status === "occupee") return; // table occupée : verrouillée, utiliser l'icône Modifier
                openTable(table.id);
              }}
              onMouseEnter={(e) => {
                if (isReserved && !pickMode && !transferFrom && !mergeFrom) showReservedPreview(e, table.id);
              }}
              onMouseLeave={() => {
                if (isReserved) setHoverReserved((cur) => (cur?.tableId === table.id ? null : cur));
              }}
              style={
                isOccupied
                  ? { borderColor: "var(--blue)", background: "linear-gradient(135deg, #fff, var(--blue-soft))", borderWidth: 2 }
                  : isFree
                  ? { borderColor: "var(--green)", background: "linear-gradient(135deg, #fff, var(--green-soft))", borderWidth: 2 }
                  : isReserved
                  ? { borderColor: "var(--red)", background: "linear-gradient(135deg, #fff, var(--red-soft))", borderWidth: 2 }
                  : { borderWidth: 2 }
              }
              className={`group relative t-card bg-surface rounded-r2 border ${STATUS_BORDER[table.status]} shadow-card hover:shadow-modal hover:-translate-y-0.5 p-4 flex flex-col items-center gap-2 text-center ${
                isLocked ? "cursor-default" : "cursor-pointer"
              } ${
                (transferFrom && !isTransferTarget) || (mergeFrom && !isMergeTarget) ? "opacity-30 pointer-events-none" : ""
              }`}
            >
              <div className="flex items-center justify-center w-full">
                <span className="font-mono font-black text-[2rem] leading-none text-black">{table.number}</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-[1.05rem] font-bold text-black">
                <span className="flex items-center gap-1">
                  <Users size={13} /> {table.capacity} pers.
                </span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[0.95rem] font-extrabold">
                <span className={`w-2 h-2 rounded-full ${STATUS_BORDER[table.status].replace("border-", "bg-")}`} />
                <span
                  className={
                    table.status === "libre" ? "text-green" : table.status === "occupee" ? "text-blue" : "text-red"
                  }
                >
                  {STATUS_LABEL[table.status]}
                </span>
              </div>

              {order && order.items.length > 0 && (
                <div className="mt-1 px-2.5 py-1.5 rounded-r bg-surface2 font-mono font-extrabold text-[1.08rem] text-blue flex items-center justify-center gap-2 w-full">
                  <span>{fmt(total)}</span>
                  <span className="text-[0.98rem] text-black font-sans font-bold">{timeAgo(order.createdAt)}</span>
                </div>
              )}

              {/* actions rapides — uniquement sur tables occupées */}
              {table.status === "occupee" && !pickMode && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="hidden group-hover:flex absolute top-2 right-2 gap-1 bg-surface rounded-r shadow-modal p-1"
                >
                  <IconBtn icon={<Pencil size={13} strokeWidth={2.75} />} title="Modifier la commande" variant="primary" bold onClick={() => openTable(table.id)} />
                  <IconBtn icon={<ArrowLeftRight size={13} strokeWidth={2.75} />} title="Transférer commande" bold onClick={() => setTransferFrom(table)} />
                  <IconBtn icon={<Merge size={13} strokeWidth={2.75} />} title="Fusionner" bold onClick={() => setMergeFrom(table)} />
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* aperçu réservation au survol — rendu en position fixe pour toujours passer devant les autres tables */}
      {hoverReserved && (() => {
        const hoveredTable = tables.find((t) => t.id === hoverReserved.tableId);
        const hoveredReservation = hoveredTable
          ? reservations.find((r) => r.tableId === hoveredTable.id && r.statut === "confirmee")
          : undefined;
        if (!hoveredTable) return null;
        return (
          <div
            className="fixed z-[999] flex flex-col w-62 bg-surface rounded-r2 border border-border shadow-modal p-3.5 gap-1.5 text-left pointer-events-none"
            style={{ top: hoverReserved.top, left: hoverReserved.left, transform: "translateY(-50%)", width: 248 }}
          >
            <div className="flex items-center gap-1.5 text-red font-extrabold text-[0.95rem]">
              <CalendarClock size={13} /> Réservation — {hoveredTable.number}
            </div>
            {hoveredReservation ? (
              <>
                <p className="font-extrabold text-[1rem] text-black">
                  {hoveredReservation.prenom} {hoveredReservation.nom}
                </p>
                <p className="text-[0.92rem] font-semibold text-black flex items-center gap-1.5">
                  <Clock size={12} /> {hoveredReservation.heure} · {hoveredReservation.duree} min
                </p>
                <p className="text-[0.92rem] font-semibold text-black flex items-center gap-1.5">
                  <Users size={12} /> {hoveredReservation.personnes} pers.
                </p>
                <p className="text-[0.92rem] font-semibold text-black flex items-center gap-1.5">
                  <Phone size={12} /> {hoveredReservation.telephone}
                </p>
                {hoveredReservation.notes && (
                  <p className="text-[0.88rem] text-black italic">📝 {hoveredReservation.notes}</p>
                )}
              </>
            ) : (
              <p className="text-[0.92rem] font-semibold text-black">Aucun détail disponible.</p>
            )}
          </div>
        );
      })()}

      {filtered.length === 0 && (
        <div className="text-center py-20 text-black font-bold">Aucune table ne correspond à ces critères.</div>
      )}

      {(creating || editTable) && (
        <TableFormModal
          table={editTable}
          zones={zones}
          onClose={() => {
            setCreating(false);
            setEditTable(null);
          }}
          onSave={(t) => {
            const zoneId = zones.find((z) => z.name === t.zone)?.id;
            if (editTable) {
              setTables((ts) => ts.map((x) => (x.id === editTable.id ? t : x)));
              if (zoneId) {
                updateTableMutation.mutate({ id: editTable.id, name: t.number, capacity: t.capacity, zoneId });
              }
              pushToast("Table modifiée");
            } else {
              const tempId = uid();
              setTables((ts) => [...ts, { ...t, id: tempId }]);
              if (zoneId) {
                createTableMutation.mutate(
                  { name: t.number, capacity: t.capacity, zoneId },
                  {
                    onSuccess: (created: any) => {
                      setTables((ts) => ts.map((x) => (x.id === tempId ? { ...x, id: created.id } : x)));
                    },
                  }
                );
              }
              pushToast("Table créée");
            }
            setCreating(false);
            setEditTable(null);
          }}
        />
      )}
    </div>
  );
}

function TableFormModal({
  table,
  zones,
  onClose,
  onSave,
}: {
  table: TableData | null;
  zones: { id: string; name: string }[];
  onClose: () => void;
  onSave: (t: TableData) => void;
}) {
  const zoneNames = zones.length ? zones.map((z) => z.name) : ["Salle", "Terrasse", "Cafeteria"];
  const [number, setNumber] = useState(table?.number ?? "");
  const [zone, setZone] = useState<Zone>(table?.zone ?? zoneNames[0]);
  const [capacity, setCapacity] = useState(table?.capacity ?? 2);

  return (
    <Modal title="Modifier la table" onClose={onClose} width={420}>
      <div className="flex flex-col gap-4">
        <Field label="Numéro de table">
          <input className={`${inputCls} text-black`} value={number} onChange={(e) => setNumber(e.target.value)} placeholder="T15" />
        </Field>
        <Field label="Zone">
          <div className="flex gap-2 flex-wrap">
            {zoneNames.map((z) => (
              <button
                key={z}
                onClick={() => setZone(z)}
                className={`t-std flex-1 py-2.5 rounded-r font-extrabold border ${
                  zone === z ? "bg-[var(--blue-soft)] text-black border-blue" : "bg-surface2 border-border text-black"
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Capacité (personnes)">
          <input
            type="number"
            min={1}
            className={`${inputCls} text-black`}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </Field>
        <Btn
          variant="primary"
          full
          disabled={!number}
          onClick={() => onSave({ id: table?.id ?? "", number, zone, capacity, status: table?.status ?? "libre" })}
        >
          {table ? "Enregistrer" : "Créer la table"}
        </Btn>
      </div>
    </Modal>
  );
}

/* ============================================================================
   9. POS / MENU + PANIER
============================================================================ */

function POSView({
  table,
  tables,
  order,
  updateOrder,
  onCloseTable,
  onTransfer,
  onPay,
  pushToast,
  headerLabel,
}: {
  table: TableData | null;
  tables: TableData[];
  order: Order;
  updateOrder: (fn: (o: Order) => Order) => void;
  onCloseTable: (freeTable: boolean) => void;
  onTransfer: (toId: string) => void;
  onPay: (entry: Omit<HistoryEntry, "id" | "closedAt">) => void;
  pushToast: (m: string, k?: "success" | "error" | "info") => void;
  headerLabel?: string;
}) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [search, setSearch] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [showReturn, setShowReturn] = useState<CartItem | null>(null);
  const [cartCollapsed, setCartCollapsed] = useState(() => localStorage.getItem("rm_cart") === "1");
  const [selectedItemUid, setSelectedItemUid] = useState<string | null>(null);
  const [activePerson, setActivePerson] = useState<number | null>(null); // null = commun

  useEffect(() => {
    localStorage.setItem("rm_cart", cartCollapsed ? "1" : "0");
  }, [cartCollapsed]);

  const guestCount = order.guests ?? 1;
  const setGuestCount = (n: number) => {
    const clamped = Math.max(1, n);
    updateOrder((o) => ({ ...o, guests: clamped }));
    if (activePerson !== null && activePerson >= clamped) setActivePerson(null);
  };

  const products = PRODUCTS.filter(
    (p) => p.category === category && p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addProduct = (p: Product) => {
    updateOrder((o) => {
      const existing = o.items.find(
        (i) => i.productId === p.id && !i.offered && !i.returned && i.personIndex === (activePerson ?? undefined)
      );
      if (existing) {
        return { ...o, items: o.items.map((i) => (i.uid === existing.uid ? { ...i, qty: i.qty + 1 } : i)) };
      }
      return {
        ...o,
        items: [
          ...o.items,
          { uid: uid(), productId: p.id, name: p.name, price: p.price, qty: 1, personIndex: activePerson ?? undefined },
        ],
      };
    });
  };

  const changeQty = (itemUid: string, delta: number) => {
    updateOrder((o) => ({
      ...o,
      items: o.items
        .map((i) => (i.uid === itemUid ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    }));
  };

  const removeItem = (itemUid: string) => {
    updateOrder((o) => ({ ...o, items: o.items.filter((i) => i.uid !== itemUid) }));
  };

  const toggleOffer = (itemUid: string) => {
    updateOrder((o) => ({ ...o, items: o.items.map((i) => (i.uid === itemUid ? { ...i, offered: !i.offered } : i)) }));
  };

  const reassignPerson = (itemUid: string, personIndex: number | undefined) => {
    updateOrder((o) => ({
      ...o,
      items: o.items.map((i) => (i.uid === itemUid ? { ...i, personIndex } : i)),
    }));
  };

  const vider = () => {
    updateOrder((o) => ({ ...o, items: [] }));
    pushToast("Panier vidé", "info");
  };

  const setDiscount = (pct: number) => {
    updateOrder((o) => ({ ...o, discountPercent: pct }));
  };

  const total = orderTotal(order);
  const activeItems = order.items.filter((i) => !i.returned);
  const cartWidth = cartCollapsed ? 76 : 420;
  const selectedItem = order.items.find((i) => i.uid === selectedItemUid) ?? null;
  const menuMinCard = cartCollapsed ? 210 : 160;
  const menuCardHeight = cartCollapsed ? 300 : 260;

  return (
    <div className="flex h-screen">
      {/* zone menu */}
      <div className="flex-1 min-w-0 flex flex-col p-5 t-std" style={{ marginRight: cartWidth }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Recherche rapide d'un produit..."
              className={`${inputCls} pl-10 text-black`}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`t-std shrink-0 px-4 py-2.5 rounded-r2 font-extrabold text-[1rem] border ${
                category === c ? "bg-[var(--blue-soft)] text-black border-blue shadow-glow" : "bg-surface border-border text-black hover:bg-surface3"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div
          className="grid gap-3 overflow-y-auto pr-1 flex-1 t-std"
          style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${menuMinCard}px, 1fr))` }}
        >
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => addProduct(p)}
              className="img-zoom t-card text-left bg-surface rounded-r2 border border-border shadow-card hover:shadow-modal hover:-translate-y-0.5 overflow-hidden flex flex-col relative t-std"
              style={{ height: menuCardHeight }}
            >
              <div className="flex-1 min-h-[120px] flex items-center justify-center bg-surface3 relative overflow-hidden">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[3.4rem] leading-none">{p.emoji}</span>
                )}
              </div>
              <div className="p-3 flex flex-col gap-1 bg-surface border-t border-border text-center">
                <span className="font-extrabold text-[1.02rem] leading-tight text-black">{p.name}</span>
                <span className="font-mono font-black text-blue text-[1rem]">{fmt(p.price)}</span>
              </div>
              <span className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-blue text-white flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-glow">
                <Plus size={16} />
              </span>
            </button>
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-center py-16 text-black font-bold">Aucun produit trouvé.</div>
          )}
        </div>
      </div>

      {/* panneau panier — rétractable */}
      <div
        className="fixed right-0 top-0 bottom-0 t-std bg-surface border-l border-border flex flex-col shadow-modal overflow-hidden"
        style={{ width: cartWidth }}
      >
        {cartCollapsed ? (
          <div className="flex flex-col items-center h-full py-4 gap-4">
            <IconBtn
              icon={<ChevronLeft size={18} />}
              title="Déplier le panier"
              variant="primary"
              onClick={() => setCartCollapsed(false)}
            />
            <div className="relative">
              <ShoppingBag size={22} className="text-black" />
              {activeItems.length > 0 && (
                <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue text-white text-[0.95rem] font-black flex items-center justify-center">
                  {activeItems.reduce((s, i) => s + i.qty, 0)}
                </span>
              )}
            </div>
            <div className="flex-1 flex items-center">
              <span
                className="font-mono font-black text-blue text-[0.98rem] whitespace-nowrap"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                {fmt(total)}
              </span>
            </div>
            <Btn variant="primary" small disabled={order.items.length === 0} onClick={() => setShowPayment(true)}>
              <CreditCard size={14} />
            </Btn>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-2">
              <IconBtn
                icon={<ChevronRight size={16} />}
                title="Réduire le panier"
                onClick={() => setCartCollapsed(true)}
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-[1rem] truncate text-black">{table ? `Commande ${table.number}` : headerLabel ?? "Commande à emporter"}</h3>
                <span className="text-[1rem] font-bold text-black">
                  {activeItems.reduce((s, i) => s + i.qty, 0)} article(s)
                </span>
              </div>
            </div>

            {/* barre des personnes — sans sélection : rattache les prochains produits ajoutés à la personne choisie.
               avec un article sélectionné dans le panier : réassigne directement cet article à la personne cliquée. */}
            <div className="px-5 py-2.5 border-b border-border flex items-center gap-1.5 overflow-x-auto bg-surface2">
              <button
                onClick={() => (selectedItem ? reassignPerson(selectedItem.uid, undefined) : setActivePerson(null))}
                className={`t-std shrink-0 px-3 py-1.5 rounded-r2 font-extrabold text-[0.9rem] border ${
                  (selectedItem ? selectedItem.personIndex === undefined : activePerson === null)
                    ? "bg-[var(--blue-soft)] border-blue text-black"
                    : "bg-surface border-border text-black"
                }`}
              >
                Commun
              </button>
              {Array.from({ length: guestCount }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => (selectedItem ? reassignPerson(selectedItem.uid, i) : setActivePerson(i))}
                  className={`t-std shrink-0 px-3 py-1.5 rounded-r2 font-extrabold text-[0.9rem] border ${
                    (selectedItem ? selectedItem.personIndex === i : activePerson === i)
                      ? "bg-[var(--blue-soft)] border-blue text-black"
                      : "bg-surface border-border text-black"
                  }`}
                >
                  Pers. {i + 1}
                </button>
              ))}
              <IconBtn icon={<Plus size={13} />} title="Ajouter une personne" onClick={() => setGuestCount(guestCount + 1)} />
              {guestCount > 1 && (
                <IconBtn icon={<Minus size={13} />} title="Retirer une personne" onClick={() => setGuestCount(guestCount - 1)} />
              )}
            </div>

            {/* barre d'actions — s'applique à l'article sélectionné, plus d'icônes sur chaque plat */}
            <div className="px-5 py-2.5 border-b border-border flex items-center gap-2 bg-surface2">
              <span className="text-[1rem] font-bold text-black truncate flex-1">
                {selectedItem ? `Sélectionné : ${selectedItem.name} — cliquez une personne ci-dessus pour la réassigner` : "Touchez un article pour le sélectionner"}
              </span>
              <div className="flex gap-1.5 shrink-0 items-center">
                <IconBtn
                  icon={<span style={{ fontSize: 13, lineHeight: 1 }}>🎁</span>}
                  title="Offrir / annuler l'offre"
                  variant={selectedItem?.offered ? "primary" : "default"}
                  disabled={!selectedItem || selectedItem.returned}
                  onClick={() => selectedItem && toggleOffer(selectedItem.uid)}
                />
                <IconBtn
                  icon={<span style={{ fontSize: 13, lineHeight: 1 }}>↩</span>}
                  title="Retourner"
                  disabled={!selectedItem || selectedItem.returned}
                  onClick={() => selectedItem && setShowReturn(selectedItem)}
                />
                <IconBtn
                  icon={<Trash2 size={14} />}
                  title="Supprimer"
                  variant="danger"
                  disabled={!selectedItem}
                  onClick={() => {
                    if (selectedItem) {
                      removeItem(selectedItem.uid);
                      setSelectedItemUid(null);
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2.5">
              {order.items.length === 0 && (
                <div className="text-center py-16 text-black font-bold text-[1.02rem]">
                  Le panier est vide.
                  <br />
                  Sélectionnez des produits dans le menu.
                </div>
              )}
              {order.items.map((item) => (
                <div
                  key={item.uid}
                  onClick={() => setSelectedItemUid((cur) => (cur === item.uid ? null : item.uid))}
                  className={`t-std cursor-pointer rounded-r2 border px-3 py-2.5 flex items-center justify-between gap-2 ${
                    item.uid === selectedItemUid ? "ring-2 ring-blue border-blue" : ""
                  } ${
                    item.returned ? "border-red/30 bg-[var(--red-soft)] opacity-70" : item.offered ? "border-green/30 bg-[var(--green-soft)]" : "border-border bg-surface2"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[1.1rem] shrink-0">{productEmoji(item.productId)}</span>
                    <div className="min-w-0">
                      <p className="font-extrabold text-[0.98rem] truncate text-black">{item.name}</p>
                      {item.note && <p className="text-[0.98rem] text-black font-semibold truncate">📝 {item.note}</p>}
                      {item.returned && (
                        <p className="text-[0.98rem] text-red font-bold">Retourné{item.returnReason ? ` — ${item.returnReason}` : ""}</p>
                      )}
                      {item.offered && <p className="text-[0.98rem] text-green font-bold">Offert</p>}
                    </div>
                  </div>

                  {item.personIndex !== undefined && (
                    <span className="text-[0.78rem] font-black text-blue bg-[var(--blue-soft)] rounded-full px-1.5 py-0.5 shrink-0">
                      P{item.personIndex + 1}
                    </span>
                  )}

                  <span className="font-mono font-black w-6 text-center text-[0.98rem] text-black shrink-0">{item.qty}</span>
                </div>
              ))}
            </div>

            {/* footer panier */}
            <div className="border-t border-border p-5 flex flex-col gap-3">
              {order.clientNote && (
                <div className="px-3 py-2 rounded-r bg-surface3 text-[1.05rem] font-semibold text-black flex items-center gap-2">
                  📝 {order.clientNote}
                </div>
              )}

              {!!order.discountPercent && (
                <div className="px-3 py-2 rounded-r bg-[var(--orange-soft)] text-[1.05rem] font-bold text-black flex items-center gap-2">
                  % Remise appliquée : -{order.discountPercent}%
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="font-extrabold text-black text-[1.08rem]">Total</span>
                <span className="font-mono font-black text-[1.5rem] text-blue">{fmt(total)}</span>
              </div>

              <Btn variant="primary" full disabled={order.items.length === 0} onClick={() => setShowPayment(true)}>
                <CreditCard size={16} /> Encaisser
              </Btn>
            </div>
          </>
        )}
      </div>

      {showReturn && (
        <ReturnModal
          item={showReturn}
          onClose={() => setShowReturn(null)}
          onConfirm={(reason) => {
            updateOrder((o) => ({
              ...o,
              items: o.items.map((i) => (i.uid === showReturn.uid ? { ...i, returned: true, returnReason: reason } : i)),
            }));
            pushToast("Plat marqué comme retourné", "info");
            setShowReturn(null);
            setSelectedItemUid(null);
          }}
        />
      )}

      {showPayment && (
        <PaymentModal
          order={order}
          table={table}
          onClose={() => setShowPayment(false)}
          onSetDiscount={setDiscount}
          onConfirm={(method) => {
            onPay({
              type: table ? "sur_place" : "emporter",
              tableLabel: table?.number,
              items: order.items,
              total,
              method,
            });
            pushToast("Paiement encaissé avec succès");
            setShowPayment(false);
            onCloseTable(true);
          }}
        />
      )}
    </div>
  );
}

function CancelOrderModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <Modal title="Annuler la commande" onClose={onClose} width={400} icon={<AlertTriangle size={18} />}>
      <p className="text-[0.98rem] font-semibold text-black mb-3">
        Tous les articles seront supprimés et la table sera libérée. Cette action est irréversible.
      </p>
      <input
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motif de l'annulation (facultatif)"
        className={`${inputCls} mb-4 text-black`}
      />
      <div className="grid grid-cols-2 gap-2">
        <Btn variant="default" onClick={onClose}>
          Retour
        </Btn>
        <Btn variant="danger" onClick={() => onConfirm(reason)}>
          <X size={16} /> Confirmer l'annulation
        </Btn>
      </div>
    </Modal>
  );
}

function NoteModal({
  isClient,
  initial,
  onClose,
  onSave,
}: {
  isClient: boolean;
  initial: string;
  onClose: () => void;
  onSave: (t: string) => void;
}) {
  const [text, setText] = useState(initial);
  return (
    <Modal title={isClient ? "Note client" : "Note sur le plat"} onClose={onClose} width={400} icon={<span style={{ fontSize: 18, lineHeight: 1 }}>📝</span>}>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder={isClient ? "Allergie, demande spéciale..." : "Sans oignon, cuisson à point..."}
        className={`${inputCls} resize-none mb-4 text-black`}
      />
      <Btn variant="primary" full onClick={() => onSave(text)}>
        Enregistrer la note
      </Btn>
    </Modal>
  );
}

function ReturnModal({ item, onClose, onConfirm }: { item: CartItem; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <Modal title={`Retourner — ${item.name}`} onClose={onClose} width={400} icon={<span style={{ fontSize: 18, lineHeight: 1 }}>↩</span>}>
      <p className="text-[0.98rem] font-semibold text-black mb-3">Motif du retour (facultatif)</p>
      <input
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Plat froid, erreur de commande..."
        className={`${inputCls} mb-4 text-black`}
      />
      <Btn variant="danger" full onClick={() => onConfirm(reason)}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>↩</span> Confirmer le retour
      </Btn>
    </Modal>
  );
}

function ComplaintModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [text, setText] = useState("");
  return (
    <Modal title="Réclamation client" onClose={onClose} width={420} icon={<AlertTriangle size={18} />}>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Décrire la réclamation du client..."
        className={`${inputCls} resize-none mb-4 text-black`}
      />
      <Btn variant="warning" full onClick={onConfirm}>
        Enregistrer la réclamation
      </Btn>
    </Modal>
  );
}

function TransferModal({
  tables,
  onClose,
  onSelect,
}: {
  tables: TableData[];
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <Modal title="Transférer la commande" onClose={onClose} width={460} icon={<ArrowLeftRight size={18} />}>
      {tables.length === 0 ? (
        <p className="text-black font-bold text-center py-6">Aucune table libre disponible.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {tables.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className="t-card rounded-r2 border border-border bg-surface2 hover:bg-blue hover:text-black hover:border-blue p-4 flex flex-col items-center gap-1 text-black"
            >
              <span className="font-mono font-black text-[1.3rem]">{t.number}</span>
              <span className="text-[0.85rem] font-bold opacity-70">{t.zone}</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ============================================================================
   10. PAIEMENT — total / par personne / par plat
============================================================================ */

function SplitByPerson({
  order,
  guestCount,
  onValidate,
}: {
  order: Order;
  guestCount: number;
  onValidate: () => void;
}) {
  const items = order.items.filter((i) => !i.returned);
  const shared = items
    .filter((i) => i.personIndex === undefined)
    .reduce((s, i) => s + (i.offered ? 0 : i.price * i.qty), 0);
  const sharedPerPerson = guestCount > 0 ? shared / guestCount : 0;

  const personTotal = (p: number) =>
    items.filter((i) => i.personIndex === p).reduce((s, i) => s + (i.offered ? 0 : i.price * i.qty), 0) +
    sharedPerPerson;

  const [groups, setGroups] = useState<number[][]>(() =>
    Array.from({ length: guestCount }).map((_, i) => [i])
  );
  const [selection, setSelection] = useState<number[]>([]);
  const [paidGroupIdx, setPaidGroupIdx] = useState<number[]>([]);

  const toggleSelect = (p: number) =>
    setSelection((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));

  const mergeSelection = () => {
    if (selection.length < 2) return;
    setGroups((gs) => {
      const remaining = gs.map((g) => g.filter((p) => !selection.includes(p))).filter((g) => g.length > 0);
      return [...remaining, [...selection].sort((a, b) => a - b)];
    });
    setSelection([]);
  };

  const resetGroups = () => {
    setGroups(Array.from({ length: guestCount }).map((_, i) => [i]));
    setPaidGroupIdx([]);
    setSelection([]);
  };

  const groupTotal = (g: number[]) => g.reduce((s, p) => s + personTotal(p), 0);
  const allPaid = paidGroupIdx.length >= groups.length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[0.95rem] font-semibold text-black">
        Cochez plusieurs personnes pour qu'elles paient ensemble, puis « Grouper ». Chacune peut aussi payer seule.
      </p>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: guestCount }).map((_, p) => (
          <button
            key={p}
            onClick={() => toggleSelect(p)}
            className={`t-std px-3 py-2 rounded-r2 font-extrabold text-[0.92rem] border ${
              selection.includes(p) ? "bg-[var(--orange-soft)] border-orange text-black" : "bg-surface2 border-border text-black"
            }`}
          >
            Pers. {p + 1} — {fmt(personTotal(p))}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Btn small disabled={selection.length < 2} onClick={mergeSelection}>
          <Merge size={14} /> Grouper la sélection
        </Btn>
        <Btn small variant="ghost" onClick={resetGroups}>
          Réinitialiser
        </Btn>
      </div>

      <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1">
        {groups.map((g, gi) => {
          const paid = paidGroupIdx.includes(gi);
          return (
            <div
              key={gi}
              className={`flex items-center justify-between px-4 py-3 rounded-r2 border ${
                paid ? "bg-[var(--green-soft)] border-green/40" : "bg-surface2 border-border"
              }`}
            >
              <span className="font-extrabold text-[1rem] text-black">
                {g.length > 1 ? `Personnes ${g.map((p) => p + 1).join(" + ")}` : `Personne ${g[0] + 1}`}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-blue">{fmt(groupTotal(g))}</span>
                <Btn
                  small
                  variant={paid ? "success" : "default"}
                  onClick={() => setPaidGroupIdx((pi) => (paid ? pi.filter((x) => x !== gi) : [...pi, gi]))}
                >
                  {paid ? <Check size={14} /> : "Payer"}
                </Btn>
              </div>
            </div>
          );
        })}
      </div>

      <Btn variant="success" full disabled={!allPaid} onClick={onValidate}>
        <Check size={18} /> {allPaid ? "Tous les groupes ont payé — Valider" : `${paidGroupIdx.length}/${groups.length} groupe(s) payé(s)`}
      </Btn>
    </div>
  );
}

function PaymentModal({
  order,
  table,
  onClose,
  onConfirm,
  onSetDiscount,
}: {
  order: Order;
  table?: TableData | null;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => void;
  onSetDiscount: (pct: number) => void;
}) {
  const [mode, setMode] = useState<"total" | "personne" | "plat">("total");
  const [method, setMethod] = useState<PaymentMethod>("especes");
  const [cashGiven, setCashGiven] = useState<string>("");
  const [mixedCash, setMixedCash] = useState<string>("");
  const [showTicket, setShowTicket] = useState(false);
  const [autoPrint, setAutoPrint] = useState(true);
  const [ticketNumber] = useState(() => `TCK-${Date.now().toString().slice(-6)}`);
  const [ticketDate] = useState(() => new Date());

  const tableLabel = table?.number;
  const total = orderTotal(order);

  const cashGivenNum = Number(cashGiven) || 0;
  const change = Math.max(0, cashGivenNum - total);

  const mixedCashNum = Number(mixedCash) || 0;
  const mixedCardNum = Math.max(0, total - mixedCashNum);

  const subtotal = order.items.filter((i) => !i.returned).reduce((s, i) => s + (i.offered ? 0 : i.price * i.qty), 0);
  const discountAmount = order.discountPercent ? (subtotal * order.discountPercent) / 100 : 0;

  const methodLabelFull: Record<PaymentMethod, string> = {
    especes: "Espèces",
    carte: "Carte (TPE)",
    cib: "CIB en ligne",
    mixte: "Mixte",
  };

  const printReceipt = () => {
    const rows = order.items
      .filter((i) => !i.returned)
      .map(
        (i) =>
          `<div class="r-item"><div class="r-item-name">${i.qty}x ${i.name}${
            i.offered ? " (offert)" : ""
          }</div><div class="r-item-price">${fmt(i.offered ? 0 : i.price * i.qty)}</div></div>`
      )
      .join("");
    const css = `*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Courier New',monospace;font-size:13px;padding:18px;color:#111;background:#fff;max-width:340px;}.r-center{text-align:center;}.r-title{font-weight:900;font-size:1.05rem;letter-spacing:1px;}.r-sub{color:#555;font-size:.72rem;margin-top:2px;}.r-sep{border:none;border-top:1px dashed #999;margin:10px 0;}.r-info-row{display:flex;justify-content:space-between;font-size:.75rem;color:#333;line-height:1.6;}.r-item{display:flex;justify-content:space-between;font-size:.86rem;line-height:1.7;gap:8px;}.r-item-name{flex:1;}.r-item-price{font-weight:700;}.r-total-row{display:flex;justify-content:space-between;font-size:.85rem;padding:2px 0;}.r-grand{display:flex;justify-content:space-between;font-weight:900;font-size:1.15rem;margin-top:6px;padding-top:8px;border-top:2px solid #111;}.r-grand span:last-child{color:#2563eb;}.r-footer{text-align:center;margin-top:16px;font-size:.72rem;color:#555;line-height:1.6;}.r-barcode{text-align:center;letter-spacing:2px;font-size:1.4rem;margin-top:10px;color:#111;}@media print{body{padding:6px;}}`;
    const html = `
      <div class="r-center">
        <div class="r-title">🍽 RESTAUMANAGER</div>
        <div class="r-sub">12 Rue des Frères Bencherif, Sétif</div>
        <div class="r-sub">Tél: 036 84 00 00 · RC 00/00-0000000B00</div>
      </div>
      <div class="r-sep"></div>
      <div class="r-info-row"><span>Ticket N°</span><span>${ticketNumber}</span></div>
      <div class="r-info-row"><span>Date</span><span>${ticketDate.toLocaleDateString("fr-FR")}</span></div>
      <div class="r-info-row"><span>Heure</span><span>${ticketDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span></div>
      <div class="r-info-row"><span>${tableLabel ? "Table" : "Type"}</span><span>${tableLabel ? `Table ${tableLabel}` : "À emporter"}</span></div>
      <div class="r-info-row"><span>Caissier</span><span>Poste 1</span></div>
      <div class="r-sep"></div>
      ${rows}
      <div class="r-sep"></div>
      <div class="r-total-row"><span>Sous-total</span><span>${fmt(subtotal)}</span></div>
      ${
        order.discountPercent
          ? `<div class="r-total-row"><span>Remise (-${order.discountPercent}%)</span><span>-${fmt(discountAmount)}</span></div>`
          : ""
      }
      <div class="r-grand"><span>TOTAL</span><span>${fmt(total)}</span></div>
      <div class="r-sep"></div>
      <div class="r-info-row"><span>Paiement</span><span style="text-transform:uppercase">${methodLabelFull[method]}</span></div>
      ${
        method === "especes" && cashGivenNum > 0
          ? `<div class="r-info-row"><span>Montant reçu</span><span>${fmt(cashGivenNum)}</span></div><div class="r-info-row"><span>Monnaie rendue</span><span>${fmt(change)}</span></div>`
          : ""
      }
      <div class="r-footer">
        Merci de votre visite !<br/>
        À très bientôt 🙏
      </div>
      <div class="r-barcode">▌▍▌▌▍▍▌▍▌▌▍▌▍▍▌▌▍▌</div>
    `;
    const w = window.open("", "_blank", "width=380,height=680");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`);
    w.document.close();
    w.onload = () => w.print();
  };

  useEffect(() => {
    if (showTicket && autoPrint) {
      printReceipt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTicket]);

  if (showTicket) {
    return (
      <Modal title="Ticket de caisse" onClose={onClose} width={400} icon={<Receipt size={18} />}>
        <div className="font-mono text-[0.95rem] bg-surface2 rounded-r2 p-5 border border-dashed border-border2 mb-4">
          <div className="text-center mb-1">
            <div className="font-black text-[1.05rem] text-black tracking-wide">🍽 RESTAUMANAGER</div>
            <div className="text-black text-[1.08rem] mt-0.5">12 Rue des Frères Bencherif, Sétif</div>
            <div className="text-black text-[1.08rem]">Tél: 036 84 00 00</div>
          </div>

          <div className="border-t border-dashed border-border2 my-3" />

          <div className="flex flex-col gap-1 text-[1rem] text-black">
            <div className="flex justify-between">
              <span>Ticket N°</span>
              <span className="font-bold text-black">{ticketNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date</span>
              <span className="font-bold text-black">{ticketDate.toLocaleDateString("fr-FR")}</span>
            </div>
            <div className="flex justify-between">
              <span>Heure</span>
              <span className="font-bold text-black">
                {ticketDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{tableLabel ? "Table" : "Type"}</span>
              <span className="font-bold text-black">{tableLabel ? `Table ${tableLabel}` : "À emporter"}</span>
            </div>
            <div className="flex justify-between">
              <span>Caissier</span>
              <span className="font-bold text-black">Poste 1</span>
            </div>
          </div>

          <div className="border-t border-dashed border-border2 my-3" />

          <div className="flex flex-col gap-1">
            {order.items
              .filter((i) => !i.returned)
              .map((i) => (
                <div key={i.uid} className="flex justify-between py-0.5 text-black">
                  <span>
                    {i.qty}x {i.name}
                    {i.offered ? " (offert)" : ""}
                  </span>
                  <span className="font-mono text-blue font-bold">{fmt(i.offered ? 0 : i.price * i.qty)}</span>
                </div>
              ))}
          </div>

          <div className="border-t border-dashed border-border2 my-3" />

          <div className="flex flex-col gap-1 text-black">
            <div className="flex justify-between text-[0.95rem]">
              <span>Sous-total</span>
              <span>{fmt(subtotal)}</span>
            </div>
            {order.discountPercent ? (
              <div className="flex justify-between text-[0.95rem] font-bold">
                <span>Remise (-{order.discountPercent}%)</span>
                <span>-{fmt(discountAmount)}</span>
              </div>
            ) : null}
          </div>

          <div className="flex justify-between font-black text-[1.1rem] mt-2 pt-2 border-t-2 border-black text-black">
            <span>TOTAL</span>
            <span className="text-blue">{fmt(total)}</span>
          </div>

          <div className="border-t border-dashed border-border2 my-3" />

          <div className="flex flex-col gap-1 text-[1.05rem] text-black">
            <div className="flex justify-between">
              <span>Paiement</span>
              <span className="uppercase font-bold">{methodLabelFull[method]}</span>
            </div>
            {method === "especes" && cashGivenNum > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Montant reçu</span>
                  <span>{fmt(cashGivenNum)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monnaie rendue</span>
                  <span>{fmt(change)}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center text-black mt-4 text-[1rem] leading-relaxed">
            Merci de votre visite !
            <br />
            À très bientôt 🙏
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Btn variant="default" onClick={printReceipt}>
            <Printer size={16} /> Imprimer
          </Btn>
          <Btn variant="primary" onClick={() => onConfirm(method)}>
            <Check size={16} /> Terminer
          </Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Encaissement" onClose={onClose} width={900} icon={<CreditCard size={18} />}>
      <p className="font-mono font-black text-[1.15rem] text-blue mb-5 text-center">
        {table ? `Table ${table.number}` : "Commande à emporter"}
      </p>

      <div className="flex gap-6 items-start">
        {/* colonne gauche — total, remise, mode de répartition */}
        <div className="w-[240px] shrink-0 flex flex-col gap-4">
          <div className="px-4 py-3 rounded-r2 bg-surface3">
            <span className="font-extrabold text-black text-[0.95rem]">Total à encaisser</span>
            <div className="font-mono font-black text-[1.7rem] text-blue leading-tight mt-0.5">{fmt(total)}</div>
          </div>

          <Field label="Remise">
            <div className="grid grid-cols-3 gap-1.5">
              {[0, 5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  onClick={() => onSetDiscount(pct)}
                  className={`t-std py-2 rounded-r font-extrabold text-[0.88rem] border ${
                    (order.discountPercent ?? 0) === pct
                      ? "bg-[var(--orange-soft)] text-black border-orange"
                      : "bg-surface2 border-border text-black hover:bg-surface3"
                  }`}
                >
                  {pct === 0 ? "Aucune" : `-${pct}%`}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Mode de paiement">
            <div className="flex flex-col gap-1.5">
              {[
                { key: "total", label: "Paiement total" },
                { key: "personne", label: "Par personne" },
                { key: "plat", label: "Par plat" },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key as any)}
                  className={`t-std text-left px-3 py-2.5 rounded-r2 font-extrabold text-[0.98rem] border ${
                    mode === m.key ? "bg-[var(--blue-soft)] text-black border-blue" : "bg-surface2 border-border text-black hover:bg-surface3"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* colonne droite — détails du mode sélectionné */}
        <div className="flex-1 min-w-0">
          {mode === "total" && (
            <div className="flex flex-col gap-4">
              <Field label="Moyen de paiement">
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      { key: "especes", label: "Espèces", icon: <Banknote size={16} /> },
                      { key: "carte", label: "Carte (TPE)", icon: <CreditCard size={16} /> },
                      { key: "cib", label: "CIB en ligne", icon: <Smartphone size={16} /> },
                      { key: "mixte", label: "Mixte", icon: <Layers size={16} /> },
                    ] as { key: PaymentMethod; label: string; icon: React.ReactNode }[]
                  ).map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setMethod(m.key)}
                      className={`t-std flex flex-col items-center justify-center gap-1.5 py-3 rounded-r2 font-extrabold text-[0.86rem] border ${
                        method === m.key ? "bg-[var(--blue-soft)] text-black border-blue shadow-glow" : "bg-surface2 border-border text-black hover:bg-surface3"
                      }`}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="flex gap-4">
                {method === "especes" && (
                  <Field label="Montant donné par le client">
                    <input
                      type="number"
                      className={`${inputCls} text-black`}
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      placeholder={String(total)}
                    />
                    {cashGivenNum > 0 && (
                      <p className="text-[0.98rem] font-bold text-black mt-1">Monnaie à rendre : <span className="text-blue">{fmt(change)}</span></p>
                    )}
                  </Field>
                )}

                {method === "mixte" && (
                  <Field label="Répartition espèces / carte">
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        className={`${inputCls} text-black`}
                        value={mixedCash}
                        onChange={(e) => setMixedCash(e.target.value)}
                        placeholder="Montant en espèces"
                      />
                      <span className="font-bold text-black">+</span>
                      <div className={`${inputCls} bg-surface3 text-blue font-bold`}>{fmt(mixedCardNum)} carte</div>
                    </div>
                  </Field>
                )}
              </div>

              <label className="flex items-center gap-2.5 px-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoPrint}
                  onChange={(e) => setAutoPrint(e.target.checked)}
                  className="w-4 h-4 accent-[var(--blue)]"
                />
                <span className="text-[0.95rem] font-bold text-black">Impression automatique du ticket</span>
              </label>

              <Btn variant="success" full onClick={() => setShowTicket(true)}>
                <Check size={18} /> Valider le paiement
              </Btn>
            </div>
          )}

          {mode === "personne" && (
            <SplitByPerson order={order} guestCount={order.guests ?? 1} onValidate={() => setShowTicket(true)} />
          )}

          {mode === "plat" && <SplitByItem order={order} onValidate={() => setShowTicket(true)} />}
        </div>
      </div>
    </Modal>
  );
}

function SplitByItem({ order, onValidate }: { order: Order; onValidate: () => void }) {
  const items = order.items.filter((i) => !i.returned);
  const [assign, setAssign] = useState<Record<string, number>>({});
  const [numPersons, setNumPersons] = useState(2);

  const totals = Array.from({ length: numPersons }).map((_, p) =>
    items.reduce((sum, i) => (assign[i.uid] === p ? sum + (i.offered ? 0 : i.price * i.qty) : sum), 0)
  );
  const allAssigned = items.every((i) => assign[i.uid] !== undefined);

  return (
    <div className="flex flex-col gap-4">
      <Field label="Nombre de personnes">
        <div className="flex items-center gap-3">
          <IconBtn icon={<Minus size={14} />} onClick={() => setNumPersons((g) => Math.max(2, g - 1))} />
          <span className="font-mono font-black text-[1.4rem] w-10 text-center text-black">{numPersons}</span>
          <IconBtn icon={<Plus size={14} />} onClick={() => setNumPersons((g) => g + 1)} />
        </div>
      </Field>

      <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
        {items.map((i) => (
          <div key={i.uid} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-r2 bg-surface2 border border-border">
            <div className="min-w-0">
              <p className="font-extrabold text-[0.98rem] truncate text-black">
                {i.qty}x {i.name}
              </p>
              <p className="font-mono text-[1.05rem] text-blue font-bold">{fmt(i.offered ? 0 : i.price * i.qty)}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              {Array.from({ length: numPersons }).map((_, p) => (
                <button
                  key={p}
                  onClick={() => setAssign((a) => ({ ...a, [i.uid]: p }))}
                  className={`t-std w-8 h-8 rounded-r font-extrabold text-[1.05rem] border ${
                    assign[i.uid] === p ? "bg-[var(--blue-soft)] text-black border-blue" : "bg-surface3 text-black border-transparent"
                  }`}
                >
                  {p + 1}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${numPersons}, 1fr)` }}>
        {totals.map((t, p) => (
          <div key={p} className="text-center px-2 py-2 rounded-r bg-surface3">
            <p className="text-[0.98rem] font-bold text-black">Pers. {p + 1}</p>
            <p className="font-mono font-black text-[0.98rem] text-blue">{fmt(t)}</p>
          </div>
        ))}
      </div>

      <Btn variant="success" full disabled={!allAssigned} onClick={onValidate}>
        <Check size={18} /> {allAssigned ? "Valider la répartition" : "Assignez tous les plats"}
      </Btn>
    </div>
  );
}

/* ============================================================================
   11. RÉSERVATIONS
============================================================================ */

const RES_STATUS_LABEL: Record<Reservation["statut"], string> = {
  confirmee: "Réservée",
  annulee: "Annulée",
  decalee: "Décalée",
  honoree: "Honorée",
};

const RES_STATUS_COLOR: Record<Reservation["statut"], "green" | "red" | "orange" | "blue"> = {
  confirmee: "green",
  annulee: "red",
  decalee: "orange",
  honoree: "blue",
};

function ReservationsView({
  reservations,
  setReservations,
  tables,
  pushToast,
}: {
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  tables: TableData[];
  pushToast: (m: string, k?: "success" | "error" | "info") => void;
}) {
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [creating, setCreating] = useState(false);
  const [cancelling, setCancelling] = useState<Reservation | null>(null);
  const [rescheduling, setRescheduling] = useState<Reservation | null>(null);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<"toutes" | Reservation["statut"]>("toutes");

  const isSearching = search.trim().length > 0;

  // Recherche par nom client : quand une recherche est en cours, on cherche dans TOUTES les
  // réservations (peu importe la date), pour retrouver un client sans devoir connaître sa date.
  // Sans recherche, on affiche simplement les réservations du jour sélectionné, triées par heure.
  const dayReservations = reservations
    .filter((r) => (isSearching ? true : r.date === dateFilter))
    .filter((r) => (statutFilter === "toutes" ? true : r.statut === statutFilter))
    .filter((r) => {
      if (!isSearching) return true;
      const table = tables.find((t) => t.id === r.tableId);
      const hay = `${r.nom} ${r.prenom} ${r.telephone} ${table?.number ?? ""}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    })
    .sort((a, b) => (isSearching ? (a.date + a.heure).localeCompare(b.date + b.heure) : a.heure.localeCompare(b.heure)));

  const counts = {
    confirmee: reservations.filter((r) => r.date === dateFilter && r.statut === "confirmee").length,
    decalee: reservations.filter((r) => r.date === dateFilter && r.statut === "decalee").length,
    annulee: reservations.filter((r) => r.date === dateFilter && r.statut === "annulee").length,
  };

  const confirmCancel = (reason: string) => {
    if (!cancelling) return;
    setReservations((rs) =>
      rs.map((r) => (r.id === cancelling.id ? { ...r, statut: "annulee", annulationRaison: reason || "Non précisé" } : r))
    );
    pushToast("Réservation annulée", "info");
    setCancelling(null);
  };

  const confirmReschedule = (date: string, heure: string) => {
    if (!rescheduling) return;
    setReservations((rs) =>
      rs.map((r) =>
        r.id === rescheduling.id ? { ...r, statut: "decalee", decaleeDate: date, decaleeHeure: heure } : r
      )
    );
    pushToast("Réservation décalée à une heure ultérieure");
    setRescheduling(null);
  };

  return (
    <div className="p-6">
      {/* barre de filtres — organisation logique : date > recherche client > statut > action.
         flex-wrap pour que rien ne soit jamais coupé (le bouton "Nouvelle" passe à la ligne si besoin
         plutôt que d'être tronqué par un scroll horizontal). */}
      <div className="flex items-center flex-wrap gap-2.5 mb-5">
        <div className="flex items-center gap-2 shrink-0">
          <CalendarIcon size={16} className="text-black shrink-0" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`${inputCls} w-auto text-black shrink-0`}
          />
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client (nom, téléphone, table)..."
            className={`${inputCls} pl-9 text-black`}
          />
        </div>

        <div className="flex items-center gap-1.5 bg-surface2 p-1 rounded-r2 border border-border shrink-0 overflow-x-auto">
          <ListFilter size={14} className="ml-1.5 text-black shrink-0" />
          {(
            [
              { k: "toutes", l: "Toutes" },
              { k: "confirmee", l: "Réservées" },
              { k: "decalee", l: "Décalées" },
              { k: "annulee", l: "Annulées" },
            ] as const
          ).map((o) => (
            <button
              key={o.k}
              onClick={() => setStatutFilter(o.k)}
              className={`t-std px-3 py-2 rounded-r font-extrabold text-[0.95rem] whitespace-nowrap shrink-0 ${
                statutFilter === o.k ? "bg-[var(--blue-soft)] text-black border border-blue" : "text-black hover:bg-surface3"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>

        <Btn variant="primary" small onClick={() => setCreating(true)}>
          <Plus size={16} className="shrink-0" />
          <span className="whitespace-nowrap">Nouvelle réservation</span>
        </Btn>
      </div>

      {/* résumé du jour */}
      {!isSearching && (
        <div className="flex items-center gap-2 mb-4">
          <Badge color="green">{counts.confirmee} réservée{counts.confirmee > 1 ? "s" : ""}</Badge>
          {counts.decalee > 0 && (
            <Badge color="orange">{counts.decalee} décalée{counts.decalee > 1 ? "s" : ""}</Badge>
          )}
          {counts.annulee > 0 && (
            <Badge color="red">{counts.annulee} annulée{counts.annulee > 1 ? "s" : ""}</Badge>
          )}
        </div>
      )}

      {isSearching && (
        <p className="text-[0.95rem] font-bold text-black mb-3">
          {dayReservations.length} résultat{dayReservations.length > 1 ? "s" : ""} pour « {search} » — toutes dates confondues
        </p>
      )}

      {/* tableau des réservations */}
      <div className="bg-surface rounded-r2 border border-border shadow-card overflow-hidden">
        <div
          className="grid px-4 py-3 bg-surface2 border-b border-border text-[0.95rem] font-extrabold uppercase tracking-wide text-black"
          style={{ gridTemplateColumns: "90px 90px 1.3fr 1.1fr 70px 80px 1.2fr 90px" }}
        >
          <span>Heure</span>
          <span>Table</span>
          <span>Client</span>
          <span>Téléphone</span>
          <span>Pers.</span>
          <span>Durée</span>
          <span>Statut</span>
          <span className="text-right">Actions</span>
        </div>

        {dayReservations.length === 0 && (
          <div className="text-center py-16 text-black font-bold">
            {isSearching ? "Aucun client trouvé pour cette recherche." : "Aucune réservation pour cette date."}
          </div>
        )}

        {dayReservations.map((r) => {
          const table = tables.find((t) => t.id === r.tableId);
          const canAct = r.statut === "confirmee" || r.statut === "decalee";
          return (
            <div
              key={r.id}
              className={`grid items-center px-4 py-3.5 border-b border-border last:border-b-0 ${
                r.statut === "annulee" ? "opacity-60" : ""
              }`}
              style={{ gridTemplateColumns: "90px 90px 1.3fr 1.1fr 70px 80px 1.2fr 90px" }}
            >
              <span className="font-mono font-black text-[1.02rem] text-black flex items-center gap-1.5">
                <Clock size={13} className="text-blue shrink-0" />
                {r.statut === "decalee" && r.decaleeHeure ? r.decaleeHeure : r.heure}
              </span>
              <span className="font-bold text-black">{table ? table.number : "—"}</span>
              <div className="min-w-0">
                <p className="font-extrabold text-[1rem] text-black truncate">
                  {r.prenom} {r.nom}
                </p>
                {r.notes && <p className="text-[0.9rem] text-black font-semibold truncate">📝 {r.notes}</p>}
              </div>
              <span className="text-[0.98rem] font-semibold text-black flex items-center gap-1.5 truncate">
                <Phone size={12} className="shrink-0" /> {r.telephone}
              </span>
              <span className="font-bold text-black flex items-center gap-1">
                <Users size={12} /> {r.personnes}
              </span>
              <span className="font-semibold text-black">{r.duree} min</span>
              <div className="flex flex-col gap-0.5">
                <Badge color={RES_STATUS_COLOR[r.statut]}>{RES_STATUS_LABEL[r.statut]}</Badge>
                {r.statut === "annulee" && r.annulationRaison && (
                  <span className="text-[0.85rem] font-semibold text-black italic truncate">Motif : {r.annulationRaison}</span>
                )}
                {r.statut === "decalee" && r.decaleeDate && r.decaleeHeure && (
                  <span className="text-[0.85rem] font-semibold text-black italic truncate">
                    au {new Date(r.decaleeDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} à {r.decaleeHeure}
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 justify-end">
                {canAct && (
                  <>
                    <IconBtn icon={<Pencil size={14} />} title="Modifier les détails" onClick={() => setEditing(r)} />
                    <IconBtn icon={<Clock size={14} />} title="Décaler à une heure ultérieure" variant="ghost" onClick={() => setRescheduling(r)} />
                    <IconBtn icon={<X size={14} />} title="Annuler" variant="danger" onClick={() => setCancelling(r)} />
                  </>
                )}
                {!canAct && (
                  <IconBtn icon={<Pencil size={14} />} title="Modifier les détails" onClick={() => setEditing(r)} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(creating || editing) && (
        <ReservationFormModal
          reservation={editing}
          tables={tables}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(r) => {
            if (editing) {
              setReservations((rs) => rs.map((x) => (x.id === editing.id ? r : x)));
              pushToast("Réservation modifiée");
            } else {
              setReservations((rs) => [...rs, { ...r, id: uid() }]);
              pushToast("Réservation créée");
            }
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {cancelling && (
        <ReservationCancelModal
          reservation={cancelling}
          onClose={() => setCancelling(null)}
          onConfirm={confirmCancel}
        />
      )}

      {rescheduling && (
        <ReservationRescheduleModal
          reservation={rescheduling}
          onClose={() => setRescheduling(null)}
          onConfirm={confirmReschedule}
        />
      )}
    </div>
  );
}

function ReservationCancelModal({
  reservation,
  onClose,
  onConfirm,
}: {
  reservation: Reservation;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Modal title={`Annuler — ${reservation.prenom} ${reservation.nom}`} onClose={onClose} width={420} icon={<AlertTriangle size={18} />}>
      <p className="text-[0.98rem] font-semibold text-black mb-3">
        Indiquez la cause de l'annulation. Elle sera visible dans la colonne statut.
      </p>
      <input
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Ex: Client injoignable, désistement..."
        className={`${inputCls} mb-4 text-black`}
      />
      <div className="grid grid-cols-2 gap-2">
        <Btn variant="default" onClick={onClose}>
          Retour
        </Btn>
        <Btn variant="danger" onClick={() => onConfirm(reason)}>
          <X size={16} /> Confirmer l'annulation
        </Btn>
      </div>
    </Modal>
  );
}

function ReservationRescheduleModal({
  reservation,
  onClose,
  onConfirm,
}: {
  reservation: Reservation;
  onClose: () => void;
  onConfirm: (date: string, heure: string) => void;
}) {
  const [date, setDate] = useState(reservation.date);
  const [heure, setHeure] = useState(reservation.heure);

  return (
    <Modal title={`Décaler — ${reservation.prenom} ${reservation.nom}`} onClose={onClose} width={420} icon={<Clock size={18} />}>
      <p className="text-[0.98rem] font-semibold text-black mb-4">
        Choisissez la nouvelle date et heure. La réservation reste modifiable ensuite.
      </p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Field label="Nouvelle date">
          <input type="date" className={`${inputCls} text-black`} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Nouvelle heure">
          <input type="time" className={`${inputCls} text-black`} value={heure} onChange={(e) => setHeure(e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Btn variant="default" onClick={onClose}>
          Retour
        </Btn>
        <Btn variant="warning" onClick={() => onConfirm(date, heure)}>
          <Clock size={16} /> Confirmer le décalage
        </Btn>
      </div>
    </Modal>
  );
}

function ReservationFormModal({
  reservation,
  tables,
  onClose,
  onSave,
}: {
  reservation: Reservation | null;
  tables: TableData[];
  onClose: () => void;
  onSave: (r: Reservation) => void;
}) {
  const [nom, setNom] = useState(reservation?.nom ?? "");
  const [prenom, setPrenom] = useState(reservation?.prenom ?? "");
  const [telephone, setTelephone] = useState(reservation?.telephone ?? "");
  const [date, setDate] = useState(reservation?.date ?? new Date().toISOString().slice(0, 10));
  const [heure, setHeure] = useState(reservation?.heure ?? "19:00");
  const [personnes, setPersonnes] = useState(reservation?.personnes ?? 2);
  const [duree, setDuree] = useState(reservation?.duree ?? 90);
  const [notes, setNotes] = useState(reservation?.notes ?? "");
  const [tableId, setTableId] = useState(reservation?.tableId ?? "");
  const [methode, setMethode] = useState(reservation?.methodePaiement ?? "");

  const valid = nom && prenom && telephone && date && heure;

  return (
    <Modal title={reservation ? "Modifier la réservation" : "Nouvelle réservation"} onClose={onClose} width={560} icon={<CalendarClock size={18} />}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nom">
          <input className={`${inputCls} text-black`} value={nom} onChange={(e) => setNom(e.target.value)} />
        </Field>
        <Field label="Prénom">
          <input className={`${inputCls} text-black`} value={prenom} onChange={(e) => setPrenom(e.target.value)} />
        </Field>
        <Field label="Téléphone">
          <input className={`${inputCls} text-black`} value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="0550 00 00 00" />
        </Field>
        <Field label="Nombre de personnes">
          <input type="number" min={1} className={`${inputCls} text-black`} value={personnes} onChange={(e) => setPersonnes(Number(e.target.value))} />
        </Field>
        <Field label="Date">
          <input type="date" className={`${inputCls} text-black`} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Heure">
          <input type="time" className={`${inputCls} text-black`} value={heure} onChange={(e) => setHeure(e.target.value)} />
        </Field>
        <Field label="Durée estimée (min)">
          <input type="number" step={15} className={`${inputCls} text-black`} value={duree} onChange={(e) => setDuree(Number(e.target.value))} />
        </Field>
        <Field label="Table attribuée">
          <select className={`${inputCls} text-black`} value={tableId} onChange={(e) => setTableId(e.target.value)}>
            <option value="">— Aucune —</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.number} ({t.zone}, {t.capacity}p)
              </option>
            ))}
          </select>
        </Field>
        <Field label="Méthode de paiement prévue">
          <select className={`${inputCls} text-black`} value={methode} onChange={(e) => setMethode(e.target.value)}>
            <option value="">— Non précisé —</option>
            <option value="especes">Espèces</option>
            <option value="carte">Carte</option>
            <option value="cib">CIB en ligne</option>
          </select>
        </Field>
        <div className="col-span-2">
          <Field label="Notes">
            <textarea className={`${inputCls} resize-none text-black`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="flex gap-2 mt-5">
        <Btn variant="default" full onClick={onClose}>
          Annuler
        </Btn>
        <Btn
          variant="primary"
          full
          disabled={!valid}
          onClick={() =>
            onSave({
              id: reservation?.id ?? "",
              nom,
              prenom,
              telephone,
              date,
              heure,
              personnes,
              duree,
              notes,
              tableId: tableId || undefined,
              methodePaiement: methode || undefined,
              statut: reservation?.statut ?? "confirmee",
              annulationRaison: reservation?.annulationRaison,
              decaleeDate: reservation?.decaleeDate,
              decaleeHeure: reservation?.decaleeHeure,
            })
          }
        >
          {reservation ? "Enregistrer" : "Créer la réservation"}
        </Btn>
      </div>
    </Modal>
  );
}

/* ============================================================================
   12. HISTORIQUE
============================================================================ */

function HistoriqueView({
  history,
  tables,
  pushToast,
  onReopen,
}: {
  history: HistoryEntry[];
  tables: TableData[];
  pushToast: (m: string, k?: any) => void;
  onReopen: (entry: HistoryEntry) => void;
}) {
  const [type, setType] = useState<"tous" | "sur_place" | "emporter">("tous");
  const [period, setPeriod] = useState<"jour" | "semaine" | "mois">("jour");
  const [expanded, setExpanded] = useState<string | null>(null);

  const now = Date.now();
  const cutoff = period === "jour" ? 24 * 3600 * 1000 : period === "semaine" ? 7 * 24 * 3600 * 1000 : 30 * 24 * 3600 * 1000;

  const filtered = history
    .filter((h) => (type === "tous" ? true : h.type === type))
    .filter((h) => now - h.closedAt <= cutoff);

  const totalSum = filtered.reduce((s, h) => s + h.total, 0);

  const methodLabel: Record<PaymentMethod, string> = {
    especes: "Espèces",
    carte: "Carte (TPE)",
    cib: "CIB en ligne",
    mixte: "Mixte",
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1.5 bg-surface2 p-1 rounded-r2 border border-border">
          {([
            { k: "tous", l: "Toutes" },
            { k: "sur_place", l: "Sur place" },
            { k: "emporter", l: "À emporter" },
          ] as const).map((o) => (
            <button
              key={o.k}
              onClick={() => setType(o.k)}
              className={`t-std px-4 py-2 rounded-r font-extrabold text-[1.08rem] ${
                type === o.k ? "bg-[var(--blue-soft)] text-black border border-blue" : "text-black hover:bg-surface3"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 bg-surface2 p-1 rounded-r2 border border-border">
          {([
            { k: "jour", l: "Par jour" },
            { k: "semaine", l: "Par semaine" },
            { k: "mois", l: "Par mois" },
          ] as const).map((o) => (
            <button
              key={o.k}
              onClick={() => setPeriod(o.k)}
              className={`t-std px-4 py-2 rounded-r font-extrabold text-[1.08rem] ${
                period === o.k ? "bg-[var(--blue-soft)] text-black border border-blue" : "text-black hover:bg-surface3"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>

        <div className="ml-auto px-4 py-2.5 rounded-r2 bg-[var(--blue-soft)] font-extrabold text-black text-[1.02rem]">
          {filtered.length} commande(s) — Total <span className="text-blue">{fmt(totalSum)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-black font-bold">Aucune commande sur cette période.</div>
        )}
        {filtered.map((h) => (
          <div key={h.id} className="bg-surface rounded-r2 border border-border shadow-card overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === h.id ? null : h.id)}
              className="w-full flex items-center gap-4 px-4 py-3.5"
            >
              <div className={`w-9 h-9 rounded-r2 flex items-center justify-center shrink-0 ${h.type === "sur_place" ? "bg-[var(--blue-soft)] text-blue" : "bg-[var(--orange-soft)] text-orange"}`}>
                {h.type === "sur_place" ? <UtensilsCrossed size={16} /> : <PackageCheck size={16} />}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-extrabold text-[1.05rem] text-black">
                  {h.type === "sur_place" ? `Table ${h.tableLabel ?? "—"}` : "Commande à emporter"}
                </p>
                <p className="text-[1rem] text-black font-semibold">
                  {new Date(h.closedAt).toLocaleString("fr-FR")} · {methodLabel[h.method]}
                </p>
              </div>
              <span className="font-mono font-black text-[1rem] text-blue">{fmt(h.total)}</span>
              <ChevronDown size={16} className={`t-std text-black ${expanded === h.id ? "rotate-180" : ""}`} />
            </button>
            {expanded === h.id && (
              <div className="px-4 pb-4 border-t border-border pt-3 flex flex-col gap-1.5">
                {h.items.map((i) => (
                  <div key={i.uid} className="flex justify-between text-[0.98rem] font-semibold text-black">
                    <span>
                      {i.qty}x {i.name}
                    </span>
                    <span className="font-mono text-blue font-bold">{fmt(i.price * i.qty)}</span>
                  </div>
                ))}
                <div className="pt-2 flex gap-2">
                  {h.type === "sur_place" && (
                    <Btn small variant="warning" onClick={() => onReopen(h)}>
                      <span style={{ fontSize: 14, lineHeight: 1 }}>↩</span> Réouvrir la commande
                    </Btn>
                  )}
                  <Btn small variant="default" onClick={() => pushToast("Ticket réimprimé")}>
                    <Printer size={14} /> Réimprimer le ticket
                  </Btn>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}