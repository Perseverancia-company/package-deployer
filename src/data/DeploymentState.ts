import fsp from "fs/promises";
import DefaultConfigFolder from "@/configuration/DefaultConfigFolder";
import path from "path";
import { parse, stringify } from "yaml";

/**
 * Deployment state
 *
 * To track down what packages were deployed
 *
 * Only successful deployments should be stored here
 */
export default class DeploymentState {
	deploymentState: {
		[packageName: string]: string;
	} = {};

	/**
	 * Create class object
	 *
	 * You can load previous state in the options
	 *
	 * @param options
	 */
	constructor(options?: { previousState?: {} }) {
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
	 */
	getDeploymentStateAsMap() {
		const resultingMap = new Map();
		for (const key of Object.keys(this.deploymentState)) {
			resultingMap.set(key, this.deploymentState[key]);
		}

		return resultingMap;
	}

	/**
	 * Set package state
	 */
	setPackageState(packageName: string, version: string) {
		this.deploymentState[packageName] = version;
		return this;
	}

	/**
	 * Get file path
	 */
	static filePath() {
		// File path
		const filePath = path.join(
			DefaultConfigFolder.getPath(),
			"packageDeploymentState.yaml"
		);
		return filePath;
	}

	/**
	 * Load
	 */
	static async load() {
		try {
			// Read file
			const data = await fsp.readFile(DeploymentState.filePath(), {
				encoding: "utf-8",
			});

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
	async save() {
		const data = stringify(this.deploymentState);

		// Save as json
		return await fsp.writeFile(DeploymentState.filePath(), data, {
			encoding: "utf-8",
		});
	}
}
