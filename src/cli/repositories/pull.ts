import PackageDeployerConfiguration from "@/configuration/PackageDeployerConfiguration";
import LocalRepositories from "@/repository/LocalRepositories";

/**
 * Pull command
 */
export default function pullMain(
	yargs: any,
	config: PackageDeployerConfiguration
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
			const localRepositories = await LocalRepositories.fromPath(
				repositoriesPath,
				{
					whitelist,
					logging: config.getLogging(),
				}
			);
			await localRepositories.pull();
		}
	);
}
