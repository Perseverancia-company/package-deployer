import { Octokit } from "@octokit/rest";

import { RepositoryList } from "@/index";
import PackageDeployerConfiguration from "@/configuration/PackageDeployerConfiguration";
import RepositoryManager from "@/repository/RepositoryManager";
import AppState from "@/data/AppState";

/**
 * Update command
 */
export default function updateMain(
	yargs: any,
	config: PackageDeployerConfiguration,
	state: AppState,
	octokit: Octokit
) {
	return yargs.command(
		"update",
		"Push or pull repositories",
		(yargs: any) => {
			return yargs
				.option("path", {
					type: "string",
					description:
						"The path to the repositories, defaults to the default repositories path",
					default: config.getPackagesPath(),
				})
				.option("sync-info", {
					type: "boolean",
					description:
						"Synchronize local information with remote repository information",
					default: false,
				});
		},
		async (args: any) => {
			const repositoriesPath = args.path;

			// Update the repository information list from github
			let repositoryList;
			if (args.syncInfo) {
				repositoryList = await RepositoryList.sync(
					RepositoryList.defaultConfigurationFile(
						config.configurationPath
					),
					octokit,
					config.repositoriesPath
				);
			} else {
				repositoryList = await RepositoryList.fromPath(
					RepositoryList.defaultConfigurationFile(
						config.configurationPath
					),
					octokit,
					config.repositoriesPath
				);
			}

			// Clone and save
			await Promise.all([
				// Clone missing repositories
				repositoryList.cloneAll({
					whitelist: config.getWhitelist(),
					cloneAt: config.getPackagesPath(),
				}),
				// Save
				repositoryList.save(),
			]);

			// Get local repositories list
			const whitelist =
				config.configuration.repositoriesListing.use === "whitelist"
					? config.getWhitelist()
					: [];
			const rm = await RepositoryManager.fromPath(
				repositoriesPath,
				state,
				config,
				{
					whitelist,
					logging: config.getLogging(),
				}
			);

			// Push or pull repositories based on their last commit date
			await rm.update();
		}
	);
}
