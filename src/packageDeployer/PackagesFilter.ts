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

	constructor(
		packageDeployerConfiguration: PackageDeployerConfiguration,
		localNodePackages: NodePackageList,
		remotePackageList: RemotePackageList
	) {
		this.config = packageDeployerConfiguration;
		this.localNodePackages = localNodePackages;
		this.remotePackageList = remotePackageList;
	}

	/**
	 * Filters by configuration whitelist/blacklist
	 */
	public filterByConfiguration() {
		return this.localNodePackages
			.getNodePackages()
			.filter((pkg) =>
				this.config.configuration.repositoriesListing.use ===
				"whitelist"
					? this.config.getWhitelist().includes(pkg.name)
					: !this.config.getBlacklist().includes(pkg.name)
			);
	}

	/**
	 * Finds only packages that need an update and their dependents
	 */
	public getIncrementalBuildOrder(): Array<NodePackage> {
		const directlyAffected = this.localNodePackages
			.getNodePackages()
			.filter((pkg) => {
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
