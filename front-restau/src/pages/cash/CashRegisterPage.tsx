import { useState } from 'react';
import { DollarSign, ArrowDownCircle, ArrowUpCircle, Lock, Unlock, Clock } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, KpiCard } from '@/components/ui/Badge';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function formatDA(v: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(v ?? 0)) + ' DA';
}

// ── Hooks ─────────────────────────────────────────────────────
function useCashRegister() {
  return useQuery({
    queryKey: ['cash-register', 'current'],
    queryFn: async () => {
      const { data } = await apiClient.get('/cash-register/current');
      return data;
    },
    refetchInterval: 15000,
  });
}

function useCashBalance() {
  return useQuery({
    queryKey: ['cash-register', 'balance'],
    queryFn: async () => {
      const { data } = await apiClient.get('/cash-register/current/balance');
      return data;
    },
    refetchInterval: 15000,
  });
}

function useCashHistory() {
  return useQuery({
    queryKey: ['cash-register', 'history'],
    queryFn: async () => {
      const { data } = await apiClient.get('/cash-register/history', { params: { limit: 20 } });
      return data.data as any[];
    },
  });
}

function useOpenRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (openingAmount: number) =>
      apiClient.post('/cash-register/open', { openingAmount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-register'] });
      toast.success('Caisse ouverte');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erreur'),
  });
}

function useCloseRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (closingAmount: number) =>
      apiClient.post('/cash-register/close', { closingAmount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-register'] });
      toast.success('Caisse fermée');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erreur'),
  });
}

function useCashMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, amount, reason }: { type: string; amount: number; reason?: string }) =>
      apiClient.post('/cash-register/movement', { type, amount, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-register'] });
      toast.success('Mouvement enregistré');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erreur'),
  });
}

// ── Open modal ────────────────────────────────────────────────
function OpenRegisterModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const open = useOpenRegister();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ouvrir la caisse" size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-600">Saisissez le montant de monnaie présent en caisse à l'ouverture.</p>
        <Input
          label="Fond de caisse initial (DA)"
          type="number"
          step="0.01"
          placeholder="5000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button
          className="w-full"
          icon={<Unlock size={16} />}
          loading={open.isPending}
          onClick={() => open.mutate(Number(amount), { onSuccess: onClose })}
          disabled={!amount}
        >
          Ouvrir la caisse
        </Button>
      </div>
    </Modal>
  );
}

// ── Close modal ───────────────────────────────────────────────
function CloseRegisterModal({
  isOpen,
  onClose,
  expectedBalance,
}: {
  isOpen: boolean;
  onClose: () => void;
  expectedBalance: number;
}) {
  const [amount, setAmount] = useState('');
  const close = useCloseRegister();

  const diff = Number(amount) - expectedBalance;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fermer la caisse" size="sm">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Solde théorique</span>
            <span className="font-semibold">{formatDA(expectedBalance)}</span>
          </div>
        </div>
        <Input
          label="Montant réel compté (DA)"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {amount && (
          <div className={clsx('rounded-lg p-3 text-sm font-medium', diff === 0 ? 'bg-emerald-50 text-emerald-700' : diff > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700')}>
            {diff === 0 ? '✓ Caisse équilibrée' : diff > 0 ? `Excédent : +${formatDA(diff)}` : `Manquant : ${formatDA(diff)}`}
          </div>
        )}
        <Button
          variant="danger"
          className="w-full"
          icon={<Lock size={16} />}
          loading={close.isPending}
          onClick={() => close.mutate(Number(amount), { onSuccess: onClose })}
          disabled={!amount}
        >
          Fermer la caisse
        </Button>
      </div>
    </Modal>
  );
}

// ── Movement modal ────────────────────────────────────────────
function MovementModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [type, setType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const movement = useCashMovement();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mouvement de caisse" size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          <button
            onClick={() => setType('DEPOSIT')}
            className={clsx('flex-1 py-2 text-sm font-medium', type === 'DEPOSIT' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600')}
          >
            Dépôt
          </button>
          <button
            onClick={() => setType('WITHDRAWAL')}
            className={clsx('flex-1 py-2 text-sm font-medium', type === 'WITHDRAWAL' ? 'bg-red-600 text-white' : 'bg-white text-slate-600')}
          >
            Retrait
          </button>
        </div>
        <Input
          label="Montant (DA)"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input
          label="Motif (optionnel)"
          placeholder="Ex: Achat fournitures, rendu monnaie..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button
          variant={type === 'DEPOSIT' ? 'success' : 'danger'}
          className="w-full"
          loading={movement.isPending}
          onClick={() => movement.mutate({ type, amount: Number(amount), reason: reason || undefined }, { onSuccess: onClose })}
          disabled={!amount}
        >
          Valider le {type === 'DEPOSIT' ? 'dépôt' : 'retrait'}
        </Button>
      </div>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────
export function CashRegisterPage() {
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showMovement, setShowMovement] = useState(false);

  const { data: register } = useCashRegister();
  const { data: balance } = useCashBalance();
  const { data: history } = useCashHistory();

  const isOpen = !!register && !register.closedAt;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Caisse</h1>
            <p className="text-sm text-slate-500">
              {isOpen
                ? `Ouverte depuis ${dayjs(register.openedAt).format('HH:mm')}`
                : 'Caisse fermée'}
            </p>
          </div>
          <div className="flex gap-2">
            {isOpen ? (
              <>
                <Button
                  variant="secondary"
                  icon={<ArrowDownCircle size={16} />}
                  onClick={() => setShowMovement(true)}
                >
                  Dépôt / Retrait
                </Button>
                <Button
                  variant="danger"
                  icon={<Lock size={16} />}
                  onClick={() => setShowClose(true)}
                >
                  Fermer la caisse
                </Button>
              </>
            ) : (
              <Button icon={<Unlock size={16} />} onClick={() => setShowOpen(true)}>
                Ouvrir la caisse
              </Button>
            )}
          </div>
        </div>

        {/* Filters + timeframe + summary */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-2 rounded-lg bg-slate-50 p-2">
              <button className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium">Toutes</button>
              <button className="rounded-lg px-3 py-1.5 text-sm font-medium">Sur place</button>
              <button className="rounded-lg px-3 py-1.5 text-sm font-medium">À emporter</button>
            </div>

            <div className="flex gap-2 rounded-lg bg-slate-50 p-2">
              <button className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium">Par jour</button>
              <button className="rounded-lg px-3 py-1.5 text-sm font-medium">Par semaine</button>
              <button className="rounded-lg px-3 py-1.5 text-sm font-medium">Par mois</button>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-2 text-sm font-medium">
            <span className="text-slate-500">{(register?.movements?.length ?? 0)} commande(s) — Total </span>
            <span className="text-primary-600 font-bold">{formatDA(balance?.cashSales ?? 0)}</span>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {!isOpen && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3 text-amber-700">
            <Lock size={20} />
            <div>
              <p className="font-medium">La caisse est actuellement fermée</p>
              <p className="text-sm opacity-75">Ouvrez la caisse avant de commencer à enregistrer des ventes.</p>
            </div>
          </div>
        </Card>
      )}

      {/* KPIs temps réel */}
      {isOpen && balance && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            title="Fond d'ouverture"
            value={formatDA(balance.openingAmount)}
            icon={<DollarSign size={22} />}
            color="primary"
          />
          <KpiCard
            title="Ventes (espèces)"
            value={formatDA(balance.cashSales)}
            icon={<ArrowDownCircle size={22} />}
            color="green"
          />
          <KpiCard
            title="Dépôts / Retraits"
            value={formatDA(balance.deposits - balance.withdrawals)}
            icon={<ArrowUpCircle size={22} />}
            color="amber"
          />
          <KpiCard
            title="Solde théorique"
            value={formatDA(balance.expectedBalance)}
            icon={<DollarSign size={22} />}
            color="primary"
          />
        </div>
      )}

      {/* Mouvements de la session en cours */}
      {isOpen && (register?.movements?.length ?? 0) > 0 && (
        <Card>
          <h2 className="mb-3 text-base font-semibold text-slate-800">Mouvements de la session</h2>
          <div className="flex flex-col gap-2">
            {register.movements.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <div className="flex items-center gap-2">
                  {m.type === 'DEPOSIT'
                    ? <ArrowDownCircle size={16} className="text-emerald-500" />
                    : <ArrowUpCircle size={16} className="text-red-500" />}
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {m.type === 'DEPOSIT' ? 'Dépôt' : 'Retrait'}
                    </p>
                    {m.reason && <p className="text-xs text-slate-400">{m.reason}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className={clsx('text-sm font-semibold', m.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-red-600')}>
                    {m.type === 'DEPOSIT' ? '+' : '-'}{formatDA(m.amount)}
                  </p>
                  <p className="text-xs text-slate-400">{dayjs(m.movedAt).format('HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Historique des sessions */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <Clock size={18} className="text-slate-400" />
          <h2 className="text-base font-semibold text-slate-800">Historique des sessions</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3">Ouverture</th>
              <th className="px-4 py-3">Fermeture</th>
              <th className="px-4 py-3">Caissier</th>
              <th className="px-4 py-3 text-right">Fond initial</th>
              <th className="px-4 py-3 text-right">Montant final</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {(history ?? []).map((session: any) => (
              <tr key={session.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">{dayjs(session.openedAt).format('DD/MM/YYYY HH:mm')}</td>
                <td className="px-4 py-3 text-slate-400">
                  {session.closedAt ? dayjs(session.closedAt).format('DD/MM/YYYY HH:mm') : '—'}
                </td>
                <td className="px-4 py-3 text-slate-700">{session.user?.fullName}</td>
                <td className="px-4 py-3 text-right">{formatDA(session.openingAmount)}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {session.closingAmount != null ? formatDA(session.closingAmount) : '—'}
                </td>
                <td className="px-4 py-3">
                  {session.closedAt ? (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Fermée</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">En cours</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Modals */}
      <OpenRegisterModal isOpen={showOpen} onClose={() => setShowOpen(false)} />
      <CloseRegisterModal isOpen={showClose} onClose={() => setShowClose(false)} expectedBalance={balance?.expectedBalance ?? 0} />
      <MovementModal isOpen={showMovement} onClose={() => setShowMovement(false)} />
    </div>
  );
}
