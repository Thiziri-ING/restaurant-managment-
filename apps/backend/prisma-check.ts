import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

// Manual dotenv loading
try {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    for (const line of envConfig.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        process.env[key] = value.trim();
      }
    }
  }
} catch (e) {
  console.error('Failed to load .env manually', e);
}

const prisma = new PrismaClient();

async function main() {
  console.log('Querying users...');
  const users = await prisma.user.findMany({
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });
  console.log('Users found:', users.map(u => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    isActive: u.isActive,
    roles: u.roles.map(ur => ur.role.name)
  })));
  
  if (users.length > 0) {
    for (const user of users) {
      const passwordMatch = await bcrypt.compare('password123', user.passwordHash);
      console.log(`Checking password "password123" for ${user.email}:`, passwordMatch);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
