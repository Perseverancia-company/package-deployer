import { appsToNodePackages, getAllPackages } from "@/lib/apps";
import NodePackage from "./NodePackage";

/**
 * Node package list
 */
export default class NodePackageList {
	nodePackages: Array<NodePackage> = [];

	/**
	 *
	 */
	constructor(nodePackages: Array<NodePackage>) {
		this.nodePackages = nodePackages;
	}

	/**
	 * From packages path
	 *
	 * Gets all packages, even those inside workspaces
	 *
	 * The whitelist filters the packages, and returns only those that are in it.
	 */
	static async fromPackagesPath(
		packagesPath: string,
		options?: {
			whitelist?: Array<string>;
		},
	) {
		// Get all packages from the given packages path
		const allPackages = await getAllPackages(packagesPath);

		// Filter them by the whitelist
		if (options && options.whitelist) {
			const whitelist = options.whitelist;
			const remainingPackages = allPackages.filter((pkg) =>
				whitelist.includes(pkg.packageName),
			);

			// Convert to node packages
			const nodePackages = await appsToNodePackages(remainingPackages);

			return new NodePackageList(nodePackages);
		}

		// Convert to node packages
		const nodePackages = await appsToNodePackages(allPackages);

		return new NodePackageList(nodePackages);
	}

	/**
	 * Get node packages
	 */
	getNodePackages() {
		return this.nodePackages;
	}

	/**
	 * Filter node packages with a whitelist
	 */
	getNodePackagesWhitelist(whitelist: Array<string>) {
		return this.nodePackages.filter((pkg) =>
			whitelist.includes(pkg.packageName),
		);
	}

	/**
	 * Filter node packages with a whitelist of folder names
	 */
	getNodePackagesFolderNameWhitelisted(whitelist: Array<string>) {
		return this.nodePackages.filter((pkg) => whitelist.includes(pkg.name));
	}

	/**
	 * Filter node packages with a blacklist of folder names
	 */
	getNodePackagesFolderNameBlacklisted(blacklist: Array<string>) {
		return this.nodePackages.filter((pkg) => !blacklist.includes(pkg.name));
	}
}
