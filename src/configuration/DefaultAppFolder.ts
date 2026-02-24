import os from "os";
import path from "path";
import fsp from "fs/promises";
import YAML from "yaml";

export interface IGlobalConfiguration {
	appPath: string;
}

/**
 * Default app folder
 */
export default class DefaultAppFolder {
	path: string;

	/**
	 * Create class
	 */
	constructor(appPath: string = path.join(os.homedir(), "perseverancia")) {
		this.path = appPath;
	}

	/**
	 * Set app path
	 */
	setAppPath(appPath: string) {
		this.path = appPath;
	}

	/**
	 * App path
	 */
	get appPath() {
		return this.path;
	}

	/**
	 * Repositories path
	 */
	get repositoriesPath() {
		return path.join(this.appPath, "repos");
	}

	/**
	 * Default monorepo path
	 */
	get monorepoPath() {
		return path.join(this.appPath, "monorepo");
	}

	/**
	 * Default configuration path
	 */
	get configurationPath() {
		return path.join(this.appPath, "configuration");
	}

	/**
	 * Default data path
	 */
	get dataPath() {
		return path.join(this.appPath, "data");
	}

	/**
	 * Default folder path
	 */
	static defaultFolderPath() {
		return path.join(os.homedir(), "perseverancia");
	}

	/**
	 * Get configuration path
	 */
	static globalConfigurationFilePath() {
		const appPath = DefaultAppFolder.defaultFolderPath();

		// Check if there's a different configuration over there
		const configurationFilePath = path.join(
			appPath,
			"globalConfiguration.yaml"
		);

		return configurationFilePath;
	}

	/**
	 * Create from global configuration
	 *
	 * @returns
	 */
	static async fromGlobalConfiguration(): Promise<DefaultAppFolder> {
		const configurationFilePath =
			DefaultAppFolder.globalConfigurationFilePath();
		try {
			// Read the file
			const fileData = await fsp.readFile(configurationFilePath, {
				encoding: "utf-8",
			});
			const configuration: IGlobalConfiguration = YAML.parse(fileData);

			return new DefaultAppFolder(configuration.appPath);
		} catch (err) {}

		// If that didn't work, then just return the object with the default path
		const defaultFolderPath = DefaultAppFolder.defaultFolderPath();
		return new DefaultAppFolder(defaultFolderPath);
	}

	/**
	 * Save configuration
	 */
	async saveGlobalConfiguration() {
		const appPath = DefaultAppFolder.globalConfigurationFilePath();

		const configuration: IGlobalConfiguration = {
			appPath: this.path,
		};
		const fileData = YAML.stringify(configuration);

		await fsp.writeFile(appPath, fileData);
	}

	/**
	 * Create folders
	 */
	async createFolders() {
		// Create main folder first
		await fsp.mkdir(this.appPath, {
			recursive: true,
		});

		// Now create the other folders
		const foldersPath = [
			this.repositoriesPath,
			this.monorepoPath,
			this.configurationPath,
			this.dataPath,
		];

		// Create folders
		const createPromises = [];
		for (const folderPath of foldersPath) {
			createPromises.push(
				(async () => {
					try {
						await fsp.mkdir(folderPath, {
							recursive: true,
						});
					} catch (err) {}
				})()
			);
		}
	}
}
