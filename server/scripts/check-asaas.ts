import { prisma } from '../src/prisma';

async function checkAsaas() {
  try {
    console.log('🔍 Verificando integração Asaas atual...\n');

    const integration = await prisma.apiIntegration.findFirst({
      where: { name: 'asaas' },
    });

    if (!integration) {
      console.log('❌ Nenhuma integração Asaas encontrada no banco.');
      return;
    }

    console.log('✅ Integração encontrada:');
    console.log('   - ID:', integration.id);
    console.log('   - Display Name:', integration.displayName);
    console.log('   - API Key:', integration.apiKey ? `${integration.apiKey.substring(0, 20)}...` : 'não configurada');
    console.log('   - Ambiente:', integration.environment);
    console.log('   - Ativa:', integration.isActive);
    console.log('   - Metadata:', JSON.stringify(integration.metadata, null, 2));
    console.log('\n');
  } catch (error) {
    console.error('❌ Erro ao verificar Asaas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkAsaas();
