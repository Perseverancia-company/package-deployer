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
		(yargs: any) => {
			return yargs
				.option("ignore-apps", {
					type: "boolean",
					description:
						"Ignore applications(to detect them, just whether the package is private is checked)",
				})
				.option("incremental", {
					type: "boolean",
					description: "Incremental deployment(defaults to true)",
					default: true,
				});
		},
		async (args: any) => {
			const ignoreApps = args.ignoreApps;
			const incrementalEnabled = args.incremental;

			const registryUsername = config.getRegistryUsername();
			const registryPassword = config.getRegistryPassword();
			if (registryPassword && registryUsername && incrementalEnabled) {
				console.log(`Smart(Incremental) package deployment`);

				// Package deployer
				const pkgDeployer = new PackageDeployer(config, {
					ignoreApps
				});
				await pkgDeployer.incrementalDeployment();
			} else {
				console.log(
					`No registry password nor username, defaulting to deploying all at once.\n`,
					`Make sure you set the registry username and password so that updates\n`,
					`are incremental, and you don't re-build what you already had.`
				);
				// Initialize package deployer and deploy all
				const pkgDeployer = new PackageDeployer(config, {
					ignoreApps,
				});
				await pkgDeployer.deploy();
			}
		}
	);
}
