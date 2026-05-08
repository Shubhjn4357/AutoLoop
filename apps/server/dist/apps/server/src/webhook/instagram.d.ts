import { Context } from 'hono';
export declare const instagramWebhookHandler: {
    verify(c: Context): Promise<Response & import("hono").TypedResponse<string, import("hono/utils/http-status").ContentfulStatusCode, "text">>;
    handle(c: Context): Promise<(Response & import("hono").TypedResponse<"EVENT_RECEIVED", 200, "text">) | (Response & import("hono").TypedResponse<"Error", 500, "text">)>;
};
