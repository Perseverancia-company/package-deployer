import { Octokit } from "@octokit/rest";
import fsp from "fs/promises";
import path from "path";

import { RepositoryFileConfiguration } from "@/types";
import { getAllRepositories } from ".";
import DefaultConfigFolder from "@/DefaultConfigFolder";
import simpleGit from "simple-git";
import Repository from "./Repository";

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

	/**
	 * Clone all the repositories
	 */
	async cloneAll(
		options: {
			whitelist?: Array<string>;
			blacklist?: Array<string>;
		} = {}
	) {
		// Get lists
		const whitelist = options.whitelist;
		const blacklist = options.blacklist;

		// Cannot use both parameters
		if (blacklist && whitelist) {
			throw new Error(
				"Cannot pass both parameters 'blacklist' and 'whitelist' use one of them."
			);
		}

		// Create repository classes
		let repositories = this.getRepositories()
			// Create object
			.map((repository) => new Repository(repository));
		
		// If no list was given then all the repositories will be cloned
		if (whitelist) {
			// Filter repositories using the whitelist
			repositories = repositories.filter((repository) =>
				whitelist.includes(repository.repositoryInfo.name)
			);
		} else if (blacklist) {
			// Filter repositories using the blacklist
			repositories = repositories.filter((repository) =>
				blacklist.includes(repository.repositoryInfo.name)
			);
		}

		// Clone at path
		const cloneAt = DefaultConfigFolder.repositoriesPath();

		const git = simpleGit();

		// Concurrency limit
		const CONCURRENCY_LIMIT = 5;
		const results = { success: 0, failed: 0 };

		// We process clones in batchs to not saturate bandwidth
		for (let i = 0; i < repositories.length; i += CONCURRENCY_LIMIT) {
			const chunk = repositories.slice(i, i + CONCURRENCY_LIMIT);

			await Promise.all(
				chunk.map(async (repo) => {
					const dest = path.join(cloneAt, repo.repositoryInfo.name);

					try {
						console.log(`[Cloning] ${repo.repositoryInfo.name}...`);
						await git.clone(repo.sshUrl, dest);
						results.success++;
					} catch (err: any) {
						console.error(
							`❌ Error at ${repo.repositoryInfo.name}:`,
							err.message
						);
						results.failed++;
					}
				})
			);
		}

		console.log(
			`\n✅ Process finished with: ${results.success} successful clones and ${results.failed} failed clones.`
		);
	}
}
