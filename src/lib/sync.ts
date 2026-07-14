import { Octokit } from "@octokit/rest";
import pc from "picocolors";

import LocalRepositoryList from "@/repository/LocalRepositoryList";
import { PackageDeployerConfiguration, RepositoryList } from "..";
import LocalRepositories from "@/repository/LocalRepositories";
import NodePackageList from "@/package/NodePackageList";
import DeploymentState from "@/data/DeploymentState";
import PackageDeployerOrchestrator from "@/packageDeployer/PackageDeployerOrchestrator";
import AppState from "@/data/AppState";

/**
 * Sync all
 */
export async function syncAll(
	config: PackageDeployerConfiguration,
	state: AppState,
	octokit: Octokit
) {
	console.log(
		`\n${pc.bold(pc.cyan("🚀 Starting Sync Process for Perseverancia..."))}`
	);

	// Get(locally) or fetch(from github) repository list
	console.log(pc.blue("🔍 Fetching repository list..."));
	const repositoryList = await RepositoryList.sync(
		RepositoryList.defaultConfigurationFile(config.configurationPath),
		octokit,
		config.repositoriesPath
	);
	console.log(pc.green("✅ Repository list synchronized."));

	// Clone missing repositories
	console.log(pc.blue("📦 Checking for missing repositories..."));
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
	// Push or pull based on the repositories last commit date
	// Check whether it's time to do the pull or not
	const lastUpdate = state.state.lastRepositoriesUpdate;
	const shouldUpdateRepositories = lastUpdate
		? lastUpdate.getTime() + config.configuration.updateRepositoriesEvery <
		  Date.now()
		: true; // Default to true if the last repositories update date doesn't exists
	if (shouldUpdateRepositories) {
		console.log(pc.yellow("🔄 Updating local repositories..."));
		const repositories = new LocalRepositories(
			config.getPackagesPath(),
			localRepositories,
			config.configuration.repositoriesListing.use === "whitelist"
				? config.getWhitelist()
				: []
		);
		await repositories.update();

		// Save state
		await state.save();
		console.log(pc.green("✅ All repositories are up to date."));
	} else {
		console.log(pc.green("✅ Don't update repositories."));
	}

	// Get package list
	const packageList = await NodePackageList.fromPackagesPath(
		config.getPackagesPath()
	);

	// Deployment state
	const deploymentState = await DeploymentState.load(
		config.configurationPath
	);

	// Deploy all packages orchestrator
	console.log(pc.magenta("🏗️ Initializing Incremental Deployment..."));
	const orchestrator = new PackageDeployerOrchestrator(
		config,
		packageList,
		deploymentState
	);
	await orchestrator.incrementalDeployment();

	console.log(
		`\n${pc.bold(
			pc.green("✨ Sync and Deployment completed successfully! ✨")
		)}\n`
	);
}
