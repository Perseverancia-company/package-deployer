import path from "path";
import fsp from "fs/promises";

import { appsToNodePackages, getAllApps } from "../lib/apps";
import PackageDeployerConfiguration from "./PackageDeployerConfiguration";
import DefaultConfigFolder from "../configuration/DefaultConfigFolder";
import { ITaskDeploymentResult } from "../types";
import KhansDependencyGraph from "@/graph/KhansDependencyGraph";

/**
 * Package deployer
 */
export default class PackageDeployer {
	config: PackageDeployerConfiguration;
	whitelist: Array<string> = [];

	/**
	 * Package deployer constructor
	 *
	 * @param config
	 */
	constructor(
		config: PackageDeployerConfiguration,
		whitelist?: Array<string>
	) {
		this.config = config;
		this.whitelist = whitelist ? whitelist : [];
	}

	/**
	 * Deploy
	 */
	async deploy() {
		// Get all packages at the given path
		const allPackages = await getAllApps(this.config.getPackagesPath(), {
			blacklist: this.config.getBlacklist(),
		});

		// Create node packages class
		const nodePackages = await appsToNodePackages(allPackages);
		
		// Get the dependency graph
		const dependencyGraph = new KhansDependencyGraph(nodePackages);
		const buildOrder = dependencyGraph.getBuildOrder();
		
		// Filter out those that aren't in the whitelist
		const finalBuildOrder =
			this.whitelist.length > 0
				? buildOrder.filter((pkg) =>
						this.whitelist.includes(pkg.packageName)
				  )
				: buildOrder;

		// Deploy all packages
		const packageDeploymentResult: Array<ITaskDeploymentResult> = [];
		for (const nodePackage of finalBuildOrder) {
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
					success: true,
				});
			} catch (err) {
				console.log(
					`Package ${nodePackage.packageName} failed to be deployed`
				);
				packageDeploymentResult.push({
					packageName: nodePackage.packageName,
					name: nodePackage.name,
					success: false,
				});
			}
		}

		// Save as json
		this.saveDeploymentResult(packageDeploymentResult);
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
