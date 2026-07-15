import { useEffect, useState } from 'react';
import { Clock, CreditCard, ShoppingBag, Users } from 'lucide-react';
import type { OrderType, RestaurantTable } from '@/types';

interface CashierTopbarProps {
  orderType: OrderType;
  selectedTable: RestaurantTable | null;
}

export function CashierTopbar({ orderType, selectedTable }: CashierTopbarProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const clock = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });

  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <Clock size={16} className="text-primary-600" />
        <span className="font-mono">{clock}</span>
        <span className="text-slate-300">|</span>
        <span className="capitalize text-slate-500">{date}</span>
      </div>

      <div className="flex items-center gap-2">
        {orderType === 'TAKEAWAY' ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black uppercase text-amber-700">
            <ShoppingBag size={14} />
            A emporter
          </span>
        ) : selectedTable ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase text-emerald-700">
            <Users size={14} />
            Table {selectedTable.name} - {selectedTable.zone.name}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black uppercase text-slate-500">
            <CreditCard size={14} />
            En attente
          </span>
        )}
      </div>
    </div>
  );
}