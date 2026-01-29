import { Edge, Node } from "reactflow";

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    targetBusinessType: string;
    keywords: string[];
    emailTemplates?: Array<{
        name: string;
        subject: string;
        body: string;
    }>;
    nodes: Node[];
    edges: Edge[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
    {
        id: "template-google-maps-email",
        name: "Google Maps -> Cold Email",
        description: "Scrape businesses from Google Maps and send them a cold email outreach sequence.",
        icon: "MapPin",
        targetBusinessType: "Local Businesses",
        keywords: ["outreach", "scraping", "local"],
        emailTemplates: [
            {
                name: "Initial Outreach",
                subject: "Question about {business.name}",
                body: "Hi {business.name},\n\nI found your business on Google Maps and noticed..."
            }
        ],
        nodes: [
            {
                id: "node-1",
                type: "scraperNode",
                position: { x: 100, y: 100 },
                data: {
                    label: "Google Maps Scraper",
                    source: "google-maps",
                    keywords: ["marketing agency"],
                    location: "New York, NY",
                },
            },
            {
                id: "node-2",
                type: "emailNode",
                position: { x: 100, y: 300 },
                data: {
                    label: "Send Cold Email",
                    templateId: "template-0", // logic to map to created template
                },
            },
        ],
        edges: [
            { id: "edge-1", source: "node-1", target: "node-2" },
        ],
    },
    {
        id: "template-search-review",
        name: "Search Scraping -> Review",
        description: "Scrape generic Google Search results and queue them for manual review before taking action.",
        icon: "Search",
        targetBusinessType: "Online Businesses",
        keywords: ["research", "scraping", "review"],
        nodes: [
            {
                id: "node-1",
                type: "scraperNode",
                position: { x: 100, y: 100 },
                data: {
                    label: "Google Search Scraper",
                    source: "google-search",
                    keywords: ["top saas companies"],
                    location: "USA",
                },
            },
            {
                id: "node-2",
                type: "aiNode",
                position: { x: 100, y: 300 },
                data: {
                    label: "Filter & Qualify",
                    prompt: "Analyze if this business is a B2B SaaS company.",
                },
            },
        ],
        edges: [
            { id: "edge-1", source: "node-1", target: "node-2" },
        ],
    },
    {
        id: "template-drip-campaign",
        name: "Simple Cold Email Drip",
        description: "A classic drip campaign: Send an email, wait 2 days, then send a follow-up if no reply.",
        icon: "Mail",
        targetBusinessType: "B2B",
        keywords: ["drip", "sales", "follow-up"],
        emailTemplates: [
            {
                name: "Drip 1: Intro",
                subject: "Hello {business.name}",
                body: "Introduction..."
            },
            {
                name: "Drip 2: Follow-up",
                subject: "Following up",
                body: "Just checking in..."
            }
        ],
        nodes: [
            {
                id: "node-1",
                type: "triggerNode",
                position: { x: 100, y: 50 },
                data: {
                    label: "Manual Trigger",
                    triggerType: "manual",
                },
            },
            {
                id: "node-2",
                type: "emailNode",
                position: { x: 100, y: 200 },
                data: {
                    label: "Initial Email",
                    templateId: "template-0"
                },
            },
            {
                id: "node-3",
                type: "delayNode",
                position: { x: 100, y: 350 },
                data: {
                    label: "Wait 2 Days",
                    delaySeconds: 172800, // 2 days
                },
            },
            {
                id: "node-4",
                type: "emailNode",
                position: { x: 100, y: 500 },
                data: {
                    label: "Follow-up Email",
                    templateId: "template-1"
                },
            },
        ],
        edges: [
            { id: "edge-1", source: "node-1", target: "node-2" },
            { id: "edge-2", source: "node-2", target: "node-3" },
            { id: "edge-3", source: "node-3", target: "node-4" },
        ],
    },
    {
        id: "template-customer-onboarding",
        name: "Customer Onboarding",
        description: "Send a welcome email immediately, then a tips email 1 day later.",
        icon: "UserPlus",
        targetBusinessType: "SaaS/Service",
        keywords: ["onboarding", "retention", "welcome"],
        emailTemplates: [
            {
                name: "Welcome Email",
                subject: "Welcome to our service!",
                body: "Thanks for signing up..."
            },
            {
                name: "Pro Tips",
                subject: "Here are some tips",
                body: "Did you know you can..."
            }
        ],
        nodes: [
            {
                id: "node-1",
                type: "triggerNode",
                position: { x: 100, y: 50 },
                data: {
                    label: "New Customer (Webhook)",
                    triggerType: "webhook",
                },
            },
            {
                id: "node-2",
                type: "emailNode",
                position: { x: 100, y: 200 },
                data: {
                    label: "Welcome Email",
                    templateId: "template-0"
                },
            },
            {
                id: "node-3",
                type: "delayNode",
                position: { x: 100, y: 350 },
                data: {
                    label: "Wait 1 Day",
                    delaySeconds: 86400,
                },
            },
            {
                id: "node-4",
                type: "emailNode",
                position: { x: 100, y: 500 },
                data: {
                    label: "Pro Tips Email",
                    templateId: "template-1"
                },
            },
        ],
        edges: [
            { id: "edge-1", source: "node-1", target: "node-2" },
            { id: "edge-2", source: "node-2", target: "node-3" },
            { id: "edge-3", source: "node-3", target: "node-4" },
        ],
    },
    {
        id: "template-review-request",
        name: "Review Request Sequence",
        description: "Automatically ask for a review after a set period.",
        icon: "Star",
        targetBusinessType: "Local/E-com",
        keywords: ["reviews", "reputation", "feedback"],
        emailTemplates: [
            {
                name: "Review Request",
                subject: "How was your experience?",
                body: "We'd love to hear your thoughts..."
            }
        ],
        nodes: [
            {
                id: "node-1",
                type: "triggerNode",
                position: { x: 100, y: 50 },
                data: {
                    label: "Schedule (Weekly)",
                    triggerType: "schedule",
                    cron: "0 9 * * 1", // Mondays at 9am
                },
            },
            {
                id: "node-2",
                type: "emailNode",
                position: { x: 100, y: 200 },
                data: {
                    label: "Review Request",
                    templateId: "template-0"
                },
            },
        ],
        edges: [
            { id: "edge-1", source: "node-1", target: "node-2" },
        ],
    },
    {
        id: "template-data-enrichment",
        name: "Business Data Enrichment",
        description: "Take existing contacts and enrich them with data scraped from their websites.",
        icon: "Database",
        targetBusinessType: "B2B",
        keywords: ["enrichment", "data", "ops"],
        nodes: [
            {
                id: "node-1",
                type: "triggerNode",
                position: { x: 100, y: 50 },
                data: {
                    label: "Manual Trigger",
                    triggerType: "manual",
                },
            },
            {
                id: "node-2",
                type: "scraperNode",
                position: { x: 100, y: 200 },
                data: {
                    label: "Visit Website",
                    source: "url-visit", // Assuming this source exists or will exist
                },
            },
            {
                id: "node-3",
                type: "aiNode",
                position: { x: 100, y: 350 },
                data: {
                    label: "Extract Info",
                    prompt: "Extract CEO name and confirm address.",
                },
            },
        ],
        edges: [
            { id: "edge-1", source: "node-1", target: "node-2" },
            { id: "edge-2", source: "node-2", target: "node-3" },
        ],
    },
];
