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
	const logging = config.configuration.logging;
	if (logging) {
		console.log(
			`\n${pc.bold(
				pc.cyan("🚀 Starting Sync Process for Perseverancia...")
			)}`
		);
	}

	// Get(locally) or fetch(from github) repository list
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

	// Pull all the repositories if they are newer on the remote
	// Push or pull based on the repositories last commit date
	// Check whether it's time to do the pull or not
	const lastUpdate = state.state.lastRepositoriesUpdate;
	const shouldUpdateRepositories = lastUpdate
		? lastUpdate.getTime() + config.configuration.updateRepositoriesEvery <
		  Date.now()
		: true; // Default to true if the last repositories update date doesn't exists
	if (shouldUpdateRepositories) {
		if (logging) {
			console.log(pc.yellow("🔄 Updating local repositories..."));
		}
		const whitelist =
			config.configuration.repositoriesListing.use === "whitelist"
				? config.getWhitelist()
				: [];
		const repositories = new LocalRepositories(
			config.getPackagesPath(),
			localRepositories,
			{
				whitelist,
				logging: config.getLogging(),
			}
		);
		await repositories.update();

		// Save state
		await state.save();
		if (logging) {
			console.log(pc.green("✅ All repositories are up to date."));
		}
	} else {
		if (logging) {
			console.log(pc.green("✅ Don't update repositories."));
		}
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
