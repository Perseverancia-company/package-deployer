import os from "os";
import path from "path";
import fsp from "fs/promises";

/**
 * Default configuration folder
 */
export default class DefaultConfigFolder {
	/**
	 * Main folder
	 */
	static mainFolderPath() {
		return path.join(os.homedir(), "perseverancia");
	}

	/**
	 * Repositories path
	 */
	static repositoriesPath() {
		return path.join(DefaultConfigFolder.mainFolderPath(), "repos");
	}

	/**
	 * Default monorepo path
	 */
	static monorepoPath() {
		return path.join(DefaultConfigFolder.mainFolderPath(), "monorepo");
	}

	/**
	 * Get default configuration folder path
	 */
	static getPath() {
		return path.join(DefaultConfigFolder.mainFolderPath(), "data");
	}

	/**
	 * Create default configuration folder
	 */
	static async createFolder() {
		return await fsp.mkdir(DefaultConfigFolder.getPath(), {
			recursive: true,
		});
	}
}
