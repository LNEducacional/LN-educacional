"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("./auth");
const prisma_1 = require("./prisma");
async function main() {
    // Create admin user
    const adminPassword = await (0, auth_1.hashPassword)('admin123');
    const admin = await prisma_1.prisma.user.upsert({
        where: { email: 'admin@lneducacional.com' },
        update: {},
        create: {
            email: 'admin@lneducacional.com',
            name: 'Administrador',
            password: adminPassword,
            role: 'ADMIN',
            verified: true,
        },
    });
    // Create student user
    const studentPassword = await (0, auth_1.hashPassword)('aluno123');
    const student = await prisma_1.prisma.user.upsert({
        where: { email: 'aluno@lneducacional.com' },
        update: {},
        create: {
            email: 'aluno@lneducacional.com',
            name: 'Aluno Teste',
            password: studentPassword,
            role: 'STUDENT',
            verified: true,
        },
    });
    // Create sample papers (COMMENTED OUT - use seed-data.ts for actual data)
    /*
    await prisma.paper.upsert({
      where: {
        // Use a composite unique constraint or find first and conditionally create
        id: (await prisma.paper.findFirst({
          where: { title: 'Metodologias Ágeis no Desenvolvimento de Software' }
        }))?.id || 'dummy-id-will-create-new'
      },
      update: {},
      create: {
        title: 'Metodologias Ágeis no Desenvolvimento de Software',
        description:
          'Estudo completo sobre implementação de metodologias ágeis em equipes de desenvolvimento.',
        paperType: 'ARTICLE',
        academicArea: 'ENGINEERING',
        price: 9900,
        pageCount: 45,
        authorName: 'Dr. João Silva',
        language: 'pt-BR',
        keywords: 'agile, scrum, desenvolvimento, software',
        fileUrl: 'https://example.com/papers/metodologias-ageis.pdf',
        thumbnailUrl: 'https://example.com/thumbnails/metodologias-ageis.jpg',
        isFree: false,
      },
    });
  
    await prisma.paper.upsert({
      where: {
        id: (await prisma.paper.findFirst({
          where: { title: 'Introdução à Psicologia Organizacional' }
        }))?.id || 'dummy-id-will-create-new-2'
      },
      update: {},
      create: {
        title: 'Introdução à Psicologia Organizacional',
        description: 'Material gratuito sobre conceitos básicos de psicologia organizacional.',
        paperType: 'ESSAY',
        academicArea: 'PSYCHOLOGY',
        price: 0,
        pageCount: 20,
        authorName: 'Dra. Maria Santos',
        language: 'pt-BR',
        keywords: 'psicologia, organizacional, recursos humanos',
        fileUrl: 'https://example.com/papers/psicologia-org.pdf',
        isFree: true,
      },
    });
    */
    // Create sample course (using upsert to prevent duplicates)
    await prisma_1.prisma.course.upsert({
        where: {
            id: (await prisma_1.prisma.course.findFirst({
                where: { title: 'JavaScript Moderno: Do Básico ao Avançado' }
            }))?.id || 'dummy-id-course'
        },
        update: {},
        create: {
            title: 'JavaScript Moderno: Do Básico ao Avançado',
            description: 'Aprenda JavaScript do zero com projetos práticos e conceitos avançados.',
            academicArea: 'ENGINEERING',
            instructorName: 'Carlos Developer',
            instructorBio: 'Desenvolvedor Full Stack com 10 anos de experiência.',
            price: 19900,
            duration: 480,
            thumbnailUrl: 'https://example.com/courses/javascript.jpg',
            videoUrl: 'https://example.com/courses/javascript-intro.mp4',
            status: 'ACTIVE',
        },
    });
    // Create sample ebook (using upsert to prevent duplicates)
    await prisma_1.prisma.ebook.upsert({
        where: {
            id: (await prisma_1.prisma.ebook.findFirst({
                where: { title: 'Guia Completo de Marketing Digital' }
            }))?.id || 'dummy-id-ebook'
        },
        update: {},
        create: {
            title: 'Guia Completo de Marketing Digital',
            description: 'Estratégias práticas para dominar o marketing digital em 2024.',
            academicArea: 'ADMINISTRATION',
            authorName: 'Laura Marketing',
            price: 14900,
            pageCount: 150,
            fileUrl: 'https://example.com/ebooks/marketing-digital.pdf',
            coverUrl: 'https://example.com/covers/marketing-digital.jpg',
        },
    });
    // Create sample blog post
    await prisma_1.prisma.blogPost.upsert({
        where: { slug: 'como-estudar-de-forma-eficiente' },
        update: {},
        create: {
            title: 'Como Estudar de Forma Eficiente',
            content: '# Como Estudar de Forma Eficiente\n\nDescubra técnicas comprovadas para melhorar seu aprendizado...',
            slug: 'como-estudar-de-forma-eficiente',
            excerpt: 'Descubra técnicas comprovadas para melhorar seu aprendizado e reter mais informações.',
            coverImageUrl: 'https://example.com/blog/estudar-eficiente.jpg',
            published: true,
            authorId: admin.id,
        },
    });
    // Create default legal documents
    await prisma_1.prisma.legalDocument.upsert({
        where: { type_active: { type: 'TERMS_OF_SERVICE', active: true } },
        update: {},
        create: {
            type: 'TERMS_OF_SERVICE',
            title: 'Termos de Serviço',
            content: `
        <h2>1. Informações Importantes</h2>
        <p>Este contrato estabelece os termos e condições para a prestação de serviços acadêmicos pela LN Educacional.</p>

        <h2>2. Partes Contratantes</h2>
        <p><strong>CONTRATADA:</strong> LN Educacional, empresa especializada em serviços acadêmicos.</p>
        <p><strong>CONTRATANTE:</strong> Pessoa física que solicita os serviços oferecidos.</p>

        <h2>3. Objeto do Contrato</h2>
        <p>A CONTRATADA compromete-se a prestar os seguintes serviços:</p>
        <ul>
          <li>Elaboração de trabalhos acadêmicos personalizados</li>
          <li>Revisão e formatação de textos acadêmicos</li>
          <li>Consultoria em metodologia científica</li>
          <li>E-books e materiais didáticos</li>
          <li>Cursos online e treinamentos</li>
        </ul>

        <h2>4. Direitos e Deveres</h2>
        <h3>Do CONTRATANTE:</h3>
        <ul>
          <li>Fornecer informações precisas e completas</li>
          <li>Efetuar o pagamento nos prazos estabelecidos</li>
          <li>Comunicar alterações ou dúvidas tempestivamente</li>
        </ul>

        <h3>Da CONTRATADA:</h3>
        <ul>
          <li>Entregar os serviços conforme especificações</li>
          <li>Manter confidencialidade das informações</li>
          <li>Fornecer suporte durante o processo</li>
        </ul>
      `,
            version: 'v1.0.0',
            active: true,
            publishedBy: admin.id,
        },
    });
    await prisma_1.prisma.legalDocument.upsert({
        where: { type_active: { type: 'PRIVACY_POLICY', active: true } },
        update: {},
        create: {
            type: 'PRIVACY_POLICY',
            title: 'Política de Privacidade',
            content: `
        <h2>1. Coleta de Informações</h2>
        <p>Coletamos informações quando você se registra em nosso site, faz um pedido ou preenche um formulário.</p>

        <h2>2. Uso das Informações</h2>
        <p>As informações coletadas são utilizadas para:</p>
        <ul>
          <li>Processar transações</li>
          <li>Melhorar nosso website</li>
          <li>Enviar emails periódicos</li>
          <li>Responder consultas e dúvidas</li>
        </ul>

        <h2>3. Proteção de Informações</h2>
        <p>Implementamos medidas de segurança apropriadas para proteger suas informações pessoais.</p>

        <h2>4. Compartilhamento de Informações</h2>
        <p>Não vendemos, trocamos ou transferimos suas informações pessoais para terceiros.</p>
      `,
            version: 'v1.0.0',
            active: true,
            publishedBy: admin.id,
        },
    });
    await prisma_1.prisma.legalDocument.upsert({
        where: { type_active: { type: 'LGPD_COMPLIANCE', active: true } },
        update: {},
        create: {
            type: 'LGPD_COMPLIANCE',
            title: 'Conformidade com a LGPD',
            content: `
        <h2>Lei Geral de Proteção de Dados (LGPD)</h2>
        <p>Em conformidade com a Lei 13.709/2018 (LGPD), informamos:</p>

        <h3>1. Finalidade do Tratamento</h3>
        <p>Seus dados são tratados para execução de contrato, legítimo interesse e cumprimento de obrigação legal.</p>

        <h3>2. Seus Direitos</h3>
        <ul>
          <li>Confirmação da existência de tratamento</li>
          <li>Acesso aos dados</li>
          <li>Correção de dados incompletos</li>
          <li>Anonimização, bloqueio ou eliminação</li>
          <li>Portabilidade dos dados</li>
        </ul>

        <h3>3. Contato do Encarregado</h3>
        <p>Para exercer seus direitos ou esclarecer dúvidas sobre tratamento de dados:</p>
        <p>Email: lgpd@lneducacional.com</p>
      `,
            version: 'v1.0.0',
            active: true,
            publishedBy: admin.id,
        },
    });
    // Create default message templates
    await prisma_1.prisma.messageTemplate.create({
        data: {
            name: 'Boas-vindas',
            subject: 'Bem-vindo à LN Educacional!',
            content: `
        <p>Olá {name},</p>
        <p>Obrigado por entrar em contato conosco!</p>
        <p>Recebemos sua mensagem sobre "<strong>{subject}</strong>" e nossa equipe analisará sua solicitação.</p>
        <p>Retornaremos em até 24 horas úteis.</p>
        <br>
        <p>Atenciosamente,<br>
        <strong>Equipe LN Educacional</strong><br>
        WhatsApp: (94) 98421-1357<br>
        Email: trabalhos.academicos.assessoria2@gmail.com</p>
      `,
            variables: ['name', 'email', 'subject', 'message'],
            category: 'AUTO_REPLY',
            createdBy: admin.id,
        },
    });
    await prisma_1.prisma.messageTemplate.create({
        data: {
            name: 'Resposta Padrão - Orçamento',
            subject: 'Re: {subject} - Orçamento Solicitado',
            content: `
        <p>Olá {name},</p>
        <p>Agradecemos seu interesse em nossos serviços!</p>
        <p>Com base em sua solicitação, preparamos uma proposta personalizada:</p>
        <ul>
          <li><strong>Tipo de trabalho:</strong> [ESPECIFICAR]</li>
          <li><strong>Número de páginas:</strong> [ESPECIFICAR]</li>
          <li><strong>Prazo de entrega:</strong> [ESPECIFICAR]</li>
          <li><strong>Valor:</strong> R$ [VALOR]</li>
        </ul>
        <p>Para dar prosseguimento, confirme seu interesse respondendo este email.</p>
        <br>
        <p>Atenciosamente,<br>
        <strong>Equipe LN Educacional</strong></p>
      `,
            variables: ['name', 'email', 'subject'],
            category: 'QUOTE',
            createdBy: admin.id,
        },
    });
    await prisma_1.prisma.messageTemplate.create({
        data: {
            name: 'Informações Gerais',
            subject: 'Re: {subject} - Informações Solicitadas',
            content: `
        <p>Olá {name},</p>
        <p>Obrigado por sua mensagem!</p>
        <p>Trabalhamos com os seguintes serviços:</p>
        <ul>
          <li>Trabalhos acadêmicos personalizados (artigos, TCCs, dissertações)</li>
          <li>Revisão e formatação de textos</li>
          <li>Cursos online especializados</li>
          <li>E-books e materiais didáticos</li>
        </ul>
        <p><strong>Formas de pagamento:</strong> PIX (5% desconto), cartão (até 12x), boleto</p>
        <p><strong>Prazos:</strong> Artigos 3-5 dias, TCCs 15-30 dias</p>
        <p>Para orçamento personalizado, envie mais detalhes sobre sua necessidade.</p>
        <br>
        <p>Atenciosamente,<br>
        <strong>Equipe LN Educacional</strong></p>
      `,
            variables: ['name', 'subject'],
            category: 'INFO',
            createdBy: admin.id,
        },
    });
    console.log({
        users: { admin: admin.email, student: student.email },
        papers: 2,
        courses: 1,
        ebooks: 1,
        blogPosts: 1,
        legalDocuments: 3,
        messageTemplates: 3,
    });
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map