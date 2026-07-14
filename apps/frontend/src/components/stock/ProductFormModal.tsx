import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { productSchema, ProductFormValues } from '@/schemas';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useStock';
import type { Product, StockCategory } from '@/types';

export function ProductFormModal({
  isOpen,
  onClose,
  product,
  categories,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: StockCategory[];
}) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({ resolver: zodResolver(productSchema) });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        code: product.code,
        unit: product.unit,
        currentQty: product.currentQty,
        minQty: product.minQty,
        alertQty: product.alertQty,
        costPrice: product.costPrice,
        categoryId: product.categoryId,
      });
    } else {
      reset({ name: '', code: '', unit: '', currentQty: 0, minQty: 0, alertQty: 0, costPrice: 0, categoryId: '' });
    }
  }, [product, reset, isOpen]);

  const onSubmit = (values: ProductFormValues) => {
    if (product) {
      updateProduct.mutate({ id: product.id, values }, { onSuccess: onClose });
    } else {
      createProduct.mutate(values, { onSuccess: onClose });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Modifier le produit' : 'Nouveau produit'}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Nom du produit" error={errors.name?.message} {...register('name')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Code" error={errors.code?.message} {...register('code')} />
          <Input label="Unité (kg, L, pièce...)" error={errors.unit?.message} {...register('unit')} />
        </div>
        <Select label="Catégorie" error={errors.categoryId?.message} {...register('categoryId')}>
          <option value="">Sélectionner...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Qté actuelle" type="number" step="0.01" {...register('currentQty')} />
          <Input label="Stock min" type="number" step="0.01" {...register('minQty')} />
          <Input label="Seuil alerte" type="number" step="0.01" {...register('alertQty')} />
        </div>
        <Input label="Prix de revient (DA)" type="number" step="0.01" {...register('costPrice')} />

        <Button type="submit" loading={createProduct.isPending || updateProduct.isPending} className="mt-2 w-full">
          {product ? 'Mettre à jour' : 'Créer le produit'}
        </Button>
      </form>
    </Modal>
  );
}
