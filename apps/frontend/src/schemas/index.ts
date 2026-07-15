import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit faire au moins 6 caractères'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const productSchema = z.object({
  name: z.string().min(2, 'Le nom est requis'),
  code: z.string().min(2, 'Le code est requis'),
  unit: z.string().min(1, 'L\'unité est requise'),
  currentQty: z.coerce.number().min(0).optional(),
  minQty: z.coerce.number().min(0).optional(),
  alertQty: z.coerce.number().min(0).optional(),
  costPrice: z.coerce.number().min(0).optional(),
  categoryId: z.string().uuid('Catégorie requise'),
});
export type ProductFormValues = z.infer<typeof productSchema>;

export const stockEntrySchema = z.object({
  reference: z.string().min(2, 'La référence est requise'),
  supplierId: z.string().uuid('Fournisseur requis'),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid('Produit requis'),
        quantity: z.coerce.number().positive('La quantité doit être positive'),
        unitPrice: z.coerce.number().min(0, 'Le prix doit être positif ou nul'),
      }),
    )
    .min(1, 'Ajoutez au moins un produit'),
});
export type StockEntryFormValues = z.infer<typeof stockEntrySchema>;

export const stockOutputSchema = z.object({
  reason: z.string().min(2, 'Le motif est requis'),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid('Produit requis'),
        quantity: z.coerce.number().positive('La quantité doit être positive'),
      }),
    )
    .min(1, 'Ajoutez au moins un produit'),
});
export type StockOutputFormValues = z.infer<typeof stockOutputSchema>;

export const menuItemSchema = z.object({
  name: z.string().min(2, 'Le nom est requis'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Le prix doit être positif'),
  available: z.boolean().optional(),
  categoryId: z.string().uuid('Catégorie requise'),
});
export type MenuItemFormValues = z.infer<typeof menuItemSchema>;

export const userSchema = z.object({
  fullName: z.string().min(2, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court').optional(),
  roleIds: z.array(z.string().uuid()).optional(),
});
export type UserFormValues = z.infer<typeof userSchema>;
