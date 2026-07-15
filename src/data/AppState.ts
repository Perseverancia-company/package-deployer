import fsp from "fs/promises";
import path from "path";
import YAML from "yaml";

import { IDeployerState } from "@/types";

/**
 * App state
 *
 * This stores app state.
 */
export default class AppState {
	state: IDeployerState = {};
	statePath: string;

	/**
	 * Create class object
	 *
	 * You can load previous state in the options
	 *
	 * @param options
	 */
	constructor(
		statePath: string,
		options?: { previousState?: IDeployerState }
	) {
		this.statePath = statePath;

		if (options) {
			// Load previous state
			if (options.previousState) {
				this.state = options.previousState;
			}
		}
	}

	/**
	 * Set last repositories update date
	 */
	setLastRepositoriesUpdate(updateDate: Date) {
		console.log(`Setting the new repository date to: `, updateDate);
		this.state.lastRepositoriesUpdate = updateDate;
	}

	// --- Storage ---
	/**
	 * Get file path
	 */
	static filePath(statePath: string) {
		// File path
		const filePath = path.join(statePath, "deployerState.yaml");
		return filePath;
	}

	/**
	 * Load
	 */
	static async load(statePath: string) {
		try {
			// Read file
			const data = await fsp.readFile(AppState.filePath(statePath), {
				encoding: "utf-8",
			});

			// Parse data
			const parsedData = YAML.parse(data);

			// Create instance
			return new AppState(statePath, {
				previousState: parsedData,
			});
		} catch (err) {}

		// Create new with empty state
		return new AppState(statePath);
	}

	/**
	 * Save deployer state
	 */
	async save() {
		const data = YAML.stringify(this.state);

		// Save as json
		return await fsp.writeFile(AppState.filePath(this.statePath), data, {
			encoding: "utf-8",
		});
	}
}
