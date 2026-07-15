import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { stockEntrySchema, StockEntryFormValues } from '@/schemas';
import { useCreateStockEntry, useSuppliers, useProducts } from '@/hooks/useStock';

export function StockEntryFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: suppliers } = useSuppliers();
  const { data: products } = useProducts({ page: 1 });
  const createEntry = useCreateStockEntry();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockEntryFormValues>({
    resolver: zodResolver(stockEntrySchema),
    defaultValues: { reference: '', supplierId: '', notes: '', items: [{ productId: '', quantity: 1, unitPrice: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = (values: StockEntryFormValues) => {
    createEntry.mutate(values, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle entrée de stock" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Référence (bon de livraison)" error={errors.reference?.message} {...register('reference')} />
          <Select label="Fournisseur" error={errors.supplierId?.message} {...register('supplierId')}>
            <option value="">Sélectionner...</option>
            {suppliers?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        <Input label="Notes (optionnel)" {...register('notes')} />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Produits</span>
            <button
              type="button"
              onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
            >
              <Plus size={14} /> Ajouter une ligne
            </button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 items-end gap-2 rounded-lg border border-slate-100 p-2">
              <div className="col-span-5">
                <Select label={index === 0 ? 'Produit' : undefined} {...register(`items.${index}.productId`)}>
                  <option value="">Sélectionner...</option>
                  {products?.data.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                </Select>
              </div>
              <div className="col-span-3">
                <Input label={index === 0 ? 'Quantité' : undefined} type="number" step="0.01" {...register(`items.${index}.quantity`)} />
              </div>
              <div className="col-span-3">
                <Input label={index === 0 ? 'Prix unitaire' : undefined} type="number" step="0.01" {...register(`items.${index}.unitPrice`)} />
              </div>
              <div className="col-span-1">
                <button type="button" onClick={() => remove(index)} className="rounded p-2 text-slate-300 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {errors.items?.message && <p className="text-xs text-red-500">{errors.items.message}</p>}
        </div>

        <Button type="submit" loading={createEntry.isPending} className="mt-2 w-full">
          Enregistrer l'entrée de stock
        </Button>
      </form>
    </Modal>
  );
}
