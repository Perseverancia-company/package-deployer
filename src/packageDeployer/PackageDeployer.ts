import { ITaskDeploymentResult } from "../types";
import NodePackage from "@/package/NodePackage";

/**
 * Package deployer
 */
export default class PackageDeployer {
	packages: Array<NodePackage> = [];
	configurationFolderPath: string;

	onPackageDeployed?: (data: ITaskDeploymentResult) => Promise<void>;

	/**
	 * Package deployer constructor
	 *
	 * @param config
	 */
	constructor(
		nodePackages: Array<NodePackage>,
		configurationFolderPath: string,
		configuration?: {
			onPackageDeployed?: (data: ITaskDeploymentResult) => Promise<void>;
		}
	) {
		this.packages = nodePackages;
		this.configurationFolderPath = configurationFolderPath;

		if (configuration) {
			if (configuration.onPackageDeployed) {
				this.onPackageDeployed = configuration.onPackageDeployed;
			}
		}
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
			} catch (err) {
				console.log(
					`Package ${nodePackage.packageName} failed to be deployed`
				);
			}

			// Save package state
			const packageInfo = {
				packageName: nodePackage.packageName,
				name: nodePackage.name,
				version: nodePackage.version,
				success: true,
			};
			packageDeploymentResult.push(packageInfo);

			// Trigger callback
			if (this.onPackageDeployed) {
				await this.onPackageDeployed(packageInfo);
			}
		}

		return packageDeploymentResult;
	}
}
