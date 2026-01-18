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
		const entries = await fsp.readdir(folderPath, { withFileTypes: true });
		const repositories: Array<LocalRepositoryInfo> = [];

		// Fill list of repositories
		for (const entry of entries) {
			if (entry.isDirectory()) {
				const fullPath = path.join(folderPath, entry.name);
				const gitPath = path.join(fullPath, ".git");

				// Only add if it contains a .git folder
				try {
					await fsp.access(gitPath);
					repositories.push({
						name: entry.name,
						path: fullPath,
					});
				} catch {
					// Not a git repo, skip
				}
			}
		}

		return new LocalRepositoryList(folderPath, repositories);
	}
}
