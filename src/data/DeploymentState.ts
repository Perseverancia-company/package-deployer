import fsp from "fs/promises";
import path from "path";
import { parse, stringify } from "yaml";

import { IDeploymentState } from "@/types";

/**
 * Deployment state
 *
 * To track down what packages were deployed
 *
 * Only successful deployments should be stored here
 */
export default class DeploymentState {
	deploymentState: IDeploymentState = {
		successes: {},
		failures: {},
	};

	/**
	 * Create class object
	 *
	 * You can load previous state in the options
	 *
	 * @param options
	 */
	constructor(options?: { previousState?: IDeploymentState }) {
		if (options) {
			// Load previous state
			if (options.previousState) {
				this.deploymentState = options.previousState;
			}
		}
	}

	/**
	 * Get deployment state
	 */
	getDeploymentState() {
		return this.deploymentState;
	}

	/**
	 * Get deployment state as map
	 *
	 * Merges both successes and failures
	 */
	getDeploymentStateAsMap() {
		const resultingMap: Map<string, { version: string }> = new Map();

		// Get successes
		for (const key of Object.keys(this.deploymentState.successes)) {
			const state = this.deploymentState.successes[key];
			resultingMap.set(key, { version: state });
		}

		// Get failures
		for (const key of Object.keys(this.deploymentState.failures)) {
			const state = this.deploymentState.failures[key];
			resultingMap.set(key, { version: state });
		}

		return resultingMap;
	}

	/**
	 * Set package state
	 */
	setPackageState(packageName: string, version: string, success: boolean) {
		if (success) {
			this.deploymentState.successes[packageName] = version;
		} else {
			this.deploymentState.failures[packageName];
		}

		return this;
	}

	/**
	 * Get file path
	 */
	static filePath(configurationPath: string) {
		// File path
		const filePath = path.join(
			configurationPath,
			"packageDeploymentState.yaml"
		);
		return filePath;
	}

	/**
	 * Load
	 */
	static async load(configurationPath: string) {
		try {
			// Read file
			const data = await fsp.readFile(
				DeploymentState.filePath(configurationPath),
				{
					encoding: "utf-8",
				}
			);

			// Parse data
			const parsedData = parse(data);

			// Create instance
			return new DeploymentState({
				previousState: parsedData,
			});
		} catch (err) {}

		// Create new with empty state
		return new DeploymentState();
	}

	/**
	 * Save deployment state
	 */
	async save(configurationPath: string) {
		const data = stringify(this.deploymentState);

		// Save as json
		return await fsp.writeFile(
			DeploymentState.filePath(configurationPath),
			data,
			{
				encoding: "utf-8",
			}
		);
	}
}
