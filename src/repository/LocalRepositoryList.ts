import { LocalRepositoryInfo } from "@/types";
import fsp from "fs/promises";
import path from "path";

/**
 * Local repository list
 *
 * Retrieve repositories from a path
 */
export default class LocalRepositoryList {
	path: string;
	repositories: Array<LocalRepositoryInfo>;

	/**
	 *
	 * @param path
	 */
	constructor(path: string, repositoriesInfo: Array<LocalRepositoryInfo>) {
		this.path = path;
		this.repositories = repositoriesInfo;
	}

	/**
	 * From path
	 *
	 * Create from the given path
	 */
	static async fromPath(folderPath: string) {
		// Repository list names
		const repositoryListNames = await fsp.readdir(folderPath);
		const repositories: Array<LocalRepositoryInfo> = [];

		// Fill list of repositories
		for (const repositoryName of repositoryListNames) {
			repositories.push({
				name: repositoryName,
				path: path.join(folderPath, repositoryName),
			});
		}

		return new LocalRepositoryList(folderPath, repositories);
	}
}
