import semver from "semver";

import NodePackageList from "@/package/NodePackageList";
import PackageDeployerConfiguration from "../configuration/PackageDeployerConfiguration";
import KhansDependencyGraph from "@/graph/KhansDependencyGraph";
import NodePackage from "@/package/NodePackage";

/**
 * Packages filter
 */
export default class PackagesFilter {
	config: PackageDeployerConfiguration;
	localNodePackages: NodePackageList;
	deployedPackages: Map<string, { version: string }>;

	// Whether to ignore applications
	ignoreApps: boolean = false;

	constructor(
		packageDeployerConfiguration: PackageDeployerConfiguration,
		localNodePackages: NodePackageList,
		deployedPackages: Map<string, { version: string }>,
		options?: {
			ignoreApps: boolean;
		}
	) {
		this.config = packageDeployerConfiguration;
		this.localNodePackages = localNodePackages;
		this.deployedPackages = deployedPackages;

		if (options) {
			if (options.ignoreApps) {
				this.ignoreApps = true;
			}
		}
	}

	/**
	 * Filter given packages by configuration
	 */
	public filterGivenPackagesByConfiguration(
		nodePackages: Array<NodePackage>
	) {
		const filteredPackages = nodePackages.filter((pkg) => {
			// Configuration whitelist/blacklist uses repositories/folder names
			if (
				!(this.config.configuration.repositoriesListing.use ===
				"whitelist"
					? this.config.getWhitelist().includes(pkg.name)
					: !this.config.getBlacklist().includes(pkg.name))
			) {
				return false;
			}

			// Check if the user flagged ignore apps as true
			if (this.ignoreApps) {
				// Check if the package is private
				return !pkg.packageJson.private;
			}

			// Otherwise all of them can pass
			return true;
		});

		return filteredPackages;
	}

	/**
	 * Filters by configuration whitelist/blacklist
	 *
	 * This shouldn't leave "gaps"
	 *
	 * Suppose this hierarchy
	 *
	 * Package A -> Package B -> Package C
	 *
	 * If package C is contained, the result of this function must
	 * have its previous dependencies always.
	 *
	 * If you want to save deployment time, use incremental build order.
	 */
	public filterByConfiguration() {
		return this.filterGivenPackagesByConfiguration(
			this.localNodePackages.getNodePackages()
		);
	}

	/**
	 * Affected packages
	 *
	 * This returns a list of packages that haven't been deployed and
	 * packages that have changed their version.
	 */
	public affectedPackages() {
		// Directly affected packages
		const directlyAffected = this.localNodePackages
			.getNodePackages()
			.filter((pkg) => {
				// Get remote package
				const remote = this.deployedPackages.get(pkg.packageName);

				return !remote || semver.gt(pkg.version, remote.version);
			});

		return directlyAffected;
	}

	/**
	 * Finds only packages that need an update and their dependents
	 *
	 * The result of incremental build, can leave gaps between packages
	 */
	public getIncrementalBuildOrder(): Array<NodePackage> {
		const allPackages = this.localNodePackages.getNodePackages();

		// Get packages that have changed versions or weren't deployed
		const directlyAffected = this.affectedPackages();

		// Get directly affected packages
		const names = directlyAffected.map((p) => p.packageName);
		const graph = new KhansDependencyGraph(allPackages);

		// Get affected packages from the graph
		const affectedPackages = graph.getAffectedPackages(names);

		// Apply policies filter (Ignore apps, check whitelist/blacklist)
		const finalDeploymentOrder =
			this.filterGivenPackagesByConfiguration(affectedPackages);

		return finalDeploymentOrder;
	}
}
