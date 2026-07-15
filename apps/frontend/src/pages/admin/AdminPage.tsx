import { useState } from 'react';
import { Plus, Power, Shield, Search } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge, Card } from '@/components/ui/Badge';
import { userSchema, UserFormValues } from '@/schemas';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

// ── Hooks ─────────────────────────────────────────────────────
function useUsers(search?: string) {
  return useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      const { data } = await apiClient.get('/users', { params: { search, limit: 50 } });
      return data.data as any[];
    },
  });
}

function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await apiClient.get('/roles');
      return data as any[];
    },
  });
}

function useAuditLogs() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data } = await apiClient.get('/audit-logs', { params: { limit: 50 } });
      return data.data as any[];
    },
  });
}

function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: UserFormValues) => {
      const { data } = await apiClient.post('/users', values);
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Utilisateur créé'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erreur'),
  });
}

function useToggleUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => apiClient.patch(`/users/${id}/toggle`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); },
  });
}

// ── User form modal ───────────────────────────────────────────
function UserFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: roles } = useRoles();
  const createUser = useCreateUser();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { fullName: '', email: '', password: '', roleIds: [] },
  });

  const onSubmit = (values: UserFormValues) => {
    createUser.mutate(values, { onSuccess: () => { reset(); onClose(); } });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvel utilisateur">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Nom complet *" error={errors.fullName?.message} {...register('fullName')} />
        <Input label="Email *" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Mot de passe *" type="password" error={errors.password?.message} {...register('password')} />
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Rôles</p>
          <div className="flex flex-col gap-2">
            {roles?.map((role) => (
              <label key={role.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" value={role.id} {...register('roleIds')} className="rounded" />
                <span className="font-medium">{role.name}</span>
                {role.description && <span className="text-slate-400">— {role.description}</span>}
              </label>
            ))}
          </div>
        </div>
        <Button type="submit" loading={createUser.isPending} className="mt-2 w-full">
          Créer l'utilisateur
        </Button>
      </form>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────
export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit'>('users');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: users, isLoading: loadingUsers } = useUsers(search || undefined);
  const { data: roles, isLoading: loadingRoles } = useRoles();
  const { data: auditLogs, isLoading: loadingAudit } = useAuditLogs();
  const toggleUser = useToggleUser();

  const TABS = [
    { key: 'users', label: `Utilisateurs (${users?.length ?? 0})` },
    { key: 'roles', label: `Rôles (${roles?.length ?? 0})` },
    { key: 'audit', label: 'Journal d\'audit' },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Administration</h1>
          <p className="text-sm text-slate-500">Gestion des utilisateurs, rôles et journaux</p>
        </div>
        {activeTab === 'users' && (
          <Button icon={<Plus size={16} />} onClick={() => setShowForm(true)}>Nouvel utilisateur</Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={clsx('pb-2 px-3 text-sm font-medium', activeTab === key ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500 hover:text-slate-700')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {activeTab === 'users' && (
        <>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">Rôles</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Créé le</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Chargement...</td></tr>
                ) : users?.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{user.fullName}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.map((ur: any) => (
                          <Badge key={ur.role.id} color="blue">{ur.role.name}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={user.isActive ? 'green' : 'gray'}>{user.isActive ? 'Actif' : 'Désactivé'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{dayjs(user.createdAt).format('DD/MM/YYYY')}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleUser.mutate(user.id)}
                        className={clsx('flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium', user.isActive ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50')}
                      >
                        <Power size={13} />
                        {user.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {/* Roles tab */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loadingRoles ? (
            <div className="col-span-3 py-12 text-center text-slate-400">Chargement...</div>
          ) : roles?.map((role) => (
            <Card key={role.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-primary-600" />
                <p className="font-semibold text-slate-800">{role.name}</p>
                <Badge color="blue">{role._count?.users ?? 0} utilisateur(s)</Badge>
              </div>
              {role.description && <p className="text-sm text-slate-500">{role.description}</p>}
              <div>
                <p className="mb-1 text-xs text-slate-400">{role.permissions?.length ?? 0} permissions</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions?.slice(0, 6).map((rp: any) => (
                    <span key={rp.permission.id} className="text-[10px] rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                      {rp.permission.action}:{rp.permission.resource}
                    </span>
                  ))}
                  {(role.permissions?.length ?? 0) > 6 && (
                    <span className="text-[10px] text-slate-400">+{role.permissions.length - 6} autres</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Audit logs tab */}
      {activeTab === 'audit' && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Ressource</th>
              </tr>
            </thead>
            <tbody>
              {loadingAudit ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Chargement...</td></tr>
              ) : auditLogs?.map((log) => (
                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-400">{dayjs(log.createdAt).format('DD/MM/YYYY HH:mm:ss')}</td>
                  <td className="px-4 py-3 text-slate-600">{log.user?.fullName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge color={log.action === 'deleted' ? 'red' : log.action === 'created' ? 'green' : 'blue'}>
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{log.resource}{log.resourceId ? ` #${log.resourceId.slice(0, 8)}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <UserFormModal isOpen={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
