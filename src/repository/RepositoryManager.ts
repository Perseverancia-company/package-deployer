import pc from "picocolors";
import simpleGit from "simple-git";

import LocalRepositoryList from "./LocalRepositoryList";
import { pullRepositoryIfNewer, updateRepository } from ".";
import AppState from "@/data/AppState";
import PackageDeployerConfiguration from "@/configuration/PackageDeployerConfiguration";

/**
 * # Repository manager
 *
 * Very similar to LocalRepositories, but the name of this
 * class is more appropriate for what it does.
 *
 * Repository manager uses a list of local repositories at the given path to
 * manage local repositories.
 *
 * The  tasks it does are listed here:
 *
 * ## Remote services integration
 *
 * Uses remote services like github, gitlab, bitbucket, etc. to clone, push
 * or pull repositories.
 *
 * ## Clone/Push/Pull consensus
 *
 * This are the policies used to clone, push or pull a repository from the remote
 * to the local machine.
 *
 * ### Clone policy
 *
 * In case that a repository doesn't exists locally, the repository will be
 * cloned locally.
 *
 * ### Pull policy
 *
 * It fetches repositories information from the remotes(github, gitlab,
 * bitbucket, etc.), if the remote version is newer than the
 * local version, then it pulls the repositories.
 *
 * ## Options
 *
 * Options can be used to configure the behavior of the class.
 *
 * - whitelist
 * The whitelist does exactly what you think, it only fetches/clones/pulls
 * repositories in that list.
 * - logging
 * Whether to log actions or not in the console/terminal(stdout, stderr).
 */
export default class RepositoryManager {
	path: string;
	repositoryList: LocalRepositoryList;
	state: AppState;
	config: PackageDeployerConfiguration;

	whitelist: Array<string> = [];
	logging: boolean = false;

	/**
	 * Create LocalRepositories class
	 *
	 * In the options you can pass a whitelist and the logging variable.
	 *
	 * @param path
	 */
	constructor(
		path: string,
		repositoryList: LocalRepositoryList,
		state: AppState,
		config: PackageDeployerConfiguration,
		options?: {
			whitelist?: Array<string>;
			logging?: boolean;
		}
	) {
		this.path = path;
		this.repositoryList = repositoryList;
		this.state = state;
		this.config = config;

		if (options) {
			if (options.logging) {
				this.logging = options.logging;
			}

			if (options.whitelist) {
				this.whitelist = options.whitelist;
			}
		}
	}

	/**
	 * From path
	 *
	 * Create from the given path
	 */
	static async fromPath(
		folderPath: string,
		state: AppState,
		config: PackageDeployerConfiguration,
		options?: {
			whitelist?: Array<string>;
			logging?: boolean;
			localRepositoryList?: LocalRepositoryList;
		}
	) {
		const repositoryList = await LocalRepositoryList.fromPath(folderPath);
		return new RepositoryManager(
			folderPath,
			repositoryList,
			state,
			config,
			options
		);
	}

	/**
	 * Filter repositories
	 *
	 * If there was a whitelist given this will only keep the repositories
	 * that are in that whitelist.
	 */
	filterRepositories() {
		if (this.whitelist.length > 0) {
			const filteredRepositories =
				this.repositoryList.repositories.filter((repository) => {
					const repoName = repository.name;

					if (this.whitelist.includes(repoName)) {
						return true;
					}

					return false;
				});

			return filteredRepositories;
		}

		return this.repositoryList.repositories;
	}

	/**
	 * Should update local repositories
	 *
	 * Checks whether the app should update repositories or not, normally
	 * if the check was done recently it won't update repositories locally.
	 */
	shouldUpdateRepositories() {
		// Push or pull based on the repositories last commit date
		// If the latest commit on the remote is newer the repository is pulled
		const lastUpdate = this.state.state.lastRepositoriesUpdate;
		console.log(`Last update: `, lastUpdate);
		const shouldUpdateRepositories = lastUpdate
			? lastUpdate.getTime() +
					this.config.configuration.updateRepositoriesEvery <
			  Date.now()
			: true; // Default to true if the last repositories update date doesn't exists

		return shouldUpdateRepositories;
	}

	/**
	 * Update repository
	 *
	 * Fetch repository metadata and push or pull based on the last commit date.
	 *
	 * TODO: Clones a repository when it doesn't exists locally.
	 */
	async update() {
		const repositories = this.filterRepositories();
		const CONCURRENCY_LIMIT = 3;

		const shouldUpdateRepositories = this.shouldUpdateRepositories();

		// Only if should update repositories is true, actually update
		if (shouldUpdateRepositories) {
			if (this.logging) {
				console.log(
					pc.magenta(
						`📦 Batch processing ${repositories.length} repos (Concurrency ${CONCURRENCY_LIMIT})`
					)
				);
			}

			// Push or pull repositories
			for (let i = 0; i < repositories.length; i += CONCURRENCY_LIMIT) {
				const chunk = repositories.slice(i, i + CONCURRENCY_LIMIT);

				await Promise.allSettled(
					chunk.map(async (repository) => {
						try {
							// Update repository handles pushing or pulling
							await updateRepository(repository.path);
							if (this.logging) {
								console.log(
									`${pc.green("✔")} ${pc.bold(
										repository.name
									)}`
								);
							}
						} catch (err: any) {
							if (this.logging) {
								console.error(
									pc.red(`❌ ${repository.name} failed:`),
									err.message
								);
							}
						}
					})
				);

				if (this.logging) {
					if (i + CONCURRENCY_LIMIT < repositories.length) {
						console.log(pc.gray("--- Waiting for next batch ---"));
					}
				}
			}

			if (this.logging) {
				console.log(pc.bgGreen(pc.black(" DONE ")));
			}

			// Save state
			this.state.setLastRepositoriesUpdate(new Date());
			await this.state.save();
		} else {
			if (this.logging) {
				console.log(pc.green("✅ Don't update repositories."));
			}
		}
	}

	/**
	 * Pull all repositories
	 */
	async pull() {
		for (const repository of this.repositoryList.repositories) {
			try {
				// Create git object and pull
				const git = simpleGit(repository.path);
				const remote = await git.remote(["get-url", "origin"]);

				if (remote) {
					await git.pull(remote);
					if (this.logging) {
						console.log(`Pulled ${repository.name}`);
					}
				} else {
					if (this.logging) {
						console.log(
							`Repository ${repository.name} has no remote`
						);
					}
				}
			} catch (err) {
				if (this.logging) {
					console.error(`Error: `, err);
				}
			}
		}
	}

	/**
	 * Pull if newer
	 */
	async pullIfNewer() {
		// Filter repositories by the whitelist
		const filteredRepositories = this.filterRepositories();
		for (const repository of filteredRepositories) {
			try {
				await pullRepositoryIfNewer(repository.path);
			} catch (err) {}
		}
	}

	/**
	 * Push all repositories
	 */
	async push() {
		// Filter repositories by the whitelist
		const filteredRepositories = this.filterRepositories();
		for (const repository of filteredRepositories) {
			try {
				const git = simpleGit(repository.path);
				await git.push();
				if (this.logging) {
					console.log(`Pushed ${repository.name}`);
				}
			} catch (err) {
				if (this.logging) {
					console.error(
						`Error when pushing ${repository.name}: `,
						err
					);
				}
			}
		}
	}
}
