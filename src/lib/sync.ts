import { Octokit } from "@octokit/rest";
import pc from "picocolors";

import LocalRepositoryList from "@/repository/LocalRepositoryList";
import { PackageDeployerConfiguration, RepositoryList } from "..";
import NodePackageList from "@/package/NodePackageList";
import DeploymentState from "@/data/DeploymentState";
import PackageDeployerOrchestrator from "@/packageDeployer/PackageDeployerOrchestrator";
import AppState from "@/data/AppState";
import RepositoryManager from "@/repository/RepositoryManager";

/**
 * Sync all
 */
export async function syncAll(
	config: PackageDeployerConfiguration,
	state: AppState,
	octokit: Octokit
) {
	const logging = config.configuration.logging;
	if (logging) {
		console.log(
			`\n${pc.bold(
				pc.cyan("🚀 Starting Sync Process for Perseverancia...")
			)}`
		);
	}

	// Get(locally) or fetch(from github) the repository list
	if (logging) {
		console.log(pc.blue("🔍 Fetching repository list..."));
	}
	const repositoryList = await RepositoryList.sync(
		RepositoryList.defaultConfigurationFile(config.configurationPath),
		octokit,
		config.repositoriesPath
	);
	if (logging) {
		console.log(pc.green("✅ Repository list synchronized."));
	}

	// Clone missing repositories
	if (logging) {
		console.log(pc.blue("📦 Checking for missing repositories..."));
	}
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

	if (logging) {
		console.log(pc.yellow("🔄 Updating local repositories..."));
	}
	const whitelist =
		config.configuration.repositoriesListing.use === "whitelist"
			? config.getWhitelist()
			: [];
	const rm = new RepositoryManager(
		config.getPackagesPath(),
		localRepositories,
		state,
		config,
		{
			whitelist,
			logging: config.getLogging(),
		}
	);
	await rm.update();

	// Get package list
	const packageList = await NodePackageList.fromPackagesPath(
		config.getPackagesPath()
	);

	// Deployment state
	const deploymentState = await DeploymentState.load(
		config.configurationPath
	);

	// Deploy all packages orchestrator
	if (logging) {
		console.log(pc.magenta("🏗️ Initializing Incremental Deployment..."));
	}
	const orchestrator = new PackageDeployerOrchestrator(
		config,
		packageList,
		deploymentState
	);
	await orchestrator.incrementalDeployment();

	if (logging) {
		console.log(
			`\n${pc.bold(
				pc.green("✨ Sync and Deployment completed successfully! ✨")
			)}\n`
		);
	}
}
