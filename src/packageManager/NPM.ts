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

		// For windows
		if (os.platform() === "win32") {
			return promisifiedSpawn(
				firstCommand,
				[...this.commands, ...this.args],
				{
					shell: true,
					cwd: this.packagePath,
				}
			);
		} else {
			// Any other OS
			return promisifiedSpawn(
				firstCommand,
				[...this.commands, ...this.args],
				{
					cwd: this.packagePath,
				}
			);
		}
	}
}
