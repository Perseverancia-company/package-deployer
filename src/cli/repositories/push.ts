import PackageDeployerConfiguration from "@/configuration/PackageDeployerConfiguration";
import LocalRepositories from "@/repository/LocalRepositories";

/**
 * Push command
 */
export default function pushMain(
	yargs: any,
	config: PackageDeployerConfiguration,
) {
	return yargs.command(
		"push",
		"Push all repositories",
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
			const localRepositories = await LocalRepositories.fromPath(
				repositoriesPath,
				config.configuration.repositoriesListing.use === "whitelist"
					? config.getWhitelist()
					: [],
			);
			await localRepositories.push();
		},
	);
}
