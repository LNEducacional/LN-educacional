interface AutoReplyTemplate {
    id: string;
    name: string;
    subject: string;
    content: string;
    variables: string[];
    keywords?: string[];
    category?: string;
    enabled: boolean;
}
interface AutoReplyConfig {
    enabled: boolean;
    defaultTemplateId?: string;
    keywordMatching: boolean;
    sendDelay: number;
}
interface MessageData {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    phone?: string;
    category?: string;
}
declare class AutoReplyService {
    private config;
    private templates;
    constructor(config: AutoReplyConfig);
    loadTemplatesFromDatabase(): Promise<void>;
    processAutoReply(message: MessageData): Promise<boolean>;
    private selectTemplate;
    private findTemplateByKeywords;
    private findTemplateByCategory;
    private sendAutoReply;
    private processTemplate;
    private generateAutoReplyHTML;
    private extractKeywords;
    private initializeDefaultTemplates;
    addTemplate(template: Omit<AutoReplyTemplate, 'id'>): Promise<string>;
    updateTemplate(id: string, updates: Partial<AutoReplyTemplate>): Promise<boolean>;
    deleteTemplate(id: string): Promise<boolean>;
    getTemplates(): AutoReplyTemplate[];
    getTemplate(id: string): AutoReplyTemplate | undefined;
    updateConfig(newConfig: Partial<AutoReplyConfig>): Promise<void>;
    getConfig(): AutoReplyConfig;
}
export declare const autoReplyService: AutoReplyService;
export { AutoReplyService, type AutoReplyTemplate, type AutoReplyConfig, type MessageData };
//# sourceMappingURL=auto-reply.service.d.ts.map