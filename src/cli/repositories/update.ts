import { RepositoryList } from "@/index";
import PackageDeployerConfiguration from "@/packageDeployer/PackageDeployerConfiguration";
import LocalRepositories from "@/repository/LocalRepositories";
import { Octokit } from "@octokit/rest";

/**
 * Update command
 */
export default function updateMain(
	yargs: any,
	config: PackageDeployerConfiguration,
	octokit: Octokit,
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
					RepositoryList.defaultConfigurationFile(),
					octokit,
				);
			} else {
				repositoryList = await RepositoryList.fromPath(
					RepositoryList.defaultConfigurationFile(),
					octokit,
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
			const localRepositories = await LocalRepositories.fromPath(
				repositoriesPath,
				config.configuration.repositoriesListing.use === "whitelist"
					? config.getWhitelist()
					: [],
			);

			// Push or pull repositories based on their last commit date
			await localRepositories.update();
		},
	);
}
