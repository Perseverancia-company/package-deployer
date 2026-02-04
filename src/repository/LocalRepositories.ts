import simpleGit from "simple-git";
import LocalRepositoryList from "./LocalRepositoryList";
import { pullRepositoryIfNewer } from ".";

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
			try {
				await pullRepositoryIfNewer(repository.path);
			} catch (err) {}
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
