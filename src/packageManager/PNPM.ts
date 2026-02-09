import os from "os";
import { promisifiedSpawn } from "@/lib/cmd";
import PackageManagerController from "./PackageManagerController";

/**
 * PNPM package manager
 */
export default class PNPM extends PackageManagerController {
	commands: Array<string> = ["pnpm"];
	args: Array<string> = [];

	/**
	 * PNPM constructor
	 */
	constructor(packagePath: string) {
		super(packagePath);
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
	 * Publish command
	 */
	publish(): this {
		this.commands.push("publish");
		// Often used in CI/CD to skip manual confirmation
		this.args.push("--no-git-checks");
		return this;
	}

	/**
	 * Don't update package versions
	 *
	 * In pnpm this is the argument "--no-save"
	 * In npm don't do anything
	 */
	lockPackageJson(): this {
		this.args.push("--no-save");
		return this;
	}

	/**
	 * Update
	 */
	update(): this {
		this.commands.push("update");
		return this;
	}

	/**
	 * Add a package to update
	 */
	addPackage(packageName: string): this {
		this.args.push(packageName);
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

		return await promisifiedSpawn(
			firstCommand,
			[...this.commands, ...this.args],
			spawnOptions
		);
	}
}
