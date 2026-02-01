import path from "path";
import fsp from "fs/promises";
import semver from "semver";

import { appsToNodePackages, getAllPackages } from "../lib/apps";
import PackageDeployerConfiguration from "./PackageDeployerConfiguration";
import DefaultConfigFolder from "../configuration/DefaultConfigFolder";
import { IRemotePackageInfo, ITaskDeploymentResult } from "../types";
import KhansDependencyGraph from "@/graph/KhansDependencyGraph";
import VerdaccioClient from "@/lib/VerdaccioClient";
import NodePackage from "@/package/NodePackage";

/**
 * Package deployer
 */
export default class PackageDeployer {
	config: PackageDeployerConfiguration;
	remotePackages: Map<string, IRemotePackageInfo> = new Map();
	nodePackages: Array<NodePackage> = [];
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
		options?: {
			whitelist?: Array<string>;
			ignoreApps?: boolean;
		}
	) {
		this.config = config;

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
		return this.nodePackages;
	}

	/**
	 * Get remote packages
	 */
	getRemotePackages() {
		return this.remotePackages;
	}

	/**
	 * Fetch node packages
	 */
	async fetchNodePackages() {
		// If there's at least one package return that
		if (this.nodePackages.length > 0) {
			return this.nodePackages;
		}

		// Get all packages at path
		const fetchPackages = await getAllPackages(
			this.config.getPackagesPath(),
			{
				// Filter out those that aren't in the whitelist
				blacklist: (
					await fsp.readdir(this.config.getPackagesPath())
				).filter((folderName) =>
					this.config.configuration.repositoriesListing.use ===
					"whitelist"
						? !this.config.getWhitelist().includes(folderName)
						: this.config.getBlacklist().includes(folderName)
				),
			}
		);

		// Filter out applications if the argument was given
		const allPackages = fetchPackages.filter((pkg) => {
			// Check if the user flagged ignore apps as true
			if (this.ignoreApps) {
				// Check if the package is private
				return !pkg.private;
			}

			// Otherwise all of them can pass
			return true;
		});

		// Create node packages class
		const nodePackages = await appsToNodePackages(allPackages);
		this.nodePackages = nodePackages;

		return this.nodePackages;
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
		const nodePackages = await this.fetchNodePackages();
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
	 * Incremental deployment
	 *
	 * This will ignore the given whitelist it will make its own
	 */
	async incrementalDeployment() {
		const nodePackages = await this.fetchNodePackages();
		const remotePackages = await this.fetchRemotePackages();

		const incrementalBuildOrder = this.getIncrementalBuildOrder();

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

	/**
	 * Fetch remote packages
	 */
	async fetchRemotePackages() {
		// Get verdaccio url
		const [registryUrl, registryUsername, registryPassword] = [
			this.config.getRegistryUrl(),
			this.config.getRegistryUsername(),
			this.config.getRegistryPassword(),
		];
		const verdaccioUrl = registryUrl
			? registryUrl
			: "http://localhost:4873";

		if (!registryUsername) {
			throw new Error(
				"Registry username is not set, cannot do incremental build."
			);
		}

		if (!registryPassword) {
			throw new Error(
				"Registry password is not set, cannot do incremental build."
			);
		}

		// We use verdaccio to get the remote packages
		const verdaccioClient = new VerdaccioClient(
			verdaccioUrl,
			registryUsername,
			registryPassword
		);
		const remotePackagesList = await verdaccioClient.getAllPackages();
		const remotePackagesObjects = Object.values(remotePackagesList);

		// Remove packages that aren't on the 'packages' array
		const remotePkgs = remotePackagesObjects.filter((pkg) =>
			this.getNodePackages().some((localPkg) => {
				return pkg.name === localPkg.packageName;
			})
		);

		// Remote package map for O(1) lookups
		const remotePackages = new Map(
			remotePkgs.map((pkg) => [pkg.name, pkg])
		);

		this.remotePackages = remotePackages;
		return this.remotePackages;
	}
}
