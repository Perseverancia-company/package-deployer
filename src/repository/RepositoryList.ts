import { Octokit } from "@octokit/rest";
import fsp from "fs/promises";
import path from "path";

import { RepositoryFileConfiguration } from "@/types";
import { getAllRepositories } from ".";
import DefaultConfigFolder from "@/DefaultConfigFolder";

/**
 * Repository list
 */
export default class RepositoryList {
	configurationFilePath: string;
	configuration: RepositoryFileConfiguration;
	octokit: Octokit;

	/**
	 * Constructor
	 */
	constructor(
		configurationFilePath: string,
		repoConfig: RepositoryFileConfiguration,
		octokit: Octokit
	) {
		this.configurationFilePath = configurationFilePath;
		this.configuration = repoConfig;
		this.octokit = octokit;
	}

	/**
	 * Default configuration file path
	 */
	static defaultConfigurationFile() {
		// File path
		const filePath = path.join(
			DefaultConfigFolder.getPath(),
			"userRepositories.json"
		);

		return filePath;
	}

	/**
	 * Save repository list
	 */
	async save() {
		return await fsp.writeFile(
			this.configurationFilePath,
			JSON.stringify(this.configuration)
		);
	}

	/**
	 * Get repositories
	 */
	getRepositories() {
		return this.configuration.repositories;
	}

	/**
	 * Sync
	 *
	 * Overwrite local repository information
	 */
	static async sync(configurationFilePath: string, octokit: Octokit) {
		// Get all repositories from the github user
		const repositories = await getAllRepositories(octokit);
		if (!repositories) {
			throw new Error("Couldn't fetch user repositories");
		}

		// Create config object
		const config: RepositoryFileConfiguration = {
			repositories,
			lastUpdated: new Date(),
		};

		// Instantiate class
		return new RepositoryList(configurationFilePath, config, octokit);
	}

	/**
	 * Create from a given path or fetch from github
	 */
	static async fromPath(configurationFilePath: string, octokit: Octokit) {
		try {
			// Try to load configuration
			const content = await fsp.readFile(configurationFilePath, "utf-8");
			const config: RepositoryFileConfiguration = JSON.parse(content);

			// Instantiate class
			return new RepositoryList(configurationFilePath, config, octokit);
		} catch (err) {
			// The file couldn't be read, it probably doesn't exists
			// Let's fetch user repository information
			const repositories = await getAllRepositories(octokit);
			if (!repositories) {
				throw new Error("Couldn't fetch user repositories");
			}

			// Create config object
			const config: RepositoryFileConfiguration = {
				repositories,
				lastUpdated: new Date(),
			};

			// Instantiate class
			return new RepositoryList(configurationFilePath, config, octokit);
		}
	}
}
