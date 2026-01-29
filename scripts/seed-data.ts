
import { db } from "../db";
import { businesses, emailTemplates, users } from "../db/schema";


async function seed() {
    console.log("🌱 Starting seed...");

    // Get a user (assuming first user is admin/owner for this local seed)
    const allUsers = await db.select().from(users).limit(1);
    if (allUsers.length === 0) {
        console.error("❌ No users found. Please login first to create a user.");
        return;
    }
    const userId = allUsers[0].id;
    console.log(`👤 Using user: ${userId}`);

    // 1. Seed Businesses
    console.log("🏢 Seeding businesses...");
    await db.insert(businesses).values([
        {
            userId,
            name: "Acme Corp",
            email: "contact@acme.com",
            website: "https://acme.com",
            category: "Technology",
            rating: 4.8,
            reviewCount: 120,
            address: "123 Tech Lane",
        },
        {
            userId,
            name: "Bistro Delight",
            email: "info@bistrodelight.com",
            website: "https://bistrodelight.com",
            category: "Restaurant",
            rating: 4.5,
            reviewCount: 85,
            address: "45 Culinary Ave",
        },
        {
            userId,
            name: "Fitness First",
            email: "hello@fitnessfirst.com",
            website: "https://fitnessfirst.com",
            category: "Health",
            rating: 4.9,
            reviewCount: 200,
            address: "789 Gym Blvd",
        }
    ]);

    // 2. Seed Email Templates
    console.log("✉️ Seeding templates...");
    await db.insert(emailTemplates).values([
        {
            userId,
            name: "Intro / Cold Outreach",
            subject: "Quick question about {business.name}",
            body: "Hi there,\n\nI came across {business.website} and was impressed by your reviews ({business.rating} stars!).\n\nWe help companies in the {business.category} space grow. Interested?\n\nBest,\nAutoLoop",
            isDefault: true
        },
        {
            userId,
            name: "Follow-up #1",
            subject: "Re: Quick question",
            body: "Hi again,\n\nJust bumping this up. Did you see my last email?\n\nThanks!",
            isDefault: false
        }
    ]);

    console.log("✅ Seed complete!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
