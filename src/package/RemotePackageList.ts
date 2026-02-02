import { IRemotePackageInfo } from "@/types";
import PackageDeployerConfiguration from "@/packageDeployer/PackageDeployerConfiguration";
import VerdaccioClient from "@/lib/VerdaccioClient";
import NodePackageList from "./NodePackageList";
import getVerdaccioFromConfiguration from "@/lib/verdaccio";

/**
 * Remote node packages list
 */
export default class RemotePackageList {
	nodePackages: Map<string, IRemotePackageInfo> = new Map();

	/**
	 *
	 */
	constructor(nodePackages: Map<string, IRemotePackageInfo>) {
		this.nodePackages = nodePackages;
	}

	/**
	 * Fetch remote packages
	 */
	static async fetchRemotePackages(
		config: PackageDeployerConfiguration,
		nodePackages: NodePackageList
	) {
		// Get verdaccio client from configuration
		const verdaccioClient = await getVerdaccioFromConfiguration(config);

		const remotePackagesList = await verdaccioClient.getAllPackages();
		const remotePackagesObjects = Object.values(remotePackagesList);

		// Local packages
		const localPackages = nodePackages.getNodePackages();

		// Remove packages that aren't on the 'packages' array
		const remotePkgs = remotePackagesObjects.filter((pkg) => {
			return localPackages.some((localPkg) => {
				return pkg.name === localPkg.packageName;
			});
		});

		// Remote package map for O(1) lookups
		const remotePackages = new Map(
			remotePkgs.map((pkg) => [pkg.name, pkg])
		);

		return new RemotePackageList(remotePackages);
	}

	/**
	 * Get packages
	 */
	getPackages() {
		return this.nodePackages;
	}
}
