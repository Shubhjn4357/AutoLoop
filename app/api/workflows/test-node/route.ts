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
        let logs: string[] = [];
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
                        } catch (e: any) {
                             logs.push(`Error evaluating condition: ${e.message}`);
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
                        } catch (e: any) {
                             logs.push(`Error evaluating filter: ${e.message}`);
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

                 case "splitInBatches":
                     logs.push("Loop node passed (mock).");
                     break;
                
                default:
                    logs.push(`Unknown node type: ${nodeType}`);
                    break;
            }

        } catch (error: any) {
            status = "error";
            logs.push(`Runtime Error: ${error.message}`);
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
