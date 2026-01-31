import axios from "axios";
import path from "path";
import fs from "fs";
import os from "os";

interface PackageInfo {
	name: string;
	description: string;
	[key: string]: any;
}

/**
 * Verdaccio Client Class
 *
 * This class provides a simple interface for interacting with a Verdaccio server.
 */
export default class VerdaccioClient {
	url: string;
	private username: string;
	private password: string;
	credentials: string;
	packages?: PackageInfo[];

	/**
	 * Constructor
	 *
	 * Initializes the Verdaccio client with the given URL and credentials.
	 *
	 * @param {string} url - The URL of the Verdaccio server.
	 * @param {string} username - The username to use for authentication.
	 * @param {string} password - The password to use for authentication.
	 */
	constructor(url: string, username: string, password: string) {
		this.url = url;
		this.username = username;
		this.password = password;
		this.credentials = Buffer.from(
			`${username}:${password}`,
			"utf8"
		).toString("base64");
	}

	/**
	 * Get username
	 *
	 * @returns
	 */
	getUsername() {
		return this.username;
	}

	/**
	 * Get password
	 *
	 * @returns
	 */
	getPassword() {
		return this.password;
	}

	/**
	 * Log success with a green checkmark
	 */
	private logSuccess(message: string): void {
		console.log(`\x1b[32m✔ ${message}\x1b[0m`);
	}

	/**
	 * Log failure with a red cross
	 */
	private logFailure(message: string): void {
		console.error(`\x1b[31m✖ ${message}\x1b[0m`);
	}

	/**
	 * Get All Packages
	 *
	 * Retrieves a list of all packages from the Verdaccio server.
	 *
	 * @returns {Promise<any[]>} A promise that resolves with an array of packages.
	 */
	async getAllPackages() {
		try {
			const response = await axios.get(`${this.url}-/all`, {
				headers: {
					Authorization: `Basic ${this.credentials}`,
					"Content-Type": "application/json",
				},
			});

			// console.log("Retrieved all packages, packages: ", response.data);
			console.log(`Retrieved all packages`);
			return response.data as {
				[key: string]: PackageInfo;
			};
		} catch (error: any) {
			console.error(`Error getting packages: `, error);
			throw error;
		}
	}

	/**
	 * Delete Package
	 *
	 * Deletes a package from the Verdaccio server.
	 *
	 * @param {string} packageName - The name of the package to delete.
	 * @param {boolean} dryRun - If true, only logs the action without performing it.
	 * @returns {Promise<void>} A promise that resolves when the package has been deleted.
	 */
	async deletePackage(packageName: string, dryRun = false) {
		const defaultVerdaccioStorage = path.join(
			os.homedir(),
			".local",
			"share",
			"verdaccio",
			"storage"
		);

		const verdaccioStorage = path.join(
			process.env.VERDACCIO_STORAGE || defaultVerdaccioStorage,
			packageName
		);

		if (dryRun) {
			this.logSuccess(
				`[Dry Run] Would delete package folder: ${verdaccioStorage}`
			);
			return;
		}

		try {
			if (fs.existsSync(verdaccioStorage)) {
				fs.rmSync(verdaccioStorage, { recursive: true, force: true });
				this.logSuccess(`Deleted package folder: ${verdaccioStorage}`);
			} else {
				this.logFailure(
					`Package ${packageName} does not exist in storage.`
				);
			}
		} catch (error) {
			this.logFailure(`Error deleting package ${packageName}: ${error}`);
		}
	}

	/**
	 * Delete Multiple Packages
	 *
	 * Deletes all packages that are within a given array of names.
	 *
	 * @param {string[]} packageNames - The array of package names to delete.
	 * @param {boolean} dryRun - If true, only logs the actions without performing them.
	 * @returns {Promise<void>} A promise that resolves when all packages have been deleted.
	 */
	async deletePackages(packageNames: string[], dryRun = false) {
		const allPackages = await this.getAllPackages();
		const packageNamesSet = new Set(Object.keys(allPackages));

		for (const packageName of packageNames) {
			if (!packageNamesSet.has(packageName)) {
				this.logFailure(`Package ${packageName} does not exist.`);
				continue;
			}

			try {
				await this.deletePackage(packageName, dryRun);
			} catch (error) {
				this.logFailure(
					`Failed to delete package ${packageName}: ${error}`
				);
			}
		}
	}
}
