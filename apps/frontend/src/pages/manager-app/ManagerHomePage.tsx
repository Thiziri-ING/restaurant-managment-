import { useEffect, useRef, useState } from 'react';
import Chart, { type ChartConfiguration } from 'chart.js/auto';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  LineChart, ShoppingCart, Package, Settings, LayoutGrid,
  Users, ClipboardList, History, ChevronLeft, ChevronRight,
  LogOut, Store, Calendar, Download, FileText, X, Trash2, KeyRound,
  Plus, Salad, Beef, Pizza, Coffee, IceCream, Sandwich,
  Fish, Soup, Wine, Beer, CupSoda, Cherry, Apple, Croissant,
  Cookie, CakeSlice, Popcorn, Drumstick, Egg, Milk, Carrot,
  Utensils, UtensilsCrossed, ChefHat, Wheat, Grape, Candy,
  Donut, IceCreamCone, GlassWater, Martini, Vegan, Ham,
  Citrus, Banana, Bean, Nut, Snowflake, Bell,
  Receipt, Truck, ArrowDownLeft, ArrowUpRight, FileCheck, Eye,
  Coins, TrendingUp, Percent, PieChart, CreditCard, MapPin,
  Armchair, Sun, ShoppingBag, Gift, Star, BarChart3, ArrowLeft,
  ArrowDownRight, PackageX, Tag, Pencil, Heart, ListOrdered, Box,
  AlertTriangle, Clock, AlertCircle, FlaskConical, RotateCcw, Flame,
  CalendarCheck, CalendarRange, CalendarDays, ShoppingBasket, MoreHorizontal,
  Camera, Printer, Save, Upload, CircleCheck, CircleX, Layers,
  Banknote, Shield, Calculator, UserPlus, Search, Filter, Image as ImageIcon,
  Target, Flag, Wallet,
} from 'lucide-react';
import { useLogout } from '@/hooks/useAuth';

/* ============================================================================
 * CSS — Style Manager (Design System RestauManager)
 * ==========================================================================*/
const MANAGER_DASHBOARD_CSS = `
.mgr-dashboard {
  --bg: #f2f6fc;
  --surface: #ffffff;
  --surface2: #f0f4fa;
  --surface3: #e6edf5;
  --border: #d0dbe8;
  --border2: #b8c7da;
  --green: #0b7e3d;
  --green-soft: #dff0e6;
  --red: #b91c1c;
  --red-soft: #fde8e8;
  --orange: #b45309;
  --orange-soft: #fef3e0;
  --blue: #2563eb;
  --blue2: #1d4ed8;
  --blue-soft: #dbeafe;
  --r: 8px;
  --r2: 12px;
  --r3: 16px;
  --shadow-card: 0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.05);
  --shadow-modal: 0 20px 60px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.08);
  --shadow-glow: 0 4px 14px rgba(37,99,235,0.35);
  --blue-light: var(--blue-soft);
  --blue-mid: var(--blue-soft);
  --blue-dark: var(--blue2);
  --white: var(--surface);
  --text-1: #000000;
  --text-2: #000000;
  --text-3: #000000;
  --green-bg: var(--green-soft);
  --red-bg: var(--red-soft);
  --amber: var(--orange);
  --amber-bg: var(--orange-soft);
  --sidebar-w: 232px;
  --topbar-h: 60px;
  --radius: var(--r);
  --radius-lg: var(--r2);
  --shadow: var(--shadow-card);
  --mono: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
}

.mgr-dashboard *,
.mgr-dashboard *::before,
.mgr-dashboard *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.mgr-dashboard {
  font-family: 'Nunito', 'Inter', system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: #000;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 18px;
  line-height: 1.5;
}

.mgr-dashboard .t-std {
  font-family: 'Nunito', 'Inter', system-ui, -apple-system, sans-serif;
  transition: all 0.15s ease;
  -webkit-font-smoothing: antialiased;
}
.mgr-dashboard .t-card,
.mgr-dashboard .card {
  background: var(--surface);
  border-radius: var(--r2);
  border: 1px solid var(--border);
  transition: all 0.2s ease;
  box-shadow: var(--shadow-card);
}
.mgr-dashboard .t-card:hover,
.mgr-dashboard .card:hover {
  box-shadow: var(--shadow-modal);
  transform: translateY(-1px);
}
.mgr-dashboard .shadow-modal { box-shadow: var(--shadow-modal); }
.mgr-dashboard .shadow-card { box-shadow: var(--shadow-card); }
.mgr-dashboard .shadow-glow { box-shadow: var(--shadow-glow); }
.mgr-dashboard .img-zoom { transition: transform 0.3s ease; }
.mgr-dashboard .img-zoom:hover { transform: scale(1.02); }
.mgr-dashboard .badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  border-radius: 20px;
  font-size: 0.95rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes toastIn { from { opacity: 0; transform: translateX(20px) scale(0.95); } to { opacity: 1; transform: translateX(0) scale(1); } }
.mgr-dashboard .animate-fade-in { animation: fadeIn 0.25s ease forwards; }
.mgr-dashboard .animate-modal-in { animation: modalIn 0.25s ease forwards; }
.mgr-dashboard .animate-toast-in { animation: toastIn 0.3s ease forwards; }

/* ----- Sidebar ----- */
.mgr-dashboard .sidebar {
  background: linear-gradient(180deg, #e8f0fe 0%, #d4e4fa 100%);
  border-right: 1px solid var(--border);
  font-family: 'Nunito', 'Inter', system-ui, -apple-system, sans-serif;
}
.mgr-dashboard .sidebar-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.75rem;
  border-radius: var(--r);
  font-weight: 800;
  font-size: 1.05rem;
  color: #000;
  transition: background 0.15s ease;
  background: transparent;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
}
.mgr-dashboard .sidebar-btn:hover { background: rgba(255,255,255,0.6); }
.mgr-dashboard .sidebar-btn.active {
  background: var(--blue-soft);
  box-shadow: var(--shadow-glow);
}

/* ----- Inputs ----- */
.mgr-dashboard .input-field,
.mgr-dashboard .input {
  width: 100%;
  padding: 0.6rem 0.875rem;
  border-radius: var(--r);
  border: 1px solid var(--border);
  background: var(--surface2);
  font-size: 1.08rem;
  font-weight: 800;
  font-family: 'Nunito', 'Inter', system-ui, -apple-system, sans-serif;
  color: #000;
  outline: none;
  transition: all 0.15s ease;
}
.mgr-dashboard .input-field:focus,
.mgr-dashboard .input:focus {
  background: var(--surface);
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(37,99,235,0.15);
}

/* ----- Boutons — style moderne (relief doux, texte noir, ombre portée) ----- */
.mgr-dashboard .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.75rem 1.75rem;
  border-radius: 9999px;
  font-weight: 800;
  font-size: 1.28rem;
  letter-spacing: 0.01em;
  border: 1px solid transparent;
  cursor: pointer;
  position: relative;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Nunito', 'Inter', system-ui, -apple-system, sans-serif;
  min-height: 48px;
  white-space: nowrap;
}
.mgr-dashboard .btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}
.mgr-dashboard .btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 45%);
  pointer-events: none;
}
.mgr-dashboard .btn:active { transform: translateY(1px) scale(0.98) !important; }

.mgr-dashboard .btn-default,
.mgr-dashboard button.btn-default {
  background: linear-gradient(180deg, #ffffff 0%, var(--surface2) 100%);
  color: #000;
  border: 1.5px solid var(--border);
  border-radius: 9999px;
  box-shadow: 0 1px 2px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.6);
}
.mgr-dashboard .btn-default:hover { background: var(--surface3); border-color: var(--border2); transform: translateY(-2px); box-shadow: 0 6px 14px rgba(15,23,42,0.1); }

.mgr-dashboard .btn-primary,
.mgr-dashboard button.btn-primary {
  background: var(--blue);
  color: #000;
  border: 1.5px solid var(--blue2);
  border-radius: 9999px;
  padding: 0.65rem 1.5rem;
  font-weight: 700;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 3px 0 var(--blue2), 0 6px 16px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.35);
}
.mgr-dashboard .btn-primary:hover {
  background: #3d78ef;
  box-shadow: 0 3px 0 var(--blue2), 0 10px 22px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.35);
  transform: translateY(-2px);
}
.mgr-dashboard .btn-primary:active {
  box-shadow: 0 1px 0 var(--blue2), 0 4px 10px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.35);
}

.mgr-dashboard .btn-danger,
.mgr-dashboard button.btn-danger {
  background: var(--red);
  color: #000;
  border: 1.5px solid #991b1b;
  border-radius: 9999px;
  padding: 0.65rem 1.5rem;
  font-weight: 700;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 3px 0 #991b1b, 0 6px 16px rgba(185,28,28,0.3), inset 0 1px 0 rgba(255,255,255,0.3);
}
.mgr-dashboard .btn-danger:hover {
  background: #c62828;
  box-shadow: 0 3px 0 #991b1b, 0 10px 22px rgba(185,28,28,0.4), inset 0 1px 0 rgba(255,255,255,0.3);
  transform: translateY(-2px);
}
.mgr-dashboard .btn-danger:active { box-shadow: 0 1px 0 #991b1b, 0 4px 10px rgba(185,28,28,0.3), inset 0 1px 0 rgba(255,255,255,0.3); }

.mgr-dashboard .btn-success,
.mgr-dashboard button.btn-success {
  background: var(--green);
  color: #fff;
  border: 1.5px solid #086b32;
  border-radius: 9999px;
  padding: 0.65rem 1.5rem;
  font-weight: 700;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 3px 0 #086b32, 0 6px 16px rgba(11,126,61,0.3), inset 0 1px 0 rgba(255,255,255,0.3);
}
.mgr-dashboard .btn-success:hover {
  background: #0a9247;
  box-shadow: 0 3px 0 #086b32, 0 10px 22px rgba(11,126,61,0.4), inset 0 1px 0 rgba(255,255,255,0.3);
  transform: translateY(-2px);
}
.mgr-dashboard .btn-success:active { box-shadow: 0 1px 0 #086b32, 0 4px 10px rgba(11,126,61,0.3), inset 0 1px 0 rgba(255,255,255,0.3); }

.mgr-dashboard .btn-warning,
.mgr-dashboard button.btn-warning {
  background: var(--orange);
  color: #000;
  border: 1.5px solid #92400e;
  border-radius: 9999px;
  padding: 0.65rem 1.5rem;
  font-weight: 700;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 3px 0 #92400e, 0 6px 16px rgba(180,83,9,0.3), inset 0 1px 0 rgba(255,255,255,0.3);
}
.mgr-dashboard .btn-warning:hover {
  background: #c2670d;
  box-shadow: 0 3px 0 #92400e, 0 10px 22px rgba(180,83,9,0.4), inset 0 1px 0 rgba(255,255,255,0.3);
  transform: translateY(-2px);
}
.mgr-dashboard .btn-warning:active { box-shadow: 0 1px 0 #92400e, 0 4px 10px rgba(180,83,9,0.3), inset 0 1px 0 rgba(255,255,255,0.3); }

.mgr-dashboard .btn-ghost,
.mgr-dashboard button.btn-ghost {
  background: #ffffff;
  color: #000;
  border: 1.5px solid var(--border2);
  border-radius: 9999px;
  padding: 0.65rem 1.5rem;
  font-weight: 700;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 3px 0 var(--border2), 0 4px 10px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.6);
}
.mgr-dashboard .btn-ghost:hover {
  background: var(--blue-soft);
  border-color: var(--blue2);
  box-shadow: 0 3px 0 var(--blue2), 0 8px 18px rgba(37,99,235,0.18), inset 0 1px 0 rgba(255,255,255,0.6);
  transform: translateY(-2px);
}
.mgr-dashboard .btn-ghost:active { box-shadow: 0 1px 0 var(--border2), 0 3px 8px rgba(15,23,42,0.08); }

.mgr-dashboard .icon-btn {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--border2);
  background: linear-gradient(180deg, #ffffff 0%, var(--surface2) 100%);
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  color: #000;
  box-shadow: 0 3px 0 var(--border2), 0 3px 8px rgba(15,23,42,0.08);
}
.mgr-dashboard .icon-btn:hover { background: var(--blue-soft); border-color: var(--blue2); transform: translateY(-2px); box-shadow: 0 3px 0 var(--blue2), 0 8px 18px rgba(37,99,235,0.18); }
.mgr-dashboard .icon-btn:active { transform: translateY(1px) scale(0.96); }
.mgr-dashboard .icon-btn.primary {
  background: linear-gradient(180deg, #4f83f2 0%, var(--blue) 100%);
  border-color: var(--blue2);
  box-shadow: 0 3px 0 var(--blue2), 0 6px 14px rgba(37,99,235,0.35);
  color: #000;
}
.mgr-dashboard .icon-btn.danger {
  background: var(--red-soft);
  border-color: #f5b8b8;
  color: var(--red);
}
.mgr-dashboard .icon-btn.danger:hover { background: var(--red); color: #fff; box-shadow: 0 4px 14px rgba(185,28,28,0.3); }

/* ----- Bouton notification (cloche) ----- */
.mgr-dashboard .notif-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  position: relative;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #475569;
  box-shadow: 0 1px 2px rgba(15,23,42,0.03);
  flex-shrink: 0;
}
.mgr-dashboard .notif-btn:hover {
  background: var(--surface2);
  border-color: var(--border2);
  color: #0f172a;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(15,23,42,0.06);
}
.mgr-dashboard .notif-btn:active { transform: translateY(1px); }
.mgr-dashboard .notif-badge {
  position: absolute; top: -3px; right: -3px;
  background: var(--red);
  color: #fff;
  border: 1.5px solid var(--surface);
  border-radius: 50%;
  min-width: 17px; height: 17px;
  font-size: 10.5px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 6px rgba(185,28,28,0.3);
}

/* ----- Modals ----- */
.mgr-dashboard .modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
  animation: fadeIn 0.2s ease forwards;
}
.mgr-dashboard .modal-box {
  background: var(--surface);
  border-radius: var(--r3);
  box-shadow: var(--shadow-modal);
  max-width: 90vw;
  max-height: 88vh;
  overflow-y: auto;
  width: 100%;
  animation: modalIn 0.25s ease forwards;
}
.mgr-dashboard .modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--surface);
  z-index: 10;
}
.mgr-dashboard .modal-title {
  font-size: 1.3rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #000;
}
.mgr-dashboard .modal-body { padding: 1.5rem; }
.mgr-dashboard .modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
  background: var(--surface);
}
.mgr-dashboard .modal-footer.spread { justify-content: space-between; }
.mgr-dashboard .modal-close {
  width: 32px;
  height: 32px;
  border-radius: var(--r);
  border: 1px solid var(--border);
  background: var(--surface2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #000;
  transition: all 0.15s ease;
}
.mgr-dashboard .modal-close:hover { background: var(--red-soft); color: var(--red); border-color: var(--red-soft); }

/* ----- Toast ----- */
.mgr-dashboard .toast-container {
  position: fixed;
  bottom: 1.25rem;
  right: 1.25rem;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}
.mgr-dashboard .toast {
  padding: 0.75rem 1rem;
  border-radius: var(--r2);
  font-weight: 800;
  font-size: 1.02rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  box-shadow: var(--shadow-modal);
  animation: toastIn 0.3s ease forwards;
}
.mgr-dashboard .toast-success { background: var(--green); }
.mgr-dashboard .toast-error { background: var(--red); }
.mgr-dashboard .toast-info { background: var(--blue); }

/* ----- Scrollbar ----- */
.mgr-dashboard ::-webkit-scrollbar { width: 6px; height: 6px; }
.mgr-dashboard ::-webkit-scrollbar-track { background: var(--surface2); }
.mgr-dashboard ::-webkit-scrollbar-thumb { background: var(--border); border-radius: var(--r2); }
.mgr-dashboard ::-webkit-scrollbar-thumb:hover { background: var(--border2); }

/* ----- Topbar ----- */
.mgr-dashboard .app { display: flex; flex-direction: column; min-height: 100vh; }
.mgr-dashboard .topbar {
  height: var(--topbar-h);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 200;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.01), 0 2px 8px rgba(0,0,0,0.02);
}
.mgr-dashboard .topbar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  overflow: hidden;
}
.mgr-dashboard .brand-icon {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, var(--blue), var(--blue2));
  border-radius: var(--r2);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 18px; flex-shrink: 0;
  box-shadow: var(--shadow-glow);
}
.mgr-dashboard .brand-name { font-size: 11px; font-weight: 700; color: var(--blue2); text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2; }
.mgr-dashboard .brand-sub { font-size: 14.5px; color: #0f172a; font-weight: 800; line-height: 1.2; }
.mgr-dashboard .topbar-center { flex: 1; display: flex; align-items: center; gap: 12px; }
.mgr-dashboard .topbar-title {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--blue2);
  background: var(--blue-soft);
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid rgba(37, 99, 235, 0.12);
  white-space: nowrap;
}
.mgr-dashboard .topbar-date {
  font-size: 13.5px;
  color: #475569;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  white-space: nowrap;
}
.mgr-dashboard .period-group {
  display: flex;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 3px;
  gap: 2px;
  position: relative;
}
.mgr-dashboard .period-btn {
  padding: 5px 13px;
  font-size: 17px; font-weight: 800;
  border: none; background: none;
  border-radius: 6px;
  cursor: pointer;
  color: #000;
  transition: all 0.15s;
  position: relative;
}
.mgr-dashboard .period-btn.active { background: var(--surface); color: var(--blue); box-shadow: var(--shadow-glow); }
.mgr-dashboard .period-btn:hover:not(.active) { background: var(--surface); color: #000; }
.mgr-dashboard .period-btn .date-picker-popover {
  position: absolute;
  top: 110%;
  left: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 10px;
  box-shadow: var(--shadow-card);
  z-index: 300;
  min-width: 200px;
}
.mgr-dashboard .period-option-item {
  padding: 9px 12px;
  font-size: 15px;
  font-weight: 800;
  color: #000;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  text-align: left;
  transition: all 0.12s ease;
}
.mgr-dashboard .period-option-item:hover { background: var(--blue-soft); color: var(--blue2); }
.mgr-dashboard .period-option-item.current { color: var(--blue2); }
.mgr-dashboard .topbar-actions { display: flex; align-items: center; gap: 8px; }
.mgr-dashboard .avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--blue-soft); color: var(--blue2);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; cursor: pointer; flex-shrink: 0;
  border: 2px solid var(--surface);
  box-shadow: 0 0 0 2px var(--blue-soft), 0 2px 6px rgba(0,0,0,0.06);
  transition: all 0.2s ease;
}
.mgr-dashboard .avatar:hover {
  transform: scale(1.04);
  box-shadow: 0 0 0 2px var(--blue), 0 4px 10px rgba(37,99,235,0.15);
}

/* ----- Body & Main ----- */
.mgr-dashboard .body { flex: 1; display: flex; flex-direction: column; margin-top: var(--topbar-h); }
.mgr-dashboard .main { flex: 1; overflow-y: auto; padding: 28px 28px 40px; transition: margin-left 0.2s ease; }

/* ----- Sidebar spécifique ----- */
.mgr-dashboard .sidebar {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px 0 12px;
}
.mgr-dashboard .nav-section { margin-bottom: 4px; }
.mgr-dashboard .nav-label {
  font-size: 16px; font-weight: 800;
  color: #000;
  text-transform: uppercase; letter-spacing: 2px;
  padding: 10px 20px 5px;
}
.mgr-dashboard .nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 20px;
  font-size: 18px; color: #000;
  cursor: pointer; border-left: 3px solid transparent;
  transition: all 0.12s; user-select: none;
  font-weight: 800;
}
.mgr-dashboard .nav-item svg { flex-shrink: 0; color: #000; }
.mgr-dashboard .nav-item:hover { background: rgba(255,255,255,0.6); color: #000; }
.mgr-dashboard .nav-item.active {
  background: var(--blue-soft);
  color: #000;
  border-left-color: var(--blue);
  font-weight: 800;
  box-shadow: var(--shadow-glow);
}
.mgr-dashboard .nav-item.active svg { color: var(--blue); }
.mgr-dashboard .nav-item-collapsed { justify-content: center; padding: 10px 0; }
.mgr-dashboard .nav-divider { height: 1px; background: var(--border2); opacity: 0.5; margin: 10px 20px; }
.mgr-dashboard .sidebar-footer { margin-top: auto; padding: 10px 12px 0; border-top: 1px solid rgba(203,213,225,0.6); }
.mgr-dashboard .logout-btn {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 9px 12px; border-radius: var(--r);
  font-size: 17px; font-weight: 800; color: #000;
  background: none; border: none; cursor: pointer;
  transition: all 0.15s;
}
.mgr-dashboard .logout-btn:hover { background: var(--red-soft); color: var(--red); }
.mgr-dashboard .logout-btn.collapsed-btn { justify-content: center; }
.mgr-dashboard .logout-confirm { display: flex; flex-direction: column; gap: 8px; padding: 6px 4px 2px; }
.mgr-dashboard .logout-confirm-txt { font-size: 17px; font-weight: 800; color: #000; text-align: center; }
.mgr-dashboard .logout-confirm-row { display: flex; gap: 8px; }
.mgr-dashboard .logout-confirm-row button {
  flex: 1; padding: 7px; border-radius: var(--r);
  font-size: 17px; font-weight: 800; border: none; cursor: pointer;
}
.mgr-dashboard .btn-cancel-mini { background: var(--surface); color: #000; border: 1px solid var(--border) !important; }
.mgr-dashboard .btn-quit-mini { background: var(--red); color: #fff; }
.mgr-dashboard .collapse-toggle {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: calc(100% - 24px); margin: 6px 12px 0; padding: 9px 0;
  border-radius: var(--r); border: none; background: none; cursor: pointer;
  font-size: 17px; font-weight: 800; color: #000;
  transition: all 0.15s;
}
.mgr-dashboard .collapse-toggle:hover { background: rgba(255,255,255,0.6); color: #000; }

/* ----- KPI ----- */
.mgr-dashboard .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.mgr-dashboard .kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r2);
  padding: 12px 14px;
  box-shadow: var(--shadow-card);
  display: flex; flex-direction: row; align-items: center; gap: 10px;
  transition: all 0.2s ease;
}
.mgr-dashboard .kpi-card:hover { box-shadow: var(--shadow-modal); transform: translateY(-1px); }
.mgr-dashboard .kpi-content { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.mgr-dashboard .kpi-icon {
  width: 40px; height: 40px; border-radius: 12px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: var(--blue);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}
.mgr-dashboard .kpi-card:hover .kpi-icon { transform: scale(1.06) rotate(-2deg); }
.mgr-dashboard .kpi-icon.blue { background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #2563eb; }
.mgr-dashboard .kpi-icon.green { background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #16a34a; }
.mgr-dashboard .kpi-icon.red { background: linear-gradient(135deg, #fee2e2, #fecaca); color: #dc2626; }
.mgr-dashboard .kpi-icon.orange { background: linear-gradient(135deg, #fef3e0, #fde3b8); color: #b45309; }
.mgr-dashboard .kpi-icon.purple { background: linear-gradient(135deg, #f3e8ff, #e9d5ff); color: #7c3aed; }
.mgr-dashboard .kpi-label { font-size: 14px; color: #000; font-weight: 800; }
.mgr-dashboard .kpi-value { font-size: 21px; font-weight: 900; color: #000; line-height: 1.1; font-family: var(--mono); }
.mgr-dashboard .kpi-value.kpi-price { color: var(--blue); }
.mgr-dashboard .kpi-value small { font-size: 13px; font-weight: 800; color: #000; margin-left: 2px; font-family: 'Nunito', sans-serif; }
.mgr-dashboard .kpi-delta {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 13px; font-weight: 800;
}
.mgr-dashboard .kpi-card.clickable { cursor: pointer; }
.mgr-dashboard .kpi-card.kpi-filter-active { border-color: var(--blue); box-shadow: 0 0 0 2px var(--blue-soft), var(--shadow-card); }
.mgr-dashboard .kpi-card-wrap { position: relative; flex: 1; }
.mgr-dashboard .kpi-hover-popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 260px;
  max-width: 320px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r2);
  box-shadow: var(--shadow-modal);
  padding: 12px 14px;
  z-index: 60;
  animation: fadeIn 0.15s ease forwards;
}
.mgr-dashboard .kpi-hover-title {
  font-size: 15px;
  font-weight: 900;
  color: #000;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
.mgr-dashboard .kpi-hover-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 14px;
  padding: 4px 0;
  color: #000;
}
.mgr-dashboard .kpi-hover-row span:first-child { color: #000; font-weight: 700; }
.mgr-dashboard .kpi-hover-row span:last-child { font-weight: 900; font-family: var(--mono); text-align: right; }
.mgr-dashboard .flux-filter-btn {
  padding: 0.85rem 1.6rem !important;
  font-size: 1.05rem !important;
  font-weight: 900 !important;
  border-radius: 9999px !important;
}
.mgr-dashboard .delta-up { color: var(--green); }
.mgr-dashboard .delta-down { color: var(--red); }
.mgr-dashboard .delta-neu { color: #000; }

/* ----- Layouts ----- */
.mgr-dashboard .charts-2 { display: grid; grid-template-columns: 1.55fr 1fr; gap: 14px; }
.mgr-dashboard .charts-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
.mgr-dashboard .charts-2eq { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.mgr-dashboard .chart-wrap { position: relative; width: 100%; }
.mgr-dashboard .zone-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.mgr-dashboard .full-row { display: grid; grid-template-columns: 1fr; gap: 14px; }

/* ----- Tables ----- */
.mgr-dashboard .tbl-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.mgr-dashboard table { width: 100%; min-width: 460px; border-collapse: collapse; table-layout: auto; }
.mgr-dashboard thead th {
  font-size: 15px; font-weight: 800; color: #000;
  text-transform: uppercase; letter-spacing: 0.03em;
  padding: 13px 20px; text-align: left;
  background: var(--surface2);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.mgr-dashboard tbody td {
  padding: 14px 20px;
  font-size: 16px; color: #000;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  white-space: nowrap;
}
.mgr-dashboard tbody td.td-wrap { white-space: normal; }
.mgr-dashboard tbody tr:last-child td { border-bottom: none; }
.mgr-dashboard tbody tr:hover td { background: var(--surface2); }
.mgr-dashboard .td-name { font-weight: 800; color: #000; }
.mgr-dashboard .td-blue { color: var(--blue); font-weight: 800; font-family: var(--mono); }
.mgr-dashboard .td-id { color: var(--blue); font-size: 15px; font-family: var(--mono); }

/* ----- Badges ----- */
.mgr-dashboard .b-blue { background: var(--blue-soft); color: var(--blue2); }
.mgr-dashboard .b-green { background: var(--green-soft); color: var(--green); }
.mgr-dashboard .b-red { background: var(--red-soft); color: var(--red); }
.mgr-dashboard .b-amber { background: var(--orange-soft); color: var(--orange); }
.mgr-dashboard .b-gray { background: var(--surface2); color: #000; }
.mgr-dashboard .b-purple { background: #f3e8ff; color: #7c3aed; }

/* ----- Divers ----- */
.mgr-dashboard .rank {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--blue-soft); color: var(--blue2);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 800; flex-shrink: 0;
}
.mgr-dashboard .stat-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 0;
  border-bottom: 1px solid var(--border);
  font-size: 17px;
}
.mgr-dashboard .stat-row:last-child { border: none; }
.mgr-dashboard .stat-row .lbl { color: #000; display: flex; align-items: center; gap: 6px; font-weight: 800; }
.mgr-dashboard .stat-row .lbl svg { color: #000; flex-shrink: 0; }
.mgr-dashboard .stat-row .val { font-weight: 800; color: #000; font-family: var(--mono); }
.mgr-dashboard .stat-row .val.val-price { color: var(--blue); }

.mgr-dashboard .toggle {
  width: 34px; height: 19px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; cursor: pointer;
  transition: background 0.2s; padding: 2px;
}
.mgr-dashboard .toggle.on { background: var(--blue); justify-content: flex-end; }
.mgr-dashboard .toggle.off { background: var(--border); justify-content: flex-start; }
.mgr-dashboard .toggle-dot { width: 15px; height: 15px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }

.mgr-dashboard .user-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 800; flex-shrink: 0;
}
.mgr-dashboard .online-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
.mgr-dashboard .dot-on { background: var(--green); }
.mgr-dashboard .dot-off { background: var(--border); }

.mgr-dashboard .menu-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r2);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  transition: all 0.2s ease;
}
.mgr-dashboard .menu-card:hover { box-shadow: var(--shadow-modal); transform: translateY(-2px); }
.mgr-dashboard .menu-card-img {
  position: relative;
  height: 155px;
  display: flex; align-items: center; justify-content: center;
  font-size: 40px;
  overflow: hidden;
}
.mgr-dashboard .menu-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s ease; }
.mgr-dashboard .menu-card:hover .menu-card-img img { transform: scale(1.04); }
.mgr-dashboard .menu-avail-chip {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
}
.mgr-dashboard .menu-card-body { padding: 10px 12px; }
.mgr-dashboard .menu-cat-label { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
.mgr-dashboard .menu-name { font-size: 15px; font-weight: 800; color: #000; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mgr-dashboard .menu-desc { font-size: 12px; color: #000; margin-bottom: 6px; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mgr-dashboard .menu-price { font-size: 19px; font-weight: 900; color: var(--blue); margin-bottom: 7px; font-family: var(--mono); }
.mgr-dashboard .menu-price small { font-size: 13px; font-weight: 800; color: #000; font-family: 'Nunito', sans-serif; }
.mgr-dashboard .menu-footer { display: flex; align-items: center; justify-content: space-between; }
.mgr-dashboard .avail-row { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 800; color: #000; }
.mgr-dashboard .btn-edit {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 14px; border-radius: 9999px;
  border: 1px solid var(--border); background: var(--surface);
  font-size: 16px; font-weight: 800; color: var(--blue);
  cursor: pointer; transition: all 0.15s;
}
.mgr-dashboard .btn-edit:hover { background: var(--blue-soft); border-color: var(--blue); transform: translateY(-1px); }

.mgr-dashboard .link { color: var(--blue); font-size: 17px; font-weight: 800; cursor: pointer; border: none; background: none; }
.mgr-dashboard .field { display: flex; flex-direction: column; gap: 5px; }
.mgr-dashboard .field label { font-size: 12.5px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
.mgr-dashboard .search-wrap {
  position: relative; flex: 1; max-width: 280px;
}
.mgr-dashboard .search-wrap svg {
  position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
  color: #000; pointer-events: none;
}
.mgr-dashboard .search-input {
  width: 100%; padding: 7px 10px 7px 34px;
  border: 1px solid var(--border); border-radius: var(--r);
  font-size: 17px; color: #000; background: var(--surface);
  outline: none; font-family: inherit;
}
.mgr-dashboard .search-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.mgr-dashboard .topbar-search {
  position: relative; width: 220px; flex-shrink: 0;
}
.mgr-dashboard .topbar-search svg {
  position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
  color: #000; pointer-events: none;
}
.mgr-dashboard .topbar-search input {
  width: 100%; padding: 7px 10px 7px 32px;
  border: 1px solid var(--border); border-radius: 9999px;
  font-size: 15px; font-weight: 800; color: #000; background: var(--surface2);
  outline: none; font-family: inherit;
}
.mgr-dashboard .topbar-search input:focus { background: var(--surface); border-color: var(--blue); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }

.mgr-dashboard .filter-tabs { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 16px; }
.mgr-dashboard .filter-tab {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 14px; border-radius: 20px;
  font-size: 17px; font-weight: 800; cursor: pointer;
  border: 1px solid var(--border); background: var(--surface); color: #000;
  transition: all 0.12s;
}
.mgr-dashboard .filter-tab.active { background: var(--blue-soft); border-color: var(--blue); color: #000; box-shadow: var(--shadow-glow); }
.mgr-dashboard .filter-tab:hover:not(.active) { border-color: var(--border2); color: #000; }

.mgr-dashboard .legend { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 10px; }
.mgr-dashboard .leg-item { display: flex; align-items: center; gap: 5px; font-size: 16px; color: #000; font-weight: 800; }
.mgr-dashboard .leg-sq { width: 9px; height: 9px; border-radius: 2px; flex-shrink: 0; }

.mgr-dashboard .note {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 12px; border-radius: var(--r);
  font-size: 17px; margin-top: 12px; font-weight: 800;
  color: #000;
}
.mgr-dashboard .note-amber { background: var(--orange-soft); color: #000; }
.mgr-dashboard .note svg { flex-shrink: 0; margin-top: 1px; color: #000; }

.mgr-dashboard .radio-row { display: flex; flex-direction: column; gap: 8px; }
.mgr-dashboard .radio-opt {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: var(--r);
  border: 1px solid var(--border); cursor: pointer; font-size: 17px; color: #000; font-weight: 800;
}
.mgr-dashboard .radio-opt.selected { border-color: var(--blue); background: var(--blue-soft); color: var(--blue2); }

.mgr-dashboard .icon-picker-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; max-height: 260px; overflow-y: auto; padding: 4px 2px; }
.mgr-dashboard .icon-picker-item {
  display: flex; align-items: center; justify-content: center;
  padding: 10px 0; border-radius: var(--r);
  border: 1px solid var(--border); background: var(--surface);
  color: #000; cursor: pointer; transition: all 0.12s;
}
.mgr-dashboard .icon-picker-item:hover { border-color: var(--blue); background: var(--blue-soft); color: var(--blue2); }
.mgr-dashboard .icon-picker-item.selected { border-color: var(--blue); background: var(--blue-soft); color: var(--blue2); box-shadow: var(--shadow-glow); }

.mgr-dashboard .action-list { display: flex; flex-direction: column; gap: 6px; }
.mgr-dashboard .action-list-item {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; border-radius: var(--r2);
  border: 1px solid var(--border); background: var(--surface);
  font-size: 17px; font-weight: 800; color: #000;
  cursor: pointer; transition: all 0.12s;
}
.mgr-dashboard .action-list-item:hover { background: var(--blue-soft); border-color: var(--blue); color: var(--blue2); }
.mgr-dashboard .action-list-item.danger:hover { background: var(--red-soft); border-color: var(--red-soft); color: var(--red); }

.mgr-dashboard .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.mgr-dashboard .page-title { font-size: 24px; font-weight: 900; color: #000; }
.mgr-dashboard .page-sub { font-size: 17px; color: #000; margin-top: 2px; font-weight: 800; }

.mgr-dashboard .section { margin-bottom: 28px; }
.mgr-dashboard .section-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.mgr-dashboard .section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 17px; font-weight: 800; color: #000;
}
.mgr-dashboard .section-title svg { color: var(--blue); }

.mgr-dashboard .card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mgr-dashboard .card-header h3 { font-size: 18px; font-weight: 800; color: #000; display: flex; align-items: center; gap: 7px; }
.mgr-dashboard .card-body { padding: 20px; }

.mgr-dashboard .logout-screen {
  height: 100vh; display: flex; align-items: center; justify-content: center;
  background: var(--bg);
}
.mgr-dashboard .logout-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--r2);
  box-shadow: var(--shadow-card); padding: 40px 36px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 14px; max-width: 360px;
}
.mgr-dashboard .logout-card .brand-icon { width: 52px; height: 52px; font-size: 24px; border-radius: var(--r2); }

.mgr-dashboard .perm-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 0; border-bottom: 1px solid var(--border);
}
.mgr-dashboard .perm-row:last-child { border: none; }
.mgr-dashboard .perm-info .perm-name { font-size: 17px; font-weight: 800; color: #000; }
.mgr-dashboard .perm-info .perm-desc { font-size: 16px; color: #000; margin-top: 1px; font-weight: 800; }

/* ----- Document styles for Bon de Commande & Ticket ----- */
.mgr-dashboard .doc-container {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--r2);
  padding: 24px;
  font-family: 'Courier New', monospace;
  box-shadow: var(--shadow-card);
}
.mgr-dashboard .doc-header {
  text-align: center;
  border-bottom: 2px dashed var(--border);
  padding-bottom: 16px;
  margin-bottom: 16px;
}
.mgr-dashboard .doc-title {
  font-size: 20px;
  font-weight: 900;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 2px;
}
.mgr-dashboard .doc-subtitle {
  font-size: 17px;
  color: #000;
  margin-top: 4px;
  font-weight: 800;
}
.mgr-dashboard .doc-info-row {
  display: flex;
  justify-content: space-between;
  font-size: 17px;
  margin-bottom: 6px;
  color: #000;
}
.mgr-dashboard .doc-table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 17px;
}
.mgr-dashboard .doc-table th {
  border-bottom: 2px solid #000;
  padding: 6px 4px;
  text-align: left;
  font-weight: 800;
  color: #000;
}
.mgr-dashboard .doc-table td {
  padding: 6px 4px;
  border-bottom: 1px dashed var(--border);
  color: #000;
}
.mgr-dashboard .doc-table .doc-total-row td {
  border-top: 2px solid #000;
  border-bottom: none;
  font-weight: 900;
  font-size: 18px;
  padding-top: 10px;
}
.mgr-dashboard .doc-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 2px dashed var(--border);
  font-size: 16px;
  color: #000;
  font-weight: 800;
}
.mgr-dashboard .doc-stamp {
  display: inline-block;
  border: 2px solid var(--red);
  color: var(--red);
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-top: 8px;
}
.mgr-dashboard .doc-signature {
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  color: #000;
}
.mgr-dashboard .doc-signature div {
  text-align: center;
  width: 120px;
}
.mgr-dashboard .doc-signature .doc-line {
  border-top: 1px solid #000;
  margin-top: 24px;
  padding-top: 4px;
}
.mgr-dashboard .logo-uploader-btn {
  transition: all 0.2s ease-in-out;
}
.mgr-dashboard .logo-uploader-btn:hover {
  border-color: var(--blue) !important;
  background: var(--blue-soft) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15) !important;
  color: var(--blue2) !important;
}
.mgr-dashboard .logo-uploader-btn:hover svg {
  color: var(--blue) !important;
}
.mgr-dashboard .logo-uploader-btn:hover .hover-overlay {
  opacity: 1 !important;
}
`;

/* ============================================================================
 * Navigation
 * ==========================================================================*/
type PageId =
  | 'ca'
  | 'commercial'
  | 'stock'
  | 'restaurant'
  | 'tables'
  | 'users'
  | 'menu'
  | 'audit'
  | 'flux';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ElementType;
  title: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Statistiques',
    items: [
      { id: 'ca', label: "Chiffre d'affaires", icon: LineChart, title: "Chiffre d'affaires" },
      { id: 'commercial', label: 'Stats commerciales', icon: ShoppingCart, title: 'Stats commerciales' },
      { id: 'stock', label: 'Stats stock', icon: Package, title: 'Stats stock' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { id: 'restaurant', label: 'Paramètres', icon: Settings, title: 'Paramètres Restaurant' },
      { id: 'tables', label: 'Tables', icon: LayoutGrid, title: 'Tables' },
      { id: 'users', label: 'Utilisateurs', icon: Users, title: 'Utilisateurs & Accès' },
      { id: 'menu', label: 'Menu', icon: ClipboardList, title: 'Menu' },
    ],
  },
  {
    label: 'Activité',
    items: [
      { id: 'flux', label: 'Entrées / Sorties', icon: History, title: 'Flux' },
      { id: 'audit', label: "Journal d'audit", icon: History, title: 'Audit des Actions' },
    ],
  },
];

const EXPORTABLE_PAGES: PageId[] = ['ca', 'commercial', 'stock', 'flux'];

type Period = 'jour' | 'semaine' | 'mois' | 'personnalise';

const PERIOD_LABELS: Record<Period, string> = {
  jour: 'Jour',
  semaine: 'Semaine',
  mois: 'Mois',
  personnalise: 'Personnalisé',
};

/* ============================================================================
 * Fonctions de date
 * ==========================================================================*/
interface DateRange {
  from: Date;
  to: Date;
}

interface CustomRange {
  from: string;
  to: string;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return startOfDay(date);
}

function endOfWeek(d: Date): Date {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  return endOfDay(e);
}

function startOfMonth(d: Date): Date {
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
}

function endOfMonth(d: Date): Date {
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getPeriodRange(period: Period, custom: CustomRange | null): DateRange {
  const now = new Date();
  if (period === 'jour') return { from: startOfDay(now), to: endOfDay(now) };
  if (period === 'semaine') return { from: startOfWeek(now), to: endOfWeek(now) };
  if (period === 'mois') return { from: startOfMonth(now), to: endOfMonth(now) };
  if (custom && custom.from && custom.to) {
    const from = startOfDay(new Date(custom.from + 'T00:00:00'));
    const to = endOfDay(new Date(custom.to + 'T00:00:00'));
    return to < from ? { from: to, to: from } : { from, to };
  }
  return { from: startOfDay(now), to: endOfDay(now) };
}

function getPeriodRangeFromDate(period: Period, refDate: Date): DateRange {
  const date = new Date(refDate);
  if (period === 'jour') return { from: startOfDay(date), to: endOfDay(date) };
  if (period === 'semaine') return { from: startOfWeek(date), to: endOfWeek(date) };
  if (period === 'mois') return { from: startOfMonth(date), to: endOfMonth(date) };
  return { from: startOfDay(date), to: endOfDay(date) };
}

const DAY_NAMES_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTH_NAMES_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function formatDateFR(d: Date, withDay?: boolean): string {
  const base = `${d.getDate()} ${MONTH_NAMES_FR[d.getMonth()]} ${d.getFullYear()}`;
  return withDay ? `${DAY_NAMES_FR[d.getDay()]} ${base}` : base;
}

function formatDateTimeFR(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${formatDateFR(d)} à ${hh}:${mm}`;
}

function formatPeriodLabel(period: Period, range: DateRange): string {
  if (period === 'jour') return formatDateFR(range.from, true);
  const sameDay = toInputDate(range.from) === toInputDate(range.to);
  if (sameDay) return formatDateFR(range.from, true);
  return `Du ${formatDateFR(range.from)} au ${formatDateFR(range.to)}`;
}

function periodKindLabel(period: Period): string {
  switch (period) {
    case 'jour': return 'Rapport journalier';
    case 'semaine': return 'Rapport hebdomadaire';
    case 'mois': return 'Rapport mensuel';
    default: return 'Rapport — période personnalisée';
  }
}

/* Génère la liste des semaines précédentes jusqu'à la semaine actuelle (incluse) */
function getWeekOptions(count: number): { label: string; date: Date }[] {
  const now = new Date();
  const options: { label: string; date: Date }[] = [];
  for (let i = 0; i < count; i++) {
    const ref = new Date(now);
    ref.setDate(ref.getDate() - i * 7);
    const start = startOfWeek(ref);
    const end = endOfWeek(ref);
    const label = i === 0
      ? `Cette semaine · ${formatDateFR(start)} - ${formatDateFR(end)}`
      : `${formatDateFR(start)} - ${formatDateFR(end)}`;
    options.push({ label, date: start });
  }
  return options;
}

/* Génère la liste des mois précédents jusqu'au mois actuel (inclus) */
function getMonthOptions(count: number): { label: string; date: Date }[] {
  const now = new Date();
  const options: { label: string; date: Date }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = i === 0
      ? `Ce mois-ci · ${MONTH_NAMES_FR[d.getMonth()]} ${d.getFullYear()}`
      : `${MONTH_NAMES_FR[d.getMonth()]} ${d.getFullYear()}`;
    options.push({ label, date: d });
  }
  return options;
}

/* ============================================================================
 * Restaurant info & Export helpers
 * ==========================================================================*/
interface RestaurantInfo {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  rc?: string;
  nif?: string;
}

const RESTAURANT_INFO: RestaurantInfo = {
  name: "L'Arôme Gourmet",
  tagline: 'Authentic Algerian Gastronomy',
  address: '12 Rue des Frères Bouadou, Bir Mourad Raïs, Alger',
  phone: '+213 21 54 87 96',
  email: 'contact@arome-gourmet.dz',
  rc: '16/00-1234567B24',
  nif: '000216123456789',
};

type ExportRow = Record<string, string | number>;

interface ReportMeta {
  title: string;
  period: Period;
  periodLabel: string;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportRowsToExcel(rows: ExportRow[], meta: ReportMeta, filename: string) {
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const generated = formatDateTimeFR(new Date());
  const headerRows: (string | number)[][] = [
    [RESTAURANT_INFO.name],
    [RESTAURANT_INFO.tagline],
    [RESTAURANT_INFO.address],
    [`Tél : ${RESTAURANT_INFO.phone}  ·  Email : ${RESTAURANT_INFO.email}`],
    [`RC : ${RESTAURANT_INFO.rc}  ·  NIF : ${RESTAURANT_INFO.nif}`],
    [],
    [meta.title],
    [periodKindLabel(meta.period)],
    [`Période : ${meta.periodLabel}`],
    [`Généré le : ${generated}`],
    [],
    columns,
    ...rows.map((r) => columns.map((c) => r[c])),
  ];
  const ws = XLSX.utils.aoa_to_sheet(headerRows);
  ws['!cols'] = columns.map((c) => ({ wch: Math.max(16, c.length + 4) }));
  const lastCol = Math.max(columns.length - 1, 0);
  ws['!merges'] = [0, 1, 2, 3, 4, 6, 7, 8, 9].map((r) => ({ s: { r, c: 0 }, e: { r, c: lastCol } }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, meta.title.slice(0, 31));
  XLSX.writeFile(wb, filename);
}

function exportRowsToCSV(rows: ExportRow[], meta: ReportMeta, filename: string) {
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const generated = formatDateTimeFR(new Date());
  const headerLines = [
    RESTAURANT_INFO.name,
    RESTAURANT_INFO.tagline,
    RESTAURANT_INFO.address,
    `Tel: ${RESTAURANT_INFO.phone} - Email: ${RESTAURANT_INFO.email}`,
    `RC: ${RESTAURANT_INFO.rc} - NIF: ${RESTAURANT_INFO.nif}`,
    '',
    meta.title,
    periodKindLabel(meta.period),
    `Periode: ${meta.periodLabel}`,
    `Genere le: ${generated}`,
    '',
  ];
  const ws = XLSX.utils.json_to_sheet(rows, { header: columns });
  const tableCsv = XLSX.utils.sheet_to_csv(ws);
  const csv = headerLines.join('\n') + '\n' + tableCsv;
  triggerDownload(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }), filename);
}

function exportRowsToPDF(meta: ReportMeta, rows: ExportRow[], filename: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const generated = formatDateTimeFR(new Date());
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(RESTAURANT_INFO.name, marginX, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(RESTAURANT_INFO.tagline, marginX, 19);
  doc.text(`${RESTAURANT_INFO.address}`, marginX, 24.5);
  doc.text(`Tél : ${RESTAURANT_INFO.phone}   ·   Email : ${RESTAURANT_INFO.email}`, marginX, 29);
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(meta.title, marginX, 40);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(periodKindLabel(meta.period), marginX, 46);
  doc.text(`Période couverte : ${meta.periodLabel}`, marginX, 51);
  doc.text(`Document généré le ${generated}`, marginX, 56);
  doc.setFontSize(8);
  doc.text(`RC : ${RESTAURANT_INFO.rc}`, pageWidth - marginX, 46, { align: 'right' });
  doc.text(`NIF : ${RESTAURANT_INFO.nif}`, pageWidth - marginX, 51, { align: 'right' });
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const body = rows.map((r) => columns.map((c) => String(r[c])));
  autoTable(doc, {
    startY: 63,
    head: [columns],
    body,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawPage: () => {
      const pageCount = doc.getNumberOfPages();
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(RESTAURANT_INFO.name, marginX, pageH - 8);
      doc.text(`Page ${doc.getCurrentPageInfo().pageNumber} / ${pageCount}`, pageWidth - marginX, pageH - 8, { align: 'right' });
    },
  });
  doc.save(filename);
}

type ExportFormat = 'pdf' | 'excel' | 'csv';

function runExport(format: ExportFormat, meta: ReportMeta, rows: ExportRow[], baseFilename: string) {
  if (rows.length === 0) {
    window.alert('Aucune donnée à exporter pour cette période.');
    return;
  }
  if (format === 'excel') exportRowsToExcel(rows, meta, `${baseFilename}.xlsx`);
  else if (format === 'csv') exportRowsToCSV(rows, meta, `${baseFilename}.csv`);
  else exportRowsToPDF(meta, rows, `${baseFilename}.pdf`);
}

function demoAction(label: string) {
  window.alert(`Démo — action déclenchée : ${label}`);
}


/* ============================================================================
 * Modal générique
 * ==========================================================================*/
interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  spreadFooter?: boolean;
}

function Modal({ title, subtitle, onClose, children, footer, width, spreadFooter }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: width || '460px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#000', margin: 0 }}>{title}</h3>
            {subtitle && <div style={{ fontSize:'16px', color: '#000', marginTop: '4px', fontWeight:800 }}>{subtitle}</div>}
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className={`modal-footer${spreadFooter ? ' spread' : ''}`}>{footer}</div>}
      </div>
    </div>
  );
}

/* ============================================================================
 * KPI Details Modal (générique) — affiche tous les attributs d'un KPI
 * ==========================================================================*/
interface KpiDetailRow {
  label: string;
  value: string;
  accent?: 'up' | 'down' | 'neutral';
}

interface KpiDetail {
  title: string;
  subtitle?: string;
  rows: KpiDetailRow[];
}

function KpiDetailsModal({ detail, onClose }: { detail: KpiDetail; onClose: () => void }) {
  return (
    <Modal
      title={detail.title}
      subtitle={detail.subtitle}
      onClose={onClose}
      width="480px"
      footer={<button className="btn-primary" onClick={onClose}>Fermer</button>}
    >
      <div>
        {detail.rows.map((r, i) => (
          <div className="stat-row" key={i}>
            <div className="lbl">{r.label}</div>
            <div className={`val${r.accent === 'up' ? '' : ''}`} style={{ color: r.accent === 'up' ? 'var(--green)' : r.accent === 'down' ? 'var(--red)' : undefined }}>{r.value}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ============================================================================
 * KPI Details Modal v2 — cartes horizontales (design riche, consultation seule)
 * ==========================================================================*/
type KpiColor2 = 'blue' | 'green' | 'red' | 'orange' | 'purple';

const KPI_COLOR2: Record<KpiColor2, { solid: string; soft: string; text: string }> = {
  blue:   { solid: 'var(--blue)',   soft: 'var(--blue-soft)',   text: 'var(--blue2)' },
  green:  { solid: 'var(--green)',  soft: 'var(--green-soft)',  text: 'var(--green)' },
  red:    { solid: 'var(--red)',    soft: 'var(--red-soft)',    text: 'var(--red)' },
  orange: { solid: 'var(--orange)', soft: 'var(--orange-soft)', text: 'var(--orange)' },
  purple: { solid: '#7c3aed',       soft: '#f3e8ff',            text: '#7c3aed' },
};

interface KpiHeroCard2 {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  variant: 'filled' | 'soft';
  color: KpiColor2;
}

function KpiHero({ card }: { card: KpiHeroCard2 }) {
  const c = KPI_COLOR2[card.color];
  const filled = card.variant === 'filled';
  const Icon = card.icon;
  return (
    <div style={{
      flex: 1, minWidth: 190, borderRadius: 'var(--r2)', padding: '18px 20px',
      background: filled ? c.solid : 'var(--surface)',
      border: filled ? 'none' : '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: filled ? 'rgba(255,255,255,0.22)' : c.soft,
          color: filled ? '#fff' : c.text,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}><Icon size={18} /></div>
        <span style={{ fontSize: '15px', fontWeight: 800, color: filled ? 'rgba(255,255,255,0.9)' : '#000' }}>{card.label}</span>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'var(--mono)', color: filled ? '#fff' : c.text }}>
        {card.value}
      </div>
      {card.sub && (
        <div style={{ fontSize: '14px', fontWeight: 700, color: filled ? 'rgba(255,255,255,0.85)' : '#000' }}>{card.sub}</div>
      )}
    </div>
  );
}

interface KpiProgressCard2 {
  icon: React.ElementType;
  label: string;
  value: string;
  percent: number;
  footer: string;
  color: KpiColor2;
}

function KpiProgress({ card }: { card: KpiProgressCard2 }) {
  const c = KPI_COLOR2[card.color];
  const Icon = card.icon;
  return (
    <div style={{ flex: 1, minWidth: 160, borderRadius: 'var(--r2)', border: '1px solid var(--border)', background: 'var(--surface)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: c.soft, color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={15} /></div>
        <span style={{ fontSize: '14px', fontWeight: 800, color: '#000' }}>{card.label}</span>
      </div>
      <div style={{ fontSize: '21px', fontWeight: 900, color: '#000', fontFamily: 'var(--mono)' }}>{card.value}</div>
      <div style={{ height: 6, borderRadius: 4, background: 'var(--surface2)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, card.percent))}%`, background: c.solid, borderRadius: 4 }} />
      </div>
      <div style={{ fontSize: '13px', fontWeight: 800, color: c.text }}>{card.footer}</div>
    </div>
  );
}

interface KpiSplitStat2 {
  leftLabel: string; leftValue: string; leftSub?: string;
  rightLabel: string; rightValue: string; rightIcon?: React.ElementType;
  progress: number; progressLeftText: string; progressRightText: string;
  color: KpiColor2;
}

function KpiSplit({ stat }: { stat: KpiSplitStat2 }) {
  const c = KPI_COLOR2[stat.color];
  const RightIcon = stat.rightIcon;
  return (
    <div style={{ borderRadius: 'var(--r2)', border: '1px solid var(--border)', background: 'var(--surface2)', padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '20px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#000' }}>{stat.leftLabel}</span>
          <span style={{ fontSize: '32px', fontWeight: 900, color: c.text, fontFamily: 'var(--mono)' }}>{stat.leftValue}</span>
          {stat.leftSub && <span style={{ fontSize: '14px', color: '#000', fontWeight: 700 }}>{stat.leftSub}</span>}
        </div>
        <div style={{ width: 1, background: 'var(--border2)' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#000' }}>{stat.rightLabel}</span>
            {RightIcon && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: c.soft, color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RightIcon size={15} /></div>
            )}
          </div>
          <span style={{ fontSize: '32px', fontWeight: 900, color: '#000', fontFamily: 'var(--mono)' }}>{stat.rightValue}</span>
        </div>
      </div>
      <div style={{ marginTop: '16px', height: 8, borderRadius: 5, background: 'var(--surface3)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, stat.progress))}%`, background: c.solid, borderRadius: 5 }} />
      </div>
      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800, color: c.text }}>
        <span>{stat.progressLeftText}</span>
        <span>{stat.progressRightText}</span>
      </div>
    </div>
  );
}

interface KpiListRow3 {
  icon: React.ElementType;
  label: string;
  value: string;
  color: KpiColor2;
  badge?: boolean;
}

function KpiListCard({ rows }: { rows: KpiListRow3[] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(${rows.length > 1 ? '190px' : '260px'}, 1fr))`,
      gap: '10px',
    }}>
      {rows.map((r, i) => {
        const c = KPI_COLOR2[r.color];
        const Icon = r.icon;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 14px', borderRadius: 'var(--r2)',
            border: '1px solid var(--border)', background: 'var(--surface)',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--r)',
              background: c.soft, color: c.text,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}><Icon size={16} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: r.badge ? c.text : '#000', fontFamily: 'var(--mono)' }}>{r.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface KpiDetail2 {
  title: string;
  subtitle?: string;
  hero?: KpiHeroCard2[];
  split?: KpiSplitStat2;
  pair?: KpiHeroCard2[];
  progressPair?: KpiProgressCard2[];
  list?: KpiListRow3[];
}

function KpiDetailsModalV2({ detail, onClose }: { detail: KpiDetail2; onClose: () => void }) {
  return (
    <Modal title={detail.title} subtitle={detail.subtitle} onClose={onClose} width="720px"
      footer={<button className="btn-default" onClick={onClose}>Fermer</button>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {detail.hero && <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>{detail.hero.map((h, i) => <KpiHero key={i} card={h} />)}</div>}
        {detail.split && <KpiSplit stat={detail.split} />}
        {detail.pair && <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>{detail.pair.map((h, i) => <KpiHero key={i} card={h} />)}</div>}
        {detail.progressPair && <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>{detail.progressPair.map((p, i) => <KpiProgress key={i} card={p} />)}</div>}
        {detail.list && <KpiListCard rows={detail.list} />}
      </div>
    </Modal>
  );
}

/* ============================================================================
 * PeriodModal (pour personnalisé)
 * ==========================================================================*/
interface PeriodModalProps {
  initial: CustomRange;
  onClose: () => void;
  onConfirm: (range: CustomRange) => void;
}

function PeriodModal({ initial, onClose, onConfirm }: PeriodModalProps) {
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const invalid = !from || !to || from > to;
  return (
    <Modal
      title="Période personnalisée"
      subtitle="Choisissez la date de début et la date de fin"
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn-primary" disabled={invalid} onClick={() => onConfirm({ from, to })}>
            Appliquer la période
          </button>
        </>
      }
    >
      <div className="form-row">
        <div className="field"><label>Du</label><input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="field"><label>Au</label><input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </div>
      {invalid && from && to && (
        <div className="note note-amber">La date de fin doit être postérieure ou égale à la date de début.</div>
      )}
    </Modal>
  );
}

/* ============================================================================
 * Chart.js configs & Canvas
 * ==========================================================================*/
const BLUE = '#2563eb';
const GREEN = '#0b7e3d';
const AMBER = '#b45309';
const VIOLET = '#7c3aed';
const TEAL = '#0d9488';
const gridLine = 'rgba(0,0,0,0.06)';
const tickColor = '#000';

const kFormatter = (v: number) => (v >= 1000 ? v / 1000 + 'k' : v);

const caChartConfig: ChartConfiguration = {
  type: 'line',
  data: {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: 'CA',
        data: [58000, 72000, 65000, 80000, 90000, 95000, 78000],
        borderColor: BLUE,
        backgroundColor: 'rgba(37,99,235,0.08)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: BLUE,
        fill: true,
      },
      {
        label: 'Bénéfice',
        data: [16500, 20400, 18200, 22500, 25500, 27000, 22000],
        borderColor: GREEN,
        backgroundColor: 'rgba(11,126,61,0.05)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: GREEN,
        fill: true,
        borderDash: [5, 3],
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: gridLine }, ticks: { color: tickColor } },
      y: { grid: { color: gridLine }, ticks: { color: tickColor, callback: (v: string | number) => kFormatter(Number(v)) } },
    },
  },
};

const catChartConfig: ChartConfiguration = {
  type: 'doughnut',
  data: {
    labels: ['Plats Principaux', 'Boissons', 'Entrées', 'Desserts'],
    datasets: [{
      data: [45, 25, 20, 10],
      backgroundColor: [BLUE, TEAL, AMBER, VIOLET],
      borderWidth: 3,
      borderColor: '#fff',
      spacing: 2,
    }],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: { legend: { display: false } },
  } as any,
};

const payChartConfig: ChartConfiguration = {
  type: 'bar',
  data: {
    labels: ['Espèces', 'CIB', 'Virement', 'Mixte'],
    datasets: [{
      data: [185000, 198000, 42000, 27800],
      backgroundColor: [BLUE, TEAL, AMBER, VIOLET],
      borderRadius: 5,
      borderSkipped: false,
    }],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: tickColor } },
      y: { grid: { color: gridLine }, ticks: { color: tickColor, callback: (v: string | number) => kFormatter(Number(v)) } },
    },
  },
};

const salesCatChartConfig: ChartConfiguration = {
  type: 'bar',
  data: {
    labels: ['Plats P.', 'Boissons', 'Entrées', 'Desserts', 'Pizzas', 'Burgers'],
    datasets: [{
      data: [312, 245, 198, 87, 67, 54],
      backgroundColor: BLUE,
      borderRadius: 5,
      borderSkipped: false,
    }],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: gridLine }, ticks: { color: tickColor } },
      y: { grid: { display: false }, ticks: { color: tickColor } },
    },
  },
};

const consChartConfig: ChartConfiguration = {
  type: 'bar',
  data: {
    labels: ['Poulet', 'Farine', 'Tomates', 'Huile', 'Lait', 'Oignons', 'Épices'],
    datasets: [{
      data: [84, 56, 42, 28, 35, 21, 14],
      backgroundColor: BLUE,
      borderRadius: 5,
      borderSkipped: false,
    }],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: tickColor } },
      y: { grid: { color: gridLine }, ticks: { color: tickColor, callback: (v: string | number) => `${v} kg` } },
    },
  },
};

function ChartCanvas({ config }: { config: ChartConfiguration }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current = new Chart(canvasRef.current, config);
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, []);
  return <canvas ref={canvasRef} />;
}

/* ============================================================================
 * DONNÉES POUR L'AUDIT (journal des tables)
 * ==========================================================================*/
interface TableAuditEntry {
  id: string;
  action: 'Ouverture' | 'Libération' | 'Paiement' | 'Réservation';
  table: string;
  montant?: number;
  user: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  time: string;
}

const TABLE_AUDIT_ENTRIES: TableAuditEntry[] = [
  {
    id: 'AUD-8821',
    action: 'Ouverture',
    table: 'Table 6',
    montant: 1250,
    user: 'Sofiane Rahmani',
    initials: 'SR',
    avatarBg: 'var(--blue-soft)',
    avatarColor: 'var(--blue2)',
    time: "Aujourd'hui · 10:45",
  },
  {
    id: 'AUD-8820',
    action: 'Paiement',
    table: 'Table 6',
    montant: 1850,
    user: 'Amine Belkacem',
    initials: 'AB',
    avatarBg: 'var(--green-soft)',
    avatarColor: 'var(--green)',
    time: "Aujourd'hui · 11:30",
  },
  {
    id: 'AUD-8819',
    action: 'Réservation',
    table: 'Table 12',
    user: 'Sofiane Rahmani',
    initials: 'SR',
    avatarBg: 'var(--blue-soft)',
    avatarColor: 'var(--blue2)',
    time: "Aujourd'hui · 08:15",
  },
  {
    id: 'AUD-8818',
    action: 'Ouverture',
    table: 'Terrasse T-02',
    montant: 450,
    user: 'Yacine Mansouri',
    initials: 'YM',
    avatarBg: '#f3e8ff',
    avatarColor: '#7c3aed',
    time: "Aujourd'hui · 07:45",
  },
  {
    id: 'AUD-8817',
    action: 'Libération',
    table: 'Terrasse T-02',
    montant: 1200,
    user: 'Yacine Mansouri',
    initials: 'YM',
    avatarBg: '#f3e8ff',
    avatarColor: '#7c3aed',
    time: "Aujourd'hui · 07:20",
  },
  {
    id: 'AUD-8816',
    action: 'Réservation',
    table: 'Table 3',
    user: 'Leila Haddad',
    initials: 'LH',
    avatarBg: 'var(--orange-soft)',
    avatarColor: 'var(--orange)',
    time: 'Hier · 18:30',
  },
  {
    id: 'AUD-8815',
    action: 'Ouverture',
    table: 'Table 3',
    montant: 3200,
    user: 'Amine Belkacem',
    initials: 'AB',
    avatarBg: 'var(--green-soft)',
    avatarColor: 'var(--green)',
    time: 'Hier · 11:45',
  },
  {
    id: 'AUD-8814',
    action: 'Paiement',
    table: 'Table 3',
    montant: 3200,
    user: 'Amine Belkacem',
    initials: 'AB',
    avatarBg: 'var(--green-soft)',
    avatarColor: 'var(--green)',
    time: 'Hier · 13:00',
  },
  {
    id: 'AUD-8813',
    action: 'Réservation',
    table: 'Table 5',
    user: 'Sofiane Rahmani',
    initials: 'SR',
    avatarBg: 'var(--blue-soft)',
    avatarColor: 'var(--blue2)',
    time: 'Hier · 09:15',
  },
  {
    id: 'AUD-8812',
    action: 'Ouverture',
    table: 'Table 5',
    montant: 1800,
    user: 'Amine Kaci',
    initials: 'AK',
    avatarBg: 'var(--green-soft)',
    avatarColor: 'var(--green)',
    time: 'Hier · 03:00',
  },
];

/* ============================================================================
 * NOTIFICATIONS (ruptures & expirations)
 * ==========================================================================*/
type NotificationType = 'rupture' | 'expiration';

interface StockAlert {
  id: string;
  type: NotificationType;
  produit: string;
  qte: string;
  seuil?: string;
  expiration?: string;
  jours?: number;
  date: string;
}

const STOCK_ALERTS: StockAlert[] = [
  { id: 'n1', type: 'rupture', produit: 'Filet de Bœuf', qte: '0 kg', seuil: '5 kg', date: "Aujourd'hui" },
  { id: 'n2', type: 'expiration', produit: 'Lait Entier', qte: '15 L', expiration: '29/06', jours: 1, date: "Aujourd'hui" },
  { id: 'n3', type: 'expiration', produit: 'Crème Fraîche', qte: '4 kg', expiration: '30/06', jours: 2, date: "Aujourd'hui" },
  { id: 'n4', type: 'rupture', produit: 'Saumon Frais', qte: '0 kg', seuil: '10 kg', date: 'Hier' },
  { id: 'n5', type: 'rupture', produit: 'Mozzarella', qte: '0 kg', seuil: '5 kg', date: 'Hier' },
];

/* ============================================================================
 * Topbar avec sélecteur de date au survol + notifications
 * ==========================================================================*/
interface TopbarProps {
  title: string;
  activePage: PageId;
  activePeriod: Period;
  periodLabel: string;
  customRange: CustomRange;
  onSelectPeriod: (period: Period) => void;
  onApplyCustomRange: (range: CustomRange) => void;
  reportRows: ExportRow[];
  reportTitle: string;
  showPeriodFilters?: boolean;
  showExportButtons?: boolean;
  referenceDate: Date;
  onReferenceDateChange: (date: Date) => void;
  notifications: StockAlert[];
  notificationsOpen: boolean;
  onNotificationsOpen: () => void;
  onNotificationsClose: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

function Topbar({
  title,
  activePage,
  activePeriod,
  periodLabel,
  customRange,
  onSelectPeriod,
  onApplyCustomRange,
  reportRows,
  reportTitle,
  showPeriodFilters = true,
  showExportButtons = true,
  referenceDate,
  onReferenceDateChange,
  notifications,
  notificationsOpen,
  onNotificationsOpen,
  onNotificationsClose,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: TopbarProps) {
  const periods = Object.keys(PERIOD_LABELS) as Period[];
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState({ name: 'Sofiane Rahmani', email: 'sofiane@restaurantpro.dz', phone: '+213 550 12 34 56' });

  const [datePickerOpen, setDatePickerOpen] = useState<Period | null>(null);
  const periodGroupRef = useRef<HTMLDivElement | null>(null);

  const showExport = EXPORTABLE_PAGES.includes(activePage);
  const reportMeta: ReportMeta = { title: reportTitle, period: activePeriod, periodLabel };

  const handlePeriodClick = (p: Period) => {
    if (p === 'personnalise') {
      setPeriodModalOpen(true);
      return;
    }
    setDatePickerOpen((prev) => (prev === p ? null : p));
  };

  const handleDatePick = (p: Period, date: Date) => {
    onReferenceDateChange(date);
    onSelectPeriod(p);
    setDatePickerOpen(null);
  };

  // Ferme le sélecteur de période si on clique en dehors
  useEffect(() => {
    if (!datePickerOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (periodGroupRef.current && !periodGroupRef.current.contains(e.target as Node)) {
        setDatePickerOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [datePickerOpen]);

  const displayDate = showPeriodFilters ? periodLabel : formatDateTimeFR(new Date());

  return (
    <>
      <header className="topbar">
        <div className="topbar-brand">
        <div className="brand-icon"><Store size={18} /></div>
        <div>
          <div className="brand-name">RestaurantPro</div>
          <div className="brand-sub">L&apos;Arôme Gourmet</div>
        </div>
      </div>
      <div className="topbar-center">
        {title && <span className="topbar-title">{title}</span>}
        <span className="topbar-date"><Calendar size={14} />{displayDate}</span>
      </div>
      {onSearchChange && (
        <div className="topbar-search">
          <Search size={14} />
          <input
            placeholder={searchPlaceholder || 'Rechercher...'}
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}
      {showPeriodFilters && (
        <>
          <div className="period-group" ref={periodGroupRef}>
            {periods.map((p) => (
              <button
                key={p}
                className={`period-btn${activePeriod === p ? ' active' : ''}`}
                onClick={() => handlePeriodClick(p)}
              >
                {PERIOD_LABELS[p]}
                {datePickerOpen === p && (
                  <div
                    className="date-picker-popover"
                    onClick={(e) => e.stopPropagation()}
                    style={p === 'jour' ? undefined : { maxHeight: '300px', overflowY: 'auto', minWidth: '230px' }}
                  >
                    {p === 'jour' && (
                      <input
                        type="date"
                        className="input"
                        value={toInputDate(referenceDate)}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const parts = val.split('-');
                            const newDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                            handleDatePick(p, newDate);
                          }
                        }}
                        onBlur={() => setDatePickerOpen(null)}
                        autoFocus
                      />
                    )}
                    {p === 'semaine' && getWeekOptions(12).map((opt, idx) => (
                      <div
                        key={idx}
                        className={`period-option-item${idx === 0 ? ' current' : ''}`}
                        onClick={() => handleDatePick(p, opt.date)}
                      >
                        {opt.label}
                      </div>
                    ))}
                    {p === 'mois' && getMonthOptions(12).map((opt, idx) => (
                      <div
                        key={idx}
                        className={`period-option-item${idx === 0 ? ' current' : ''}`}
                        onClick={() => handleDatePick(p, opt.date)}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="topbar-actions">
        {showExportButtons && (
          <button className="btn-primary" onClick={() => setExportOpen(true)}><Download size={15} /> Exporter</button>
        )}
        <button
          className="notif-btn"
          onClick={onNotificationsOpen}
          title="Alertes"
        >
          <Bell size={22} />
          {notifications.length > 0 && (
            <span className="notif-badge">
              {notifications.length}
            </span>
          )}
        </button>
        <div className="avatar" style={{ cursor: 'pointer' }} onClick={() => setProfileOpen(true)}>SR</div>
      </div>
    </header>

      {notificationsOpen && (
        <Modal
          title="Alertes stock & expirations"
          subtitle={`${notifications.length} notification${notifications.length > 1 ? 's' : ''} en attente`}
          onClose={onNotificationsClose}
          width="520px"
          footer={<button className="btn-primary" onClick={onNotificationsClose}>Fermer</button>}
        >
          {notifications.length === 0 ? (
            <p style={{ color: '#000', textAlign: 'center' }}>Aucune alerte</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.map(alert => (
                <div key={alert.id} style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--r)',
                  border: `1px solid ${alert.type === 'rupture' ? 'var(--red-soft)' : 'var(--orange-soft)'}`,
                  background: alert.type === 'rupture' ? 'var(--red-soft)' : 'var(--orange-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{ flexShrink: 0, color: alert.type === 'rupture' ? 'var(--red)' : 'var(--orange)' }}>
                    {alert.type === 'rupture' ? <AlertTriangle size={20} /> : <Clock size={20} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: '#000' }}>
                      {alert.type === 'rupture' ? 'Rupture de stock' : 'Expiration imminente'}
                    </div>
                    <div style={{ fontSize:'16px', color: '#000' }}>
                      {alert.produit} · {alert.qte}
                      {alert.type === 'rupture' && alert.seuil && ` (seuil : ${alert.seuil})`}
                      {alert.type === 'expiration' && alert.jours && ` · expire dans ${alert.jours} jour${alert.jours > 1 ? 's' : ''}`}
                    </div>
                    <div style={{ fontSize:'15px', color: '#000', marginTop: '4px' }}>
                      {alert.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {periodModalOpen && (
        <PeriodModal
          initial={customRange}
          onClose={() => setPeriodModalOpen(false)}
          onConfirm={(range) => { onApplyCustomRange(range); setPeriodModalOpen(false); }}
        />
      )}

      {showExport && exportOpen && (
        <Modal
          title="Exporter les données"
          subtitle={`${periodKindLabel(activePeriod)} · ${periodLabel}`}
          onClose={() => setExportOpen(false)}
          footer={
            <>
              <button className="btn-ghost" onClick={() => setExportOpen(false)}>Annuler</button>
              <button className="btn-primary" onClick={() => { runExport(exportFormat, reportMeta, reportRows, `${reportTitle.replace(/\s+/g, '_')}_${toInputDate(new Date())}`); setExportOpen(false); }}>
                <Download size={14} /> Télécharger
              </button>
            </>
          }
        >
          <div className="field">
            <label>Format du fichier</label>
            <div className="radio-row">
              {[
                { id: 'pdf', label: 'PDF — mise en page prête à imprimer, avec en-tête restaurant' },
                { id: 'excel', label: 'Excel (.xlsx) — avec en-tête restaurant et période' },
                { id: 'csv', label: 'CSV — pour import dans un autre outil' },
              ].map((opt) => (
                <div key={opt.id} className={`radio-opt${exportFormat === opt.id ? ' selected' : ''}`} onClick={() => setExportFormat(opt.id as ExportFormat)}>
                  <input type="radio" checked={exportFormat === opt.id} readOnly /> {opt.label}
                </div>
              ))}
            </div>
          </div>

        </Modal>
      )}


      {profileOpen && (
        <Modal
          title="Mon profil"
          subtitle="Manager · L'Arôme Gourmet"
          onClose={() => setProfileOpen(false)}
          footer={
            <>
              <button className="btn-ghost" onClick={() => setProfileOpen(false)}>Annuler</button>
              <button className="btn-primary" onClick={() => setProfileOpen(false)}>Enregistrer</button>
            </>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: 18 }}>SR</div>
            <button className="btn-ghost" onClick={() => demoAction('Changer la photo de profil')}>Changer la photo</button>
          </div>
          <div className="field"><label>Nom complet</label><input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
          <div className="field"><label>Email</label><input className="input" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></div>
          <div className="field"><label>Téléphone</label><input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
        </Modal>
      )}
    </>
  );
}

/* ============================================================================
 * Sidebar
 * ==========================================================================*/
interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onLogout: () => void;
}

function Sidebar({ activePage, onNavigate, collapsed, onToggleCollapsed, onLogout }: SidebarProps) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  return (
    <aside
      className="sidebar"
      style={{
        position: 'fixed',
        left: 0,
        top: 60,
        zIndex: 30,
        width: collapsed ? 72 : 250,
        height: 'calc(100vh - 60px)',
        transition: 'width .2s ease',
      }}
    >
      {NAV_SECTIONS.map((section, i) => (
        <div key={section.label}>
          <div className="nav-section">
            {!collapsed && <div className="nav-label">{section.label}</div>}
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  title={collapsed ? item.label : undefined}
                  className={`nav-item${activePage === item.id ? ' active' : ''}${collapsed ? ' nav-item-collapsed' : ''}`}
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon size={18} /> {!collapsed && item.label}
                </div>
              );
            })}
          </div>
          {i < NAV_SECTIONS.length - 1 && <div className="nav-divider" />}
        </div>
      ))}
      <div className="sidebar-footer">
        {confirmLogout && !collapsed ? (
          <div className="logout-confirm">
            <span className="logout-confirm-txt">Confirmer la déconnexion ?</span>
            <div className="logout-confirm-row">
              <button className="btn-cancel-mini" onClick={() => setConfirmLogout(false)}>Annuler</button>
              <button className="btn-quit-mini" onClick={onLogout}>Quitter</button>
            </div>
          </div>
        ) : (
          <button className={`logout-btn${collapsed ? ' collapsed-btn' : ''}`} title={collapsed ? 'Déconnexion' : undefined} onClick={() => (collapsed ? onLogout() : setConfirmLogout(true))}>
            <LogOut size={16} /> {!collapsed && <span>Déconnexion</span>}
          </button>
        )}
        <button className="collapse-toggle" onClick={onToggleCollapsed}>
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />} {!collapsed && <span>Réduire</span>}
        </button>
      </div>
    </aside>
  );
}


/* ============================================================================
 * Pages (sans .page-header, avec cartes uniformisées)
 * ==========================================================================*/

/* RevenuePage */
const REVENUE_KPI_DETAILS_V2: Record<string, KpiDetail2> = {
  ca: {
    title: "Chiffre d'affaires — détails",
    subtitle: "Aujourd'hui",
    hero: [
      { icon: Coins, label: 'CA total', value: '452 800 DA', variant: 'filled', color: 'blue' },
      { icon: TrendingUp, label: 'Évolution vs hier', value: '+12.5%', sub: '+50 400 DA par rapport à hier', variant: 'soft', color: 'green' },
    ],
    progressPair: [
      { icon: Armchair, label: 'CA salle', value: '241 200 DA', percent: 53.3, footer: '53.3 % du total', color: 'blue' },
      { icon: Sun, label: 'CA terrasse', value: '134 500 DA', percent: 29.7, footer: '29.7 % du total', color: 'green' },
      { icon: Coffee, label: 'CA cafétéria', value: '77 100 DA', percent: 17.0, footer: '17.0 % du total', color: 'orange' },
    ],
    list: [
      { icon: ClipboardList, label: 'Nombre de commandes', value: '342', color: 'purple' },
      { icon: FileText, label: 'Ticket moyen', value: '1 421 DA', color: 'orange' },
      { icon: Clock, label: 'Meilleure heure', value: '12h30 - 14h00', color: 'blue', badge: true },
    ],
  },
  benefice: {
    title: 'Bénéfice net — détails',
    subtitle: "Aujourd'hui",
    hero: [
      { icon: TrendingUp, label: 'Bénéfice net', value: '128 450 DA', variant: 'filled', color: 'green' },
      { icon: ArrowUpRight, label: 'Évolution vs hier', value: '+8.2%', sub: 'Bénéfice en hausse', variant: 'soft', color: 'green' },
    ],
    progressPair: [
      { icon: Coins, label: 'CA', value: '452 800 DA', percent: 100, footer: 'Base de calcul', color: 'blue' },
      { icon: ShoppingCart, label: 'Coût matières', value: '230 000 DA', percent: 50.8, footer: '50.8 % du CA', color: 'orange' },
      { icon: FileText, label: 'Charges', value: '94 350 DA', percent: 20.8, footer: '20.8 % du CA', color: 'red' },
    ],
    list: [{ icon: Percent, label: 'Marge nette', value: '28.4 %', color: 'purple' }],
  },
  ticket: {
    title: 'Ticket moyen — détails',
    subtitle: "Aujourd'hui",
    hero: [
      { icon: Receipt, label: 'Ticket moyen', value: '1 421 DA', variant: 'filled', color: 'blue' },
      { icon: ArrowUpRight, label: 'Évolution vs hier', value: '+3.1%', sub: 'Panier moyen en hausse', variant: 'soft', color: 'green' },
    ],
    list: [
      { icon: ArrowDownRight, label: 'Ticket minimum', value: '180 DA', color: 'red' },
      { icon: ArrowUpRight, label: 'Ticket maximum', value: '8 400 DA', color: 'green' },
      { icon: Receipt, label: 'Nombre de tickets', value: '318', color: 'blue' },
    ],
  },
  marge: {
    title: 'Taux de marge — détails',
    subtitle: "Aujourd'hui",
    split: {
      leftLabel: 'Taux de marge actuel', leftValue: '28.4 %', leftSub: "sur le chiffre d'affaires",
      rightLabel: 'Objectif de marge', rightValue: '30 %', rightIcon: Target,
      progress: 95, progressLeftText: "95 % de l'objectif atteint", progressRightText: '1.6 % restant',
      color: 'blue',
    },
    pair: [
      { icon: ArrowDownRight, label: 'Évolution vs hier', value: '-1.2%', sub: '↓ Baisse', variant: 'soft', color: 'red' },
      { icon: Flag, label: 'Objectif marge', value: '30 %', sub: 'Objectif mensuel', variant: 'soft', color: 'orange' },
    ],
    progressPair: [
      { icon: ShoppingCart, label: 'Coût matières / CA', value: '50.8 %', percent: 50.8, footer: '● Élevé', color: 'orange' },
      { icon: FileText, label: 'Charges / CA', value: '20.8 %', percent: 20.8, footer: '● Maîtrisé', color: 'blue' },
    ],
  },
};

function RevenuePage() {
  const [kpiOpen, setKpiOpen] = useState<string | null>(null);
  return (
    <>
      <div className="section">
        <div className="kpi-grid">
          <div className="kpi-card clickable" onClick={() => setKpiOpen('ca')}>
            <div className="kpi-icon blue"><Coins size={22} /></div>
            <div className="kpi-content">
              <div className="kpi-label">Chiffre d'affaires</div>
              <div className="kpi-value kpi-price">452 800 <small>DA</small></div>
              <div className="kpi-delta delta-up"><ArrowUpRight size={13} /> +12.5%</div>
            </div>
          </div>
          <div className="kpi-card clickable" onClick={() => setKpiOpen('benefice')}>
            <div className="kpi-icon green"><TrendingUp size={22} /></div>
            <div className="kpi-content">
              <div className="kpi-label">Bénéfice net</div>
              <div className="kpi-value kpi-price">128 450 <small>DA</small></div>
              <div className="kpi-delta delta-up"><ArrowUpRight size={13} /> +8.2%</div>
            </div>
          </div>
          <div className="kpi-card clickable" onClick={() => setKpiOpen('ticket')}>
            <div className="kpi-icon blue"><Receipt size={22} /></div>
            <div className="kpi-content">
              <div className="kpi-label">Ticket moyen</div>
              <div className="kpi-value kpi-price">1 421 <small>DA</small></div>
              <div className="kpi-delta delta-up"><ArrowUpRight size={13} /> +3.1%</div>
            </div>
          </div>
          <div className="kpi-card clickable" onClick={() => setKpiOpen('marge')}>
            <div className="kpi-icon purple"><Percent size={22} /></div>
            <div className="kpi-content">
              <div className="kpi-label">Taux de marge</div>
              <div className="kpi-value">28.4 <small>%</small></div>
              <div className="kpi-delta delta-down"><ArrowDownRight size={13} /> -1.2%</div>
            </div>
          </div>
        </div>
      </div>
      <div className="section charts-2">
        <div className="card">
          <div className="card-header"><h3><LineChart size={16} color="var(--blue)" /> Évolution du CA</h3></div>
          <div className="card-body">
            <div className="chart-wrap" style={{height: '220px'}}><ChartCanvas config={caChartConfig} /></div>
            <div className="legend"><div className="leg-item"><div className="leg-sq" style={{background: 'var(--blue)'}}></div> CA</div><div className="leg-item"><div className="leg-sq" style={{background: 'var(--green)'}}></div> Bénéfice</div></div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3><PieChart size={16} color="var(--blue)" /> Répartition CA</h3></div>
          <div className="card-body">
            <div className="chart-wrap" style={{height: '180px'}}><ChartCanvas config={catChartConfig} /></div>
            <div className="legend"><div className="leg-item"><div className="leg-sq" style={{background: 'var(--blue)'}}></div> Plats 45%</div><div className="leg-item"><div className="leg-sq" style={{background: 'var(--teal)'}}></div> Boissons 25%</div><div className="leg-item"><div className="leg-sq" style={{background: 'var(--amber)'}}></div> Entrées 20%</div><div className="leg-item"><div className="leg-sq" style={{background: 'var(--violet)'}}></div> Desserts 10%</div></div>
          </div>
        </div>
      </div>
      <div className="section charts-2eq">
        <div className="card">
          <div className="card-header"><h3><CreditCard size={16} color="var(--blue)" /> Mode de paiement</h3></div>
          <div className="card-body">
            <div className="chart-wrap" style={{height:'180px'}}><ChartCanvas config={payChartConfig} /></div>
            <div className="legend"><div className="leg-item"><div className="leg-sq" style={{background:'var(--blue)'}}></div> Espèces</div><div className="leg-item"><div className="leg-sq" style={{background:'var(--teal)'}}></div> CIB</div><div className="leg-item"><div className="leg-sq" style={{background:'var(--amber)'}}></div> Virement</div><div className="leg-item"><div className="leg-sq" style={{background:'var(--violet)'}}></div> Mixte</div></div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3><MapPin size={16} color="var(--blue)" /> CA par zone</h3></div>
          <div className="card-body">
            <div className="stat-row"><div className="lbl"><Armchair size={15} /> Salle</div><div style={{textAlign:'right'}}><div className="val val-price">241 200 DA</div><div className="kpi-delta delta-up">+14%</div></div></div>
            <div className="stat-row"><div className="lbl"><Sun size={15} /> Terrasse</div><div style={{textAlign:'right'}}><div className="val val-price">134 500 DA</div><div className="kpi-delta delta-up">+9%</div></div></div>
            <div className="stat-row"><div className="lbl"><Coffee size={15} /> Cafétéria</div><div style={{textAlign:'right'}}><div className="val val-price">77 100 DA</div><div className="kpi-delta delta-down">-3%</div></div></div>
            <div style={{marginTop:'12px'}}><div style={{fontSize:'15px', color:'#000'}}>Répartition</div><div style={{display:'flex', gap:'3px', height:'10px', borderRadius:'6px', overflow:'hidden'}}><div style={{flex:'53', background:'var(--blue)'}}></div><div style={{flex:'30', background:'var(--teal)'}}></div><div style={{flex:'17', background:'var(--amber)'}}></div></div></div>
          </div>
        </div>
      </div>
      <div className="section">
        <div className="section-header"><div className="section-title"><BarChart3 size={16} /> Bénéfice par période</div></div>
        <div className="charts-3">
          <div className="card"><div className="card-header"><h3><CalendarCheck size={16} color="var(--blue)" /> Aujourd'hui</h3></div><div className="card-body"><div className="stat-row"><div className="lbl">CA</div><div className="val val-price">452 800 DA</div></div><div className="stat-row"><div className="lbl">Coût mat.</div><div className="val val-price">230 000 DA</div></div><div className="stat-row"><div className="lbl">Charges</div><div className="val val-price">94 350 DA</div></div><div className="stat-row"><div className="lbl" style={{color:'var(--green)'}}>Bénéfice</div><div className="val" style={{color:'var(--green)'}}>128 450 DA</div></div><div className="stat-row"><div className="lbl">Marge</div><div className="val">28.4%</div></div></div></div>
          <div className="card"><div className="card-header"><h3><CalendarRange size={16} color="var(--blue)" /> Semaine</h3></div><div className="card-body"><div className="stat-row"><div className="lbl">CA</div><div className="val val-price">2 840 000 DA</div></div><div className="stat-row"><div className="lbl">Coût mat.</div><div className="val val-price">1 430 000 DA</div></div><div className="stat-row"><div className="lbl">Charges</div><div className="val val-price">568 000 DA</div></div><div className="stat-row"><div className="lbl" style={{color:'var(--green)'}}>Bénéfice</div><div className="val" style={{color:'var(--green)'}}>842 000 DA</div></div><div className="stat-row"><div className="lbl">Marge</div><div className="val">29.6%</div></div></div></div>
          <div className="card"><div className="card-header"><h3><CalendarDays size={16} color="var(--blue)" /> Mois</h3></div><div className="card-body"><div className="stat-row"><div className="lbl">CA</div><div className="val val-price">11 200 000 DA</div></div><div className="stat-row"><div className="lbl">Coût mat.</div><div className="val val-price">5 600 000 DA</div></div><div className="stat-row"><div className="lbl">Charges</div><div className="val val-price">2 240 000 DA</div></div><div className="stat-row"><div className="lbl" style={{color:'var(--green)'}}>Bénéfice</div><div className="val" style={{color:'var(--green)'}}>3 360 000 DA</div></div><div className="stat-row"><div className="lbl">Marge</div><div className="val">30.0%</div></div></div></div>
        </div>
      </div>
      {kpiOpen && REVENUE_KPI_DETAILS_V2[kpiOpen] && (
        <KpiDetailsModalV2 detail={REVENUE_KPI_DETAILS_V2[kpiOpen]} onClose={() => setKpiOpen(null)} />
      )}
    </>
  );
}

/* CommercialPage */
const ALL_SOLD_ITEMS = [
  { rank: 1, name: 'Couscous Royal', cat: 'Plats P.', catCls: 'b-blue', qty: 145, ca: '36 250 DA', evo: '+12%', up: true },
  { rank: 2, name: 'Tajine de Poulet', cat: 'Plats P.', catCls: 'b-blue', qty: 112, ca: '22 400 DA', evo: '+8%', up: true },
  { rank: 3, name: 'Salade Méchouia', cat: 'Entrées', catCls: 'b-amber', qty: 98, ca: '9 800 DA', evo: '-3%', up: false },
  { rank: 4, name: 'Thé à la Menthe', cat: 'Boissons', catCls: 'b-green', qty: 245, ca: '12 250 DA', evo: '+25%', up: true },
  { rank: 5, name: 'Pizza Margherita', cat: 'Plats P.', catCls: 'b-blue', qty: 67, ca: '63 650 DA', evo: '+4%', up: true },
  { rank: 6, name: 'Tiramisu Maison', cat: 'Desserts', catCls: 'b-purple', qty: 54, ca: '35 100 DA', evo: '+7%', up: true },
  { rank: 7, name: 'Burger Signature Pro', cat: 'Burgers', catCls: 'b-amber', qty: 49, ca: '61 250 DA', evo: '+2%', up: true },
  { rank: 8, name: 'Café Espresso Double', cat: 'Boissons', catCls: 'b-green', qty: 210, ca: '37 800 DA', evo: '+15%', up: true },
  { rank: 9, name: 'Filet de Daurade Grillé', cat: 'Plats P.', catCls: 'b-blue', qty: 31, ca: '57 350 DA', evo: '-5%', up: false },
  { rank: 10, name: 'Limonade Menthe', cat: 'Boissons', catCls: 'b-green', qty: 88, ca: '39 600 DA', evo: '+9%', up: true },
];

const COMMERCIAL_KPI_DETAILS_V2: Record<string, KpiDetail2> = {
  commandes: {
    title: 'Commandes — détails',
    subtitle: "Aujourd'hui",
    hero: [
      { icon: ShoppingBag, label: 'Commandes', value: '342', variant: 'filled', color: 'blue' },
      { icon: ArrowDownRight, label: 'Évolution vs hier', value: '-2.4%', sub: 'Légère baisse', variant: 'soft', color: 'red' },
    ],
    progressPair: [
      { icon: Armchair, label: 'Sur place', value: '265', percent: 77.5, footer: '77.5 % des commandes', color: 'blue' },
      { icon: ShoppingBag, label: 'À emporter', value: '77', percent: 22.5, footer: '22.5 % des commandes', color: 'green' },
    ],
    list: [
      { icon: X, label: 'Commandes annulées', value: '14', color: 'red' },
    ],
  },
  tickets: {
    title: 'Tickets encaissés — détails',
    subtitle: "Aujourd'hui",
    hero: [
      { icon: Receipt, label: 'Tickets encaissés', value: '318', variant: 'filled', color: 'green' },
      { icon: ArrowUpRight, label: 'Évolution vs hier', value: '+5.7%', sub: 'Bonne progression', variant: 'soft', color: 'green' },
    ],
    progressPair: [
      { icon: Banknote, label: 'Espèces', value: '185 000 DA', percent: 40.9, footer: '40.9 % des encaissements', color: 'green' },
      { icon: CreditCard, label: 'CIB', value: '198 000 DA', percent: 43.7, footer: '43.7 % des encaissements', color: 'blue' },
      { icon: FileText, label: 'Virement', value: '42 000 DA', percent: 9.3, footer: '9.3 % des encaissements', color: 'orange' },
      { icon: Layers, label: 'Mixte', value: '27 800 DA', percent: 6.1, footer: '6.1 % des encaissements', color: 'purple' },
    ],
    list: [
      { icon: Coins, label: 'Total encaissé', value: '452 800 DA', color: 'blue' },
    ],
  },
  remises: {
    title: 'Remises — détails',
    subtitle: "Aujourd'hui",
    hero: [
      { icon: Tag, label: 'Total remises', value: '12 400 DA', variant: 'filled', color: 'orange' },
      { icon: ListOrdered, label: "Nombre d'applications", value: '23', sub: 'Applications ce jour', variant: 'soft', color: 'blue' },
    ],
    progressPair: [
      { icon: Pencil, label: 'Manuelles', value: '8 200 DA', percent: 66.1, footer: '66.1 % des remises', color: 'blue' },
      { icon: Heart, label: 'Fidélité', value: '3 100 DA', percent: 25.0, footer: '25.0 % des remises', color: 'red' },
      { icon: Gift, label: 'Offertes', value: '3 200 DA', percent: 25.8, footer: '25.8 % des remises', color: 'purple' },
    ],
  },
  offerts: {
    title: 'Offerts — détails',
    subtitle: "Aujourd'hui",
    hero: [
      { icon: Gift, label: 'Total offert', value: '3 200 DA', variant: 'filled', color: 'purple' },
      { icon: Star, label: "Nombre d'articles offerts", value: '9', sub: 'Gestes commerciaux', variant: 'soft', color: 'orange' },
    ],
    list: [
      { icon: Heart, label: 'Motif principal', value: 'Geste commercial', color: 'blue' },
    ],
  },
};

function CommercialPage() {
  const [kpiOpen, setKpiOpen] = useState<string | null>(null);
  return (
    <>
      <div className="section">
        <div className="kpi-grid">
          <div className="kpi-card clickable" onClick={() => setKpiOpen('commandes')}><div className="kpi-icon blue"><ShoppingBag size={22} /></div><div className="kpi-content"><div className="kpi-label">Commandes</div><div className="kpi-value">342</div><div className="kpi-delta delta-down">-2.4%</div></div></div>
          <div className="kpi-card clickable" onClick={() => setKpiOpen('tickets')}><div className="kpi-icon green"><Receipt size={22} /></div><div className="kpi-content"><div className="kpi-label">Tickets encaissés</div><div className="kpi-value">318</div><div className="kpi-delta delta-up">+5.7%</div></div></div>
          <div className="kpi-card clickable" onClick={() => setKpiOpen('remises')}><div className="kpi-icon orange"><Tag size={22} /></div><div className="kpi-content"><div className="kpi-label">Remises</div><div className="kpi-value kpi-price">12 400 <small>DA</small></div><div className="kpi-delta delta-neu">23 app.</div></div></div>
          <div className="kpi-card clickable" onClick={() => setKpiOpen('offerts')}><div className="kpi-icon purple"><Gift size={22} /></div><div className="kpi-content"><div className="kpi-label">Offerts</div><div className="kpi-value kpi-price">3 200 <small>DA</small></div><div className="kpi-delta delta-neu">9 offerts</div></div></div>
        </div>
      </div>
      <div className="section full-row">
        <div className="card tbl-wrap">
          <div className="card-header"><h3><Star size={16} color="var(--blue)" /> Top ventes — tous les articles</h3></div>
          <table>
            <thead><tr><th>#</th><th>Produit</th><th>Catégorie</th><th>Qté</th><th>CA</th><th>Évol.</th></tr></thead>
            <tbody>
              {ALL_SOLD_ITEMS.map((it) => (
                <tr key={it.rank}>
                  <td><span className="rank">{it.rank}</span></td>
                  <td className="td-name">{it.name}</td>
                  <td><span className={`badge ${it.catCls}`}>{it.cat}</span></td>
                  <td>{it.qty}</td>
                  <td className="td-blue">{it.ca}</td>
                  <td className={it.up ? 'delta-up' : 'delta-down'} style={{fontSize:'15px', fontWeight:'800'}}>{it.evo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-header"><h3><BarChart3 size={16} color="var(--blue)" /> Ventes par catégorie</h3></div>
          <div className="card-body"><div className="chart-wrap" style={{height:'220px'}}><ChartCanvas config={salesCatChartConfig} /></div></div>
        </div>
      </div>
      <div className="section charts-2eq">
        <div className="card"><div className="card-header"><h3><ArrowLeft size={16} color="var(--red)" /> Retours & annulations</h3></div><div className="card-body">
          <div className="stat-row"><div className="lbl"><X size={15} /> Annulations</div><span className="badge b-red">14</span></div>
          <div className="stat-row"><div className="lbl"><PackageX size={15} /> Retours</div><span className="badge b-amber">6</span></div>
          <div className="stat-row"><div className="lbl"><Coins size={15} /> Remboursé</div><div className="val" style={{color:'var(--red)'}}>-8 400 DA</div></div>
          <div className="stat-row"><div className="lbl"><Percent size={15} /> Taux annulation</div><div className="val">4.1%</div></div>
        </div></div>
        <div className="card"><div className="card-header"><h3><Tag size={16} color="var(--amber)" /> Détail remises</h3></div><div className="card-body">
          <div className="stat-row"><div className="lbl"><Pencil size={15} /> Manuelles</div><div className="val val-price">8 200 DA</div></div>
          <div className="stat-row"><div className="lbl"><Heart size={15} /> Fidélité</div><div className="val val-price">3 100 DA</div></div>
          <div className="stat-row"><div className="lbl"><Gift size={15} /> Offerts</div><div className="val val-price">3 200 DA</div></div>
          <div className="stat-row"><div className="lbl"><ListOrdered size={15} /> Nb app.</div><div className="val">23</div></div>
        </div></div>
      </div>
      {kpiOpen && COMMERCIAL_KPI_DETAILS_V2[kpiOpen] && (
        <KpiDetailsModalV2 detail={COMMERCIAL_KPI_DETAILS_V2[kpiOpen]} onClose={() => setKpiOpen(null)} />
      )}
    </>
  );
}

/* StockPage */
const ALL_OUT_OF_STOCK = [
  { name: 'Filet de Bœuf', cat: 'Viandes', qty: '2.5 kg', date: "Aujourd'hui", badge: 'b-red', label: 'Critique' },
  { name: 'Saumon Frais', cat: 'Poissons', qty: '0 kg', date: 'Hier', badge: 'b-red', label: 'Rupture' },
  { name: 'Crème Fraîche', cat: 'Laitiers', qty: '1.2 L', date: '—', badge: 'b-amber', label: 'Alerte' },
  { name: 'Tomates Cerises', cat: 'Légumes', qty: '0.8 kg', date: '—', badge: 'b-amber', label: 'Alerte' },
  { name: 'Citrons', cat: 'Légumes', qty: '0.5 kg', date: '—', badge: 'b-amber', label: 'Alerte' },
  { name: 'Poivrons', cat: 'Légumes', qty: '1.1 kg', date: '—', badge: 'b-amber', label: 'Alerte' },
  { name: 'Mozzarella', cat: 'Laitiers', qty: '0 kg', date: 'Hier', badge: 'b-red', label: 'Rupture' },
];

const STOCK_KPI_DETAILS_V2: Record<string, KpiDetail2> = {
  valeur: {
    title: 'Valeur du stock — détails',
    subtitle: "Aujourd'hui",
    hero: [
      { icon: Package, label: 'Valeur du stock', value: '1 450 200 DA', variant: 'filled', color: 'blue' },
      { icon: ArrowUpRight, label: 'Évolution', value: '+4.2%', sub: 'Stock en hausse', variant: 'soft', color: 'green' },
    ],
    progressPair: [
      { icon: Beef, label: 'Viandes', value: '450 000 DA', percent: 31.0, footer: '31.0 % du stock', color: 'red' },
      { icon: Salad, label: 'Légumes', value: '120 000 DA', percent: 8.3, footer: '8.3 % du stock', color: 'green' },
      { icon: GlassWater, label: 'Laitiers', value: '85 000 DA', percent: 5.9, footer: '5.9 % du stock', color: 'blue' },
      { icon: ShoppingBasket, label: 'Épicerie', value: '320 000 DA', percent: 22.1, footer: '22.1 % du stock', color: 'orange' },
      { icon: Wine, label: 'Boissons', value: '198 000 DA', percent: 13.7, footer: '13.7 % du stock', color: 'purple' },
      { icon: MoreHorizontal, label: 'Autres', value: '277 200 DA', percent: 19.1, footer: '19.1 % du stock', color: 'blue' },
    ],
  },
  produits: {
    title: 'Produits en stock — détails',
    subtitle: "Aujourd'hui",
    hero: [
      { icon: Box, label: 'Produits en stock', value: '1 248', variant: 'filled', color: 'blue' },
      { icon: Layers, label: 'Catégories', value: '37', sub: 'Catégories actives', variant: 'soft', color: 'purple' },
    ],
    list: [
      { icon: AlertTriangle, label: 'Articles sous le seuil', value: '11', color: 'orange' },
    ],
  },
  ruptures: {
    title: 'Ruptures — détails',
    subtitle: "Aujourd'hui",
    hero: [
      { icon: AlertTriangle, label: 'Ruptures', value: '4', variant: 'filled', color: 'red' },
      { icon: Clock, label: 'Statut', value: 'Urgent', sub: 'Action requise', variant: 'soft', color: 'red' },
    ],
    list: [
      { icon: Package, label: 'Filet de Bœuf', value: '2.5 kg · Viandes', color: 'red' },
      { icon: Fish, label: 'Saumon Frais', value: '0 kg · Poissons', color: 'red' },
      { icon: GlassWater, label: 'Mozzarella', value: '0 kg · Laitiers', color: 'red' },
    ],
  },
  expirations: {
    title: 'Expirations — détails',
    subtitle: "Aujourd'hui",
    hero: [
      { icon: Clock, label: 'Expirations proches', value: '7', variant: 'filled', color: 'orange' },
      { icon: CalendarRange, label: 'Fenêtre de surveillance', value: '7 jours', sub: 'Produits à surveiller', variant: 'soft', color: 'blue' },
    ],
    list: [
      { icon: Milk, label: 'Lait Entier', value: '15 L · expire dans 1 j.', color: 'red' },
      { icon: GlassWater, label: 'Crème Fraîche', value: '4 kg · expire dans 2 j.', color: 'red' },
      { icon: FlaskConical, label: "Huile d'Olive", value: '12 u. · expire dans 4 j.', color: 'orange' },
      { icon: Wheat, label: 'Farine T45', value: '15 kg · expire dans 7 j.', color: 'orange' },
    ],
  },
};

function StockPage() {
  const [kpiOpen, setKpiOpen] = useState<string | null>(null);
  return (
    <>
      <div className="section">
        <div className="kpi-grid">
          <div className="kpi-card clickable" onClick={() => setKpiOpen('valeur')}><div className="kpi-icon blue"><Package size={22} /></div><div className="kpi-content"><div className="kpi-label">Valeur stock</div><div className="kpi-value kpi-price">1 450 200 <small>DA</small></div><div className="kpi-delta delta-up">+4.2%</div></div></div>
          <div className="kpi-card clickable" onClick={() => setKpiOpen('produits')}><div className="kpi-icon blue"><Box size={22} /></div><div className="kpi-content"><div className="kpi-label">Produits en stock</div><div className="kpi-value">1 248 <small>art.</small></div><div className="kpi-delta delta-neu">37 cat.</div></div></div>
          <div className="kpi-card clickable" onClick={() => setKpiOpen('ruptures')}><div className="kpi-icon red"><AlertTriangle size={22} /></div><div className="kpi-content"><div className="kpi-label">Ruptures</div><div className="kpi-value" style={{color:'var(--red)'}}>4</div><div className="kpi-delta delta-down">Urgent</div></div></div>
          <div className="kpi-card clickable" onClick={() => setKpiOpen('expirations')}><div className="kpi-icon orange"><Clock size={22} /></div><div className="kpi-content"><div className="kpi-label">Expirations</div><div className="kpi-value" style={{color:'var(--orange)'}}>7</div><div className="kpi-delta" style={{color:'var(--orange)'}}>7 jours</div></div></div>
        </div>
      </div>
      <div className="section full-row">
        <div className="card tbl-wrap">
          <div className="card-header"><h3><AlertCircle size={16} color="var(--red)" /> Ruptures — liste complète</h3></div>
          <table><thead><tr><th>Produit</th><th>Catégorie</th><th>Stock</th><th>Date</th><th>Statut</th></tr></thead>
          <tbody>
            {ALL_OUT_OF_STOCK.map((p) => (
              <tr key={p.name}><td className="td-name">{p.name}</td><td>{p.cat}</td><td>{p.qty}</td><td style={{fontSize:'15px'}}>{p.date}</td><td><span className={`badge ${p.badge}`}>{p.label}</span></td></tr>
            ))}
          </tbody></table>
        </div>
      </div>
      <div className="section full-row">
        <div className="card tbl-wrap">
          <div className="card-header"><h3><Clock size={16} color="var(--orange)" /> Proches expiration</h3></div>
          <table><thead><tr><th>Produit</th><th>Qté</th><th>Expiration</th><th>Jours</th><th>Valeur</th></tr></thead>
          <tbody>
            <tr><td className="td-name">Lait Entier</td><td>15 L</td><td style={{fontSize:'15px'}}>29/06</td><td style={{color:'var(--red)', fontWeight:'800'}}>1 j.</td><td>1 800 DA</td></tr>
            <tr><td className="td-name">Crème Fraîche</td><td>4 kg</td><td style={{fontSize:'15px'}}>30/06</td><td style={{color:'var(--red)', fontWeight:'800'}}>2 j.</td><td>2 400 DA</td></tr>
            <tr><td className="td-name">Huile d'Olive</td><td>12 u.</td><td style={{fontSize:'15px'}}>02/07</td><td style={{color:'var(--orange)', fontWeight:'800'}}>4 j.</td><td>14 400 DA</td></tr>
            <tr><td className="td-name">Farine T45</td><td>15 kg</td><td style={{fontSize:'15px'}}>05/07</td><td style={{color:'var(--orange)', fontWeight:'800'}}>7 j.</td><td>3 000 DA</td></tr>
          </tbody></table>
        </div>
      </div>
      <div className="section charts-2">
        <div className="card"><div className="card-header"><h3><FlaskConical size={16} color="var(--blue)" /> Consommation</h3></div><div className="card-body"><div className="chart-wrap" style={{height:'220px'}}><ChartCanvas config={consChartConfig} /></div><div className="legend"><div className="leg-item"><div className="leg-sq" style={{background:'var(--blue)'}}></div> Consommation (kg)</div></div></div></div>
        <div className="card"><div className="card-header"><h3><Package size={16} color="var(--blue)" /> Valeur par catégorie</h3></div><div className="card-body">
          <div className="stat-row"><div className="lbl"><Beef size={15} /> Viandes</div><div className="val val-price">450 000 DA</div></div>
          <div className="stat-row"><div className="lbl"><Salad size={15} /> Légumes</div><div className="val val-price">120 000 DA</div></div>
          <div className="stat-row"><div className="lbl"><GlassWater size={15} /> Laitiers</div><div className="val val-price">85 000 DA</div></div>
          <div className="stat-row"><div className="lbl"><ShoppingBasket size={15} /> Épicerie</div><div className="val val-price">320 000 DA</div></div>
          <div className="stat-row"><div className="lbl"><Wine size={15} /> Boissons</div><div className="val val-price">198 000 DA</div></div>
          <div className="stat-row"><div className="lbl"><MoreHorizontal size={15} /> Autres</div><div className="val val-price">277 200 DA</div></div>
        </div></div>
      </div>
      {kpiOpen && STOCK_KPI_DETAILS_V2[kpiOpen] && (
        <KpiDetailsModalV2 detail={STOCK_KPI_DETAILS_V2[kpiOpen]} onClose={() => setKpiOpen(null)} />
      )}
    </>
  );
}


/* RestaurantSettingsPage */
function RestaurantSettingsPage() {
  const [logoOpen, setLogoOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  return (
    <>
      <div className="section charts-2eq">
        <div className="card">
          <div className="card-header"><h3><Store size={16} color="var(--blue)" /> Identité du restaurant</h3></div>
          <div className="card-body" style={{display:'flex', flexDirection:'column', gap:'18px'}}>
            <div style={{display:'flex', gap:'20px', alignItems:'center', marginBottom:'4px'}}>
              <div
                onClick={() => setLogoOpen(true)}
                className="logo-uploader-btn"
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  border: '2px dashed var(--border2)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'var(--surface2)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                }}
              >
                <Camera size={24} color="#64748b" />
                <span>Logo</span>
                <div
                  className="hover-overlay"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(37, 99, 235, 0.92)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: '800',
                    gap: '2px'
                  }}
                >
                  <Upload size={18} />
                  <span>Modifier</span>
                </div>
              </div>
              <div style={{flex:'1', display:'flex', flexDirection:'column', gap:'12px'}}>
                <div className="field"><label>Nom</label><input className="input" defaultValue="L'Arôme Gourmet" /></div>
                <div className="field"><label>Téléphone</label><input className="input" defaultValue="+213 21 54 87 96" /></div>
              </div>
            </div>
            <div className="field"><label>Adresse</label><input className="input" defaultValue="12 Rue des Frères Bouadou, Bir Mourad Raïs, Alger" /></div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}}>
              <div className="field"><label>Devise</label><select className="input"><option>Dinar Algérien (DA)</option></select></div>
              <div className="field"><label>Format date</label><select className="input"><option>JJ/MM/AAAA</option><option>MM/JJ/AAAA</option></select></div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}}>
              <div className="field"><label>Registre de commerce (RC)</label><input className="input" defaultValue="16/00-1234567B24" /></div>
              <div className="field"><label>NIF</label><input className="input" defaultValue="000216123456789" /></div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3><Printer size={16} color="var(--blue)" /> Contenu du ticket</h3></div>
          <div className="card-body">
            <div className="field"><label>En-tête</label><input className="input" defaultValue="Authentic Algerian Gastronomy" /></div>
            <div className="field" style={{marginBottom:'18px'}}><label>Pied de page</label><textarea className="input" rows={3} style={{ minHeight: '95px', resize: 'vertical' }} defaultValue={`Bon Appétit !\nMerci de votre confiance.\nOuvert 7j/7 de 11h à 23h.`}></textarea></div>
            <div style={{border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'14px', background:'var(--surface2)', marginTop:'22px'}}>
              <div style={{fontSize:'15px', fontWeight:'800', color:'#000', marginBottom:'10px', display:'flex', alignItems:'center', gap:'5px'}}><Eye size={13} /> APERÇU</div>
              <div style={{fontFamily:"'Courier New', monospace", fontSize:'15px', lineHeight:'1.7', color:'#000', textAlign:'center', border:'1px dashed var(--border)', borderRadius:'6px', padding:'12px'}}>
                <div style={{fontSize:'17px', fontWeight:'800'}}>L'ARÔME GOURMET</div>
                <div style={{color:'#000'}}>12 Rue des Frères Bouadou, Alger</div>
                <div style={{color:'#000'}}>+213 21 54 87 96</div>
                <div style={{borderTop:'1px dashed var(--border)', margin:'8px 0', paddingTop:'6px', fontStyle:'italic', color:'#000'}}>Authentic Algerian Gastronomy</div>
                <div style={{color:'#000'}}>TICKET #0042 &nbsp;|&nbsp; 28/06/2026</div>
                <div style={{borderTop:'1px dashed var(--border)', margin:'8px 0', textAlign:'left'}}>
                  <div>Pizza Margherita x1 &nbsp;&nbsp; 1 200 DA</div>
                  <div>Soda 33cl x2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 300 DA</div>
                  <div style={{borderTop:'1px solid #000', marginTop:'6px', paddingTop:'4px', fontWeight:'800'}}>TOTAL &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 1 500 DA</div>
                </div>
                <div style={{borderTop:'1px dashed var(--border)', marginTop:'8px', paddingTop:'6px', color:'#000', fontSize:'14px'}}>Bon Appétit ! · Merci.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="section">
        <div className="card">
          <div className="card-header"><h3><Printer size={16} color="var(--blue)" /> Configuration imprimante</h3></div>
          <div className="card-body" style={{display:'flex', flexDirection:'column', gap:'14px'}}>
            <div className="field"><label>Type</label><select className="input"><option>Thermique (USB)</option><option>Thermique (Ethernet)</option><option>Fiscale (RS-232)</option></select></div>
            <div className="field"><label>Adresse / Port</label><input className="input" placeholder="192.168.1.100:9100" defaultValue="USB001" /></div>
            <div className="field"><label>Papier (mm)</label><select className="input"><option>58</option><option selected>80</option><option>110</option></select></div>
            <div className="perm-row" style={{border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'10px 12px'}}>
              <div className="perm-info"><div className="perm-name">Active</div><div className="perm-desc">Utiliser pour les tickets</div></div>
              <div className="toggle on"><div className="toggle-dot"></div></div>
            </div>
            <button className="btn-primary" style={{alignSelf:'flex-start'}} onClick={() => demoAction('Test d\'impression')}>Tester</button>
          </div>
        </div>
      </div>
      <div style={{display:'flex', justifyContent:'flex-end', gap:'8px'}}>
        <button className="btn-ghost" onClick={() => setResetOpen(true)}>Réinitialiser</button>
        <button className="btn-primary" onClick={() => setSavedOpen(true)}><Save size={15} /> Enregistrer</button>
      </div>
      {logoOpen && <Modal title="Changer le logo" subtitle="PNG, JPG — 512×512px" onClose={() => setLogoOpen(false)} footer={<><button className="btn-ghost" onClick={() => setLogoOpen(false)}>Annuler</button><button className="btn-primary" onClick={() => setLogoOpen(false)}>Enregistrer</button></>}><div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'14px'}}><div style={{width:'96px', height:'96px', borderRadius:'50%', background:'var(--blue-soft)', display:'flex', alignItems:'center', justifyContent:'center'}}><Store size={34} color="var(--blue)" /></div><label className="btn-ghost" style={{cursor:'pointer'}}><Upload size={14} /> Choisir <input type="file" accept="image/*" style={{display:'none'}} /></label><div style={{fontSize:'15px', color:'#000'}}>Aucun fichier</div></div></Modal>}
      {resetOpen && <Modal title="Réinitialiser ?" subtitle="Rétablir les valeurs par défaut" onClose={() => setResetOpen(false)} footer={<><button className="btn-ghost" onClick={() => setResetOpen(false)}>Annuler</button><button className="btn-danger" onClick={() => setResetOpen(false)}><Trash2 size={14} /> Réinitialiser</button></>}><p style={{color:'#000'}}>Cette action est irréversible.</p></Modal>}
      {savedOpen && <Modal title="Enregistré" onClose={() => setSavedOpen(false)} footer={<button className="btn-primary" onClick={() => setSavedOpen(false)}>Fermer</button>}><div className="toast-success" style={{display:'flex', alignItems:'center', gap:'6px'}}><CircleCheck size={16} /> Paramètres mis à jour.</div></Modal>}
    </>
  );
}

/* Tables */
type TableStatus = 'libre' | 'occupee' | 'reservee';
interface TableRow { id: string; name: string; capacity: number; status: TableStatus; montant?: number; reservationDate?: string; }
const STATUS_CYCLE: Record<TableStatus, TableStatus> = { libre:'occupee', occupee:'reservee', reservee:'libre' };
const STATUS_BADGE: Record<TableStatus, { cls: string; label: string }> = {
  libre: { cls:'b-green', label:'● Libre' },
  occupee: { cls:'b-red', label:'● Occupée' },
  reservee: { cls:'b-amber', label:'● Réservée' },
};

function ZoneTable({ title, icon: Icon, headerBg, headerColor, countColor, rows, totalCount, onCycle }: {
  title: string; icon: React.ElementType; headerBg: string; headerColor: string; countColor: string;
  rows: TableRow[]; totalCount: number; onCycle: (id: string) => void;
}) {
  return (
    <div className="card tbl-wrap">
      <div className="card-header" style={{background: headerBg, borderBottomColor: headerColor}}>
        <h3 style={{color: headerColor}}>
          <Icon size={16} /> {title}{' '}
          <span style={{fontWeight:'800', fontSize:'15px', color: countColor}}>
            {rows.length}{totalCount !== rows.length ? ` / ${totalCount}` : ''}
          </span>
        </h3>
      </div>
      <table><thead><tr><th>Table</th><th>Capacité</th><th>Statut</th><th>Détails</th></tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={r.id}>
          <td className="td-name">{r.name}</td>
          <td>{r.capacity} pers.</td>
          <td><span className={`badge ${STATUS_BADGE[r.status].cls}`} style={{cursor:'pointer'}} onClick={() => onCycle(r.id)}>{STATUS_BADGE[r.status].label}</span></td>
          <td style={{fontSize:'15px'}}>
            {r.status === 'occupee' && r.montant !== undefined && <span className="td-blue">{r.montant.toLocaleString('fr-FR')} DA</span>}
            {r.status === 'reservee' && r.reservationDate && <span>{r.reservationDate}</span>}
            {r.status === 'libre' && <span style={{color:'#000'}}>—</span>}
          </td>
        </tr>
      ))}
      {rows.length === 0 && <tr><td colSpan={4} style={{textAlign:'center', color:'#888', padding:'20px'}}>Aucune table trouvée pour ce filtre</td></tr>}
      </tbody></table>
    </div>
  );
}

function TablesZonesPage({ searchQuery }: { searchQuery: string }) {
  const [salle, setSalle] = useState<TableRow[]>([
    { id:'s1', name:'Table 1', capacity:4, status:'libre' },
    { id:'s2', name:'Table 2', capacity:2, status:'occupee', montant:1850 },
    { id:'s3', name:'Table 3', capacity:6, status:'reservee', reservationDate:'Ce soir · 20h00' },
    { id:'s4', name:'Table 4', capacity:4, status:'libre' },
    { id:'s5', name:'Table 5', capacity:8, status:'occupee', montant:4200 },
    { id:'s6', name:'Table 6', capacity:4, status:'reservee', reservationDate:'Demain · 12h30' },
  ]);
  const [terrasse, setTerrasse] = useState<TableRow[]>([
    { id:'t1', name:'T-01', capacity:4, status:'libre' },
    { id:'t2', name:'T-02', capacity:4, status:'occupee', montant:1200 },
    { id:'t3', name:'T-03', capacity:2, status:'libre' },
    { id:'t4', name:'T-04', capacity:6, status:'reservee', reservationDate:'Aujourd\'hui · 19h30' },
    { id:'t5', name:'T-05', capacity:4, status:'occupee', montant:2650 },
  ]);
  const [cafet, setCafet] = useState<TableRow[]>([
    { id:'c1', name:'C-1', capacity:2, status:'occupee', montant:450 },
    { id:'c2', name:'C-2', capacity:2, status:'libre' },
    { id:'c3', name:'C-3', capacity:4, status:'libre' },
    { id:'c4', name:'C-4', capacity:2, status:'occupee', montant:680 },
  ]);
  const [kpiOpen, setKpiOpen] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'libre' | 'occupee' | 'reservee' | null>(null);

  const cycle = (rows: TableRow[], setRows: (r: TableRow[]) => void, id: string) => {
    setRows(rows.map((r) => {
      if (r.id !== id) return r;
      const nextStatus = STATUS_CYCLE[r.status];
      if (nextStatus === 'occupee') return { ...r, status: nextStatus, montant: r.montant ?? Math.round((800 + Math.random() * 2500) / 50) * 50 };
      if (nextStatus === 'reservee') return { ...r, status: nextStatus, reservationDate: r.reservationDate ?? 'À définir' };
      return { ...r, status: nextStatus };
    }));
  };

  const toggleFilter = (f: 'libre' | 'occupee' | 'reservee') => {
    setStatusFilter(prev => prev === f ? null : f);
  };

  const q = (searchQuery || '').toLowerCase();
  const matches = (r: TableRow) => (!q || r.name.toLowerCase().includes(q) || STATUS_BADGE[r.status].label.toLowerCase().includes(q)) && (!statusFilter || r.status === statusFilter);
  const salleFiltered = salle.filter(matches);
  const terrasseFiltered = terrasse.filter(matches);
  const cafetFiltered = cafet.filter(matches);

  const allRows = [...salle, ...terrasse, ...cafet];
  const total = allRows.length;
  const libres = allRows.filter(r => r.status === 'libre').length;
  const occupees = allRows.filter(r => r.status === 'occupee').length;
  const reservees = allRows.filter(r => r.status === 'reservee').length;
  const montantEnCours = allRows.filter(r => r.status === 'occupee').reduce((sum, r) => sum + (r.montant || 0), 0);

  const montantEnCoursDetail: KpiDetail2 = {
    title: 'Montant en cours — détails',
    hero: [
      {
        icon: Wallet,
        label: 'Montant en cours',
        value: `${montantEnCours.toLocaleString()} DA`,
        sub: 'Total des commandes en cours',
        variant: 'filled',
        color: 'blue',
      },
    ],
    pair: [
      {
        icon: Armchair,
        label: 'Tables occupées',
        value: String(occupees),
        sub: 'Tables actuellement utilisées',
        variant: 'soft',
        color: 'blue',
      },
      {
        icon: BarChart3,
        label: 'Montant moyen / table',
        value: occupees > 0 ? `${Math.round(montantEnCours / occupees).toLocaleString()} DA` : '0 DA',
        sub: 'Moyenne par table occupée',
        variant: 'soft',
        color: 'green',
      },
    ],
  };

  const kpiActiveStyle = (f: 'libre' | 'occupee' | 'reservee' | null): React.CSSProperties => {
    if (f === null && statusFilter === null) {
      return { outline: '2.5px solid var(--blue)', outlineOffset: '2px', transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(37,99,235,0.18)' };
    }
    if (statusFilter === f && f !== null) {
      const colorMap = { libre: 'var(--green)', occupee: 'var(--red)', reservee: 'var(--orange)' };
      return { outline: `2.5px solid ${colorMap[f]}`, outlineOffset: '2px', transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0,0,0,0.12)' };
    }
    return {};
  };

  return (
    <>
      <div className="section" style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'10px'}}>
        <div
          className="kpi-card clickable"
          style={{cursor:'pointer', ...kpiActiveStyle(null)}}
          onClick={() => setStatusFilter(null)}
          title="Afficher toutes les tables"
        >
          <div className="kpi-icon blue"><LayoutGrid size={22} /></div>
          <div className="kpi-content"><div className="kpi-label">Total tables</div><div className="kpi-value">{total}</div></div>
        </div>

        <div
          className="kpi-card clickable"
          style={{cursor:'pointer', color:'var(--green)', ...kpiActiveStyle('libre')}}
          onClick={() => toggleFilter('libre')}
          title="Filtrer : Libres"
        >
          <div className="kpi-icon green"><CircleCheck size={22} /></div>
          <div className="kpi-content"><div className="kpi-label">Libres</div><div className="kpi-value" style={{color:'var(--green)'}}>{libres}</div></div>
        </div>

        <div
          className="kpi-card clickable"
          style={{cursor:'pointer', color:'var(--red)', ...kpiActiveStyle('occupee')}}
          onClick={() => toggleFilter('occupee')}
          title="Filtrer : Occupées"
        >
          <div className="kpi-icon red"><Users size={22} /></div>
          <div className="kpi-content"><div className="kpi-label">Occupées</div><div className="kpi-value" style={{color:'var(--red)'}}>{occupees}</div></div>
        </div>

        <div
          className="kpi-card clickable"
          style={{cursor:'pointer', color:'var(--orange)', ...kpiActiveStyle('reservee')}}
          onClick={() => toggleFilter('reservee')}
          title="Filtrer : Réservées"
        >
          <div className="kpi-icon orange"><CalendarCheck size={22} /></div>
          <div className="kpi-content"><div className="kpi-label">Réservées</div><div className="kpi-value" style={{color:'var(--orange)'}}>{reservees}</div></div>
        </div>

        <div
          className="kpi-card clickable"
          onClick={() => setKpiOpen('montant')}
          title="Voir le détail du montant en cours"
        >
          <div className="kpi-icon blue"><Banknote size={22} /></div>
          <div className="kpi-content"><div className="kpi-label">Montant en cours</div><div className="kpi-value kpi-price">{montantEnCours.toLocaleString()} <small>DA</small></div></div>
        </div>
      </div>

      {statusFilter && (
        <div style={{display:'flex', alignItems:'center', gap:'10px', margin:'8px 0 14px 0', padding:'8px 12px', background:'var(--surface)', borderRadius:'var(--r)', border:'1px solid var(--border)'}}>
          <span style={{fontSize:'14px', fontWeight:'700', color:'var(--text2)'}}>Filtre actif :</span>
          <span className={`badge ${ statusFilter === 'libre' ? 'b-green' : statusFilter === 'occupee' ? 'b-red' : 'b-amber' }`}>
            {statusFilter === 'libre' ? '● Libres' : statusFilter === 'occupee' ? '● Occupées' : '● Réservées'}
          </span>
          <button className="btn-ghost" style={{padding:'4px 10px', fontSize:'13px', marginLeft:'auto'}} onClick={() => setStatusFilter(null)}>✕ Réinitialiser le filtre</button>
        </div>
      )}

      <div className="section full-row">
        <ZoneTable title="Salle" icon={Armchair} headerBg="var(--blue-soft)" headerColor="var(--blue2)" countColor="var(--blue)" rows={salleFiltered} totalCount={salle.length} onCycle={(id) => cycle(salle, setSalle, id)} />
        <ZoneTable title="Terrasse" icon={Sun} headerBg="var(--green-soft)" headerColor="var(--green)" countColor="var(--green)" rows={terrasseFiltered} totalCount={terrasse.length} onCycle={(id) => cycle(terrasse, setTerrasse, id)} />
        <ZoneTable title="Cafétéria" icon={Coffee} headerBg="var(--orange-soft)" headerColor="var(--orange)" countColor="var(--orange)" rows={cafetFiltered} totalCount={cafet.length} onCycle={(id) => cycle(cafet, setCafet, id)} />
      </div>

      {kpiOpen === 'montant' && (
        <KpiDetailsModalV2 detail={montantEnCoursDetail} onClose={() => setKpiOpen(null)} />
      )}
    </>
  );
}

/* UsersPage */
type UserRole = 'Manager' | 'Caissier' | 'Magasinier';
interface StaffUser {
  id: string; name: string; email: string; role: UserRole; online: boolean; lastActivity: string; initials: string; avatarBg: string; avatarColor: string; badgeCls: string;
}
const STAFF: StaffUser[] = [
  { id:'u1', name:'Sofiane Rahmani', email:'sofiane@restaurantpro.dz', role:'Manager', online:true, lastActivity:'Maintenant', initials:'SR', avatarBg:'var(--blue-soft)', avatarColor:'var(--blue2)', badgeCls:'b-purple' },
  { id:'u2', name:'Amine Belkacem', email:'amine.b@restaurantpro.dz', role:'Caissier', online:true, lastActivity:'Maintenant', initials:'AB', avatarBg:'var(--green-soft)', avatarColor:'var(--green)', badgeCls:'b-green' },
  { id:'u3', name:'Leila Haddad', email:'leila.h@restaurantpro.dz', role:'Magasinier', online:false, lastActivity:'Il y a 2h', initials:'LH', avatarBg:'var(--orange-soft)', avatarColor:'var(--orange)', badgeCls:'b-amber' },
  { id:'u4', name:'Yacine Mansouri', email:'yacine.m@restaurantpro.dz', role:'Caissier', online:false, lastActivity:'Il y a 5h', initials:'YM', avatarBg:'#f3e8ff', avatarColor:'#7c3aed', badgeCls:'b-green' },
  { id:'u5', name:'Sonia Merad', email:'sonia.m@restaurantpro.dz', role:'Manager', online:true, lastActivity:'Maintenant', initials:'SM', avatarBg:'var(--blue-soft)', avatarColor:'var(--blue2)', badgeCls:'b-purple' },
];
const ROLE_STYLES: Record<UserRole, { avatarBg: string; avatarColor: string; badgeCls: string }> = {
  Manager: { avatarBg:'var(--blue-soft)', avatarColor:'var(--blue2)', badgeCls:'b-purple' },
  Caissier: { avatarBg:'var(--green-soft)', avatarColor:'var(--green)', badgeCls:'b-green' },
  Magasinier: { avatarBg:'var(--orange-soft)', avatarColor:'var(--orange)', badgeCls:'b-amber' },
};
function initialsOf(name: string) { return name.trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase() || '??'; }

function UsersPage({ searchQuery }: { searchQuery: string }) {
  const [staff, setStaff] = useState<StaffUser[]>(STAFF);
  const [roleFilter, setRoleFilter] = useState<'Tous' | UserRole>('Tous');
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name:'', email:'', role:'Caissier' as UserRole, password:'' });
  const [manageUser, setManageUser] = useState<StaffUser | null>(null);
  const [manageDraft, setManageDraft] = useState({ name:'', email:'', role:'Caissier' as UserRole, active:true });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const q = (searchQuery || '').toLowerCase();
  const filtered = staff.filter(u => (roleFilter === 'Tous' || u.role === roleFilter) && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));
  const submitNewUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) return;
    const style = ROLE_STYLES[newUser.role];
    const user: StaffUser = { id:`u-${Date.now()}`, name:newUser.name.trim(), email:newUser.email.trim(), role:newUser.role, online:false, lastActivity:'Jamais connecté', initials:initialsOf(newUser.name), ...style };
    setStaff(prev => [...prev, user]);
    setNewUserOpen(false);
    setNewUser({ name:'', email:'', role:'Caissier', password:'' });
  };
  const openManage = (u: StaffUser) => { setManageUser(u); setManageDraft({ name:u.name, email:u.email, role:u.role, active:u.online || !u.lastActivity.includes('Désactivé') }); };
  const saveManage = () => {
    if (!manageUser) return;
    const style = ROLE_STYLES[manageDraft.role];
    setStaff(prev => prev.map(u => u.id === manageUser.id ? { ...u, name:manageDraft.name, email:manageDraft.email, role:manageDraft.role, initials:initialsOf(manageDraft.name), lastActivity:manageDraft.active ? u.lastActivity : 'Désactivé', online:manageDraft.active ? u.online : false, ...style } : u));
    setManageUser(null);
  };
  const deleteUser = (id: string) => { setStaff(prev => prev.filter(u => u.id !== id)); setConfirmDeleteId(null); setManageUser(null); };

  const usersKpiDetails: Record<string, KpiDetail> = {
    total: { title: 'Total utilisateurs — détails', rows: [
      { label: 'Total', value: String(staff.length) },
      { label: 'En ligne', value: String(staff.filter(u=>u.online).length) },
      { label: 'Hors ligne', value: String(staff.filter(u=>!u.online).length) },
    ]},
    managers: { title: 'Managers — détails', rows: staff.filter(u=>u.role==='Manager').map(u => ({ label: u.name, value: u.online ? 'En ligne' : 'Hors ligne' })) },
    caissiers: { title: 'Caissiers — détails', rows: staff.filter(u=>u.role==='Caissier').map(u => ({ label: u.name, value: u.online ? 'En ligne' : 'Hors ligne' })) },
    magasiniers: { title: 'Magasiniers — détails', rows: staff.filter(u=>u.role==='Magasinier').map(u => ({ label: u.name, value: u.online ? 'En ligne' : 'Hors ligne' })) },
  };

  return (
    <>
      <div className="section" style={{display:'flex', alignItems:'stretch', gap:'10px'}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'10px', flex:1}}>
          <div className="kpi-card"><div className="kpi-icon blue"><Users size={22} /></div><div className="kpi-content"><div className="kpi-label">Total</div><div className="kpi-value">{staff.length}</div></div></div>
          <div className="kpi-card"><div className="kpi-icon purple"><Shield size={22} /></div><div className="kpi-content"><div className="kpi-label">Managers</div><div className="kpi-value">{staff.filter(u=>u.role==='Manager').length}</div></div></div>
          <div className="kpi-card"><div className="kpi-icon green"><Calculator size={22} /></div><div className="kpi-content"><div className="kpi-label">Caissiers</div><div className="kpi-value">{staff.filter(u=>u.role==='Caissier').length}</div></div></div>
          <div className="kpi-card"><div className="kpi-icon orange"><Box size={22} /></div><div className="kpi-content"><div className="kpi-label">Magasiniers</div><div className="kpi-value">{staff.filter(u=>u.role==='Magasinier').length}</div></div></div>
        </div>
        <button className="btn-primary" style={{flexShrink:0, alignSelf:'center'}} onClick={() => setNewUserOpen(true)}><UserPlus size={15} /> Nouvel utilisateur</button>
      </div>
      <div className="section card tbl-wrap">
        <div className="card-header">
          <h3><Users size={16} color="var(--blue)" /> Équipe</h3>
          <div style={{display:'flex', gap:'4px'}}>
            {(['Tous','Manager','Caissier','Magasinier'] as const).map(r => <span key={r} className={`badge ${roleFilter===r?'b-blue':'b-gray'}`} style={{cursor:'pointer'}} onClick={() => setRoleFilter(r)}>{r}</span>)}
          </div>
        </div>
        <table><thead><tr><th>Employé</th><th>Rôle</th><th>Statut</th><th>Dernière activ.</th><th></th></tr></thead>
        <tbody>{filtered.map(u => (
          <tr key={u.id}><td><div style={{display:'flex', alignItems:'center', gap:'9px'}}><div className="user-avatar" style={{background:u.avatarBg, color:u.avatarColor}}>{u.initials}</div><div><div style={{fontSize:'16px', fontWeight:'800', color:'#000'}}>{u.name}</div><div style={{fontSize:'15px', color:'#000'}}>{u.email}</div></div></div></td><td><span className={`badge ${u.badgeCls}`}>{u.role}</span></td><td><span className={`online-dot ${u.online?'dot-on':'dot-off'}`}></span> <span style={{fontSize:'15px', color:u.online?'var(--green)':'#000'}}>{u.lastActivity === 'Désactivé' ? 'Désactivé' : u.online ? 'En ligne' : 'Hors ligne'}</span></td><td style={{fontSize:'15px', color:u.online?undefined:'#000'}}>{u.lastActivity}</td><td><button className="btn-ghost" style={{padding:'4px 8px', fontSize:'15px'}} onClick={() => openManage(u)}><MoreHorizontal size={14} /></button></td></tr>
        ))}</tbody></table>
      </div>

      {newUserOpen && <Modal title="Nouvel utilisateur" subtitle="Créer un compte" onClose={() => setNewUserOpen(false)} footer={<><button className="btn-ghost" onClick={() => setNewUserOpen(false)}>Annuler</button><button className="btn-primary" onClick={submitNewUser}><UserPlus size={15} /> Créer</button></>}>
        <div className="field"><label>Nom complet</label><input className="input" placeholder="Ex : Karim Ziani" value={newUser.name} onChange={(e) => setNewUser({...newUser, name:e.target.value})} /></div>
        <div className="field"><label>Email</label><input className="input" type="email" placeholder="karim.z@restaurantpro.dz" value={newUser.email} onChange={(e) => setNewUser({...newUser, email:e.target.value})} /></div>
        <div className="form-row"><div className="field"><label>Rôle</label><select className="input" value={newUser.role} onChange={(e) => setNewUser({...newUser, role:e.target.value as UserRole})}><option value="Manager">Manager</option><option value="Caissier">Caissier</option><option value="Magasinier">Magasinier</option></select></div><div className="field"><label>Mot de passe</label><input className="input" type="password" placeholder="••••••••" value={newUser.password} onChange={(e) => setNewUser({...newUser, password:e.target.value})} /></div></div>
      </Modal>}

      {manageUser && <Modal title={`Gérer ${manageUser.name}`} subtitle={manageUser.email} onClose={() => setManageUser(null)} footer={<><button className="btn-danger" onClick={() => setConfirmDeleteId(manageUser.id)}><Trash2 size={14} /> Supprimer</button><button className="btn-primary" onClick={saveManage}>Enregistrer</button></>}>
        <div className="field"><label>Nom</label><input className="input" value={manageDraft.name} onChange={(e) => setManageDraft({...manageDraft, name:e.target.value})} /></div>
        <div className="field"><label>Email</label><input className="input" value={manageDraft.email} onChange={(e) => setManageDraft({...manageDraft, email:e.target.value})} /></div>
        <div className="field"><label>Rôle</label><select className="input" value={manageDraft.role} onChange={(e) => setManageDraft({...manageDraft, role:e.target.value as UserRole})}><option value="Manager">Manager</option><option value="Caissier">Caissier</option><option value="Magasinier">Magasinier</option></select></div>
        <div className="perm-row" style={{border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'10px 12px'}}><div className="perm-info"><div className="perm-name">Actif</div><div className="perm-desc">Désactiver bloque la connexion</div></div><div className={`toggle ${manageDraft.active?'on':'off'}`} onClick={() => setManageDraft({...manageDraft, active:!manageDraft.active})}><div className="toggle-dot"></div></div></div>
        <div className="action-list"><div className="action-list-item" onClick={() => demoAction(`Réinitialiser le mot de passe de ${manageUser.name}`)}><KeyRound size={15} /> Réinitialiser MDP</div></div>
      </Modal>}

      {confirmDeleteId && <Modal title="Supprimer ?" subtitle="Irréversible" onClose={() => setConfirmDeleteId(null)} footer={<><button className="btn-ghost" onClick={() => setConfirmDeleteId(null)}>Annuler</button><button className="btn-danger" onClick={() => deleteUser(confirmDeleteId)}><Trash2 size={14} /> Confirmer</button></>}><p style={{color:'#000'}}>Cette action est définitive.</p></Modal>}
    </>
  );
}

/* MenuPage avec icônes pour catégories et modal d'ajout avec dropdown */
const AVAILABLE_ICONS_LIST = [
  { name: 'Salad', component: Salad },
  { name: 'Beef', component: Beef },
  { name: 'Pizza', component: Pizza },
  { name: 'Coffee', component: Coffee },
  { name: 'IceCream', component: IceCream },
  { name: 'Sandwich', component: Sandwich },
  { name: 'Store', component: Store },
  { name: 'Fish', component: Fish },
  { name: 'Soup', component: Soup },
  { name: 'Wine', component: Wine },
  { name: 'Beer', component: Beer },
  { name: 'CupSoda', component: CupSoda },
  { name: 'Cherry', component: Cherry },
  { name: 'Apple', component: Apple },
  { name: 'Croissant', component: Croissant },
  { name: 'Cookie', component: Cookie },
  { name: 'CakeSlice', component: CakeSlice },
  { name: 'Popcorn', component: Popcorn },
  { name: 'Drumstick', component: Drumstick },
  { name: 'Egg', component: Egg },
  { name: 'Milk', component: Milk },
  { name: 'Carrot', component: Carrot },
  { name: 'Utensils', component: Utensils },
  { name: 'UtensilsCrossed', component: UtensilsCrossed },
  { name: 'ChefHat', component: ChefHat },
  { name: 'Wheat', component: Wheat },
  { name: 'Grape', component: Grape },
  { name: 'Candy', component: Candy },
  { name: 'Donut', component: Donut },
  { name: 'IceCreamCone', component: IceCreamCone },
  { name: 'GlassWater', component: GlassWater },
  { name: 'Martini', component: Martini },
  { name: 'Vegan', component: Vegan },
  { name: 'Ham', component: Ham },
  { name: 'Citrus', component: Citrus },
  { name: 'Banana', component: Banana },
  { name: 'Bean', component: Bean },
  { name: 'Nut', component: Nut },
  { name: 'Snowflake', component: Snowflake },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Entrées': Salad,
  'Plats Principaux': Beef,
  'Pizzas': Pizza,
  'Burgers': Sandwich,
  'Boissons': Coffee,
  'Desserts': IceCream,
};

interface MenuItem {
  id: string; name: string; desc: string; price: number; category: string; img: string; available: boolean;
}
const MENU_ITEMS: MenuItem[] = [
  { id:'m1', name:'Salade César Royale', desc:"Cœur de romaine, poulet grillé, croutons à l'ail...", price:850, category:'Entrées', img:'https://loremflickr.com/400/300/caesarsalad?lock=11', available:true },
  { id:'m2', name:'Couscous Royal', desc:'Semoule fine, merguez, agneau, légumes mijotés...', price:1250, category:'Plats Principaux', img:'https://loremflickr.com/400/300/couscous?lock=12', available:true },
  { id:'m3', name:'Pizza Margherita', desc:'Sauce tomate San Marzano, mozzarella di bufala...', price:950, category:'Pizzas', img:'https://loremflickr.com/400/300/margheritapizza?lock=13', available:true },
  { id:'m4', name:'Tiramisu Classique', desc:'Biscuits imbibés de café, crème mascarpone...', price:650, category:'Desserts', img:'https://loremflickr.com/400/300/tiramisu?lock=14', available:false },
  { id:'m5', name:'Filet de Daurade Grillé', desc:'Daurade fraîche grillée à la plancha, légumes...', price:1850, category:'Plats Principaux', img:'https://loremflickr.com/400/300/grilledfish?lock=15', available:true },
  { id:'m6', name:'Limonade Menthe', desc:'Limonade maison pressée à froid, feuilles de menthe...', price:450, category:'Boissons', img:'https://loremflickr.com/400/300/mintlemonade?lock=16', available:true },
  { id:'m7', name:'Burger Signature Pro', desc:'Bœuf angus, fromage cheddar, oignons caramélisés...', price:1250, category:'Burgers', img:'https://loremflickr.com/400/300/cheeseburger?lock=17', available:true },
  { id:'m8', name:'Café Espresso Double', desc:'Café arabica 100%, torréfaction artisanale...', price:180, category:'Boissons', img:'https://loremflickr.com/400/300/espresso?lock=18', available:true },
];
const DEFAULT_CATEGORIES = ['Entrées','Plats Principaux','Pizzas','Burgers','Boissons','Desserts'];
const CATEGORY_PALETTE = ['var(--blue)','#059669','#ea580c','#7c3aed','#b45309','#4f46e5','#0d9488','#be185d'];
const emptyDish = { name:'', desc:'', price:'', category:DEFAULT_CATEGORIES[0], img:'', available:true };

function MenuPage({ searchQuery }: { searchQuery: string }) {
  const [items, setItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, React.ElementType>>(CATEGORY_ICONS);
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [availFilter, setAvailFilter] = useState<'tous' | 'actifs' | 'indisponibles'>('tous');
  const [dishModal, setDishModal] = useState<{ mode:'create'|'edit'; id?: string } | null>(null);
  const [dishForm, setDishForm] = useState(emptyDish);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedIconName, setSelectedIconName] = useState('Salad');

  const categoryColor = (cat: string) => CATEGORY_PALETTE[Math.max(categories.indexOf(cat),0) % CATEGORY_PALETTE.length];
  const filtered = items.filter(it =>
    (activeCategory === 'Tous' || it.category === activeCategory) &&
    (availFilter === 'tous' || (availFilter === 'actifs' && it.available) || (availFilter === 'indisponibles' && !it.available)) &&
    it.name.toLowerCase().includes((searchQuery || '').toLowerCase())
  );
  const toggleAvailable = (id: string) => setItems(prev => prev.map(it => it.id === id ? {...it, available:!it.available} : it));
  const openCreateDish = () => { setDishForm({...emptyDish, category:categories[0]||''}); setDishModal({mode:'create'}); };
  const openEditDish = (item: MenuItem) => { setDishForm({ name:item.name, desc:item.desc, price:String(item.price), category:item.category, img:item.img, available:item.available }); setDishModal({mode:'edit', id:item.id}); };

  const handleDishImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      window.alert('Veuillez sélectionner un fichier image (JPG, PNG, WEBP...).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDishForm(prev => ({ ...prev, img: reader.result as string }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const submitDish = () => {
    if (!dishForm.name.trim()) return;
    const priceNum = Number(dishForm.price) || 0;
    const img = dishForm.img;
    if (dishModal?.mode === 'edit' && dishModal.id) {
      setItems(prev => prev.map(it => it.id === dishModal.id ? {...it, name:dishForm.name.trim(), desc:dishForm.desc.trim(), price:priceNum, category:dishForm.category, img, available:dishForm.available} : it));
    } else {
      setItems(prev => [...prev, { id:`m-${Date.now()}`, name:dishForm.name.trim(), desc:dishForm.desc.trim(), price:priceNum, category:dishForm.category, img, available:dishForm.available }]);
    }
    setDishModal(null);
  };
  const deleteDish = (id: string) => { setItems(prev => prev.filter(it => it.id !== id)); setDishModal(null); };

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name || categories.includes(name)) return;
    const selectedIconComponent = AVAILABLE_ICONS_LIST.find(icon => icon.name === selectedIconName)?.component || Store;
    setCategories(prev => [...prev, name]);
    setCategoryIcons(prev => ({ ...prev, [name]: selectedIconComponent }));
    setNewCatName('');
    setSelectedIconName('Salad');
  };

  const removeCategory = (cat: string) => {
    setCategories(prev => prev.filter(c => c !== cat));
    if (activeCategory === cat) setActiveCategory('Tous');
  };

  const activeCount = items.filter(it => it.available).length;
  const outOfStockCount = items.filter(it => !it.available).length;

  return (
    <>
      {/* KPI en haut — cliquables comme filtres de disponibilité */}
      <div className="section" style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'16px'}}>
        <div className={`kpi-card clickable${availFilter==='tous' ? ' kpi-filter-active' : ''}`} onClick={() => setAvailFilter('tous')}>
          <div className="kpi-icon orange"><ClipboardList size={22} /></div>
          <div className="kpi-content"><div className="kpi-label">Total plats</div><div className="kpi-value">{items.length}</div></div>
        </div>
        <div className={`kpi-card clickable${availFilter==='actifs' ? ' kpi-filter-active' : ''}`} onClick={() => setAvailFilter('actifs')}>
          <div className="kpi-icon blue"><CircleCheck size={22} /></div>
          <div className="kpi-content"><div className="kpi-label">Actifs</div><div className="kpi-value">{activeCount}</div></div>
        </div>
        <div className={`kpi-card clickable${availFilter==='indisponibles' ? ' kpi-filter-active' : ''}`} onClick={() => setAvailFilter('indisponibles')}>
          <div className="kpi-icon red"><AlertCircle size={22} /></div>
          <div className="kpi-content"><div className="kpi-label">Indisponibles</div><div className="kpi-value" style={{color:'var(--red)'}}>{outOfStockCount}</div></div>
        </div>
        <div className="kpi-card clickable" onClick={() => { setCatModalOpen(true); setNewCatName(''); setSelectedIconName('Salad'); }}>
          <div className="kpi-icon purple"><Layers size={22} /></div>
          <div className="kpi-content"><div className="kpi-label">Catégories</div><div className="kpi-value">{categories.length}</div></div>
        </div>
      </div>

      {/* Filtres des plats + actions — regroupés dans un même espace, en bas des KPI */}
      <div className="section card" style={{padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'flex-start', gap:'12px', flexWrap:'wrap', marginBottom:'20px'}}>
        <div className="filter-tabs" style={{margin:0, flex:'1 1 auto', minWidth:0}}>
          {['Tous', ...categories].map(cat => {
            const Icon: any = cat === 'Tous' ? null : categoryIcons[cat] || Store;
            return <span key={cat} className={`filter-tab${activeCategory === cat ? ' active' : ''}`} onClick={() => setActiveCategory(cat)}>{Icon && <Icon size={14} style={{marginRight:'4px'}} />}{cat}</span>;
          })}
        </div>
        <div style={{display:'flex', gap:'8px', alignItems:'center', flexShrink:0, marginLeft:'auto', whiteSpace:'nowrap'}}>
          <button className="btn-ghost" onClick={() => { setCatModalOpen(true); setNewCatName(''); setSelectedIconName('Salad'); }}><Plus size={15} /> Ajouter une catégorie</button>
          <button className="btn-primary" onClick={openCreateDish}><Plus size={15} /> Ajouter un plat</button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px'}}>
        {filtered.map(item => (
          <div className="menu-card" key={item.id} style={{opacity:item.available?1:0.85}}>
            <div className="menu-card-img">
              {item.img ? (
                <img src={item.img} alt={item.name} />
              ) : (
                <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface2)', color:'#000'}}>
                  {(() => { const CatIcon = categoryIcons[item.category] || Store; return <CatIcon size={36} />; })()}
                </div>
              )}
              <span className={`menu-avail-chip ${item.available ? 'b-green' : 'b-gray'}`}>
                {item.available ? <><CircleCheck size={11} /> Dispo</> : <><CircleX size={11} /> Indispo</>}
              </span>
            </div>
            <div className="menu-card-body">
              <div className="menu-cat-label" style={{color:categoryColor(item.category)}}>{item.category.toUpperCase()}</div>
              <div className="menu-name">{item.name}</div>
              <div className="menu-desc">{item.desc}</div>
              <div className="menu-price">{item.price.toLocaleString('fr-FR')} <small>DA</small></div>
              <div className="menu-footer">
                <div className="avail-row"><div className={`toggle ${item.available?'on':'off'}`} style={{width:'28px', height:'16px', cursor:'pointer'}} onClick={() => toggleAvailable(item.id)}><div className="toggle-dot" style={{width:'12px', height:'12px'}}></div></div>{item.available?'Visible':'Masqué'}</div>
                <button className="btn-edit" onClick={() => openEditDish(item)}><Pencil size={12} /> Modifier</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{gridColumn:'1 / -1', textAlign:'center', color:'#000', padding:'30px 0'}}>Aucun plat</div>}
      </div>

      {dishModal && <Modal title={dishModal.mode==='edit'?'Modifier le plat':'Nouveau plat'} subtitle={dishModal.mode==='edit'?'Mettez à jour':'Ajoutez un nouvel article'} onClose={() => setDishModal(null)} width="520px" footer={<>{dishModal.mode==='edit' && dishModal.id && <button className="btn-danger" onClick={() => deleteDish(dishModal.id as string)}><Trash2 size={14} /> Supprimer</button>}<div style={{flex:1}} /><button className="btn-ghost" onClick={() => setDishModal(null)}>Annuler</button><button className="btn-primary" onClick={submitDish}>{dishModal.mode==='edit'?'Enregistrer':'Créer'}</button></>} spreadFooter>
        <div style={{display:'flex', gap:'14px', alignItems:'flex-start'}}>
          <div style={{width:'90px', height:'68px', borderRadius:'8px', overflow:'hidden', flexShrink:0, background:'var(--surface2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center'}}>
            {dishForm.img ? (
              <img src={dishForm.img} alt="aperçu" style={{width:'100%', height:'100%', objectFit:'cover'}} />
            ) : (
              <ImageIcon size={22} color="#000" />
            )}
          </div>
          <div className="field" style={{flex:1}}>
            <label>Image du plat</label>
            <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
              <label className="btn-ghost" style={{cursor:'pointer'}}>
                <Upload size={14} /> Importer depuis le PC
                <input type="file" accept="image/*" style={{display:'none'}} onChange={handleDishImageFile} />
              </label>
              {dishForm.img && (
                <button type="button" className="icon-btn danger" title="Supprimer l'image" onClick={() => setDishForm(prev => ({...prev, img:''}))}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="field"><label>Nom</label><input className="input" placeholder="Ex : Chorba Frik" value={dishForm.name} onChange={(e) => setDishForm({...dishForm, name:e.target.value})} /></div>
        <div className="field"><label>Description</label><textarea className="input" placeholder="Description..." value={dishForm.desc} onChange={(e) => setDishForm({...dishForm, desc:e.target.value})} /></div>
        <div className="form-row"><div className="field"><label>Prix (DA)</label><input className="input" type="number" min="0" value={dishForm.price} onChange={(e) => setDishForm({...dishForm, price:e.target.value})} /></div><div className="field"><label>Catégorie</label><select className="input" value={dishForm.category} onChange={(e) => setDishForm({...dishForm, category:e.target.value})}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div></div>
        <div className="perm-row" style={{border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'10px 12px'}}><div className="perm-info"><div className="perm-name">Disponible</div><div className="perm-desc">Visible sur la carte</div></div><div className={`toggle ${dishForm.available?'on':'off'}`} onClick={() => setDishForm({...dishForm, available:!dishForm.available})}><div className="toggle-dot"></div></div></div>
      </Modal>}

      {catModalOpen && (
        <Modal
          title="Catégories"
          subtitle={`${categories.length} catégorie${categories.length > 1 ? 's' : ''} existante${categories.length > 1 ? 's' : ''} · ${items.length} plat${items.length > 1 ? 's' : ''} au total`}
          onClose={() => setCatModalOpen(false)}
          width="520px"
          footer={
            <>
              <button className="btn-ghost" onClick={() => setCatModalOpen(false)}>Fermer</button>
              <button className="btn-primary" onClick={addCategory}><Plus size={14} /> Ajouter</button>
            </>
          }
        >
          <div className="field">
            <label>Catégories existantes</label>
            <div className="action-list">
              {categories.map(cat => {
                const IconComp = categoryIcons[cat] || Store;
                const count = items.filter(it => it.category === cat).length;
                return (
                  <div className="action-list-item" key={cat} style={{cursor:'default'}}>
                    <IconComp size={15} />
                    <span style={{flex:1}}>{cat}</span>
                    <span style={{fontSize:'14px', color:'#000'}}>{count} plat{count > 1 ? 's' : ''}</span>
                    <button
                      type="button"
                      className="icon-btn danger"
                      style={{width:'28px', height:'28px'}}
                      title="Supprimer la catégorie"
                      onClick={() => removeCategory(cat)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
              {categories.length === 0 && (
                <div style={{color:'#000', fontSize:'15px', padding:'8px 0'}}>Aucune catégorie pour le moment</div>
              )}
            </div>
          </div>

          <div className="field">
            <label>Ajouter une catégorie</label>
            <input className="input" placeholder="Ex : Sandwichs" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
          </div>
          <div className="field">
            <label>Icône ({selectedIconName})</label>
            <div className="icon-picker-grid">
              {AVAILABLE_ICONS_LIST.map(icon => {
                const IconComp = icon.component;
                return (
                  <div
                    key={icon.name}
                    className={`icon-picker-item${selectedIconName === icon.name ? ' selected' : ''}`}
                    title={icon.name}
                    onClick={() => setSelectedIconName(icon.name)}
                  >
                    <IconComp size={20} />
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ============================================================================
 * AuditPage (journal des tables)
 * ==========================================================================*/
function AuditPage({ activePeriod, periodLabel, searchQuery }: { activePeriod: Period; periodLabel: string; searchQuery: string }) {
  const [page, setPage] = useState(1);
  const [onlyMine, setOnlyMine] = useState(false);
  const totalPages = 25;

  const q = (searchQuery || '').toLowerCase();
  const filtered = TABLE_AUDIT_ENTRIES.filter(e => {
    const matchesSearch = !q || e.action.toLowerCase().includes(q) || e.user.toLowerCase().includes(q) || e.table.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
    return matchesSearch && (!onlyMine || e.user === 'Sofiane Rahmani');
  });

  return (
    <>
      <div style={{display:'flex', alignItems:'center', justifyContent:'flex-end', marginBottom:'16px'}}>
        <button className={`btn-ghost`} style={onlyMine ? {borderColor:'var(--blue)', color:'var(--blue)'} : undefined} onClick={() => setOnlyMine(v => !v)}><Filter size={14} /> {onlyMine ? 'Mes actions ✓' : 'Filtrer : mes actions'}</button>
      </div>
      <div className="section card tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Action</th>
              <th>Utilisateur</th>
              <th>Table</th>
              <th>Montant</th>
              <th>Date & heure</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id}>
                <td className="td-id">{e.id}</td>
                <td className="td-name">{e.action}</td>
                <td>
                  <div style={{display:'flex', alignItems:'center', gap:'7px'}}>
                    <div className="user-avatar" style={{width:'26px', height:'26px', fontSize:'14px', background:e.avatarBg, color:e.avatarColor}}>{e.initials}</div>
                    {e.user}
                  </div>
                </td>
                <td>{e.table}</td>
                <td className="td-blue">{e.montant ? `${e.montant.toLocaleString('fr-FR')} DA` : '-'}</td>
                <td style={{fontSize:'15px', color:'#000'}}>{e.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid var(--border)'}}>
          <span style={{fontSize:'15px', color:'#000'}}>{filtered.length} entrées · Page {page}/{totalPages}</span>
          <div><button className="btn-ghost" style={{padding:'5px 10px'}} disabled={page<=1} onClick={() => setPage(p=>Math.max(1,p-1))}>←</button><button className="btn-primary" style={{padding:'5px 10px'}} disabled={page>=totalPages} onClick={() => setPage(p=>Math.min(totalPages,p+1))}>→</button></div>
        </div>
      </div>
    </>
  );
}


/* ============================================================================
 * FluxPage — Sorties = bons de commande (avec document visuel)
 *            Entrées = tickets de caisse (avec document visuel)
 * ==========================================================================*/
interface BonArticle { name: string; qty: string; pu: number; }
interface BonCommande { numero: string; fournisseur: string; date: string; articles: BonArticle[]; total: number; }

interface TicketArticle { name: string; qty: number; pu: number; }
interface TicketCaisse { numero: string; table: string; serveur: string; paiement: string; articles: TicketArticle[]; total: number; }

interface FluxEntry {
  id: string;
  date: string;
  type: 'Entrée' | 'Sortie';
  libelle: string;
  montant: number;
  source: string;
  bon?: BonCommande;
  ticket?: TicketCaisse;
}

const FLUX_DATA: FluxEntry[] = [
  {
    id: 'f1', date: '2026-06-28 10:30', type: 'Sortie', libelle: 'Bon de commande #BC-0142', montant: 24000, source: 'Stock',
    bon: {
      numero: 'BC-0142', fournisseur: 'Fournisseur El Baraka', date: '28/06/2026',
      articles: [
        { name: 'Poulet fermier', qty: '40 kg', pu: 350 },
        { name: 'Farine T55', qty: '25 kg', pu: 90 },
        { name: 'Huile de tournesol', qty: '20 L', pu: 380 },
      ],
      total: 24000,
    },
  },
  {
    id: 'f2', date: '2026-06-28 09:15', type: 'Entrée', libelle: 'Ticket de caisse #TK-442', montant: 1850, source: 'Caisse',
    ticket: {
      numero: 'TK-442', table: 'Table 6', serveur: 'Amine Belkacem', paiement: 'CIB',
      articles: [
        { name: 'Couscous Royal', qty: 1, pu: 1250 },
        { name: 'Limonade Menthe', qty: 1, pu: 450 },
        { name: 'Café Espresso', qty: 1, pu: 150 },
      ],
      total: 1850,
    },
  },
  {
    id: 'f3', date: '2026-06-27 16:20', type: 'Entrée', libelle: 'Ticket de caisse #TK-441', montant: 450, source: 'Caisse',
    ticket: {
      numero: 'TK-441', table: 'Comptoir', serveur: 'Yacine Mansouri', paiement: 'Espèces',
      articles: [{ name: 'Limonade Menthe', qty: 1, pu: 450 }],
      total: 450,
    },
  },
  {
    id: 'f4', date: '2026-06-27 14:00', type: 'Sortie', libelle: 'Bon de commande #BC-0141', montant: 1200, source: 'Stock',
    bon: {
      numero: 'BC-0141', fournisseur: 'Marché Central', date: '27/06/2026',
      articles: [{ name: 'Tomates fraîches', qty: '10 kg', pu: 120 }],
      total: 1200,
    },
  },
  {
    id: 'f5', date: '2026-06-27 11:45', type: 'Entrée', libelle: 'Ticket de caisse #TK-440', montant: 3200, source: 'Caisse',
    ticket: {
      numero: 'TK-440', table: 'Table 3', serveur: 'Amine Belkacem', paiement: 'Mixte',
      articles: [
        { name: 'Pizza Margherita', qty: 2, pu: 950 },
        { name: 'Tiramisu Classique', qty: 2, pu: 650 },
      ],
      total: 3200,
    },
  },
  {
    id: 'f6', date: '2026-06-26 18:30', type: 'Sortie', libelle: 'Bon de commande #BC-0140', montant: 32000, source: 'Stock',
    bon: {
      numero: 'BC-0140', fournisseur: 'Fournisseur El Baraka', date: '26/06/2026',
      articles: [
        { name: 'Bœuf angus', qty: '30 kg', pu: 850 },
        { name: 'Fromage cheddar', qty: '15 kg', pu: 500 },
      ],
      total: 32000,
    },
  },
  {
    id: 'f7', date: '2026-06-26 12:15', type: 'Entrée', libelle: 'Ticket de caisse #TK-439', montant: 1200, source: 'Caisse',
    ticket: {
      numero: 'TK-439', table: 'Terrasse T-02', serveur: 'Yacine Mansouri', paiement: 'Espèces',
      articles: [{ name: 'Burger Signature Pro', qty: 1, pu: 1250 }],
      total: 1200,
    },
  },
  {
    id: 'f8', date: '2026-06-26 08:00', type: 'Sortie', libelle: 'Bon de commande #BC-0139', montant: 1800, source: 'Stock',
    bon: {
      numero: 'BC-0139', fournisseur: 'Boissons Alger', date: '26/06/2026',
      articles: [{ name: 'Sodas 33cl', qty: '48 u.', pu: 37.5 }],
      total: 1800,
    },
  },
];

/* Bon de Commande Document Component */
function BonCommandeDoc({ bon }: { bon: BonCommande }) {
  return (
    <div className="doc-container">
      <div className="doc-header">
        <div className="doc-title">Bon de Commande</div>
        <div className="doc-subtitle">{RESTAURANT_INFO.name}</div>
        <div className="doc-subtitle">{RESTAURANT_INFO.address}</div>
        <div className="doc-subtitle">Tél : {RESTAURANT_INFO.phone}</div>
      </div>

      <div className="doc-info-row">
        <span><strong>N° :</strong> {bon.numero}</span>
        <span><strong>Date :</strong> {bon.date}</span>
      </div>
      <div className="doc-info-row">
        <span><strong>Fournisseur :</strong> {bon.fournisseur}</span>
      </div>

      <table className="doc-table">
        <thead>
          <tr>
            <th>Article</th>
            <th>Qté</th>
            <th>P.U. (DA)</th>
            <th>Total (DA)</th>
          </tr>
        </thead>
        <tbody>
          {bon.articles.map((a, i) => {
            const qtyNum = parseFloat(a.qty) || 1;
            const lineTotal = a.pu * qtyNum;
            return (
              <tr key={i}>
                <td>{a.name}</td>
                <td>{a.qty}</td>
                <td>{a.pu.toLocaleString('fr-FR')}</td>
                <td>{lineTotal.toLocaleString('fr-FR')}</td>
              </tr>
            );
          })}
          <tr className="doc-total-row">
            <td colSpan={3} style={{textAlign:'right'}}>TOTAL</td>
            <td>{bon.total.toLocaleString('fr-FR')} DA</td>
          </tr>
        </tbody>
      </table>

      <div className="doc-footer">
        <div>RC : {RESTAURANT_INFO.rc} · NIF : {RESTAURANT_INFO.nif}</div>
        <div className="doc-stamp">Document validé</div>
      </div>

      <div className="doc-signature">
        <div>
          <div className="doc-line">Signature Fournisseur</div>
        </div>
        <div>
          <div className="doc-line">Signature Restaurant</div>
        </div>
      </div>
    </div>
  );
}

/* Ticket de Caisse Document Component */
function TicketCaisseDoc({ ticket }: { ticket: TicketCaisse }) {
  return (
    <div className="doc-container">
      <div className="doc-header">
        <div className="doc-title">Ticket de Caisse</div>
        <div className="doc-subtitle">{RESTAURANT_INFO.name}</div>
        <div className="doc-subtitle">{RESTAURANT_INFO.address}</div>
        <div className="doc-subtitle">Tél : {RESTAURANT_INFO.phone}</div>
      </div>

      <div className="doc-info-row">
        <span><strong>N° :</strong> {ticket.numero}</span>
        <span><strong>Date :</strong> {new Date().toLocaleDateString('fr-FR')}</span>
      </div>
      <div className="doc-info-row">
        <span><strong>Table :</strong> {ticket.table}</span>
        <span><strong>Serveur :</strong> {ticket.serveur}</span>
      </div>
      <div className="doc-info-row">
        <span><strong>Paiement :</strong> {ticket.paiement}</span>
      </div>

      <table className="doc-table">
        <thead>
          <tr>
            <th>Article</th>
            <th>Qté</th>
            <th>P.U. (DA)</th>
            <th>Total (DA)</th>
          </tr>
        </thead>
        <tbody>
          {ticket.articles.map((a, i) => {
            const lineTotal = a.pu * a.qty;
            return (
              <tr key={i}>
                <td>{a.name}</td>
                <td>{a.qty}</td>
                <td>{a.pu.toLocaleString('fr-FR')}</td>
                <td>{lineTotal.toLocaleString('fr-FR')}</td>
              </tr>
            );
          })}
          <tr className="doc-total-row">
            <td colSpan={3} style={{textAlign:'right'}}>TOTAL</td>
            <td>{ticket.total.toLocaleString('fr-FR')} DA</td>
          </tr>
        </tbody>
      </table>

      <div className="doc-footer">
        <div>Merci de votre visite !</div>
        <div className="doc-stamp">Payé</div>
      </div>
    </div>
  );
}

function FluxPage({ activePeriod, periodLabel }: { activePeriod: Period; periodLabel: string }) {
  const [typeFilter, setTypeFilter] = useState<'Tous' | 'Entrée' | 'Sortie'>('Tous');
  const [detailEntry, setDetailEntry] = useState<FluxEntry | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');

  const filteredData = typeFilter === 'Tous' ? FLUX_DATA : FLUX_DATA.filter(item => item.type === typeFilter);
  const countEntrees = FLUX_DATA.filter(item => item.type === 'Entrée').length;
  const countSorties = FLUX_DATA.filter(item => item.type === 'Sortie').length;

  const toggleFilter = (type: 'Entrée' | 'Sortie') => {
    setTypeFilter(prev => (prev === type ? 'Tous' : type));
  };

  const doExport = () => {
    const rows: ExportRow[] = filteredData.map(item => ({
      Date: item.date,
      Type: item.type,
      'Libellé': item.libelle,
      'Montant (DA)': item.montant,
      Source: item.source
    }));
    const meta: ReportMeta = { title: "Flux (Entrées & Sorties)", period: activePeriod, periodLabel };
    runExport(exportFormat, meta, rows, `Flux_Entrees_Sorties_${toInputDate(new Date())}`);
    setExportOpen(false);
  };

  return (
    <>
      <div className="section" style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
        <div
          className="kpi-card clickable"
          style={{flex:1, minWidth:'200px', borderColor: typeFilter === 'Tous' ? 'var(--blue)' : undefined, boxShadow: typeFilter === 'Tous' ? '0 0 0 2px var(--blue-soft), var(--shadow-card)' : undefined}}
          onClick={() => setTypeFilter('Tous')}
        >
          <div className="kpi-icon blue"><History size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Toutes les opérations</div>
            <div className="kpi-value">{FLUX_DATA.length}</div>
            {typeFilter === 'Tous' && <div className="kpi-delta" style={{color:'var(--blue)'}}>Filtre actif</div>}
          </div>
        </div>
        <div
          className="kpi-card clickable"
          style={{flex:1, minWidth:'200px', borderColor: typeFilter === 'Entrée' ? 'var(--green)' : undefined, boxShadow: typeFilter === 'Entrée' ? '0 0 0 2px var(--green-soft), var(--shadow-card)' : undefined}}
          onClick={() => toggleFilter('Entrée')}
        >
          <div className="kpi-icon green"><ArrowDownLeft size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Total Entrées</div>
            <div className="kpi-value">{countEntrees}</div>
            {typeFilter === 'Entrée' && <div className="kpi-delta" style={{color:'var(--green)'}}>Filtre actif</div>}
          </div>
        </div>
        <div
          className="kpi-card clickable"
          style={{flex:1, minWidth:'200px', borderColor: typeFilter === 'Sortie' ? 'var(--red)' : undefined, boxShadow: typeFilter === 'Sortie' ? '0 0 0 2px var(--red-soft), var(--shadow-card)' : undefined}}
          onClick={() => toggleFilter('Sortie')}
        >
          <div className="kpi-icon red"><ArrowUpRight size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Total Sorties</div>
            <div className="kpi-value">{countSorties}</div>
            {typeFilter === 'Sortie' && <div className="kpi-delta" style={{color:'var(--red)'}}>Filtre actif</div>}
          </div>
        </div>
      </div>
      <div className="section card tbl-wrap">
        <table><thead><tr><th>Date</th><th>Type</th><th>Libellé</th><th>Montant</th><th>Source</th><th></th></tr></thead>
        <tbody>{filteredData.map((item) => (
          <tr key={item.id}>
            <td style={{fontSize:'15px', color:'#000'}}>{item.date}</td>
            <td><span className={`badge ${item.type === 'Entrée' ? 'b-green' : 'b-red'}`}>{item.type}</span></td>
            <td className="td-name">{item.libelle}</td>
            <td className="td-blue">{item.montant.toLocaleString('fr-FR')} DA</td>
            <td>{item.source}</td>
            <td><button className="btn-edit" onClick={() => setDetailEntry(item)}><Eye size={14} /> Voir document</button></td>
          </tr>
        ))}</tbody></table>
      </div>

      {/* Modal Bon de Commande */}
      {detailEntry && detailEntry.bon && (
        <Modal
          title={`Bon de commande ${detailEntry.bon.numero}`}
          subtitle={`${detailEntry.bon.fournisseur} · ${detailEntry.bon.date}`}
          onClose={() => setDetailEntry(null)}
          width="600px"
          footer={
            <>
              <button className="btn-ghost" onClick={() => setDetailEntry(null)}>Fermer</button>
              <button className="btn-primary" onClick={() => demoAction(`Imprimer ${detailEntry.bon?.numero}`)}>
                <Download size={14} /> Télécharger PDF
              </button>
            </>
          }
        >
          <BonCommandeDoc bon={detailEntry.bon} />
        </Modal>
      )}

      {/* Modal Ticket de Caisse */}
      {detailEntry && detailEntry.ticket && (
        <Modal
          title={`Ticket de caisse ${detailEntry.ticket.numero}`}
          subtitle={`${detailEntry.ticket.table} · ${detailEntry.ticket.serveur} · ${detailEntry.ticket.paiement}`}
          onClose={() => setDetailEntry(null)}
          width="520px"
          footer={
            <>
              <button className="btn-ghost" onClick={() => setDetailEntry(null)}>Fermer</button>
              <button className="btn-primary" onClick={() => demoAction(`Imprimer ${detailEntry.ticket?.numero}`)}>
                <Download size={14} /> Télécharger PDF
              </button>
            </>
          }
        >
          <TicketCaisseDoc ticket={detailEntry.ticket} />
        </Modal>
      )}
      {/* Modal d'exportation globale */}
      {exportOpen && (
        <Modal
          title="Exporter les flux"
          subtitle={`${filteredData.length} flux · ${periodKindLabel(activePeriod)}`}
          onClose={() => setExportOpen(false)}
          footer={
            <>
              <button className="btn-ghost" onClick={() => setExportOpen(false)}>Annuler</button>
              <button className="btn-primary" onClick={doExport}><Download size={14} /> Télécharger</button>
            </>
          }
        >
          <div className="field">
            <label>Format d&apos;export</label>
            <div className="radio-row">
              {([
                { id: 'excel', label: 'Excel (.xlsx)' },
                { id: 'pdf', label: 'PDF (.pdf)' },
                { id: 'csv', label: 'CSV (.csv)' }
              ] as const).map(opt => (
                <div
                  key={opt.id}
                  className={`radio-opt${exportFormat === opt.id ? ' selected' : ''}`}
                  onClick={() => setExportFormat(opt.id)}
                >
                  <input type="radio" checked={exportFormat === opt.id} readOnly /> {opt.label}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}


/* ============================================================================
 * ManagerPage
 * ==========================================================================*/
const PAGE_TITLES: Record<PageId, string> = Object.fromEntries(NAV_SECTIONS.flatMap(s => s.items).map(item => [item.id, item.title])) as Record<PageId, string>;
const SIDEBAR_STORAGE_KEY = 'mgr_sidebar_collapsed';

function buildReportRows(range: DateRange): ExportRow[] {
  const days = Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / 86400000) + 1);
  const dayCA = 452800, dayBenef = 128450, dayCommandes = 342, marge = 28.4;
  const ca = Math.round(dayCA * days), benef = Math.round(dayBenef * days), commandes = Math.round(dayCommandes * days), ticketMoyen = Math.round(ca / commandes);
  return [{ "CA": `${ca.toLocaleString('fr-FR')} DA`, 'Bénéfice': `${benef.toLocaleString('fr-FR')} DA`, 'Commandes': commandes, 'Ticket moyen': `${ticketMoyen.toLocaleString('fr-FR')} DA`, 'Marge': `${marge.toFixed(1)} %`, 'Jours': days }];
}

function buildFluxReportRows(): ExportRow[] {
  return FLUX_DATA.map((f) => ({
    Date: f.date,
    Type: f.type,
    Libellé: f.libelle,
    Montant: `${f.montant.toLocaleString('fr-FR')} DA`,
    Source: f.source,
  }));
}

const SEARCHABLE_PAGES: PageId[] = ['menu', 'audit', 'users', 'tables'];
const SEARCH_PLACEHOLDERS: Partial<Record<PageId, string>> = {
  menu: 'Rechercher un plat...',
  audit: 'Rechercher dans le journal...',
  users: 'Rechercher un utilisateur...',
  tables: 'Rechercher une table...',
};

export function ManagerPage({ onBack }: { onBack?: () => void }) {
  const [activePage, setActivePage] = useState<PageId>('ca');
  const [activePeriod, setActivePeriod] = useState<Period>('jour');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [customRange, setCustomRange] = useState<CustomRange>({ from: toInputDate(startOfWeek(new Date())), to: toInputDate(new Date()) });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' && window.localStorage?.getItem(SIDEBAR_STORAGE_KEY) === '1');
  const [loggedOut, setLoggedOut] = useState(false);
  const logoutMutation = useLogout();
  const [notifications, setNotifications] = useState<StockAlert[]>(STOCK_ALERTS);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { try { window.localStorage?.setItem(SIDEBAR_STORAGE_KEY, sidebarCollapsed ? '1' : '0'); } catch {} }, [sidebarCollapsed]);

  const dateRange = activePeriod === 'personnalise' ? getPeriodRange(activePeriod, customRange) : getPeriodRangeFromDate(activePeriod, referenceDate);
  const periodLabel = formatPeriodLabel(activePeriod, dateRange);
  const reportRows = activePage === 'flux' ? buildFluxReportRows() : buildReportRows(dateRange);
  const reportTitle = activePage === 'flux' ? 'Entrées & Sorties' : PAGE_TITLES[activePage];

  const showPeriodFilters = ['ca', 'commercial', 'stock', 'audit', 'flux'].includes(activePage);
  const showExportButtons = ['ca', 'commercial', 'stock', 'flux'].includes(activePage);
  const showSearch = SEARCHABLE_PAGES.includes(activePage);

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    setSearchQuery('');
  };

  if (loggedOut) {
    return (
      <div className="mgr-dashboard">
        <style>{MANAGER_DASHBOARD_CSS}</style>
        <div className="logout-screen"><div className="logout-card"><div className="brand-icon"><Store size={24} /></div><div style={{fontSize:'20px', fontWeight:800, color:'#000'}}>Déconnecté</div><div style={{fontSize:'16px', color:'#000'}}>Merci d'avoir utilisé RestaurantPro.</div><button className="btn-primary" onClick={() => { setLoggedOut(false); setActivePage('ca'); onBack?.(); }}><LogOut size={16} style={{transform:'scaleX(-1)'}} /> Reconnecter</button></div></div>
      </div>
    );
  }

  return (
    <div className="mgr-dashboard">
      <style>{MANAGER_DASHBOARD_CSS}</style>
      <div className="app">
        <Topbar
          title={activePage === 'users' ? '' : PAGE_TITLES[activePage]}
          activePage={activePage}
          activePeriod={activePeriod}
          periodLabel={periodLabel}
          customRange={customRange}
          onSelectPeriod={(p) => { setActivePeriod(p); if (p === 'personnalise') { /* modal ouvert via topbar */ } }}
          onApplyCustomRange={(range) => { setCustomRange(range); setActivePeriod('personnalise'); }}
          reportRows={reportRows}
          reportTitle={reportTitle}
          showPeriodFilters={showPeriodFilters}
          showExportButtons={showExportButtons}
          referenceDate={referenceDate}
          onReferenceDateChange={setReferenceDate}
          notifications={notifications}
          notificationsOpen={notificationsOpen}
          onNotificationsOpen={() => setNotificationsOpen(true)}
          onNotificationsClose={() => setNotificationsOpen(false)}
          searchValue={showSearch ? searchQuery : undefined}
          onSearchChange={showSearch ? setSearchQuery : undefined}
          searchPlaceholder={SEARCH_PLACEHOLDERS[activePage]}
        />
        <Sidebar activePage={activePage} onNavigate={handleNavigate} collapsed={sidebarCollapsed} onToggleCollapsed={() => setSidebarCollapsed(c => !c)} onLogout={() => { logoutMutation.mutate(); setLoggedOut(true); }} />
        <div className="body">
          <main className="main" style={{ marginLeft: sidebarCollapsed ? 72 : 250 }}>
            {activePage === 'ca' && <RevenuePage />}
            {activePage === 'commercial' && <CommercialPage />}
            {activePage === 'stock' && <StockPage />}
            {activePage === 'restaurant' && <RestaurantSettingsPage />}
            {activePage === 'tables' && <TablesZonesPage searchQuery={searchQuery} />}
            {activePage === 'users' && <UsersPage searchQuery={searchQuery} />}
            {activePage === 'menu' && <MenuPage searchQuery={searchQuery} />}
            {activePage === 'flux' && <FluxPage activePeriod={activePeriod} periodLabel={periodLabel} />}
            {activePage === 'audit' && <AuditPage activePeriod={activePeriod} periodLabel={periodLabel} searchQuery={searchQuery} />}
          </main>
        </div>
      </div>
    </div>
  );
}

export default ManagerPage;