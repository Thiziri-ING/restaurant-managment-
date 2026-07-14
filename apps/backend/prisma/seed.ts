import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const RESOURCES = [
  'users', 'roles', 'products', 'stock', 'menu',
  'tables', 'reservations', 'orders', 'reports',
  'cash-register', 'audit',
];
const ACTIONS = ['create', 'read', 'update', 'delete'];

async function main() {
  console.log('🌱 Seeding database...');

  // ── 1. Permissions ──────────────────────────────────────────
  const permissions: { id: string; action: string; resource: string }[] = [];
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      const permission = await prisma.permission.upsert({
        where: { action_resource: { action, resource } },
        update: {},
        create: { action, resource },
      });
      permissions.push(permission);
    }
  }
  console.log(`✅ ${permissions.length} permissions créées`);

  const findPerm = (action: string, resource: string) =>
    permissions.find((p) => p.action === action && p.resource === resource)!.id;

  // ── 2. Rôles ─────────────────────────────────────────────────
  const managerRole = await prisma.role.upsert({
    where: { name: 'MANAGER' },
    update: {},
    create: {
      name: 'MANAGER',
      description: 'Accès complet à toutes les fonctionnalités',
      permissions: { create: permissions.map((p) => ({ permissionId: p.id })) },
    },
  });

  const cashierPermissions = [
    ...ACTIONS.map((a) => findPerm(a, 'orders')),
    ...ACTIONS.map((a) => findPerm(a, 'tables')),
    ...ACTIONS.map((a) => findPerm(a, 'reservations')),
    ...ACTIONS.map((a) => findPerm(a, 'cash-register')),
    findPerm('read', 'menu'),
    findPerm('update', 'menu'), // disponibilité
  ];

  const cashierRole = await prisma.role.upsert({
    where: { name: 'CAISSIER' },
    update: {},
    create: {
      name: 'CAISSIER',
      description: 'Gestion des commandes, tables et caisse',
      permissions: { create: cashierPermissions.map((id) => ({ permissionId: id })) },
    },
  });

  const storekeeperPermissions = [
    ...ACTIONS.map((a) => findPerm(a, 'products')),
    ...ACTIONS.map((a) => findPerm(a, 'stock')),
    findPerm('read', 'reports'),
  ];

  const storekeeperRole = await prisma.role.upsert({
    where: { name: 'MAGASINIER' },
    update: {},
    create: {
      name: 'MAGASINIER',
      description: 'Gestion du stock, entrées et sorties',
      permissions: { create: storekeeperPermissions.map((id) => ({ permissionId: id })) },
    },
  });

  console.log('✅ Rôles créés: MANAGER, CAISSIER, MAGASINIER');

  // ── 3. Utilisateurs de test ─────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);

  const manager = await prisma.user.upsert({
    where: { email: 'manager@restaurant.com' },
    update: {},
    create: {
      email: 'manager@restaurant.com',
      fullName: 'Ahmed Manager',
      passwordHash,
      roles: { create: [{ roleId: managerRole.id }] },
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'caissier@restaurant.com' },
    update: {},
    create: {
      email: 'caissier@restaurant.com',
      fullName: 'Sarah Caissière',
      passwordHash,
      roles: { create: [{ roleId: cashierRole.id }] },
    },
  });

  const storekeeper = await prisma.user.upsert({
    where: { email: 'magasinier@restaurant.com' },
    update: {},
    create: {
      email: 'magasinier@restaurant.com',
      fullName: 'Karim Magasinier',
      passwordHash,
      roles: { create: [{ roleId: storekeeperRole.id }] },
    },
  });

  console.log('✅ Utilisateurs créés:');
  console.log('   manager@restaurant.com / password123');
  console.log('   caissier@restaurant.com / password123');
  console.log('   magasinier@restaurant.com / password123');

  // ── 4. Zones & Tables ────────────────────────────────────────
  const salle = await prisma.zone.upsert({
    where: { name: 'Salle' },
    update: {},
    create: { name: 'Salle' },
  });
  const terrasse = await prisma.zone.upsert({
    where: { name: 'Terrasse' },
    update: {},
    create: { name: 'Terrasse' },
  });

  for (let i = 1; i <= 8; i++) {
    await prisma.restaurantTable.create({
      data: { name: `T-${i}`, capacity: i % 2 === 0 ? 4 : 2, zoneId: salle.id },
    });
  }
  for (let i = 1; i <= 4; i++) {
    await prisma.restaurantTable.create({
      data: { name: `TE-${i}`, capacity: 4, zoneId: terrasse.id },
    });
  }
  console.log('✅ Zones et tables créées');

  // ── 5. Catégories de stock + produits exemple ────────────────
  const boissons = await prisma.stockCategory.upsert({
    where: { name: 'Boissons' },
    update: {},
    create: { name: 'Boissons' },
  });
  const epicerie = await prisma.stockCategory.upsert({
    where: { name: 'Épicerie' },
    update: {},
    create: { name: 'Épicerie' },
  });

  await prisma.product.upsert({
    where: { code: 'EAU-50CL' },
    update: {},
    create: {
      name: 'Eau minérale 50cl',
      code: 'EAU-50CL',
      unit: 'pièce',
      currentQty: 100,
      minQty: 20,
      alertQty: 30,
      costPrice: 30,
      categoryId: boissons.id,
    },
  });

  await prisma.product.upsert({
    where: { code: 'FAR-001' },
    update: {},
    create: {
      name: 'Farine de blé',
      code: 'FAR-001',
      unit: 'kg',
      currentQty: 50,
      minQty: 10,
      alertQty: 15,
      costPrice: 120,
      categoryId: epicerie.id,
    },
  });

  console.log('✅ Produits de stock créés');

  // ── 6. Menu ────────────────────────────────────────────────
  const platsCategory = await prisma.menuCategory.upsert({
    where: { name: 'Plats principaux' },
    update: {},
    create: { name: 'Plats principaux', sortOrder: 1 },
  });
  const boissonsMenuCategory = await prisma.menuCategory.upsert({
    where: { name: 'Boissons' },
    update: {},
    create: { name: 'Boissons', sortOrder: 2 },
  });

  await prisma.menuItem.create({
    data: {
      name: 'Couscous Royal',
      description: 'Couscous traditionnel avec agneau, poulet et merguez',
      price: 1200,
      categoryId: platsCategory.id,
    },
  });

  await prisma.menuItem.create({
    data: {
      name: 'Eau minérale',
      price: 80,
      categoryId: boissonsMenuCategory.id,
    },
  });

  console.log('✅ Menu créé');
  console.log('🎉 Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
