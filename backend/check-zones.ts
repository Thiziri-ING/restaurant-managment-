import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const zones = await prisma.zone.findMany({
    include: { _count: { select: { tables: true } } }
  });
  console.log('--- ZONES IN DB ---');
  console.log(JSON.stringify(zones, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
