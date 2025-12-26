"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../prisma");
const auth_1 = require("../auth");
async function createAdmin() {
    const email = 'admin@lneducacional.com.br';
    const password = 'Admin@2024!';
    const name = 'Administrador';
    try {
        // Verifica se já existe
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            console.log('Usuário admin já existe. Atualizando role para ADMIN...');
            await prisma_1.prisma.user.update({
                where: { email },
                data: { role: 'ADMIN' },
            });
            console.log('Usuário atualizado para ADMIN!');
        }
        else {
            const hashedPassword = await (0, auth_1.hashPassword)(password);
            await prisma_1.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    role: 'ADMIN',
                    verified: true,
                },
            });
            console.log('Usuário admin criado com sucesso!');
        }
        console.log('\n=================================');
        console.log('CREDENCIAIS DO ADMIN:');
        console.log('=================================');
        console.log(`Email: ${email}`);
        console.log(`Senha: ${password}`);
        console.log('=================================\n');
    }
    catch (error) {
        console.error('Erro ao criar admin:', error);
    }
    finally {
        await prisma_1.prisma.$disconnect();
    }
}
createAdmin();
//# sourceMappingURL=create-admin.js.map