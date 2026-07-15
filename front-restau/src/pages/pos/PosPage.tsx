import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { TableSelector } from '@/components/pos/TableSelector';
import { MenuGrid } from '@/components/pos/MenuGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { CashierTopbar } from '@/components/pos/CashierTopbar';
import { CashierWorkspaceHeader } from '@/components/pos/CashierWorkspaceHeader';
import { usePosStore } from '@/stores/pos.store';
import { useTables } from '@/hooks/useTables';
import type { OrderType, RestaurantTable, CashierWorkView } from '@/types';

export function PosPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { cart, selectedTableId, setSelectedTable, getSubtotal } = usePosStore();

  const location = useLocation();
  
  // Derive view & orderType from URL search params or pathname (synced via Sidebar navigation)
  const isTakeawayRoute = location.pathname === '/takeaway';
  const view = isTakeawayRoute ? 'menu' : ((searchParams.get('view') as CashierWorkView) || 'tables');
  const orderType = isTakeawayRoute ? 'TAKEAWAY' : ((searchParams.get('type') as OrderType) || 'DINE_IN');

  const [selectedTable, setSelectedTableObj] = useState<RestaurantTable | null>(null);
  const { data: tables } = useTables();

  // Load table object when selectedTableId changes and tables are loaded
  useEffect(() => {
    if (selectedTableId && tables) {
      const table = tables.find((t) => t.id === selectedTableId);
      if (table) {
        setSelectedTableObj(table);
      }
    }
  }, [selectedTableId, tables]);

  // Clear local table object when store clears (e.g. after payment)
  useEffect(() => {
    if (selectedTableId === null) {
      setSelectedTableObj(null);
    }
  }, [selectedTableId]);

  // When switching to takeaway via sidebar, clear table selection
  useEffect(() => {
    if (orderType === 'TAKEAWAY') {
      setSelectedTable(null);
      setSelectedTableObj(null);
    }
  }, [orderType, setSelectedTable]);

  const handleSelectTable = (table: RestaurantTable) => {
    setSelectedTable(table.id);
    setSelectedTableObj(table);
    setSearchParams({ view: 'menu', type: 'DINE_IN' });
  };

  const isTableView = view === 'tables';

  return (
    <div className="flex h-[calc(100vh-1.5rem)] min-h-[720px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <section className="flex min-w-0 flex-1 flex-col">
        <CashierTopbar orderType={orderType} selectedTable={selectedTable} />

        {isTableView ? (
          /* ── Table Plan: full width ── */
          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-5">
            <TableSelector selectedTableId={selectedTableId} onSelect={handleSelectTable} />
          </div>
        ) : orderType === 'TAKEAWAY' ? (
          /* ── Takeaway view: grid with CartPanel on the right ── */
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 xl:grid-cols-[minmax(0,1fr)_400px]">
            <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CashierWorkspaceHeader view={view} />
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <MenuGrid />
              </div>
            </div>

            <div className="min-h-0 overflow-hidden">
              <CartPanel orderType={orderType} selectedTable={selectedTable} />
            </div>
          </div>
        ) : (
          /* ── Menu view (DINE_IN): full width, no CartPanel ── */
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CashierWorkspaceHeader view={view} />
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <MenuGrid />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}