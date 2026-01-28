import path from "path";
import fsp from "fs/promises";
import os from "os";

import { appPackageJson } from "../apps";
import { promisifiedSpawn } from "../cmd";

/**
 * Node package
 */
export default class NodePackage {
	path: string;
	packageJson: any;
	packageName: string;
	name: string;

	constructor(appPath: string, packageJson: any) {
		this.path = appPath;
		this.packageJson = packageJson;

		// Get package name
		this.packageName = packageJson["name"];
		if (!this.packageName) {
			console.warn(`Package at ${this.path} doesn't has a name!`);
		}

		this.name = path.basename(appPath);
	}

	/**
	 * Create from a given path
	 */
	static async fromPath(appPath: string) {
		const packageJson = await appPackageJson(appPath);
		return new NodePackage(appPath, packageJson);
	}

	/**
	 * Save package json modifications
	 */
	async save() {
		const packageJsonPath = path.join(this.path, "package.json");
		await fsp.writeFile(
			packageJsonPath,
			JSON.stringify(this.packageJson, null, 4)
		);
	}

	/**
	 * Run npm install on the package
	 * 
	 * Package lock is ignored as I'm changing computers often
	 */
	async install() {
		if (os.platform() === "win32") {
			return await promisifiedSpawn(
				"npm",
				["install", "--no-package-lock"],
				{
					cwd: this.path,
					shell: true,
				}
			);
		} else {
			return await promisifiedSpawn(
				"npm",
				["install", "--no-package-lock"],
				{
					cwd: this.path,
				}
			);
		}
	}

	/**
	 * Run npm build
	 */
	async build() {
		if (os.platform() === "win32") {
			return await promisifiedSpawn("npm", ["run", "build"], {
				cwd: this.path,
				shell: true,
			});
		} else {
			return await promisifiedSpawn("npm", ["run", "build"], {
				cwd: this.path,
			});
		}
	}

	/**
	 * Run npm publish command
	 */
	async publish() {
		if (os.platform() === "win32") {
			return await promisifiedSpawn("npm", ["publish"], {
				cwd: this.path,
				shell: true,
			});
		} else {
			return await promisifiedSpawn("npm", ["publish"], {
				cwd: this.path,
			});
		}
	}
}
