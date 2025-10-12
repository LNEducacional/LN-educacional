interface WebhookPayload {
  content: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
    timestamp?: string;
  }>;
}

interface NotificationConfig {
  adminEmail: string;
  webhookUrl?: string;
  realtimeEnabled: boolean;
}

class NotificationService {
  private config: NotificationConfig;
  private io?: any; // Socket.io instance

  constructor(config: NotificationConfig) {
    this.config = config;
  }

  setSocketIO(io: any) {
    this.io = io;
  }

  async notifyNewMessage(message: any): Promise<void> {
    try {
      // Send email notification to admin
      await this.sendEmailNotification(message);

      // Send webhook notification (Discord/Slack)
      if (this.config.webhookUrl) {
        await this.sendWebhookNotification(message);
      }

      // Send real-time notification via WebSocket
      if (this.config.realtimeEnabled && this.io) {
        this.sendRealtimeNotification(message);
      }

      console.log(`Notifications sent for message ${message.id}`);
    } catch (error) {
      console.error('Failed to send notifications:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  async notifyMessageReply(message: any, replyContent: string): Promise<void> {
    try {
      // Send email notification to original sender
      const { emailService } = await import('./email.service.js');

      await emailService.sendEmail({
        to: message.email,
        subject: `Re: ${message.subject}`,
        html: this.generateReplyEmailTemplate(message, replyContent),
        replyTo: this.config.adminEmail,
      });

      console.log(`Reply notification sent to ${message.email}`);
    } catch (error) {
      console.error('Failed to send reply notification:', error);
      throw error; // Throw here because reply sending is critical
    }
  }

  async notifyLegalDocumentUpdate(document: any): Promise<void> {
    try {
      // Real-time notification for admin interface
      if (this.config.realtimeEnabled && this.io) {
        this.io.emit('legal-document-updated', {
          type: document.type,
          title: document.title,
          version: document.version,
          updatedAt: new Date().toISOString(),
        });
      }

      console.log(`Legal document update notification sent for ${document.type}`);
    } catch (error) {
      console.error('Failed to send legal document update notification:', error);
    }
  }

  // Collaborator notification methods

  async notifyApplicationReceived(applicationId: string): Promise<void> {
    try {
      const { prisma } = await import('../prisma');

      const application = await prisma.collaboratorApplication.findUnique({
        where: { id: applicationId },
        include: { user: true }
      });

      if (!application) return;

      // Send confirmation email to applicant
      const { emailService } = await import('./email.service.js');

      await emailService.sendEmail({
        to: application.email,
        subject: 'Aplicação Recebida - LN Educacional',
        html: this.generateApplicationReceivedTemplate(application),
      });

      // Notify admins
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' }
      });

      for (const admin of admins) {
        await emailService.sendEmail({
          to: admin.email,
          subject: 'Nova Aplicação de Colaborador',
          html: this.generateNewApplicationAdminTemplate(admin, application),
        });
      }

      console.log(`Application received notifications sent for ${application.fullName}`);
    } catch (error) {
      console.error('Failed to send application received notifications:', error);
    }
  }

  async notifyStageChange(applicationId: string, newStage: string): Promise<void> {
    try {
      const { prisma } = await import('../prisma');

      const application = await prisma.collaboratorApplication.findUnique({
        where: { id: applicationId },
        include: { user: true }
      });

      if (!application) return;

      const { emailService } = await import('./email.service.js');

      await emailService.sendEmail({
        to: application.email,
        subject: 'Atualização da sua Aplicação - LN Educacional',
        html: this.generateStageUpdateTemplate(application, newStage),
      });

      console.log(`Stage change notification sent to ${application.fullName} - ${newStage}`);
    } catch (error) {
      console.error('Failed to send stage change notification:', error);
    }
  }

  async notifyInterview(interviewId: string): Promise<void> {
    try {
      const { prisma } = await import('../prisma');

      const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
        include: {
          application: true,
          interviewer: true
        }
      });

      if (!interview) return;

      const { emailService } = await import('./email.service.js');

      // Email for candidate
      await emailService.sendEmail({
        to: interview.application.email,
        subject: 'Entrevista Agendada - LN Educacional',
        html: this.generateInterviewCandidateTemplate(interview),
      });

      // Email for interviewer
      await emailService.sendEmail({
        to: interview.interviewer.email,
        subject: 'Entrevista Agendada - Candidato',
        html: this.generateInterviewInterviewerTemplate(interview),
      });

      console.log(`Interview notifications sent for ${interview.application.fullName}`);
    } catch (error) {
      console.error('Failed to send interview notifications:', error);
    }
  }

  async notifyEvaluation(evaluationId: string): Promise<void> {
    try {
      const { prisma } = await import('../prisma');

      const evaluation = await prisma.evaluation.findUnique({
        where: { id: evaluationId },
        include: {
          application: true,
          evaluator: true
        }
      });

      if (!evaluation) return;

      // For now, only log evaluation notifications
      // In production, this could notify relevant stakeholders
      console.log(`Evaluation completed for ${evaluation.application.fullName} by ${evaluation.evaluator.name}`);
      console.log(`Score: ${evaluation.totalScore}/10 - Recommendation: ${evaluation.recommendation}`);
    } catch (error) {
      console.error('Failed to send evaluation notification:', error);
    }
  }

  private async sendEmailNotification(message: any): Promise<void> {
    const { emailService } = await import('./email.service.js');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #dc3545; margin: 0;">🚨 Nova Mensagem de Contato</h2>
        </div>

        <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
          <h3 style="color: #495057; margin-top: 0;">Detalhes da Mensagem</h3>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Nome:</td>
              <td style="padding: 8px 0;">${message.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Email:</td>
              <td style="padding: 8px 0;">${message.email}</td>
            </tr>
            ${message.phone ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Telefone:</td>
              <td style="padding: 8px 0;">${message.phone}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Assunto:</td>
              <td style="padding: 8px 0;">${message.subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Prioridade:</td>
              <td style="padding: 8px 0;">
                <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;
                  ${this.getPriorityStyle(message.priority)}">
                  ${this.getPriorityLabel(message.priority)}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Data:</td>
              <td style="padding: 8px 0;">${new Date(message.createdAt).toLocaleString('pt-BR')}</td>
            </tr>
          </table>

          <div style="margin-top: 20px;">
            <h4 style="color: #495057; margin-bottom: 10px;">Mensagem:</h4>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; white-space: pre-wrap;">
              ${message.message}
            </div>
          </div>

          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/messages"
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none;
                      border-radius: 6px; display: inline-block; font-weight: bold;">
              Ver no Painel Admin
            </a>
          </div>
        </div>

        <div style="margin-top: 20px; text-align: center; color: #6c757d; font-size: 14px;">
          <p>LN Educacional - Sistema de Notificações</p>
        </div>
      </div>
    `;

    await emailService.sendEmail({
      to: this.config.adminEmail,
      subject: `Nova mensagem: ${message.subject}`,
      html,
    });
  }

  private async sendWebhookNotification(message: any): Promise<void> {
    if (!this.config.webhookUrl) return;

    const payload: WebhookPayload = {
      content: `🚨 **Nova mensagem de contato recebida!**`,
      embeds: [
        {
          title: message.subject,
          description: message.message.length > 200
            ? `${message.message.substring(0, 200)}...`
            : message.message,
          color: this.getPriorityColor(message.priority),
          fields: [
            {
              name: '👤 Nome',
              value: message.name,
              inline: true,
            },
            {
              name: '📧 Email',
              value: message.email,
              inline: true,
            },
            {
              name: '⚡ Prioridade',
              value: this.getPriorityLabel(message.priority),
              inline: true,
            },
            ...(message.phone ? [{
              name: '📞 Telefone',
              value: message.phone,
              inline: true,
            }] : []),
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  }

  private sendRealtimeNotification(message: any): void {
    if (!this.io) return;

    this.io.emit('new-message', {
      id: message.id,
      name: message.name,
      email: message.email,
      subject: message.subject,
      priority: message.priority,
      createdAt: message.createdAt,
    });
  }

  private generateApplicationReceivedTemplate(application: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #007bff; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">LN Educacional</h1>
          <p style="color: white; margin: 5px 0 0 0;">Aplicação Recebida</p>
        </div>

        <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6;">
          <p>Olá ${application.fullName},</p>

          <p>Recebemos sua aplicação para se tornar colaborador da LN Educacional! 🎉</p>

          <div style="background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #155724;">✅ Aplicação Confirmada</h4>
            <p style="margin: 0; color: #155724;">Sua aplicação foi recebida com sucesso e está sendo analisada por nossa equipe.</p>
          </div>

          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0;">Próximos Passos:</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Nossa equipe irá analisar sua aplicação</li>
              <li>Caso aprovado na triagem inicial, entraremos em contato para uma entrevista</li>
              <li>Você pode acompanhar o status da sua aplicação a qualquer momento</li>
            </ul>
          </div>

          <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>ID da Aplicação:</strong> ${application.id}<br>
              <strong>Área:</strong> ${application.area}<br>
              <strong>Data:</strong> ${new Date(application.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <p>Agradecemos seu interesse em fazer parte da nossa equipe!</p>

          <p>
            Atenciosamente,<br>
            <strong>Equipe LN Educacional</strong>
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; color: #6c757d; font-size: 14px;">
          <p>LN Educacional - Sua plataforma de educação e conhecimento</p>
        </div>
      </div>
    `;
  }

  private generateNewApplicationAdminTemplate(admin: any, application: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #28a745; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🚨 Nova Aplicação de Colaborador</h1>
        </div>

        <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6;">
          <p>Olá ${admin.name},</p>

          <p>Uma nova aplicação para colaborador foi recebida!</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Nome:</td>
              <td style="padding: 8px 0;">${application.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Email:</td>
              <td style="padding: 8px 0;">${application.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Telefone:</td>
              <td style="padding: 8px 0;">${application.phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Área:</td>
              <td style="padding: 8px 0;">${application.area}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Disponibilidade:</td>
              <td style="padding: 8px 0;">${application.availability}</td>
            </tr>
          </table>

          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0;">Experiência:</h4>
            <p style="margin: 0; white-space: pre-wrap;">${application.experience}</p>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/collaborators"
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none;
                      border-radius: 6px; display: inline-block; font-weight: bold;">
              Ver no Painel Admin
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generateStageUpdateTemplate(application: any, newStage: string): string {
    const stageLabels = {
      RECEIVED: 'Aplicação Recebida',
      SCREENING: 'Em Triagem',
      INTERVIEW: 'Entrevista Agendada',
      TECHNICAL_TEST: 'Teste Técnico',
      FINAL_REVIEW: 'Revisão Final',
      OFFER: 'Proposta Enviada',
      HIRED: 'Contratado'
    };

    const stageLabel = stageLabels[newStage as keyof typeof stageLabels] || newStage;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #17a2b8; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">LN Educacional</h1>
          <p style="color: white; margin: 5px 0 0 0;">Atualização da Aplicação</p>
        </div>

        <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6;">
          <p>Olá ${application.fullName},</p>

          <p>Temos uma atualização sobre sua aplicação para colaborador!</p>

          <div style="background-color: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0c5460;">📋 Nova Etapa: ${stageLabel}</h4>
            <p style="margin: 0; color: #0c5460;">Sua aplicação avançou para a próxima etapa do processo seletivo.</p>
          </div>

          <p>Continue acompanhando o progresso da sua aplicação. Entraremos em contato caso sejam necessárias ações adicionais de sua parte.</p>

          <p>
            Atenciosamente,<br>
            <strong>Equipe LN Educacional</strong>
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; color: #6c757d; font-size: 14px;">
          <p>LN Educacional - Sua plataforma de educação e conhecimento</p>
        </div>
      </div>
    `;
  }

  private generateInterviewCandidateTemplate(interview: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #ffc107; padding: 20px; text-align: center;">
          <h1 style="color: #212529; margin: 0;">📅 Entrevista Agendada</h1>
          <p style="color: #212529; margin: 5px 0 0 0;">LN Educacional</p>
        </div>

        <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6;">
          <p>Olá ${interview.application.fullName},</p>

          <p>Sua entrevista foi agendada! 🎉</p>

          <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <h4 style="margin: 0 0 15px 0; color: #856404;">Detalhes da Entrevista:</h4>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 5px 0; font-weight: bold;">Tipo:</td>
                <td style="padding: 5px 0;">${interview.type}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold;">Data:</td>
                <td style="padding: 5px 0;">${new Date(interview.scheduledAt).toLocaleDateString('pt-BR')}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold;">Horário:</td>
                <td style="padding: 5px 0;">${new Date(interview.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold;">Duração:</td>
                <td style="padding: 5px 0;">${interview.duration} minutos</td>
              </tr>
              ${interview.location ? `
              <tr>
                <td style="padding: 5px 0; font-weight: bold;">Local:</td>
                <td style="padding: 5px 0;">${interview.location}</td>
              </tr>
              ` : ''}
              ${interview.meetingUrl ? `
              <tr>
                <td style="padding: 5px 0; font-weight: bold;">Link da Reunião:</td>
                <td style="padding: 5px 0;"><a href="${interview.meetingUrl}" style="color: #007bff;">Entrar na Reunião</a></td>
              </tr>
              ` : ''}
            </table>
          </div>

          <div style="background-color: #d4edda; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #155724;">💡 Dicas para a Entrevista:</h4>
            <ul style="margin: 0; color: #155724;">
              <li>Revise sua experiência na área de ${interview.application.area}</li>
              <li>Prepare exemplos práticos do seu trabalho</li>
              <li>Chegue 5 minutos antes do horário agendado</li>
              <li>Tenha um ambiente calmo e boa conexão de internet (se online)</li>
            </ul>
          </div>

          <p>Estamos ansiosos para conhecer você melhor!</p>

          <p>
            Atenciosamente,<br>
            <strong>Equipe LN Educacional</strong>
          </p>
        </div>
      </div>
    `;
  }

  private generateInterviewInterviewerTemplate(interview: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #6f42c1; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">📅 Entrevista Agendada</h1>
          <p style="color: white; margin: 5px 0 0 0;">Candidato: ${interview.application.fullName}</p>
        </div>

        <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6;">
          <p>Olá ${interview.interviewer.name},</p>

          <p>Uma entrevista foi agendada com o candidato ${interview.application.fullName}.</p>

          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin: 0 0 15px 0;">Detalhes da Entrevista:</h4>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 5px 0; font-weight: bold;">Candidato:</td>
                <td style="padding: 5px 0;">${interview.application.fullName}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold;">Email:</td>
                <td style="padding: 5px 0;">${interview.application.email}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold;">Área:</td>
                <td style="padding: 5px 0;">${interview.application.area}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold;">Tipo:</td>
                <td style="padding: 5px 0;">${interview.type}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold;">Data/Hora:</td>
                <td style="padding: 5px 0;">${new Date(interview.scheduledAt).toLocaleString('pt-BR')}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold;">Duração:</td>
                <td style="padding: 5px 0;">${interview.duration} minutos</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/collaborators"
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none;
                      border-radius: 6px; display: inline-block; font-weight: bold;">
              Ver Aplicação Completa
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generateReplyEmailTemplate(originalMessage: any, replyContent: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #007bff; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">LN Educacional</h1>
          <p style="color: white; margin: 5px 0 0 0;">Resposta à sua mensagem</p>
        </div>

        <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6;">
          <p>Olá ${originalMessage.name},</p>

          <p>Recebemos sua mensagem e preparamos uma resposta para você:</p>

          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
            ${replyContent}
          </div>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #dee2e6;">

          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px;">
            <h4 style="margin: 0 0 10px 0; color: #6c757d;">Sua mensagem original:</h4>
            <p style="margin: 0; color: #6c757d;"><strong>Assunto:</strong> ${originalMessage.subject}</p>
            <p style="margin: 5px 0 0 0; color: #6c757d;">${originalMessage.message}</p>
          </div>

          <p style="margin-top: 20px;">
            Se você tiver mais dúvidas, não hesite em entrar em contato conosco.
          </p>

          <p>
            Atenciosamente,<br>
            <strong>Equipe LN Educacional</strong>
          </p>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; color: #6c757d; font-size: 14px;">
          <p>LN Educacional - Sua plataforma de educação e conhecimento</p>
          <p>Este email foi enviado em resposta à sua mensagem de contato.</p>
        </div>
      </div>
    `;
  }

  private getPriorityStyle(priority: string): string {
    switch (priority) {
      case 'URGENT':
        return 'background-color: #dc3545; color: white;';
      case 'HIGH':
        return 'background-color: #fd7e14; color: white;';
      case 'NORMAL':
        return 'background-color: #28a745; color: white;';
      case 'LOW':
        return 'background-color: #6c757d; color: white;';
      default:
        return 'background-color: #6c757d; color: white;';
    }
  }

  private getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'URGENT':
        return '🔴 URGENTE';
      case 'HIGH':
        return '🟠 ALTA';
      case 'NORMAL':
        return '🟢 NORMAL';
      case 'LOW':
        return '🔵 BAIXA';
      default:
        return '⚪ NORMAL';
    }
  }

  private getPriorityColor(priority: string): number {
    switch (priority) {
      case 'URGENT':
        return 0xff0000; // Red
      case 'HIGH':
        return 0xff8c00; // Orange
      case 'NORMAL':
        return 0x00ff00; // Green
      case 'LOW':
        return 0x0080ff; // Blue
      default:
        return 0x808080; // Gray
    }
  }
}

// Create and export default instance
const notificationConfig: NotificationConfig = {
  adminEmail: process.env.ADMIN_EMAIL || 'admin@lneducacional.com.br',
  webhookUrl: process.env.DISCORD_WEBHOOK || process.env.SLACK_WEBHOOK,
  realtimeEnabled: process.env.REALTIME_NOTIFICATIONS !== 'false',
};

export const notificationService = new NotificationService(notificationConfig);
export { NotificationService, type NotificationConfig };