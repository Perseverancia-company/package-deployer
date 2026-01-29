import PackageDeployerConfiguration from "@/PackageDeployerConfiguration";
import LocalRepositories from "@/repository/LocalRepositories";
import LocalRepositoryList from "@/repository/LocalRepositoryList";
import RepositoryList from "@/repository/RepositoryList";
import { Octokit } from "@octokit/rest";
import yargs from "yargs";
import { PackageDeployer } from "..";

/**
 * Update things
 */
export default async function updateMain(
	yargs: any,
	config: PackageDeployerConfiguration,
	octokit: Octokit,
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
				octokit,
			);

			// Save
			await repositoryList.save();

			// Read all the repositories at the path
			const localRepositories = await LocalRepositoryList.fromPath(
				config.getPackagesPath(),
			);

			// Pull all the repositories if they are newer on the remote
			const repositories = new LocalRepositories(
				config.getPackagesPath(),
				localRepositories,
			);
			await repositories.pullIfNewer();

			// Initialize package deployer and deploy all
			const pkgDeployer = new PackageDeployer(config);
			await pkgDeployer.deploy();
		},
	);
}
