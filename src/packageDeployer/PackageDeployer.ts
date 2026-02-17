import path from "path";
import fsp from "fs/promises";

import { ITaskDeploymentResult } from "../types";
import NodePackage from "@/package/NodePackage";

/**
 * Package deployer
 */
export default class PackageDeployer {
	packages: Array<NodePackage> = [];
	configurationFolderPath: string;

	/**
	 * Package deployer constructor
	 *
	 * @param config
	 */
	constructor(nodePackages: Array<NodePackage>, configurationFolderPath: string) {
		this.packages = nodePackages;
		this.configurationFolderPath = configurationFolderPath;
	}

	/**
	 * Deploy
	 */
	async deploy() {
		// Deploy all packages
		const packageDeploymentResult: Array<ITaskDeploymentResult> = [];
		for (const nodePackage of this.packages) {
			try {
				// Install packages for the first time
				if (!nodePackage.hasNodeModules) {
					await nodePackage.install();
				}

				// No matter what we may still need to update our own packages
				// Get dependencies
				const dependencies = nodePackage.getDependencies();

				// Get only dependencies that are in the list
				const packagesToUpdate = this.packages
					.filter((pkg) => dependencies.includes(pkg.packageName))
					.map((pkg) => pkg.packageName);

				await nodePackage.updatePackages(packagesToUpdate);

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
					`Package ${nodePackage.packageName} failed to be deployed`,
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
			this.configurationFolderPath,
			"deploymentResult.json",
		);

		// Save as json
		return await fsp.writeFile(filePath, JSON.stringify(deploymentResult), {
			encoding: "utf-8",
		});
	}
}
