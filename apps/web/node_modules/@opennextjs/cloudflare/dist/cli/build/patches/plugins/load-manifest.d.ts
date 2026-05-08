/**
 * Inline `loadManifest` and `evalManifest` from `load-manifest.js`
 *
 * They rely on `readFileSync` that is not supported by workerd.
 */
import { type BuildOptions } from "@opennextjs/aws/build/helper.js";
import type { ContentUpdater, Plugin } from "@opennextjs/aws/plugins/content-updater.js";
export declare function inlineLoadManifest(updater: ContentUpdater, buildOpts: BuildOptions): Plugin;
/**
 * Factor out large manifest values into separate variables.
 *
 * @param manifest The manifest code.
 * @param key The key to factor out.
 * @param values A map to store the factored values (indexed by variable name).
 * @param prefixMap Map of short hash prefix → full hash, updated in place for
 *   collision resolution across calls.
 * @returns The manifest code with large values factored out.
 */
export declare function factorManifestValue(manifest: string, key: string, values: Map<string, string>, prefixMap: Map<string, string>): string;
/**
 * Factor out large object values into separate variables.
 *
 * @param valueText The JS source text of the module mapping object.
 * @param sharedVars Map to accumulate shared variable declarations.
 * @param prefixMap Map of short hash prefix → full hash, updated in place for
 *   collision resolution across calls.
 * @returns The rewritten value text with chunks arrays replaced by variable refs.
 */
export declare function factorObjectValues(valueText: string, sharedVars: Map<string, string>, prefixMap: Map<string, string>): string;
/**
 * Get or create a short variable name for a value, resolving collisions.
 *
 * Computes a SHA1 hash of the value, then finds the shortest unique prefix
 * (minimum {@link MIN_PREFIX_LENGTH} hex chars). When a new hash collides with
 * an existing prefix, the new entry is given a longer prefix — existing entries
 * are never renamed.
 *
 * This allows saving space in the generated code (A full SHA1 is 40 hex chars) because
 * identifiers are not minimized by the Open Next build process.
 *
 * @param value The value to hash.
 * @param prefixMap Map of short prefix → full hash, updated in place.
 * @returns The variable name (`v<shortPrefix>`).
 */
export declare function getOrCreateVarName(value: string, prefixMap: Map<string, string>): string;
