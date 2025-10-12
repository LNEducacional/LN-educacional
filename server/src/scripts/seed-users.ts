import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

type SeedUser = {
  id?: string;
  email: string;
  password: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'PACIENTE' | 'STUDENT' | 'COLLABORATOR';
};

const usersToSeed: SeedUser[] = [
  {
    id: 'cmfsxa5kq0000lwfb4v7elsxp',
    email: 'admin@sistema.com',
    password: 'SuperAdmin123!',
    name: 'Super Administrator',
    role: 'SUPER_ADMIN',
  },
  {
    email: 'admin@dentalcare.com',
    password: 'Admin123!',
    name: 'Admin Dental Care',
    role: 'ADMIN',
  },
  {
    id: 'cmfvb2xj90001lwdtlgbg8vxx',
    email: 'paciente@clinicaexemplo.com',
    password: 'Paciente123!',
    name: 'Carlos Oliveira',
    role: 'PACIENTE',
  },
];

function mapRoleToPrisma(role: SeedUser['role']): 'ADMIN' | 'STUDENT' | 'COLLABORATOR' {
  if (role === 'SUPER_ADMIN') return 'ADMIN';
  if (role === 'PACIENTE') return 'STUDENT';
  if (role === 'STUDENT') return 'STUDENT';
  if (role === 'COLLABORATOR') return 'COLLABORATOR';
  return 'ADMIN';
}

async function upsertUser(u: SeedUser) {
  const prismaRole = mapRoleToPrisma(u.role);
  if (u.role === 'SUPER_ADMIN' || u.role === 'PACIENTE') {
    console.warn(`[role-map] Mapeando role ${u.role} -> ${prismaRole} (compatibilidade com schema atual)`);
  }

  const hashed = await argon2.hash(u.password);

  const existing = await prisma.user.findUnique({ where: { email: u.email } });

  if (existing) {
    const updated = await prisma.user.update({
      where: { email: u.email },
      data: {
        name: u.name,
        password: hashed,
        role: prismaRole,
        verified: true,
        updatedAt: new Date(),
      },
    });
    return { action: 'updated', user: updated } as const;
  }

  const created = await prisma.user.create({
    data: {
      id: u.id,
      email: u.email,
      password: hashed,
      name: u.name,
      role: prismaRole,
      verified: true,
    },
  });
  return { action: 'created', user: created } as const;
}

async function main() {
  console.log('🌱 Seeding usuarios...');
  const results = [] as Array<{ action: 'created' | 'updated'; user: { id: string; email: string; role: string } }>;

  for (const u of usersToSeed) {
    const res = await upsertUser(u);
    results.push({ action: res.action, user: { id: res.user.id, email: res.user.email, role: res.user.role } });
    console.log(`✅ ${res.action.toUpperCase()}: ${res.user.email} (id=${res.user.id}, role=${res.user.role})`);
  }

  console.log('📋 Resultado:', results);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


