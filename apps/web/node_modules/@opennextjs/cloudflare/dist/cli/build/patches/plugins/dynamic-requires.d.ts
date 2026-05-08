import { type BuildOptions } from "@opennextjs/aws/build/helper.js";
import type { ContentUpdater, Plugin } from "@opennextjs/aws/plugins/content-updater.js";
export declare function getRequires(idVariable: string, files: string[], serverDir: string): string;
export declare function inlineDynamicRequires(updater: ContentUpdater, buildOpts: BuildOptions): Plugin;
