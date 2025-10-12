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
exports.AutoReplyService = exports.autoReplyService = void 0;
class AutoReplyService {
    config;
    templates = new Map();
    constructor(config) {
        this.config = config;
        this.initializeDefaultTemplates();
    }
    async loadTemplatesFromDatabase() {
        try {
            const { prisma } = await Promise.resolve().then(() => __importStar(require('../prisma.js')));
            const dbTemplates = await prisma.messageTemplate.findMany({
                where: { category: 'AUTO_REPLY' }
            });
            dbTemplates.forEach(template => {
                this.templates.set(template.id, {
                    id: template.id,
                    name: template.name,
                    subject: template.subject,
                    content: template.content,
                    variables: template.variables,
                    keywords: this.extractKeywords(template.content),
                    category: template.category || undefined,
                    enabled: true,
                });
            });
            console.log(`Loaded ${dbTemplates.length} auto-reply templates from database`);
        }
        catch (error) {
            console.error('Failed to load templates from database:', error);
            // Continue with default templates
        }
    }
    async processAutoReply(message) {
        if (!this.config.enabled) {
            return false;
        }
        try {
            const template = await this.selectTemplate(message);
            if (!template) {
                console.log(`No auto-reply template found for message ${message.id}`);
                return false;
            }
            // Add delay to make it feel more natural
            if (this.config.sendDelay > 0) {
                await new Promise(resolve => setTimeout(resolve, this.config.sendDelay));
            }
            await this.sendAutoReply(message, template);
            return true;
        }
        catch (error) {
            console.error('Failed to process auto-reply:', error);
            return false;
        }
    }
    async selectTemplate(message) {
        // Try keyword matching first if enabled
        if (this.config.keywordMatching) {
            const keywordTemplate = this.findTemplateByKeywords(message);
            if (keywordTemplate) {
                return keywordTemplate;
            }
        }
        // Try category matching
        if (message.category) {
            const categoryTemplate = this.findTemplateByCategory(message.category);
            if (categoryTemplate) {
                return categoryTemplate;
            }
        }
        // Fall back to default template
        if (this.config.defaultTemplateId) {
            return this.templates.get(this.config.defaultTemplateId) || null;
        }
        // Use general template as last resort
        return this.templates.get('general') || null;
    }
    findTemplateByKeywords(message) {
        const messageText = `${message.subject} ${message.message}`.toLowerCase();
        for (const template of this.templates.values()) {
            if (!template.enabled || !template.keywords)
                continue;
            const hasKeyword = template.keywords.some(keyword => messageText.includes(keyword.toLowerCase()));
            if (hasKeyword) {
                return template;
            }
        }
        return null;
    }
    findTemplateByCategory(category) {
        for (const template of this.templates.values()) {
            if (template.enabled && template.category === category) {
                return template;
            }
        }
        return null;
    }
    async sendAutoReply(message, template) {
        const { emailService } = await Promise.resolve().then(() => __importStar(require('./email.service.js')));
        const processedContent = this.processTemplate(template.content, message);
        const processedSubject = this.processTemplate(template.subject, message);
        await emailService.sendEmail({
            to: message.email,
            subject: processedSubject,
            html: this.generateAutoReplyHTML(processedContent, message),
            text: processedContent,
        });
        console.log(`Auto-reply sent to ${message.email} using template "${template.name}"`);
    }
    processTemplate(content, message) {
        let processed = content;
        // Replace variables with actual values
        processed = processed.replace(/{name}/g, message.name);
        processed = processed.replace(/{email}/g, message.email);
        processed = processed.replace(/{subject}/g, message.subject);
        processed = processed.replace(/{phone}/g, message.phone || 'Não informado');
        processed = processed.replace(/{date}/g, new Date().toLocaleDateString('pt-BR'));
        processed = processed.replace(/{time}/g, new Date().toLocaleTimeString('pt-BR'));
        return processed;
    }
    generateAutoReplyHTML(content, message) {
        return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #007bff; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">LN Educacional</h1>
          <p style="color: white; margin: 5px 0 0 0;">Confirmação de Recebimento</p>
        </div>

        <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6;">
          <div style="background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin-bottom: 20px;">
            <h3 style="color: #155724; margin: 0 0 10px 0;">✅ Mensagem Recebida com Sucesso!</h3>
            <p style="color: #155724; margin: 0;">
              Olá ${message.name}, recebemos sua mensagem e entraremos em contato em breve.
            </p>
          </div>

          <div style="margin: 20px 0;">
            ${content.replace(/\n/g, '<br>')}
          </div>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #dee2e6;">

          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px;">
            <h4 style="margin: 0 0 10px 0; color: #6c757d;">📩 Resumo da sua mensagem:</h4>
            <p style="margin: 0; color: #6c757d;"><strong>Assunto:</strong> ${message.subject}</p>
            <p style="margin: 5px 0 0 0; color: #6c757d;"><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>💡 Dica:</strong> Este é um email automático de confirmação.
              Nossa equipe analisará sua mensagem e retornará o contato em até 24 horas.
            </p>
          </div>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; color: #6c757d; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">
            <strong>LN Educacional</strong><br>
            Sua plataforma de educação e conhecimento
          </p>
          <p style="margin: 0; font-size: 12px;">
            📧 contato@lneducacional.com.br |
            🌐 <a href="${process.env.FRONTEND_URL || 'https://lneducacional.com.br'}" style="color: #007bff;">lneducacional.com.br</a>
          </p>
        </div>
      </div>
    `;
    }
    extractKeywords(content) {
        // Simple keyword extraction - can be enhanced with NLP
        const commonKeywords = [
            'preço', 'valor', 'custo', 'pagamento',
            'prazo', 'entrega', 'tempo',
            'trabalho', 'tcc', 'monografia', 'artigo',
            'curso', 'certificado',
            'dúvida', 'informação', 'ajuda',
            'urgente', 'urgência',
            'desconto', 'promoção',
        ];
        return commonKeywords.filter(keyword => content.toLowerCase().includes(keyword));
    }
    initializeDefaultTemplates() {
        // General auto-reply template
        this.templates.set('general', {
            id: 'general',
            name: 'Resposta Geral',
            subject: 'Recebemos sua mensagem - {subject}',
            content: `Olá {name},

Obrigado por entrar em contato conosco!

Recebemos sua mensagem sobre "{subject}" e nossa equipe analisará seu pedido com atenção.

Retornaremos o contato em até 24 horas durante dias úteis.

Se for urgente, você também pode nos contatar via WhatsApp.

Atenciosamente,
Equipe LN Educacional`,
            variables: ['name', 'email', 'subject', 'phone', 'date', 'time'],
            enabled: true,
        });
        // Pricing inquiry template
        this.templates.set('pricing', {
            id: 'pricing',
            name: 'Consulta de Preços',
            subject: 'Informações sobre preços - {subject}',
            content: `Olá {name},

Obrigado pelo seu interesse em nossos serviços!

Recebemos sua consulta sobre preços e nossa equipe comercial preparará um orçamento personalizado para você.

Nossos preços variam de acordo com:
• Tipo de trabalho acadêmico
• Número de páginas
• Prazo de entrega
• Complexidade do tema

Retornaremos com uma proposta detalhada em até 2 horas durante horário comercial.

Atenciosamente,
Equipe Comercial LN Educacional`,
            variables: ['name', 'email', 'subject'],
            keywords: ['preço', 'valor', 'custo', 'pagamento', 'orçamento'],
            category: 'PRICING',
            enabled: true,
        });
        // Urgent inquiry template
        this.templates.set('urgent', {
            id: 'urgent',
            name: 'Consulta Urgente',
            subject: 'URGENTE - Recebemos sua mensagem',
            content: `Olá {name},

Identificamos que sua solicitação tem caráter urgente.

Nossa equipe de plantão foi notificada e entrará em contato com você em até 1 hora.

Para agilizar ainda mais, você pode nos chamar diretamente no WhatsApp.

Estamos aqui para ajudar!

Equipe LN Educacional`,
            variables: ['name', 'email', 'subject'],
            keywords: ['urgente', 'urgência', 'pressa', 'rápido'],
            category: 'URGENT',
            enabled: true,
        });
        // Course inquiry template
        this.templates.set('courses', {
            id: 'courses',
            name: 'Consulta sobre Cursos',
            subject: 'Informações sobre nossos cursos',
            content: `Olá {name},

Que ótimo saber do seu interesse em nossos cursos!

Oferecemos diversos cursos online nas áreas de:
• Administração
• Direito
• Educação
• Psicologia
• E muito mais!

Nossa equipe educacional entrará em contato para apresentar as opções mais adequadas ao seu perfil.

Esperamos você em nossa plataforma!

Equipe Educacional LN`,
            variables: ['name', 'email', 'subject'],
            keywords: ['curso', 'certificado', 'aprender', 'estudar'],
            category: 'COURSES',
            enabled: true,
        });
        console.log(`Initialized ${this.templates.size} default auto-reply templates`);
    }
    // Admin methods for template management
    async addTemplate(template) {
        const id = `custom_${Date.now()}`;
        this.templates.set(id, { ...template, id });
        return id;
    }
    async updateTemplate(id, updates) {
        const template = this.templates.get(id);
        if (!template)
            return false;
        this.templates.set(id, { ...template, ...updates });
        return true;
    }
    async deleteTemplate(id) {
        return this.templates.delete(id);
    }
    getTemplates() {
        return Array.from(this.templates.values());
    }
    getTemplate(id) {
        return this.templates.get(id);
    }
    async updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.AutoReplyService = AutoReplyService;
// Create and export default instance
const autoReplyConfig = {
    enabled: process.env.AUTO_REPLY_ENABLED !== 'false',
    defaultTemplateId: 'general',
    keywordMatching: true,
    sendDelay: parseInt(process.env.AUTO_REPLY_DELAY || '2000'), // 2 seconds default
};
exports.autoReplyService = new AutoReplyService(autoReplyConfig);
//# sourceMappingURL=auto-reply.service.js.map