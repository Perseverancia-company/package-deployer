import PackageDeployerConfiguration from "@/packageDeployer/PackageDeployerConfiguration";
import LocalRepositories from "@/repository/LocalRepositories";
import LocalRepositoryList from "@/repository/LocalRepositoryList";
import RepositoryList from "@/repository/RepositoryList";
import { Octokit } from "@octokit/rest";
import NodePackageList from "@/package/NodePackageList";
import RemotePackageList from "@/package/RemotePackageList";
import PackageDeployerOrchestrator from "@/packageDeployer/PackageDeployerOrchestrator";
import DeploymentState from "@/data/DeploymentState";

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
			
			// Clone missing repositories
			await repositoryList.cloneAll({
				whitelist: config.getWhitelist(),
				cloneAt: config.getPackagesPath(),
			});

			// Save
			await repositoryList.save();

			// Read all the repositories at the path
			const localRepositories = await LocalRepositoryList.fromPath(
				config.getPackagesPath()
			);

			// Pull all the repositories if they are newer on the remote
			const repositories = new LocalRepositories(
				config.getPackagesPath(),
				localRepositories,
				config.configuration.repositoriesListing.use === "whitelist"
					? config.getWhitelist()
					: []
			);

			// Push or pull based on the repositories last commit date
			await repositories.update();

			// Get package list
			const packageList = await NodePackageList.fromPackagesPath(
				config.getPackagesPath()
			);

			// Deployment state
			const deploymentState = await DeploymentState.load();

			// Deploy all packages orchestrator
			const orchestrator = new PackageDeployerOrchestrator(
				config,
				packageList,
				deploymentState
			);
			await orchestrator.incrementalDeployment();
		}
	);
}
