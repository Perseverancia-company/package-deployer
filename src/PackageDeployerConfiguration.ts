import YAML from "yaml";
import fsp from "fs/promises";
import path from "path";

import { IPackageDeployerConfiguration } from "./types";
import DefaultConfigFolder from "./DefaultConfigFolder";

export const DEPLOYER_CONFIG_FILENAME = "deployer-config.yaml";

/**
 * Package deployer configuration
 */
export default class PackageDeployerConfiguration {
	configuration: IPackageDeployerConfiguration;

	/**
	 * Package deployer configuration
	 */
	constructor(configuration: IPackageDeployerConfiguration) {
		this.configuration = configuration;
	}

	/**
	 * Blacklist
	 */
	blacklistAdd(packageName: string) {
		this.configuration.blacklist.push(packageName);
	}

	/**
	 * Get blacklist
	 */
	getBlacklist() {
		return this.configuration.blacklist;
	}

	/**
	 * Get packages path
	 */
	getPackagesPath() {
		return this.configuration.packagesPath;
	}

	/**
	 * Load
	 */
	static async load(configPath: string = process.cwd()) {
		// File path
		const filePath = path.join(configPath, DEPLOYER_CONFIG_FILENAME);

		try {
			// Read the file
			const fileData = await fsp.readFile(filePath, {
				encoding: "utf-8",
			});
			const configuration = YAML.parse(fileData);

			// Instantiate
			return new PackageDeployerConfiguration(configuration);
		} catch (err) {}

		// File doesn't exists, create it
		const data: IPackageDeployerConfiguration = {
			blacklist: [],
			packagesPath: DefaultConfigFolder.repositoriesPath(),
		};
		await fsp.writeFile(filePath, YAML.stringify(data));
		return new PackageDeployerConfiguration(data);
	}

	/**
	 * Save
	 */
	async save(configPath: string = process.cwd()) {
		// Filepath
		const filePath = path.join(configPath, DEPLOYER_CONFIG_FILENAME);

		// Write file
		const data = YAML.stringify(this.configuration);
		await fsp.writeFile(filePath, data, {
			encoding: "utf-8",
		});
	}
}
