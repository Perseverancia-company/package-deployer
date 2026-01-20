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
}
