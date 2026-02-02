import pc from "picocolors";

import PackageDeployerConfiguration from "./PackageDeployerConfiguration";
import NodePackageList from "@/package/NodePackageList";
import RemotePackageList from "@/package/RemotePackageList";
import PackagesFilter from "./PackagesFilter";
import PackageDeployer from "./PackageDeployer";

/**
 * Package deployer orchestrator
 */
export default class PackageDeployerOrchestrator {
	config: PackageDeployerConfiguration;
	packageList: NodePackageList;
	deployedPackages: Map<string, { version: string }>;
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
		deployedPackages: Map<string, { version: string }> = new Map(),
		options?: { ignoreApps?: boolean }
	) {
		this.config = config;
		this.packageList = packageList;
		this.deployedPackages = deployedPackages;

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
			this.deployedPackages,
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
		return await pkgDeployer.deploy();
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
		return await pkgDeployer.deploy();
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
		return await pkgDeployer.deploy();
	}
}
