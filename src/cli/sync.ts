import { Octokit } from "@octokit/rest";

import RepositoryList from "@/repository/RepositoryList";
import { PackageDeployerConfiguration } from "..";
import { syncAll } from "@/lib/sync";

/**
 * Sync
 */
export default async function syncMain(
	yargs: any,
	config: PackageDeployerConfiguration,
	octokit: Octokit,
) {
	return yargs.command(
		"sync",
		"Sync things",
		(args: any) => {
			return args
				.option("repositories", {
					type: "boolean",
					description:
						"Sync repositories information fetching it from the services",
				})
				.option("all", {
					type: "boolean",
					description:
						"Synchronize all, same behavior as 'update' command",
				});
		},
		async (args: any) => {
			if (args.all) {
				await syncAll(config, octokit);

				// Don't continue
				return;
			}

			// Get repository information from github
			if (args.repositories) {
				// Get(locally) or fetch(from github) repository list
				const repositoryList = await RepositoryList.sync(
					RepositoryList.defaultConfigurationFile(
						config.configurationPath,
					),
					octokit,
					config.repositoriesPath,
				);

				// Save
				await repositoryList.save();
			}
		},
	);
}
