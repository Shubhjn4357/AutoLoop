import ci from "ci-info";
/**
 * Whether the current process is running in an interactive terminal.
 */
export function isInteractive() {
    return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}
/**
 * Whether prompts should be suppressed.
 */
export function isNonInteractiveOrCI() {
    return !isInteractive() || ci.isCI;
}
