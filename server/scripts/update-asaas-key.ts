import { prisma } from '../src/prisma';
import * as readline from 'readline';

// Interface para input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function updateAsaasKey() {
  try {
    console.log('🔧 Atualização de Chave API - Asaas\n');

    // Buscar integração atual
    const integration = await prisma.apiIntegration.findFirst({
      where: { name: 'asaas' },
    });

    if (!integration) {
      console.log('❌ Nenhuma integração Asaas encontrada no banco.');
      console.log('💡 Execute o script setup-asaas.ts primeiro para criar a integração.');
      rl.close();
      return;
    }

    console.log('✅ Integração atual encontrada:');
    console.log('   - ID:', integration.id);
    console.log('   - Display Name:', integration.displayName);
    console.log('   - API Key Atual:', integration.apiKey ? `${integration.apiKey.substring(0, 20)}...` : 'não configurada');
    console.log('   - Ambiente:', integration.environment);
    console.log('   - Ativa:', integration.isActive);
    console.log('\n');

    // Solicitar nova chave
    console.log('📋 Para obter a chave válida:');
    console.log('   1. Acesse: https://lneducacional.com.br/admin/integracoes');
    console.log('   2. Localize o card "Asaas Pagamentos"');
    console.log('   3. Clique no ícone de olho para visualizar a API Key');
    console.log('   4. Copie a chave completa\n');

    const newApiKey = await question('Cole aqui a nova API Key do Asaas: ');

    if (!newApiKey || newApiKey.trim() === '') {
      console.log('\n❌ Chave não fornecida. Operação cancelada.');
      rl.close();
      return;
    }

    // Perguntar sobre ambiente
    const environment = await question('\nAmbiente (production/sandbox) [sandbox]: ');
    const env = environment.trim().toLowerCase() === 'production' ? 'production' : 'sandbox';

    // Confirmar atualização
    console.log('\n📝 Resumo da atualização:');
    console.log('   - Nova API Key:', `${newApiKey.substring(0, 20)}...`);
    console.log('   - Ambiente:', env);
    console.log('');

    const confirm = await question('Confirma a atualização? (s/n): ');

    if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'sim') {
      console.log('\n❌ Operação cancelada pelo usuário.');
      rl.close();
      return;
    }

    // Atualizar no banco
    await prisma.apiIntegration.update({
      where: { id: integration.id },
      data: {
        apiKey: newApiKey.trim(),
        environment: env,
        isActive: true,
      },
    });

    console.log('\n✅ Chave API atualizada com sucesso!');
    console.log('   - ID da integração:', integration.id);
    console.log('   - Ambiente:', env);
    console.log('   - Status: Ativa');
    console.log('\n🎉 Agora você pode testar o checkout!');

    rl.close();
  } catch (error) {
    console.error('\n❌ Erro ao atualizar chave:', error);
    rl.close();
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateAsaasKey();
