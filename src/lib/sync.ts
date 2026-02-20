import { Octokit } from "@octokit/rest";

import LocalRepositoryList from "@/repository/LocalRepositoryList";
import { PackageDeployerConfiguration, RepositoryList } from "..";
import LocalRepositories from "@/repository/LocalRepositories";
import NodePackageList from "@/package/NodePackageList";
import DeploymentState from "@/data/DeploymentState";
import PackageDeployerOrchestrator from "@/packageDeployer/PackageDeployerOrchestrator";

/**
 * Sync all
 */
export async function syncAll(
	config: PackageDeployerConfiguration,
	octokit: Octokit,
) {
	// Get(locally) or fetch(from github) repository list
	const repositoryList = await RepositoryList.sync(
		RepositoryList.defaultConfigurationFile(config.configurationPath),
		octokit,
		config.repositoriesPath,
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
		config.getPackagesPath(),
	);

	// Pull all the repositories if they are newer on the remote
	const repositories = new LocalRepositories(
		config.getPackagesPath(),
		localRepositories,
		config.configuration.repositoriesListing.use === "whitelist"
			? config.getWhitelist()
			: [],
	);

	// Push or pull based on the repositories last commit date
	await repositories.update();

	// Get package list
	const packageList = await NodePackageList.fromPackagesPath(
		config.getPackagesPath(),
	);

	// Deployment state
	const deploymentState = await DeploymentState.load(
		config.configurationPath,
	);

	// Deploy all packages orchestrator
	const orchestrator = new PackageDeployerOrchestrator(
		config,
		packageList,
		deploymentState,
	);
	await orchestrator.incrementalDeployment();
}
