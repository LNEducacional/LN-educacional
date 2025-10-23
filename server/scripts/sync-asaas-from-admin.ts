import { prisma } from '../src/prisma';

/**
 * Este script sincroniza a chave do Asaas do admin para o registro usado pelo checkout.
 *
 * Problema: O setup-asaas.ts criou um registro com chave inválida.
 * Solução: Verificar se existe outro registro com name diferente que tenha a chave válida.
 */
async function syncAsaasFromAdmin() {
  try {
    console.log('🔍 Sincronizando chave Asaas do admin...\n');

    // Buscar TODAS as integrações para verificar se há duplicatas
    const allIntegrations = await prisma.apiIntegration.findMany({
      where: {
        OR: [
          { name: 'asaas' },
          { name: { contains: 'asaas', mode: 'insensitive' } },
          { displayName: { contains: 'Asaas', mode: 'insensitive' } },
        ],
      },
    });

    console.log(`📊 Encontradas ${allIntegrations.length} integração(ões) relacionadas ao Asaas:\n`);

    allIntegrations.forEach((int, index) => {
      console.log(`${index + 1}. ID: ${int.id}`);
      console.log(`   - Name: ${int.name}`);
      console.log(`   - Display Name: ${int.displayName}`);
      console.log(`   - API Key: ${int.apiKey ? `${int.apiKey.substring(0, 30)}...` : 'não configurada'}`);
      console.log(`   - Ambiente: ${int.environment}`);
      console.log(`   - Ativa: ${int.isActive}`);
      console.log(`   - Criada em: ${int.createdAt}`);
      console.log('');
    });

    // Verificar se existe uma chave válida (diferente da chave de exemplo)
    const invalidKey = '$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAwNDM3MDA6OiRhYWNoX2NiNWQ4MzM4LTEyYTEtNGRjMy05YjkxLWIzY2UzMDczMTNkZA==';

    const validIntegration = allIntegrations.find(
      int => int.apiKey && int.apiKey !== invalidKey && int.apiKey.trim().length > 20
    );

    const currentAsaas = allIntegrations.find(int => int.name === 'asaas');

    if (!currentAsaas) {
      console.log('❌ Nenhuma integração com name="asaas" encontrada.');
      console.log('💡 Execute o script setup-asaas.ts primeiro.\n');
      return;
    }

    if (!validIntegration) {
      console.log('⚠️  Nenhuma chave válida encontrada nas integrações.');
      console.log('');
      console.log('📋 Para resolver:');
      console.log('   1. Acesse: https://lneducacional.com.br/admin/integracoes');
      console.log('   2. Se já existe uma integração Asaas configurada lá, delete-a e crie novamente');
      console.log('   3. Ou use o script update-asaas-key-direct.ts passando sua chave válida');
      console.log('');
      console.log('💡 Comando:');
      console.log('   npx tsx scripts/update-asaas-key-direct.ts "SUA_CHAVE_AQUI" sandbox\n');
      return;
    }

    // Se encontrou uma chave válida, copiar para o registro principal
    if (validIntegration.id !== currentAsaas.id) {
      console.log(`✅ Chave válida encontrada na integração ID: ${validIntegration.id}`);
      console.log('🔄 Copiando para a integração principal...\n');

      await prisma.apiIntegration.update({
        where: { id: currentAsaas.id },
        data: {
          apiKey: validIntegration.apiKey,
          environment: validIntegration.environment,
          isActive: true,
        },
      });

      console.log('✅ Chave sincronizada com sucesso!');
      console.log(`   - Chave copiada de: ${validIntegration.displayName} (${validIntegration.id})`);
      console.log(`   - Para integração: ${currentAsaas.displayName} (${currentAsaas.id})`);
      console.log(`   - Ambiente: ${validIntegration.environment}`);
      console.log('\n🎉 Agora o checkout deve funcionar!\n');
    } else {
      console.log('✅ A integração principal já possui uma chave válida!');
      console.log('');
      console.log('⚠️  Se o erro persiste, pode ser:');
      console.log('   1. Chave expirada - verifique no painel Asaas');
      console.log('   2. Ambiente incorreto - verifique se está usando sandbox/production correto');
      console.log('   3. Conta Asaas com restrições\n');
    }

  } catch (error) {
    console.error('\n❌ Erro ao sincronizar:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

syncAsaasFromAdmin();
