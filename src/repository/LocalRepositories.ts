import simpleGit from "simple-git";
import LocalRepositoryList from "./LocalRepositoryList";

/**
 * Local repositories
 */
export default class LocalRepositories {
	path: string;
	repositoryList: LocalRepositoryList;

	/**
	 *
	 * @param path
	 */
	constructor(path: string, repositoryList: LocalRepositoryList) {
		this.path = path;
		this.repositoryList = repositoryList;
	}

	/**
	 * From path
	 *
	 * Create from the given path
	 */
	static async fromPath(folderPath: string) {
		const repositoryList = await LocalRepositoryList.fromPath(folderPath);
		return new LocalRepositories(folderPath, repositoryList);
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
		for (const repository of this.repositoryList.repositories) {
			const git = simpleGit(repository.path);

			// Fetch the latest metadata
			await git.fetch();

			// Get the latest local commit date
			const localLog = await git.log({ n: 1 });
			const localDate = localLog.latest
				? new Date(localLog.latest.date)
				: new Date(0);

			// Get the latest remote commit date (tracking branch)
			// We assume 'origin/main' or 'origin/master'.
			// Using '@{u}' (upstream) is the most robust way to reference the remote tracking branch.
			const remoteLog = await git.log(["-1", "@{u}"]);
			const remoteDate = remoteLog
				? new Date(remoteLog.latest.date)
				: new Date(0);
		}
	}

	/**
	 * Push all repositories
	 */
	async push() {
		for (const repository of this.repositoryList.repositories) {
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
