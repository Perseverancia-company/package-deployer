import path from "path";
import fsp from "fs/promises";

import DefaultConfigFolder from "../configuration/DefaultConfigFolder";
import { ITaskDeploymentResult } from "../types";
import NodePackage from "@/package/NodePackage";

/**
 * Package deployer
 */
export default class PackageDeployer {
	packages: Array<NodePackage> = [];

	/**
	 * Package deployer constructor
	 *
	 * @param config
	 */
	constructor(nodePackages: Array<NodePackage>) {
		this.packages = nodePackages;
	}

	/**
	 * Deploy
	 */
	async deploy() {
		// Deploy all packages
		const packageDeploymentResult: Array<ITaskDeploymentResult> = [];
		for (const nodePackage of this.packages) {
			try {
				await nodePackage.install();
				await nodePackage.build();

				// Check that the package isn't private
				if (!nodePackage.packageJson.private) {
					await nodePackage.publish();
				}

				console.log(`Package ${nodePackage.packageName} deployed`);
				packageDeploymentResult.push({
					packageName: nodePackage.packageName,
					name: nodePackage.name,
					version: nodePackage.version,
					success: true,
				});
			} catch (err) {
				console.log(
					`Package ${nodePackage.packageName} failed to be deployed`
				);
				packageDeploymentResult.push({
					packageName: nodePackage.packageName,
					name: nodePackage.name,
					version: nodePackage.version,
					success: false,
				});
			}
		}

		// Save as json
		this.saveDeploymentResult(packageDeploymentResult);

		return packageDeploymentResult;
	}

	/**
	 * Save deployment result
	 */
	async saveDeploymentResult(deploymentResult: Array<ITaskDeploymentResult>) {
		// File path
		const filePath = path.join(
			DefaultConfigFolder.getPath(),
			"deploymentResult.json"
		);

		// Save as json
		return await fsp.writeFile(filePath, JSON.stringify(deploymentResult), {
			encoding: "utf-8",
		});
	}
}
