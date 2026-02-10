import { RepositoryList } from "@/index";
import PackageDeployerConfiguration from "@/packageDeployer/PackageDeployerConfiguration";
import { Octokit } from "@octokit/rest";

/**
 * Clone command
 */
export default function cloneMain(
	yargs: any,
	config: PackageDeployerConfiguration,
	octokit: Octokit,
) {
	return yargs.command(
		"clone",
		"Clone repositories",
		(yargs: any) => {
			return yargs
				.option("use-whitelist", {
					type: "boolean",
					description: "Use the configuration whitelist",
					default: false,
				})
				.option("all", {
					type: "boolean",
					description: "Clone all the repositories",
				});
		},
		async (args: any) => {
			// Use whitelist
			const useWhitelist = args.useWhitelist;

			// Clone all the repositories
			if (args.all) {
				// Get(locally) or fetch(from github) repository list
				const repositoryList = await RepositoryList.fromPath(
					RepositoryList.defaultConfigurationFile(),
					octokit,
				);

				// Clone all repositories
				// They are processed in batchs internally
				if (!useWhitelist) {
					await repositoryList.cloneAll({
						cloneAt: config.getPackagesPath(),
					});
				} else {
					await repositoryList.cloneAll({
						whitelist: config.getWhitelist(),
						cloneAt: config.getPackagesPath(),
					});
				}
			}
		},
	);
}
