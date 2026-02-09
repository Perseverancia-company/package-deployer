import os from "os";
import { promisifiedSpawn } from "@/lib/cmd";
import PackageManagerController from "./PackageManagerController";

/**
 * Npm package manager
 */
export default class NPM extends PackageManagerController {
	commands: Array<string> = ["npm"];
	args: Array<string> = [];

	/**
	 * NPM
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
	 * Run command
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
		return this;
	}

	/**
	 * Don't update package versions
	 *
	 * In pnpm this is the argument "--no-save"
	 * In npm don't do anything
	 */
	lockPackageJson(): this {
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
	 * Set arg to not use package lock
	 */
	noPackageLock() {
		this.args.push("--no-package-lock");
		return this;
	}

	/**
	 * Run
	 */
	async run() {
		// Get the first command
		const firstCommand = this.commands.shift();

		// Typescript thing
		if (!firstCommand) {
			throw new Error("No first command?");
		}

		// Use shell on windows environments
		const useShell = os.platform() === "win32";

		// Run command and return
		return await promisifiedSpawn(
			firstCommand,
			[...this.commands, ...this.args],
			{
				shell: useShell,
				cwd: this.packagePath,
			}
		);
	}
}
