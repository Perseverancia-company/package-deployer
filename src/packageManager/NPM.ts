import os from "os";
import { promisifiedSpawn } from "@/cmd";

/**
 * Npm package manager
 */
export default class NPM {
	packagePath: string;
	commands: Array<string> = ["npm"];
	args: Array<string> = [];

	/**
	 * NPM
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
		return promisifiedSpawn(
			firstCommand,
			[...this.commands, ...this.args],
			{
				shell: useShell,
				cwd: this.packagePath,
			}
		);
	}
}
