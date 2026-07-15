import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { stockOutputSchema, StockOutputFormValues } from '@/schemas';
import { useCreateStockOutput, useProducts } from '@/hooks/useStock';

export function StockOutputFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: products } = useProducts({ page: 1 });
  const createOutput = useCreateStockOutput();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockOutputFormValues>({
    resolver: zodResolver(stockOutputSchema),
    defaultValues: { reason: '', notes: '', items: [{ productId: '', quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = (values: StockOutputFormValues) => {
    createOutput.mutate(values, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle sortie de stock" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Motif de la sortie" placeholder="Ex: Utilisation cuisine, casse, péremption..." error={errors.reason?.message} {...register('reason')} />
        <Input label="Notes (optionnel)" {...register('notes')} />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Produits</span>
            <button
              type="button"
              onClick={() => append({ productId: '', quantity: 1 })}
              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
            >
              <Plus size={14} /> Ajouter une ligne
            </button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 items-end gap-2 rounded-lg border border-slate-100 p-2">
              <div className="col-span-8">
                <Select label={index === 0 ? 'Produit' : undefined} {...register(`items.${index}.productId`)}>
                  <option value="">Sélectionner...</option>
                  {products?.data.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (disponible: {p.currentQty} {p.unit})</option>
                  ))}
                </Select>
              </div>
              <div className="col-span-3">
                <Input label={index === 0 ? 'Quantité' : undefined} type="number" step="0.01" {...register(`items.${index}.quantity`)} />
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

        <Button type="submit" loading={createOutput.isPending} className="mt-2 w-full">
          Enregistrer la sortie de stock
        </Button>
      </form>
    </Modal>
  );
}
