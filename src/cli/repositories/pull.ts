import PackageDeployerConfiguration from "@/configuration/PackageDeployerConfiguration";
import RepositoryManager from "@/repository/RepositoryManager";
import AppState from "@/data/AppState";

/**
 * Pull command
 */
export default function pullMain(
	yargs: any,
	config: PackageDeployerConfiguration,
	state: AppState
) {
	return yargs.command(
		"pull",
		"Pull all repositories",
		(yargs: any) => {
			return yargs.option("path", {
				type: "string",
				description:
					"The path to the repositories, defaults to the default repositories path",
				default: config.getPackagesPath(),
			});
		},
		async (args: any) => {
			const repositoriesPath = args.path;

			// Pull all repositories
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
			await rm.pull();
		}
	);
}
