import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { nodeType, config, inputContext } = await req.json();

        // Simulate execution logic
        let outputContext = { ...inputContext };
        const logs: string[] = [];
        let status = "success";

        try {
            switch (nodeType) {
                case "condition":
                    // Simple JS expression evaluation
                    // In a real app, use a safe sandbox or a specific expression parser
                    // For demo: verify against context props
                    const condition = config?.condition;
                    if (condition) {
                        try {
                           // Very unsafe eval alternative for demo purposes only:
                           // Create a function with keys of context as args
                           const keys = Object.keys(inputContext);
                           const values = Object.values(inputContext);
                           // Basic check: if condition is valid JS code using context variables
                           // This is just a placeholder for the real detailed implementation
                           const check = new Function(...keys, `return ${condition};`);
                           const result = check(...values);
                           logs.push(`Condition '${condition}' evaluated to: ${result}`);
                           outputContext._conditionResult = !!result;
                        } catch (e) {
                            const errorMessage = e instanceof Error ? e.message : String(e);
                             logs.push(`Error evaluating condition: ${errorMessage}`);
                             status = "error";
                        }
                    }
                    break;

                case "filter":
                     const filterCond = config?.filterCondition;
                     if (filterCond) {
                        // Same simple eval logic
                         const keys = Object.keys(inputContext);
                         const values = Object.values(inputContext);
                         // Map "item" to inputContext for the filter
                        try {
                           const check = new Function("item", ...keys, `return ${filterCond};`);
                           const result = check(inputContext, ...values);
                            if (!result) {
                                status = "stopped";
                                logs.push("Filter matched (false). Execution would stop here.");
                            } else {
                                logs.push("Filter passed (true).");
                            }
                        } catch (e) {
                            const errorMessage = e instanceof Error ? e.message : String(e);
                             logs.push(`Error evaluating filter: ${errorMessage}`);
                             status = "error";
                        }
                     }
                     break;

                case "set":
                     const vars = config?.setVariables;
                     if (vars) {
                         outputContext = { ...outputContext, ...vars };
                         logs.push(`Set variables: ${JSON.stringify(vars)}`);
                     }
                     break;
    
                case "delay":
                    logs.push(`Simulating delay of ${config?.delayHours} hours... Done.`);
                    break;

                case "webhook":
                case "start":
                case "schedule":
                    logs.push("Trigger node executed successfully.");
                    break;

                case "gemini":
                     logs.push("Simulating Gemini AI call...");
                     logs.push(`Prompt: ${config?.aiPrompt}`);
                     outputContext.geminiResult = "This is a simulated AI response for testing.";
                     break;
                     
                case "apiRequest":
                    logs.push(`Simulating API Request to ${config?.method} ${config?.url}`);
                    outputContext.apiResponse = { status: 200, data: { mock: "result" } };
                    break;
                
                 case "merge":
                    logs.push("Merge node passed.");
                    break;

                case "scraper":
                    const action = config?.scraperAction || "extract-emails";
                    const inputVar = config?.scraperInputField || "";

                    // Simple variable resolution for test: check if inputVar is a key in inputContext, else use raw string
                    // This matches the simplified eval logic of this test endpoint
                    const cleanVar = inputVar.replace(/^\{|\}$/g, "");
                    let content = inputContext[cleanVar] !== undefined ? inputContext[cleanVar] : inputVar;
                    // handle nested like business.website
                    if (cleanVar.includes(".")) {
                        const parts = cleanVar.split(".");
                        if (parts[0] === "business" && inputContext.business) {
                            content = inputContext.business[parts[1]];
                        } else if (parts[0] === "variables") {
                            content = inputContext[parts[1]];
                        }
                    }

                    const textContent = typeof content === "string" ? content : JSON.stringify(content || "");
                    logs.push(`Running Scraper Action: ${action}`);

                    if (action === "fetch-url") {
                        let url = textContent.trim();
                        if (!url.startsWith("http")) url = "https://" + url;
                        logs.push(`Fetching URL: ${url}`);
                        try {
                            const response = await fetch(url);
                            if (!response.ok) throw new Error(`Status ${response.status}`);
                            const html = await response.text();
                            outputContext.scrapedData = html;
                            logs.push(`Success: Fetched ${html.length} chars.`);
                        } catch (e) {
                            const errorMessage = e instanceof Error ? e.message : String(e);
                            logs.push(`Error fetching URL: ${errorMessage}`);
                            status = "error";
                        }
                    } else if (action === "extract-emails") {
                        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
                        const matches = textContent.match(emailRegex);
                        const emails = matches ? [...new Set(matches)] : [];
                        outputContext.scrapedData = emails;
                        logs.push(`Extracted ${emails.length} emails: ${emails.slice(0, 3).join(", ")}...`);
                    } else {
                        logs.push(`Action ${action} simulated.`);
                        outputContext.scrapedData = "Simulated Result";
                    }
                    break;

                 case "splitInBatches":
                     logs.push("Loop node passed (mock).");
                     break;
                
                default:
                    logs.push(`Unknown node type: ${nodeType}`);
                    break;
            }

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            status = "error";
            logs.push(`Runtime Error: ${errorMessage}`);
        }

        return NextResponse.json({
            success: true,
            status,
            outputContext,
            logs
        });

    } catch (error) {
        console.error("[NODE_TEST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
