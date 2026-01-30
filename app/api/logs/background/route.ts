import { apiSuccess } from "@/lib/api-response-helpers";

// In-memory log storage (in production, use Redis or database)
const logs: Array<{
    id: string;
    timestamp: string;
    level: "info" | "error" | "warn" | "success";
    source: string;
    message: string;
}> = [];

let logIdCounter = 0;

// Export function to add logs from other parts of the app
export function addBackgroundLog(
    level: "info" | "error" | "warn" | "success",
    source: string,
    message: string
) {
    logs.push({
        id: `log-${++logIdCounter}`,
        timestamp: new Date().toISOString(),
        level,
        source,
        message,
    });

    // Keep only last 500 logs
    if (logs.length > 500) {
        logs.shift();
    }
}

export async function GET() {
    return apiSuccess({ logs: logs.slice(-200) }); // Return last 200 logs
}

export async function DELETE() {
    logs.length = 0;
    logIdCounter = 0;
    return apiSuccess({ message: "Logs cleared" });
}
