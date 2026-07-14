import { useState } from 'react';
import { Minus, Plus, Trash2, Gift, CreditCard } from 'lucide-react';
import { usePosStore } from '@/stores/pos.store';
import { useCreateOrder, useGenerateInvoice } from '@/hooks/useOrders';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export function CartPanel() {
  const { cart, selectedTableId, incrementItem, decrementItem, removeItem, toggleOffer, clearCart, getSubtotal } = usePosStore();
  const createOrder = useCreateOrder();
  const generateInvoice = useGenerateInvoice();

  const [showPayment, setShowPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const subtotal = getSubtotal();

  const handleSendToKitchen = () => {
    if (cart.length === 0) return toast.error('Le panier est vide');

    createOrder.mutate(
      {
        type: 'DINE_IN',
        tableId: selectedTableId ?? undefined,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          quantity: c.quantity,
          discount: c.discount,
          isOffer: c.isOffer,
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

    generateInvoice.mutate(
      { orderId: createdOrderId, payments },
      {
        onSuccess: () => {
          clearCart();
          setShowPayment(false);
          setCashAmount('');
          setCardAmount('');
          setCreatedOrderId(null);
        },
      },
    );
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-base font-semibold text-slate-800">Commande en cours</h2>
        {selectedTableId && <p className="text-xs text-slate-400">Table sélectionnée</p>}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {cart.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Sélectionnez des plats dans le menu</p>
        ) : (
          <div className="flex flex-col gap-2">
            {cart.map((item) => (
              <div key={item.menuItemId} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2">
                <div className="flex-1">
                  <p className={item.isOffer ? 'text-sm font-medium text-slate-400 line-through' : 'text-sm font-medium text-slate-800'}>
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-400">{item.price.toFixed(2)} DA</p>
                </div>
                <button onClick={() => decrementItem(item.menuItemId)} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                <button onClick={() => incrementItem(item.menuItemId)} className="rounded p-1 text-slate-400 hover:bg-slate-100">
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => toggleOffer(item.menuItemId)}
                  className={item.isOffer ? 'rounded p-1 text-amber-500' : 'rounded p-1 text-slate-300 hover:text-amber-500'}
                  title="Offrir cet article"
                >
                  <Gift size={14} />
                </button>
                <button onClick={() => removeItem(item.menuItemId)} className="rounded p-1 text-slate-300 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between text-base font-bold text-slate-800">
          <span>Total</span>
          <span>{subtotal.toFixed(2)} DA</span>
        </div>
        <Button
          className="w-full"
          icon={<CreditCard size={16} />}
          loading={createOrder.isPending}
          onClick={handleSendToKitchen}
          disabled={cart.length === 0}
        >
          Encaisser
        </Button>
      </div>

      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Paiement" size="sm">
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-sm text-slate-500">Total à payer</p>
            <p className="text-2xl font-bold text-slate-800">{subtotal.toFixed(2)} DA</p>
          </div>
          <Input label="Espèces" type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="0" />
          <Input label="Carte" type="number" value={cardAmount} onChange={(e) => setCardAmount(e.target.value)} placeholder="0" />
          <p className="text-xs text-slate-400">
            Total saisi : {(Number(cashAmount || 0) + Number(cardAmount || 0)).toFixed(2)} DA
          </p>
          <Button onClick={handlePay} loading={generateInvoice.isPending} className="w-full">
            Valider le paiement
          </Button>
        </div>
      </Modal>
    </div>
  );
}
