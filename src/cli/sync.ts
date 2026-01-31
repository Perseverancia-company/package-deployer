import { Octokit } from "@octokit/rest";

import PackageDeployerConfiguration from "@/packageDeployer/PackageDeployerConfiguration";
import RepositoryList from "@/repository/RepositoryList";

/**
 * Sync
 */
export default async function syncMain(
	yargs: any,
	config: PackageDeployerConfiguration,
	octokit: Octokit
) {
	return yargs.command(
		"sync",
		"Sync things",
		(args: any) => {
			return args.option("repositories", {
				type: "boolean",
				description: "Sync repositories information fetching it from the services",
			});
		},
		async (args: any) => {
			// Get repository information from github
			if (args.repositories) {
				// Get(locally) or fetch(from github) repository list
				const repositoryList = await RepositoryList.sync(
					RepositoryList.defaultConfigurationFile(),
					octokit
				);

				// Save
				await repositoryList.save();
			}
		}
	);
}
