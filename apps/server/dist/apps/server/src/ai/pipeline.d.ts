export declare function analyzeSentiment(text: string): Promise<{
    sentiment: string;
    confidence: number;
}>;
export declare function generateSmartReply(params: {
    userMessage: string;
    prompt?: string;
    context?: string;
}): Promise<{
    reply: string;
    intent?: string;
} | null>;
export declare function detectIntent(text: string): Promise<string>;
export declare function categorizeLead(text: string): Promise<string>;
export declare function trackAnalytics(params: {
    userId: string;
    eventType: string;
    automationId?: string;
    externalId?: string;
    recipientId?: string;
    metadata?: unknown;
}): Promise<void>;
