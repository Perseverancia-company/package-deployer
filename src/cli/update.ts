import PackageDeployerConfiguration from "@/packageDeployer/PackageDeployerConfiguration";
import LocalRepositories from "@/repository/LocalRepositories";
import LocalRepositoryList from "@/repository/LocalRepositoryList";
import RepositoryList from "@/repository/RepositoryList";
import { Octokit } from "@octokit/rest";
import { PackageDeployer } from "..";
import NodePackageList from "@/package/NodePackageList";
import RemotePackageList from "@/package/RemotePackageList";

/**
 * Update things
 */
export default async function updateMain(
	yargs: any,
	config: PackageDeployerConfiguration,
	octokit: Octokit
) {
	return yargs.command(
		"update",
		"Update everything, package information, pull repositories, database package information, etc.",
		(yargs: any) => {
			return yargs;
		},
		async (args: any) => {
			// Get(locally) or fetch(from github) repository list
			const repositoryList = await RepositoryList.sync(
				RepositoryList.defaultConfigurationFile(),
				octokit
			);

			// Save
			await repositoryList.save();

			// Read all the repositories at the path
			const localRepositories = await LocalRepositoryList.fromPath(
				config.getPackagesPath()
			);

			// Pull all the repositories if they are newer on the remote
			const repositories = new LocalRepositories(
				config.getPackagesPath(),
				localRepositories
			);
			await repositories.pullIfNewer();

			// Get package list
			const packageList = await NodePackageList.fromPackagesPath(
				config.getPackagesPath()
			);
			const remotePackageList =
				await RemotePackageList.fetchRemotePackages(
					config,
					packageList
				);

			// Deploy all packages
			const registryUsername = config.getRegistryUsername();
			const registryPassword = config.getRegistryPassword();
			if (registryPassword && registryUsername) {
				console.log(`Smart(Incremental) package deployment`);

				// Package deployer
				const pkgDeployer = new PackageDeployer(
					config,
					packageList,
					remotePackageList
				);
				await pkgDeployer.incrementalDeployment();
			} else {
				console.log(
					`No registry password nor username, defaulting to deploying all at once.\n`,
					`Make sure you set the registry username and password so that updates\n`,
					`are incremental, and you don't re-build what you already had.`
				);
				// Initialize package deployer and deploy all
				const pkgDeployer = new PackageDeployer(
					config,
					packageList,
					remotePackageList
				);
				await pkgDeployer.deploy();
			}
		}
	);
}
