import YAML from "yaml";
import fsp from "fs/promises";
import path from "path";

import { IPackageDeployerConfiguration } from "../types";
import DefaultConfigFolder from "../configuration/DefaultConfigFolder";

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
	 * Get registry password
	 */
	getRegistryPassword() {
		return this.configuration.registryPassword;
	}

	/**
	 * Get registry url
	 */
	getRegistryUrl() {
		return this.configuration.registryUrl;
	}

	/**
	 * Get registry username
	 */
	getRegistryUsername() {
		return this.configuration.registryUsername;
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
	 * Set registry password
	 */
	setRegistryPassword(password: string) {
		this.configuration.registryPassword = password;
	}

	/**
	 * Set registry url
	 */
	setRegistryUrl(registryUrl: string) {
		this.configuration.registryUrl = registryUrl;
	}

	/**
	 * Set registry username
	 */
	setRegistryUsername(username: string) {
		this.configuration.registryUsername = username;
	}

	/**
	 * Load default package deployer configuration
	 */
	static async loadDefaultPackageDeployerConfiguration() {
		// File path
		const filePath = path.join(
			process.cwd(),
			"defaultPackageDeployerConfiguration.yaml"
		);

		try {
			// Read the file
			const fileData = await fsp.readFile(filePath, {
				encoding: "utf-8",
			});
			const configuration: IPackageDeployerConfiguration =
				YAML.parse(fileData);

			// Instantiate
			return configuration;
		} catch (err) {}
	}

	/**
	 * Load
	 */
	static async load(
		configuration: {
			configPath: string;
			useDefaults: boolean;
		} = {
			configPath: DefaultConfigFolder.getPath(),
			useDefaults: true,
		}
	) {
		// File path
		const filePath = path.join(
			configuration.configPath,
			DEPLOYER_CONFIG_FILENAME
		);

		try {
			// Read the file
			const fileData = await fsp.readFile(filePath, {
				encoding: "utf-8",
			});
			const configuration = YAML.parse(fileData);

			// Instantiate
			return new PackageDeployerConfiguration(configuration);
		} catch (err) {}

		// Default package deployer configuration
		const defaultPackageDeployerConfiguration:
			| IPackageDeployerConfiguration
			| undefined = await this.loadDefaultPackageDeployerConfiguration();

		// File doesn't exists, create it
		const data: IPackageDeployerConfiguration = {
			repositoriesListing: {
				blacklist: [],
				whitelist: [],
				use: "whitelist",
			},
			packagesPath: DefaultConfigFolder.repositoriesPath(),
			packagesBlacklist: [],
			// Override with default options
			...defaultPackageDeployerConfiguration,
		};
		await fsp.writeFile(filePath, YAML.stringify(data));
		return new PackageDeployerConfiguration(data);
	}

	/**
	 * Save
	 */
	async save(configPath: string = DefaultConfigFolder.getPath()) {
		// Filepath
		const filePath = path.join(configPath, DEPLOYER_CONFIG_FILENAME);

		// Write file
		const data = YAML.stringify(this.configuration);
		await fsp.writeFile(filePath, data, {
			encoding: "utf-8",
		});
	}
}
