import path from "path";
import fsp from "fs/promises";

import { appPackageJson } from "../lib/apps";
import { PackageManagerEngine } from "@/types";
import NPM from "@/packageManager/NPM";
import PNPM from "@/packageManager/PNPM";

/**
 * Node package
 */
export default class NodePackage {
	path: string;
	version: string;
	packageJson: any;
	packageName: string;
	name: string;

	/**
	 * Constructor
	 *
	 * @param appPath
	 * @param packageJson
	 */
	constructor(appPath: string, packageJson: any) {
		this.path = appPath;
		this.packageJson = packageJson;

		// Get package name
		this.packageName = packageJson["name"];
		if (!this.packageName) {
			console.warn(`Package at ${this.path} doesn't has a name!`);
		}

		this.version = packageJson.version;

		this.name = path.basename(appPath);
	}

	/**
	 * Create package manager based on whether it's npm or pnpm
	 */
	static async createPackageManager(
		packagePath: string
	): Promise<PackageManagerEngine> {
		try {
			// Check if it has package lock
			await fsp.stat(path.join(packagePath, "package-lock.json"));

			// Create npm engine
			return new NPM(packagePath);
		} catch (err) {
			// Assume it's pnpm for now
			return new PNPM(packagePath);
		}
	}

	/**
	 * Create from a given path
	 */
	static async fromPath(packagePath: string) {
		// Get package json
		const packageJson = await appPackageJson(packagePath);
		return new NodePackage(packagePath, packageJson);
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
		const pkgMng = await NodePackage.createPackageManager(this.path);
		return await pkgMng.install().noPackageLock().run();
	}

	/**
	 * Run npm build
	 */
	async build() {
		const pkgMng = await NodePackage.createPackageManager(this.path);
		return await pkgMng.runCommand().build().run();
	}

	/**
	 * Run npm publish command
	 */
	async publish() {
		const pkgMng = await NodePackage.createPackageManager(this.path);
		return await pkgMng.publish().run();
	}
}
