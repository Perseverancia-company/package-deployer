import os from "os";
import { promisifiedSpawn } from "@/cmd";

/**
 * PNPM package manager
 */
export default class PNPM {
    packagePath: string;
    commands: Array<string> = ["pnpm"];
    args: Array<string> = [];

    /**
     * PNPM constructor
     */
    constructor(packagePath: string) {
        this.packagePath = packagePath;
    }

    /**
     * Install command
     */
    install() {
        this.commands.push("install");
        return this;
    }

    /**
     * Run command (e.g., pnpm run <script>)
     */
    runCommand() {
        this.commands.push("run");
        return this;
    }

    /**
     * Build command
     */
    build() {
        this.commands.push("build");
        return this;
    }

    /**
     * Set arg to not use/update lockfile
     * Equivalent to npm's --no-package-lock
     */
    noPackageLock() {
        // In pnpm, --frozen-lockfile prevents updating the lockfile
        // Or --no-frozen-lockfile depending on your specific intent
        this.args.push("--frozen-lockfile");
        return this;
    }

    /**
     * Run the built command
     */
    async run() {
        const firstCommand = this.commands.shift();

        if (!firstCommand) {
            throw new Error("No first command defined for PNPM.");
        }

        const spawnOptions = {
            cwd: this.packagePath,
            shell: os.platform() === "win32", // Simplified check
        };

        return promisifiedSpawn(
            firstCommand,
            [...this.commands, ...this.args],
            spawnOptions
        );
    }
}
