"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = exports.emailService = void 0;
class EmailService {
    config;
    constructor(config) {
        this.config = config;
    }
    async sendEmail(data) {
        const emailData = {
            ...data,
            from: data.from || `${this.config.fromName} <${this.config.from}>`,
            replyTo: data.replyTo || this.config.replyTo,
        };
        switch (this.config.provider) {
            case 'console':
                return this.sendWithConsole(emailData);
            case 'sendgrid':
                return this.sendWithSendGrid(emailData);
            case 'resend':
                return this.sendWithResend(emailData);
            case 'nodemailer':
                return this.sendWithNodemailer(emailData);
            default:
                throw new Error(`Unknown email provider: ${this.config.provider}`);
        }
    }
    async sendNewsletter(subscribers, newsletterData) {
        const results = { sent: 0, failed: 0, errors: [] };
        for (const subscriber of subscribers) {
            try {
                const template = this.generateNewsletterTemplate(newsletterData, subscriber);
                await this.sendEmail({
                    to: subscriber.email,
                    subject: template.subject,
                    html: template.html,
                    text: template.text,
                });
                results.sent++;
            }
            catch (error) {
                results.failed++;
                results.errors.push(`Failed to send to ${subscriber.email}: ${error.message}`);
                console.error(`Failed to send newsletter to ${subscriber.email}:`, error);
            }
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return results;
    }
    async sendPostNotification(subscribers, post) {
        const baseUrl = process.env.FRONTEND_URL || 'https://lneducacional.com.br';
        const postUrl = `${baseUrl}/blog/${post.slug}`;
        const newsletterData = {
            subject: `Novo post: ${post.title}`,
            content: `
        <h1>${post.title}</h1>
        ${post.coverImageUrl ? `<img src="${post.coverImageUrl}" alt="${post.title}" style="max-width: 100%; height: auto; margin: 20px 0;" />` : ''}
        ${post.excerpt ? `<p style="font-size: 16px; line-height: 1.6; color: #666;">${post.excerpt}</p>` : ''}
        <p style="margin: 20px 0;">
          <a href="${postUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ler artigo completo
          </a>
        </p>
        <p style="color: #888; font-size: 14px;">Por ${post.author.name}</p>
      `,
            postUrl,
        };
        return this.sendNewsletter(subscribers, newsletterData);
    }
    generateNewsletterTemplate(data, subscriber) {
        const baseUrl = process.env.FRONTEND_URL || 'https://lneducacional.com.br';
        const unsubscribeUrl = data.unsubscribeUrl || `${baseUrl}/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
        const preferencesUrl = data.preferencesUrl || `${baseUrl}/newsletter/preferences?email=${encodeURIComponent(subscriber.email)}`;
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #1e40af;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #1e40af;
    }
    .content {
      margin-bottom: 30px;
    }
    .footer {
      text-align: center;
      padding: 20px 0;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 14px;
    }
    .footer a {
      color: #1e40af;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .unsubscribe {
      margin-top: 20px;
      padding: 10px;
      background-color: #f9f9f9;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">LN Educacional</div>
    <p>Newsletter</p>
  </div>

  <div class="content">
    ${subscriber.name ? `<p>Olá, ${subscriber.name}!</p>` : '<p>Olá!</p>'}
    ${data.content}
  </div>

  <div class="footer">
    <p>
      <strong>LN Educacional</strong><br>
      Sua plataforma de educação e conhecimento
    </p>

    <div class="unsubscribe">
      <p>
        <a href="${preferencesUrl}">Gerenciar preferências</a> |
        <a href="${unsubscribeUrl}">Cancelar inscrição</a>
      </p>
      <p style="font-size: 12px; color: #888;">
        Você está recebendo este email porque se inscreveu em nossa newsletter.
      </p>
    </div>
  </div>
</body>
</html>`;
        // Generate text version
        const text = `
${data.subject}

${subscriber.name ? `Olá, ${subscriber.name}!` : 'Olá!'}

${data.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()}

${data.postUrl ? `Leia mais em: ${data.postUrl}` : ''}

---
LN Educacional
Sua plataforma de educação e conhecimento

Gerenciar preferências: ${preferencesUrl}
Cancelar inscrição: ${unsubscribeUrl}
`;
        return {
            subject: data.subject,
            html,
            text,
        };
    }
    async sendWithConsole(data) {
        console.log('=== EMAIL SERVICE - CONSOLE MODE ===');
        console.log('To:', data.to);
        console.log('From:', data.from);
        console.log('Subject:', data.subject);
        console.log('--- HTML Content ---');
        console.log(data.html);
        if (data.text) {
            console.log('--- Text Content ---');
            console.log(data.text);
        }
        console.log('=== END EMAIL ===');
        return true;
    }
    async sendWithSendGrid(data) {
        // TODO: Implement SendGrid integration
        // Example:
        /*
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(this.config.apiKey);
    
        const msg = {
          to: data.to,
          from: data.from,
          subject: data.subject,
          html: data.html,
          text: data.text,
        };
    
        await sgMail.send(msg);
        */
        console.log('SendGrid integration not implemented yet');
        return this.sendWithConsole(data);
    }
    async sendWithResend(data) {
        // TODO: Implement Resend integration
        // Example:
        /*
        const { Resend } = require('resend');
        const resend = new Resend(this.config.apiKey);
    
        await resend.emails.send({
          from: data.from,
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text,
        });
        */
        console.log('Resend integration not implemented yet');
        return this.sendWithConsole(data);
    }
    async sendWithNodemailer(data) {
        // TODO: Implement Nodemailer integration
        // Example:
        /*
        const nodemailer = require('nodemailer');
    
        const transporter = nodemailer.createTransporter({
          // Configure your SMTP settings here
        });
    
        await transporter.sendMail({
          from: data.from,
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text,
        });
        */
        console.log('Nodemailer integration not implemented yet');
        return this.sendWithConsole(data);
    }
}
exports.EmailService = EmailService;
// Create and export default instance
const emailConfig = {
    provider: process.env.EMAIL_PROVIDER || 'console',
    apiKey: process.env.EMAIL_API_KEY,
    from: process.env.EMAIL_FROM || 'noreply@lneducacional.com.br',
    fromName: process.env.EMAIL_FROM_NAME || 'LN Educacional',
    replyTo: process.env.EMAIL_REPLY_TO || 'contato@lneducacional.com.br',
};
exports.emailService = new EmailService(emailConfig);
//# sourceMappingURL=email.service.js.map