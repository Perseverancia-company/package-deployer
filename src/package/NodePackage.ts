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

	// Whether node modules is there or not
	hasNodeModules: boolean;

	/**
	 * Constructor
	 *
	 * @param appPath
	 * @param packageJson
	 */
	constructor(appPath: string, packageJson: any, hasNodeModules: boolean) {
		this.path = appPath;
		this.packageJson = packageJson;
		this.hasNodeModules = hasNodeModules;

		// Get package name
		this.packageName = packageJson["name"];
		if (!this.packageName) {
			console.warn(`Package at ${this.path} doesn't has a name!`);
		}

		this.version = packageJson.version;

		this.name = path.basename(appPath);
	}

	/**
	 * Get dependencies and dev dependencies
	 */
	getDependencies() {
		return [
			...Object.keys(this.packageJson.dependencies),
			...Object.keys(this.packageJson.devDependencies),
		];
	}

	/**
	 * Create package manager based on whether it's npm or pnpm
	 */
	static async createPackageManager(
		packagePath: string,
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
	 * Check if it has node modules
	 */
	static async hasNodeModules(packagePath: string) {
		try {
			const nodeModulesPath = path.join(packagePath, "node_modules");
			await fsp.statfs(nodeModulesPath);

			return true;
		} catch (err) {}

		return false;
	}

	/**
	 * Create from a given path
	 */
	static async fromPath(packagePath: string) {
		// Get package json
		const [packageJson, hasNodeModules] = await Promise.all([
			appPackageJson(packagePath),
			NodePackage.hasNodeModules(packagePath),
		]);
		return new NodePackage(packagePath, packageJson, hasNodeModules);
	}

	/**
	 * Save package json modifications
	 */
	async save() {
		const packageJsonPath = path.join(this.path, "package.json");
		await fsp.writeFile(
			packageJsonPath,
			JSON.stringify(this.packageJson, null, 4),
		);
	}

	/**
	 * Run npm install on the package
	 *
	 * Package lock is ignored as I'm changing computers often
	 */
	async install() {
		const pkgMng = await NodePackage.createPackageManager(this.path);

		// Install packages, don't change package json and use force to ignore integrity checks
		return await pkgMng.install().lockPackageJson().force().run();
	}

	/**
	 * Update packages by name
	 */
	async updatePackages(packages: string[]) {
		const pkgMng = await NodePackage.createPackageManager(this.path);

		// We've gotta lock the package json so that pnpm doesn't converts asterisks(*) to
		// a version.
		// We also need to use force so that integrity checks are skipped
		pkgMng.update().lockPackageJson().force();

		// Add all packages to the update
		for (const packageName of packages) {
			pkgMng.addPackage(packageName);
		}

		return await pkgMng.run();
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
