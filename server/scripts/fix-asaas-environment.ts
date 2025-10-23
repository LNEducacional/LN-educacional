import { prisma } from '../src/prisma';

async function fixAsaasEnvironment() {
  try {
    console.log('🔧 Corrigindo ambiente da integração Asaas...\n');

    const integration = await prisma.apiIntegration.findFirst({
      where: { name: 'asaas' },
    });

    if (!integration) {
      console.log('❌ Nenhuma integração Asaas encontrada.');
      return;
    }

    console.log('✅ Integração atual:');
    console.log('   - ID:', integration.id);
    console.log('   - API Key:', integration.apiKey ? `${integration.apiKey.substring(0, 30)}...` : 'não configurada');
    console.log('   - Ambiente Atual:', integration.environment);
    console.log('');

    // Detectar ambiente pela chave
    let detectedEnv: 'production' | 'sandbox' = 'sandbox';

    if (integration.apiKey) {
      // Chaves de produção começam com $aact_prod_ ou $aact_YTU (em base64)
      // Chaves de sandbox começam com $aact_sand_ ou outro padrão
      if (
        integration.apiKey.includes('_prod_') ||
        integration.apiKey.startsWith('$aact_prod_') ||
        (!integration.apiKey.includes('sandbox') && !integration.apiKey.includes('_sand_'))
      ) {
        detectedEnv = 'production';
      }
    }

    console.log('🔍 Ambiente detectado pela chave:', detectedEnv);

    if (integration.environment === detectedEnv) {
      console.log('✅ Ambiente já está correto!');
      console.log('');
      console.log('⚠️  Se o erro persiste, verifique:');
      console.log('   1. Se a chave está correta no painel Asaas');
      console.log('   2. Se a chave não expirou');
      console.log('   3. Se a conta Asaas está ativa\n');
      return;
    }

    // Atualizar ambiente
    console.log(`🔄 Atualizando de "${integration.environment}" para "${detectedEnv}"...\n`);

    const updated = await prisma.apiIntegration.update({
      where: { id: integration.id },
      data: {
        environment: detectedEnv,
      },
    });

    console.log('✅ Ambiente atualizado com sucesso!');
    console.log('   - ID:', updated.id);
    console.log('   - Novo Ambiente:', updated.environment);
    console.log('');
    console.log('🎉 Reinicie o servidor com: pm2 reload ln-educacional-server\n');

  } catch (error) {
    console.error('\n❌ Erro ao corrigir ambiente:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAsaasEnvironment();
