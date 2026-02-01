import semver from "semver";
import fsp from "fs/promises";

import PackageDeployerConfiguration from "@/packageDeployer/PackageDeployerConfiguration";
import {
	appsToNodePackages,
	getAllPackages,
	KhansDependencyGraph,
	PackageDeployer,
	VerdaccioClient,
} from "..";

/**
 * Deploy all packages
 */
export default async function deployMain(
	yargs: any,
	config: PackageDeployerConfiguration
) {
	return yargs.command(
		"deploy",
		"Read a folder and deploy all packages",
		(args: any) => {},
		async (args: any) => {
			const registryUsername = config.getRegistryUsername();
			const registryPassword = config.getRegistryPassword();
			if (registryPassword && registryUsername) {
				console.log(`Smart(Incremental) package deployment`);

				// Get all packages at path
				const packages = await getAllPackages(
					config.getPackagesPath(),
					{
						// Filter out those that aren't in the whitelist
						blacklist: (
							await fsp.readdir(config.getPackagesPath())
						).filter((folderName) =>
							config.configuration.repositoriesListing.use ===
							"whitelist"
								? !config.getWhitelist().includes(folderName)
								: config.getBlacklist().includes(folderName)
						),
					}
				);

				// Get verdaccio url
				const registryUrl = config.getRegistryUrl();
				const verdaccioUrl = registryUrl
					? registryUrl
					: "http://localhost:4873";
				console.log(`Verdaccio url: `, verdaccioUrl);
				console.log(`Username: `, registryUsername);
				console.log(`Password: `, registryPassword);

				// We use verdaccio to get the remote packages
				const verdaccioClient = new VerdaccioClient(
					verdaccioUrl,
					registryUsername,
					registryPassword
				);
				const remotePackagesList =
					await verdaccioClient.getAllPackages();
				const remotePackagesObjects = Object.values(remotePackagesList);

				// Remove packages that aren't on the 'packages' array
				const remotePackages = remotePackagesObjects.filter((pkg) =>
					packages.some((localPkg) => {
						return pkg.name === localPkg.name;
					})
				);

				// Remote package map for O(1) lookups
				const remotePkgMap = new Map(
					remotePackages.map((pkg) => [pkg.name, pkg])
				);

				// The new whitelist will be the new packages
				const directlyAffectedNames = packages
					.filter((pkg) => {
						// Get the remote package info
						const remotePkgInfo = remotePkgMap.get(pkg.name);

						// The package is not deployed
						if (!remotePkgInfo) {
							return true;
						}

						// Simple check, check if both versions differ
						return semver.gt(pkg.version, remotePkgInfo.version);
					})
					// Just get the package names
					.map((pkg) => pkg.name);

				// Use the Graph to find "Transitive" dependents
				// Even if App-B didn't change version, if Core-A (its dependency) changed,
				// App-B needs a redeploy.
				const nodePackages = await appsToNodePackages(packages);
				const graph = new KhansDependencyGraph(nodePackages);
				const finalBuildOrder = graph.getAffectedPackages(
					directlyAffectedNames
				);

				// Final whitelist
				const whitelist = finalBuildOrder.map((pkg) => pkg.name);

				// Initialize package deployer and deploy all
				const pkgDeployer = new PackageDeployer(config, whitelist);
				await pkgDeployer.deploy();

				console.log(`🚀 Packages to deploy: ${whitelist.join(", ")}`);
			} else {
				console.log(
					`No registry password nor username, defaulting to deploying all at once.\n`,
					`Make sure you set the registry username and password so that updates\n`,
					`are incremental, and you don't re-build what you already had.`
				);
				// Initialize package deployer and deploy all
				const pkgDeployer = new PackageDeployer(config);
				await pkgDeployer.deploy();
			}
		}
	);
}
