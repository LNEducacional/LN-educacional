"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const prisma = new client_1.PrismaClient();
const usersToSeed = [
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
function mapRoleToPrisma(role) {
    if (role === 'SUPER_ADMIN')
        return 'ADMIN';
    if (role === 'PACIENTE')
        return 'STUDENT';
    if (role === 'STUDENT')
        return 'STUDENT';
    if (role === 'COLLABORATOR')
        return 'COLLABORATOR';
    return 'ADMIN';
}
async function upsertUser(u) {
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
        return { action: 'updated', user: updated };
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
    return { action: 'created', user: created };
}
async function main() {
    console.log('🌱 Seeding usuarios...');
    const results = [];
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
//# sourceMappingURL=seed-users.js.map