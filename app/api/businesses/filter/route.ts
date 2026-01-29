import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq, and, gte, lte, or, isNotNull } from "drizzle-orm";

interface FilterCriteria {
    minRating?: number;
    maxRating?: number;
    locationRadius?: number; // in miles
    latitude?: number;
    longitude?: number;
    industries?: string[];
    minSize?: number; // number of reviews as proxy for size
    maxSize?: number;
    hasWebsite?: boolean;
    hasPhone?: boolean;
    hasEmail?: boolean;
}

interface FilterResponse {
    businesses: Array<{
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        website: string | null;
        address: string | null;
        category: string;
        rating: number | null;
        reviewCount: number | null;
        latitude?: number | null;
        longitude?: number | null;
    }>;
    total: number;
    appliedFilters: FilterCriteria;
}

/**
 * Filter businesses based on criteria like rating, location, industry, size, etc.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const criteria: FilterCriteria = await request.json();
        const userId = session.user.id;

        // Build where conditions
        const conditions = [eq(businesses.userId, userId)];

        // Rating filter
        if (criteria.minRating !== undefined) {
            conditions.push(gte(businesses.rating, criteria.minRating));
        }
        if (criteria.maxRating !== undefined) {
            conditions.push(lte(businesses.rating, criteria.maxRating));
        }

        // Industry/Category filter
        if (criteria.industries && criteria.industries.length > 0) {
            conditions.push(
                or(...criteria.industries.map((cat) => eq(businesses.category, cat)))!
            );
        }

        // Size filter (using review count as proxy)
        if (criteria.minSize !== undefined) {
            conditions.push(gte(businesses.reviewCount, criteria.minSize));
        }
        if (criteria.maxSize !== undefined) {
            conditions.push(lte(businesses.reviewCount, criteria.maxSize));
        }

        // Website presence
        if (criteria.hasWebsite === true) {
            conditions.push(
                isNotNull(businesses.website)
            );
        }

        // Phone presence
        if (criteria.hasPhone === true) {
            conditions.push(
                isNotNull(businesses.phone)
            );
        }

        // Email presence
        if (criteria.hasEmail === true) {
            conditions.push(
                isNotNull(businesses.email)
            );
        }

        // Query with filters
        const filtered = await db
            .select({
                id: businesses.id,
                name: businesses.name,
                email: businesses.email,
                phone: businesses.phone,
                website: businesses.website,
                address: businesses.address,
                category: businesses.category,
                rating: businesses.rating,
                reviewCount: businesses.reviewCount,
                latitude: businesses.latitude,
                longitude: businesses.longitude,
            })
            .from(businesses)
            .where(and(...conditions));

        // Additional location radius filtering if latitude/longitude provided
        let finalResults = filtered;
        if (
            criteria.locationRadius &&
            criteria.latitude !== undefined &&
            criteria.longitude !== undefined
        ) {
            const radiusInMiles = criteria.locationRadius;
            const radiusInDegrees = radiusInMiles / 69; // rough approximation: 1 degree ≈ 69 miles

            finalResults = filtered.filter((b) => {
                if (!b.latitude || !b.longitude) return false;

                const latDiff = Math.abs(b.latitude - criteria.latitude!);
                const lonDiff = Math.abs(b.longitude - criteria.longitude!);
                const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);

                return distance <= radiusInDegrees;
            });
        }

        return NextResponse.json({
            businesses: finalResults,
            total: finalResults.length,
            appliedFilters: criteria,
        } as FilterResponse);
    } catch (error) {
        console.error("Error filtering businesses:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
