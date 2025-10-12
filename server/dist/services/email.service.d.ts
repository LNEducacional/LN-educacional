interface EmailConfig {
    provider: 'console' | 'sendgrid' | 'resend' | 'nodemailer';
    apiKey?: string;
    from: string;
    fromName: string;
    replyTo?: string;
}
interface EmailData {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
}
interface NewsletterData {
    subject: string;
    content: string;
    postUrl?: string;
    unsubscribeUrl?: string;
    preferencesUrl?: string;
}
declare class EmailService {
    private config;
    constructor(config: EmailConfig);
    sendEmail(data: EmailData): Promise<boolean>;
    sendNewsletter(subscribers: Array<{
        email: string;
        name?: string;
        id: string;
    }>, newsletterData: NewsletterData): Promise<{
        sent: number;
        failed: number;
        errors: string[];
    }>;
    sendPostNotification(subscribers: Array<{
        email: string;
        name?: string;
        id: string;
    }>, post: {
        title: string;
        excerpt?: string;
        slug: string;
        author: {
            name: string;
        };
        coverImageUrl?: string;
    }): Promise<{
        sent: number;
        failed: number;
        errors: string[];
    }>;
    private generateNewsletterTemplate;
    private sendWithConsole;
    private sendWithSendGrid;
    private sendWithResend;
    private sendWithNodemailer;
}
export declare const emailService: EmailService;
export { EmailService, type EmailConfig, type EmailData, type NewsletterData };
//# sourceMappingURL=email.service.d.ts.map