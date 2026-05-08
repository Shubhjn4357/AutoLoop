export declare const automationEngine: {
    processEvent(payload: any): Promise<{
        success: boolean;
        queued: number;
    }>;
    queueEvent(params: {
        eventType: string;
        payload: any;
        externalId: string;
        recipientId: string;
        scheduledFor?: Date;
        idempotencyKey?: string;
    }): Promise<void>;
    processQueuedEvent(eventId: string): Promise<void>;
    handleDM(payload: any, eventType: string): Promise<void>;
    handleComment(payload: any): Promise<void>;
    handleFollow(payload: any): Promise<void>;
    handleMention(payload: any): Promise<void>;
    executeAutomation(rule: any, account: any, recipientId: string, messageText: string, messageId?: string, commentId?: string): Promise<void>;
    checkRateLimits(externalId: string, recipientId: string, cooldownMinutes: number): Promise<{
        allowed: boolean;
    }>;
    interpolateVariables(text: string, userId: string, externalId: string, recipientId: string): Promise<string>;
    upsertContact(userId: string, externalId: string, senderId: string, accessToken: string): Promise<void>;
    scheduleFollowUp(userId: string, automationId: string, externalId: string, recipientId: string, template: string, delayMinutes: number): Promise<void>;
    trackAutomationMetrics(userId: string, automationId: string): Promise<void>;
    createNotificationLog(params: any): Promise<void>;
    processScheduledMessage(msgId: string): Promise<void>;
};
