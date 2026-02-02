import pc from "picocolors";

import PackageDeployerConfiguration from "./PackageDeployerConfiguration";
import NodePackageList from "@/package/NodePackageList";
import RemotePackageList from "@/package/RemotePackageList";
import PackagesFilter from "./PackagesFilter";
import PackageDeployer from "./PackageDeployer";
import { ITaskDeploymentResult } from "@/types";
import DeploymentState from "@/data/DeploymentState";

/**
 * Package deployer orchestrator
 */
export default class PackageDeployerOrchestrator {
	config: PackageDeployerConfiguration;
	packageList: NodePackageList;
	deployedState: DeploymentState;
	packageFilter: PackagesFilter;

	// When building ignore apps
	// Nice feature when you just need to update packages
	ignoreApps: boolean = false;

	/**
	 *
	 * @param config
	 * @param packageList
	 * @param remotePackageList
	 * @param options
	 */
	constructor(
		config: PackageDeployerConfiguration,
		packageList: NodePackageList,
		deploymentState: DeploymentState,
		options?: { ignoreApps?: boolean }
	) {
		this.config = config;
		this.packageList = packageList;
		this.deployedState = deploymentState;

		// Set options
		if (options) {
			// Ignore apps
			if (options.ignoreApps) {
				this.ignoreApps = options.ignoreApps;
			}
		}

		// Create package filter
		this.packageFilter = new PackagesFilter(
			config,
			packageList,
			deploymentState.getDeploymentStateAsMap(),
			{
				ignoreApps: this.ignoreApps,
			}
		);
	}

	/**
	 * Deploy all packages
	 */
	async deployAll() {
		const pkgDeployer = new PackageDeployer(
			this.packageList.getNodePackages()
		);
		const deploymentResult = await pkgDeployer.deploy();
		await this.saveSuccessfullyDeployedPackages(deploymentResult);
		return deploymentResult;
	}

	/**
	 * Deploy
	 *
	 * Deploy packages with some filters
	 * - Filters out using configuration whitelist
	 * - Filters out apps if given by the cli option
	 */
	async deploy() {
		const pkgDeployer = new PackageDeployer(
			this.packageFilter.filterByConfiguration()
		);
		const deploymentResult = await pkgDeployer.deploy();
		await this.saveSuccessfullyDeployedPackages(deploymentResult);
		return deploymentResult;
	}

	/**
	 * Incremental deployment
	 *
	 * This will only update packages that have changed.
	 */
	async incrementalDeployment() {
		// Get incremental build order and if it's zero return
		const incrementalBuildOrder =
			this.packageFilter.getIncrementalBuildOrder();
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
		const pkgDeployer = new PackageDeployer(incrementalBuildOrder);
		const deploymentResult = await pkgDeployer.deploy();
		await this.saveSuccessfullyDeployedPackages(deploymentResult);
		return deploymentResult;
	}

	/**
	 * Save successfully deployed packages
	 */
	async saveSuccessfullyDeployedPackages(
		taskDeploymentResults: Array<ITaskDeploymentResult>
	) {
		for (const task of taskDeploymentResults) {
			// If the task is successful set the package state
			if (task.success) {
				this.deployedState.setPackageState(
					task.packageName,
					task.version
				);
			}
		}

		return await this.deployedState.save();
	}
}
