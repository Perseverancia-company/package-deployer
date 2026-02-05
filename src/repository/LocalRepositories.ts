import simpleGit from "simple-git";
import pc from "picocolors";

import LocalRepositoryList from "./LocalRepositoryList";
import { pullRepositoryIfNewer, updateRepository } from ".";

/**
 * Local repositories
 */
export default class LocalRepositories {
	path: string;
	repositoryList: LocalRepositoryList;
	whitelist: Array<string> = [];

	/**
	 *
	 * @param path
	 */
	constructor(
		path: string,
		repositoryList: LocalRepositoryList,
		whitelist: Array<string> = []
	) {
		this.path = path;
		this.repositoryList = repositoryList;
		this.whitelist = whitelist;
	}

	/**
	 * From path
	 *
	 * Create from the given path
	 */
	static async fromPath(folderPath: string, whitelist?: Array<string>) {
		const repositoryList = await LocalRepositoryList.fromPath(folderPath);
		return new LocalRepositories(folderPath, repositoryList, whitelist);
	}

	/**
	 * Filter repositories
	 */
	filterRepositories() {
		if (this.whitelist.length > 0) {
			const filteredRepositories =
				this.repositoryList.repositories.filter((repository) => {
					const repoName = repository.name;

					if (repoName === repository.name) {
						return true;
					}

					return false;
				});

			return filteredRepositories;
		}

		return this.repositoryList.repositories;
	}

	/**
	 * Update repository
	 *
	 * Fetch repository metadata and push or pull based on the last commit date.
	 */
	async update() {
		const repositories = this.filterRepositories();
		const CONCURRENCY_LIMIT = 3;

		console.log(
			pc.magenta(
				`📦 Batch processing ${repositories.length} repos (Concurrency ${CONCURRENCY_LIMIT})`
			)
		);

		for (let i = 0; i < repositories.length; i += CONCURRENCY_LIMIT) {
			const chunk = repositories.slice(i, i + CONCURRENCY_LIMIT);

			await Promise.allSettled(
				chunk.map(async (repository) => {
					try {
						await updateRepository(repository.path);
						console.log(
							`${pc.green("✔")} ${pc.bold(repository.name)}`
						);
					} catch (err: any) {
						console.error(
							pc.red(`❌ ${repository.name} failed:`),
							err.message
						);
					}
				})
			);

			if (i + CONCURRENCY_LIMIT < repositories.length) {
				console.log(pc.gray("--- Waiting for next batch ---"));
			}
		}

		console.log(pc.bgGreen(pc.black(" DONE ")));
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
					console.log(`Pulled ${repository.name}`);
				} else {
					console.log(`Repository ${repository.name} has no remote`);
				}
			} catch (err) {
				console.error(`Error: `, err);
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
				console.log(`Pushed ${repository.name}`);
			} catch (err) {
				console.error(`Error when pushing ${repository.name}: `, err);
			}
		}
	}
}
