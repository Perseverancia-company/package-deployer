import YAML from "yaml";
import fsp from "fs/promises";
import path from "path";

import { IPackageDeployerConfiguration } from "./types";

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
	 * Get blacklist
	 */
	getBlacklist() {
		return this.configuration.blacklist;
	}

	/**
	 * Load
	 */
	static async load(configPath: string = process.cwd()) {
		const fileData = await fsp.readFile(
			path.join(configPath, DEPLOYER_CONFIG_FILENAME),
			{
				encoding: "utf-8",
			}
		);
		const configuration = YAML.parse(fileData);

		return new PackageDeployerConfiguration(configuration);
	}

	/**
	 * Save
	 */
	async save() {
		const data = YAML.stringify(this.configuration);
		await fsp.writeFile(DEPLOYER_CONFIG_FILENAME, data, {
			encoding: "utf-8",
		});
	}
}
