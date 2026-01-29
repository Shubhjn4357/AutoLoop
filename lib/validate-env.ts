
export function validateEnvironmentVariables() {
    const required = [
        "DATABASE_URL",
        "NEXTAUTH_URL",
        "NEXTAUTH_SECRET",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
    ];

    const missing = required.filter(v => !process.env[v]);

    if (missing.length > 0) {
        const error = `❌ Missing required environment variables:\n${missing.map(v => `  - ${v}`).join("\n")}`;
        console.error(error);
        throw new Error(error);
    } else {
        console.log("✅ All required environment variables are set");
    }
}
