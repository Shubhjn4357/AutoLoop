import { DurableObject } from "cloudflare:workers";
export type TagData = {
    revalidatedAt: number;
    stale: number | null;
    expire: number | null;
};
export declare class DOShardedTagCache extends DurableObject<CloudflareEnv> {
    sql: SqlStorage;
    constructor(state: DurableObjectState, env: CloudflareEnv);
    getTagData(tags: string[]): Promise<Record<string, TagData>>;
    /**
     * @deprecated since v1.19.
     *
     * Use `getTagData` instead - no processing should be done in the DO ao allow using the regional cache to cache all the values
     * for a given tag using a single key.
     *
     * Kept for backward compatibility during rolling deploys.
     */
    getLastRevalidated(tags: string[]): Promise<number>;
    /**
     * @deprecated since v1.19.
     *
     * Use `getTagData` instead - no processing should be done in the DO ao allow using the regional cache to cache all the values
     * for a given tag using a single key.
     *
     * Kept for backward compatibility during rolling deploys.
     */
    hasBeenRevalidated(tags: string[], lastModified?: number): Promise<boolean>;
    /**
     * @deprecated since v1.19.
     *
     * Use `getTagData` instead - no processing should be done in the DO ao allow using the regional cache to cache all the values
     * for a given tag using a single key.
     *
     * Kept for backward compatibility during rolling deploys.
     */
    getRevalidationTimes(tags: string[]): Promise<Record<string, number>>;
    writeTags(tags: Array<string | {
        tag: string;
        stale?: number;
        expire?: number | null;
    }>, lastModified?: number): Promise<void>;
}
