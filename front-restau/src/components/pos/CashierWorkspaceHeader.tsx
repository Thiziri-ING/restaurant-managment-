import { ClipboardList, UtensilsCrossed } from 'lucide-react';
import type { CashierWorkView } from '@/types';

interface CashierWorkspaceHeaderProps {
  view: CashierWorkView;
}

export function CashierWorkspaceHeader({ view }: CashierWorkspaceHeaderProps) {
  const isTables = view === 'tables';

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
        {isTables ? <ClipboardList size={19} /> : <UtensilsCrossed size={19} />}
      </div>
      <div>
        <h2 className="text-base font-black text-slate-900">{isTables ? 'Plan de salle' : 'Menu / POS'}</h2>
        <p className="text-xs font-medium text-slate-400">
          {isTables ? 'Cliquez une table pour ouvrir une commande.' : 'Recherchez un produit puis ajoutez-le au panier.'}
        </p>
      </div>
    </div>
  );
}