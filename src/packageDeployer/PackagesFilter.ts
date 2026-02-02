import semver from "semver";

import NodePackageList from "@/package/NodePackageList";
import RemotePackageList from "@/package/RemotePackageList";
import PackageDeployerConfiguration from "./PackageDeployerConfiguration";
import KhansDependencyGraph from "@/graph/KhansDependencyGraph";
import NodePackage from "@/package/NodePackage";

/**
 * Packages filter
 */
export default class PackagesFilter {
	config: PackageDeployerConfiguration;
	localNodePackages: NodePackageList;
	remotePackageList: RemotePackageList;

	// Whether to ignore applications
	ignoreApps: boolean = false;

	constructor(
		packageDeployerConfiguration: PackageDeployerConfiguration,
		localNodePackages: NodePackageList,
		remotePackageList: RemotePackageList,
		options?: {
			ignoreApps: boolean;
		}
	) {
		this.config = packageDeployerConfiguration;
		this.localNodePackages = localNodePackages;
		this.remotePackageList = remotePackageList;

		if (options) {
			if (options.ignoreApps) {
				this.ignoreApps = true;
			}
		}
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
	 */
	public filterByConfiguration() {
		const filteredPackages = this.localNodePackages
			.getNodePackages()
			.filter((pkg) =>
				this.config.configuration.repositoriesListing.use ===
				"whitelist"
					? this.config.getWhitelist().includes(pkg.name)
					: !this.config.getBlacklist().includes(pkg.name)
			);

		// Filter out applications if the argument was given
		const packages = filteredPackages.filter((pkg) => {
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
	 * Finds only packages that need an update and their dependents
	 *
	 * The result of incremental build, can leave gaps between packages
	 */
	public getIncrementalBuildOrder(): Array<NodePackage> {
		const directlyAffected = this.filterByConfiguration().filter((pkg) => {
			// Get remote package
			const remote = this.remotePackageList
				.getPackages()
				.get(pkg.packageName);

			return !remote || semver.gt(pkg.version, remote.version);
		});

		// Get directly affected packages
		const names = directlyAffected.map((p) => p.packageName);
		const graph = new KhansDependencyGraph(
			this.localNodePackages.getNodePackages()
		);

		// Get affected packages from the graph
		return graph.getAffectedPackages(names);
	}
}
