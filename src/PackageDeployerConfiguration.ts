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
	 * Add a repository to the whitelist
	 */
	whitelistAdd(repositoryName: string) {
		this.configuration.repositoriesListing.whitelist.push(repositoryName);
	}

	/**
	 * Get whitelist
	 */
	getWhitelist() {
		return this.configuration.repositoriesListing.whitelist;
	}

	/**
	 * Set list in effect
	 */
	setListType(listType: "whitelist" | "blacklist") {
		this.configuration.repositoriesListing.use = listType;
	}

	/**
	 * Add to the repository blacklist
	 */
	blacklistAdd(repositoryName: string) {
		this.configuration.repositoriesListing.blacklist.push(repositoryName);
	}

	/**
	 * Add package name to the packages blacklist
	 */
	packageBlacklistAdd(packageName: string) {
		this.configuration.repositoriesListing.blacklist.push(packageName);
	}

	/**
	 * Get blacklist
	 */
	getBlacklist() {
		return this.configuration.repositoriesListing.blacklist;
	}

	/**
	 * Get packages path
	 */
	getPackagesPath() {
		return this.configuration.packagesPath;
	}
	
	/**
	 * Set packages path
	 */
	setPackagesPath(packagesPath: string) {
		this.configuration.packagesPath = packagesPath;
	}

	/**
	 * Set the github token
	 */
	setGithubToken(githubToken: string) {
		this.configuration.githubToken = githubToken;
	}
	
	/**
	 * Set the github user url
	 */
	setGithubUserUrl(githubUserUrl: string) {
		this.configuration.githubProfileUrl = githubUserUrl;
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
			repositoriesListing: {
				blacklist: [],
				whitelist: [],
				use: "whitelist",
			},
			packagesPath: DefaultConfigFolder.repositoriesPath(),
			packagesBlacklist: [],
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
