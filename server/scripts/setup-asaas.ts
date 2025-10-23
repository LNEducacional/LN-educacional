import { prisma } from '../src/prisma';

async function setupAsaas() {
  try {
    console.log('🔧 Configurando integração Asaas...');

    // Verificar se já existe
    const existing = await prisma.apiIntegration.findFirst({
      where: { name: 'asaas' },
    });

    if (existing) {
      console.log('✅ Integração Asaas já existe:', existing.id);
      console.log('   - API Key:', existing.apiKey ? `${existing.apiKey.substring(0, 10)}...` : 'não configurada');
      console.log('   - Ambiente:', existing.environment);
      console.log('   - Ativa:', existing.isActive);

      // Atualizar para ativo se necessário
      if (!existing.isActive) {
        await prisma.apiIntegration.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
        console.log('✅ Integração ativada');
      }
      return;
    }

    // Criar nova integração (sandbox para testes)
    const integration = await prisma.apiIntegration.create({
      data: {
        name: 'asaas',
        displayName: 'Asaas Pagamentos',
        apiKey: process.env.ASAAS_API_KEY || '$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAwNDM3MDA6OiRhYWNoX2NiNWQ4MzM4LTEyYTEtNGRjMy05YjkxLWIzY2UzMDczMTNkZA==', // Chave sandbox de exemplo
        environment: 'sandbox',
        isActive: true,
        metadata: {
          webhookUrl: `${process.env.API_URL || 'https://lneducacional.com.br/api'}/webhooks/asaas`,
        },
      },
    });

    console.log('✅ Integração Asaas criada com sucesso!');
    console.log('   - ID:', integration.id);
    console.log('   - Ambiente:', integration.environment);
    console.log('   - Webhook:', integration.metadata);
    console.log('');
    console.log('⚠️  IMPORTANTE:');
    console.log('   1. Esta é uma chave de SANDBOX para testes');
    console.log('   2. Para produção, acesse: https://www.asaas.com');
    console.log('   3. Crie uma conta e obtenha sua API Key em "Integrações"');
    console.log('   4. Configure o webhook em: Configurações > Webhooks');
    console.log(`   5. URL do webhook: ${(integration.metadata as any).webhookUrl}`);
    console.log('');
    console.log('📚 Documentação: https://docs.asaas.com');
  } catch (error) {
    console.error('❌ Erro ao configurar Asaas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupAsaas();
