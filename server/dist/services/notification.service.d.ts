interface NotificationConfig {
    adminEmail: string;
    webhookUrl?: string;
    realtimeEnabled: boolean;
}
declare class NotificationService {
    private config;
    private io?;
    constructor(config: NotificationConfig);
    setSocketIO(io: any): void;
    notifyNewMessage(message: any): Promise<void>;
    notifyMessageReply(message: any, replyContent: string): Promise<void>;
    notifyLegalDocumentUpdate(document: any): Promise<void>;
    notifyApplicationReceived(applicationId: string): Promise<void>;
    notifyStageChange(applicationId: string, newStage: string): Promise<void>;
    notifyInterview(interviewId: string): Promise<void>;
    notifyEvaluation(evaluationId: string): Promise<void>;
    private sendEmailNotification;
    private sendWebhookNotification;
    private sendRealtimeNotification;
    private generateApplicationReceivedTemplate;
    private generateNewApplicationAdminTemplate;
    private generateStageUpdateTemplate;
    private generateInterviewCandidateTemplate;
    private generateInterviewInterviewerTemplate;
    private generateReplyEmailTemplate;
    private getPriorityStyle;
    private getPriorityLabel;
    private getPriorityColor;
}
export declare const notificationService: NotificationService;
export { NotificationService, type NotificationConfig };
//# sourceMappingURL=notification.service.d.ts.map