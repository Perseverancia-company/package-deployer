import os from "os";
import path from "path";
import fsp from "fs/promises";

/**
 * Default configuration folder
 */
export default class DefaultConfigFolder {
	/**
	 * Get default configuration folder path
	 */
	static getPath() {
		return path.join(os.homedir(), "perseverancia", "data");
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
