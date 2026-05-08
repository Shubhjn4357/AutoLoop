import type { NextModeTagCache, NextModeTagCacheWriteInput } from "@opennextjs/aws/types/overrides.js";
export declare const NAME = "d1-next-mode-tag-cache";
export declare const BINDING_NAME = "NEXT_TAG_CACHE_D1";
/**
 * Stored value shape for D1 tag entries.
 *
 * - revalidatedAt: timestamp in ms of the last revalidation
 * - stale: timestamp in ms when the tag becomes stale
 * - expire: timestamp in ms when the tag expires (null means no expiry)
 */
type D1TagValue = {
    revalidatedAt: number;
    stale: number | null;
    expire: number | null;
};
export declare class D1NextModeTagCache implements NextModeTagCache {
    #private;
    readonly mode: "nextMode";
    readonly name = "d1-next-mode-tag-cache";
    getLastRevalidated(tags: string[]): Promise<number>;
    hasBeenRevalidated(tags: string[], lastModified?: number): Promise<boolean>;
    writeTags(tags: NextModeTagCacheWriteInput[]): Promise<void>;
    isStale(tags: string[], lastModified?: number): Promise<boolean>;
    private getConfig;
    protected getCacheKey(key: string): string;
    protected getBuildId(): string;
    /**
     * @returns request scoped in-memory cache for tag values, or undefined if ALS is not available.
     */
    protected getItemsCache(): Map<string, D1TagValue | null> | undefined;
}
declare const _default: D1NextModeTagCache;
export default _default;
