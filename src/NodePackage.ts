import path from "path";
import fsp from "fs/promises";

import { appPackageJson } from "./apps";
import { promisifiedSpawn } from "./cmd";

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
	 */
	async install() {
		return await promisifiedSpawn("npm", ["install"], { cwd: this.path });
	}

	/**
	 * Run npm build
	 */
	async build() {
		return await promisifiedSpawn("npm", ["run", "build"], {
			cwd: this.path,
		});
	}

	/**
	 * Run npm publish command
	 */
	async publish() {
		return await promisifiedSpawn("npm", ["publish"], {
			cwd: this.path,
		});
	}
}
