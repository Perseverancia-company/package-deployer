import path from "path";
import fsp from "fs/promises";
import semver from "semver";
import pc from "picocolors";

import PackageDeployerConfiguration from "./PackageDeployerConfiguration";
import DefaultConfigFolder from "../configuration/DefaultConfigFolder";
import { IRemotePackageInfo, ITaskDeploymentResult } from "../types";
import KhansDependencyGraph from "@/graph/KhansDependencyGraph";
import NodePackage from "@/package/NodePackage";
import NodePackageList from "@/package/NodePackageList";
import RemotePackageList from "@/package/RemotePackageList";

/**
 * Package deployer
 */
export default class PackageDeployer {
	config: PackageDeployerConfiguration;
	remotePackageList: RemotePackageList;
	nodePackagesList: NodePackageList;
	whitelist: Array<string> = [];

	// When building ignore apps
	// Nice feature when you just need to update packages
	ignoreApps: boolean = false;

	/**
	 * Package deployer constructor
	 *
	 * @param config
	 */
	constructor(
		config: PackageDeployerConfiguration,
		nodePackages: NodePackageList,
		remotePackageList: RemotePackageList,
		options?: {
			whitelist?: Array<string>;
			ignoreApps?: boolean;
		}
	) {
		this.config = config;
		this.nodePackagesList = nodePackages;
		this.remotePackageList = remotePackageList;

		// Set options
		if (options) {
			// Whitelist
			if (options.whitelist) {
				this.whitelist = options.whitelist;
			}

			// Ignore apps
			if (options.ignoreApps) {
				this.ignoreApps = options.ignoreApps;
			}
		}
	}

	/**
	 * Get node packages
	 *
	 * Call this only after fetching node packages
	 */
	getNodePackages() {
		// Whitelisted packages
		const whitelistedPackages =
			this.config.configuration.repositoriesListing.use === "whitelist"
				? this.nodePackagesList.getNodePackagesFolderNameWhitelisted(
						this.config.getWhitelist()
				  )
				: this.nodePackagesList.getNodePackagesFolderNameBlacklisted(
						this.config.getBlacklist()
				  );

		// Filter out applications if the argument was given
		const packages = whitelistedPackages.filter((pkg) => {
			// Check if the user flagged ignore apps as true
			if (this.ignoreApps) {
				// Check if the package is private
				return !pkg.packageJson.private;
			}

			// Otherwise all of them can pass
			return true;
		});

		return packages;
	}

	/**
	 * Get remote packages
	 */
	getRemotePackages() {
		return this.remotePackageList.getPackages();
	}

	/**
	 * Get build order
	 *
	 * Make sure that node packages exist
	 */
	getBuildOrder() {
		// Get the dependency graph
		const dependencyGraph = new KhansDependencyGraph(
			this.getNodePackages()
		);
		const buildOrder = dependencyGraph.getBuildOrder();

		// Filter out those that aren't in the whitelist
		const finalBuildOrder =
			this.whitelist.length > 0
				? buildOrder.filter((pkg) =>
						this.whitelist.includes(pkg.packageName)
				  )
				: buildOrder;

		return finalBuildOrder;
	}

	/**
	 * TODO: Has to be removed from this class
	 * Get incremental build order
	 *
	 * Make sure both, node packages and remote packages were fetch.
	 */
	getIncrementalBuildOrder() {
		const nodePackages = this.getNodePackages();
		const remotePackages = this.getRemotePackages();

		// The new whitelist will be the new packages
		const directlyAffectedNames = nodePackages
			.filter((pkg) => {
				// Get the remote package info
				const remotePkgInfo = remotePackages.get(pkg.packageName);

				// The package is not deployed
				if (!remotePkgInfo) {
					return true;
				}

				// Simple check, check if both versions differ
				return semver.gt(pkg.version, remotePkgInfo.version);
			})
			// Just get the package names
			.map((pkg) => pkg.packageName);

		// Use the Graph to find "Transitive" dependents
		// Even if App-B didn't change version, if Core-A (its dependency) changed,
		// App-B needs a redeploy.
		const graph = new KhansDependencyGraph(nodePackages);
		const finalBuildOrder = graph.getAffectedPackages(
			directlyAffectedNames
		);

		return finalBuildOrder;
	}

	/**
	 * Deploy
	 */
	async deploy(customBuildOrder?: Array<NodePackage>) {
		const buildOrder = customBuildOrder
			? customBuildOrder
			: this.getBuildOrder();

		// Deploy all packages
		const packageDeploymentResult: Array<ITaskDeploymentResult> = [];
		for (const nodePackage of buildOrder) {
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
	 * TODO: Has to be removed from this class
	 * Incremental deployment
	 *
	 * This will ignore the given whitelist it will make its own
	 */
	async incrementalDeployment() {
		// Get incremental build order and if it's zero return
		const incrementalBuildOrder = this.getIncrementalBuildOrder();
		if (incrementalBuildOrder.length === 0) {
			console.log(
				pc.green("✅ All packages are up to date. Nothing to deploy.")
			);
			return;
		}

		// Final build order and whitelist
		const whitelist = incrementalBuildOrder.map((pkg) => pkg.packageName);
		console.log(
			`🚀 Packages to deploy in order: ${whitelist.join(" => ")}`
		);

		// Initialize package deployer and deploy all
		await this.deploy(incrementalBuildOrder);
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
