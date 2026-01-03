import fsp from "fs/promises";

import DefaultConfigFolder from "@/DefaultConfigFolder";

/**
 * Repositories folder
 */
export default class RepositoriesFolder {
	repositoriesPath: string;

	/**
	 * Repositories folder
	 */
	constructor(reposPath: string = DefaultConfigFolder.repositoriesPath()) {
		this.repositoriesPath = reposPath;
	}

	/**
	 * Get path
	 */
	getPath() {
		return this.repositoriesPath;
	}

	/**
	 * Create folder
	 */
	async createFolder() {
		return await fsp.mkdir(this.getPath(), {
			recursive: true,
		});
	}
}
