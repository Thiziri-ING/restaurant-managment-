import { useMemo, useState } from 'react';
import { Banknote, CreditCard, Gift, Minus, Plus, Trash2, ChevronRight, Undo2 } from 'lucide-react';
import { usePosStore } from '@/stores/pos.store';
import { useCreateOrder, useGenerateInvoice } from '@/hooks/useOrders';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import type { OrderType, RestaurantTable } from '@/types';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface CartPanelProps {
  orderType: OrderType;
  selectedTable: RestaurantTable | null;
}

const formatPrice = (value: number) => `${value.toFixed(2)} DA`;

export function CartPanel({ orderType, selectedTable }: CartPanelProps) {
  const {
    cart,
    selectedTableId,
    incrementItem,
    decrementItem,
    removeItem,
    toggleOffer,
    clearCart,
    getSubtotal,
  } = usePosStore();
  const createOrder = useCreateOrder();
  const generateInvoice = useGenerateInvoice();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const selectedItem = useMemo(
    () => cart.find((item) => item.menuItemId === selectedItemId) ?? null,
    [cart, selectedItemId],
  );
  const effectiveOrderType: OrderType = orderType === 'DINE_IN' && selectedTableId ? 'DINE_IN' : 'TAKEAWAY';

  const handleSendToKitchen = () => {
    if (cart.length === 0) return toast.error('Le panier est vide');

    createOrder.mutate(
      {
        type: effectiveOrderType,
        tableId: effectiveOrderType === 'DINE_IN' ? selectedTableId ?? undefined : undefined,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          discount: item.discount,
          isOffer: item.isOffer,
        })),
      },
      {
        onSuccess: (order) => {
          setCreatedOrderId(order.id);
          setShowPayment(true);
        },
      },
    );
  };

  const handlePay = () => {
    if (!createdOrderId) return;

    const payments = [];
    if (Number(cashAmount) > 0) payments.push({ method: 'CASH', amount: Number(cashAmount) });
    if (Number(cardAmount) > 0) payments.push({ method: 'CARD', amount: Number(cardAmount) });

    if (payments.length === 0) {
      toast.error('Ajoutez au moins un paiement');
      return;
    }

    generateInvoice.mutate(
      { orderId: createdOrderId, payments },
      {
        onSuccess: () => {
          clearCart();
          setSelectedItemId(null);
          setShowPayment(false);
          setCashAmount('');
          setCardAmount('');
          setCreatedOrderId(null);
        },
      },
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* ── Header ── */}
      <div className="border-b border-slate-100 px-4 py-3 bg-white">
        <div className="flex items-center gap-3">
          {/* Square chevron button on the left */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-50/50 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          
          {/* Title & Article count */}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-bold text-slate-900 leading-snug">
              {effectiveOrderType === 'DINE_IN' && selectedTable
                ? `Commande ${selectedTable.name}`
                : 'Commande à emporter'}
            </h2>
            <p className="text-[13px] font-semibold text-slate-500 mt-0.5">
              {quantity} article(s)
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs Row ── */}
      <div className="border-b border-slate-100 px-4 py-2.5 bg-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-1.5 text-xs font-black text-blue-600 hover:bg-blue-100/70 transition-colors"
          >
            Commun
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Pers. 1
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* ── Action/Selection Bar ── */}
      <div className="border-b border-slate-100 px-4 py-2.5 bg-white">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-700">
            {selectedItem ? `Sélectionné: ${selectedItem.name}` : 'Touchez un article pour le...'}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              title="Offrir"
              disabled={!selectedItem}
              onClick={() => selectedItem && toggleOffer(selectedItem.menuItemId)}
              className={clsx(
                'flex h-7 w-7 items-center justify-center rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-40',
                selectedItem?.isOffer 
                  ? 'bg-pink-50 border-pink-200 text-pink-500' 
                  : 'bg-white border-slate-200 text-pink-500/70 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600',
              )}
            >
              <Gift size={14} />
            </button>
            <button
              type="button"
              title="Annuler la sélection"
              disabled={!selectedItem}
              onClick={() => setSelectedItemId(null)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Undo2 size={14} />
            </button>
            <button
              type="button"
              title="Retirer"
              disabled={!selectedItem}
              onClick={() => selectedItem && removeItem(selectedItem.menuItemId)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto bg-white p-4">
        {cart.length === 0 ? (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center px-4 text-center">
            <p className="text-sm font-bold text-slate-800">Le panier est vide.</p>
            <p className="mt-1 text-sm text-slate-700">Sélectionnez des produits dans le menu.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {cart.map((item) => (
              <div
                key={item.menuItemId}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedItemId((current) => (current === item.menuItemId ? null : item.menuItemId))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedItemId((current) => (current === item.menuItemId ? null : item.menuItemId));
                  }
                }}
                className={clsx(
                  'flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-left transition-colors',
                  selectedItemId === item.menuItemId
                    ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                    : item.isOffer
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-slate-100 bg-white hover:bg-slate-50',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className={clsx('truncate text-sm font-bold', item.isOffer ? 'text-slate-400 line-through' : 'text-slate-900')}>
                    {item.name}
                  </p>
                  <p className="text-xs font-medium text-slate-400">{formatPrice(item.price)}</p>
                  {item.isOffer && <p className="text-xs font-bold text-amber-600">Offert</p>}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      decrementItem(item.menuItemId);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-7 text-center text-sm font-black text-slate-900">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      incrementItem(item.menuItemId);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-slate-150 p-4 bg-white">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">Total</span>
          <div className="text-2xl font-black text-blue-600">
            {cart.length === 0 ? (
              <span>0 <span className="font-extrabold">DA</span></span>
            ) : (
              <span>{formatPrice(subtotal)}</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSendToKitchen}
          disabled={cart.length === 0 || createOrder.isPending}
          className={clsx(
            'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-bold transition-all',
            cart.length === 0
              ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] shadow-md shadow-blue-500/20'
          )}
        >
          {createOrder.isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <CreditCard size={17} className={cart.length === 0 ? 'text-blue-300' : 'text-white'} />
          )}
          <span>Encaisser</span>
        </button>
      </div>

      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Paiement" size="sm">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-sm font-semibold text-slate-500">Total a payer</p>
            <p className="text-2xl font-black text-slate-900">{formatPrice(subtotal)}</p>
          </div>
          <Input
            label="Especes"
            type="number"
            value={cashAmount}
            onChange={(event) => setCashAmount(event.target.value)}
            placeholder="0"
          />
          <Input
            label="Carte"
            type="number"
            value={cardAmount}
            onChange={(event) => setCardAmount(event.target.value)}
            placeholder="0"
          />
          <p className="flex items-center gap-1 text-xs font-medium text-slate-400">
            <Banknote size={13} />
            Total saisi: {(Number(cashAmount || 0) + Number(cardAmount || 0)).toFixed(2)} DA
          </p>
          <Button onClick={handlePay} loading={generateInvoice.isPending} className="w-full">
            Valider le paiement
          </Button>
        </div>
      </Modal>
    </div>
  );
}