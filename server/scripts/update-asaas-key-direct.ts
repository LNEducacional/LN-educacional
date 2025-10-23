import { prisma } from '../src/prisma';

async function updateAsaasKeyDirect() {
  try {
    console.log('🔧 Atualização de Chave API - Asaas\n');

    // Obter chave dos argumentos
    const newApiKey = process.argv[2];
    const environment = process.argv[3] || 'sandbox';

    if (!newApiKey || newApiKey.trim() === '') {
      console.log('❌ Uso incorreto do script.');
      console.log('\n📋 Como usar:');
      console.log('   npx tsx scripts/update-asaas-key-direct.ts "SUA_API_KEY_AQUI" [production|sandbox]');
      console.log('\n💡 Exemplos:');
      console.log('   npx tsx scripts/update-asaas-key-direct.ts "$aact_..." sandbox');
      console.log('   npx tsx scripts/update-asaas-key-direct.ts "$aact_..." production');
      console.log('\n📍 Para obter a chave válida:');
      console.log('   1. Acesse: https://lneducacional.com.br/admin/integracoes');
      console.log('   2. Localize o card "Asaas Pagamentos"');
      console.log('   3. Clique no ícone de olho para visualizar a API Key');
      console.log('   4. Copie a chave completa e use no comando acima\n');
      return;
    }

    // Buscar integração atual
    const integration = await prisma.apiIntegration.findFirst({
      where: { name: 'asaas' },
    });

    if (!integration) {
      console.log('❌ Nenhuma integração Asaas encontrada no banco.');
      console.log('💡 Execute o script setup-asaas.ts primeiro para criar a integração.\n');
      return;
    }

    console.log('✅ Integração atual encontrada:');
    console.log('   - ID:', integration.id);
    console.log('   - Display Name:', integration.displayName);
    console.log('   - API Key Atual:', integration.apiKey ? `${integration.apiKey.substring(0, 20)}...` : 'não configurada');
    console.log('   - Ambiente Atual:', integration.environment);
    console.log('\n');

    // Validar ambiente
    const env = environment.toLowerCase() === 'production' ? 'production' : 'sandbox';

    console.log('📝 Atualizando com:');
    console.log('   - Nova API Key:', `${newApiKey.substring(0, 20)}...`);
    console.log('   - Novo Ambiente:', env);
    console.log('');

    // Atualizar no banco
    const updated = await prisma.apiIntegration.update({
      where: { id: integration.id },
      data: {
        apiKey: newApiKey.trim(),
        environment: env,
        isActive: true,
      },
    });

    console.log('✅ Chave API atualizada com sucesso!');
    console.log('   - ID da integração:', updated.id);
    console.log('   - Ambiente:', updated.environment);
    console.log('   - Status: Ativa');
    console.log('\n🎉 Agora você pode testar o checkout!\n');
  } catch (error) {
    console.error('\n❌ Erro ao atualizar chave:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateAsaasKeyDirect();
