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
	 */
	static async fromPackagesPath(packagesPath: string) {
		// Get all packages from the given packages path
		const allPackages = await getAllPackages(packagesPath);

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
			whitelist.includes(pkg.packageName)
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
