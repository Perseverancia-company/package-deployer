import PackageDeployerConfiguration from "@/packageDeployer/PackageDeployerConfiguration";
import LocalRepositories from "@/repository/LocalRepositories";

/**
 * Pull command
 */
export default function pullMain(
	yargs: any,
	config: PackageDeployerConfiguration,
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
			const localRepositories = await LocalRepositories.fromPath(
				repositoriesPath,
				config.configuration.repositoriesListing.use === "whitelist"
					? config.getWhitelist()
					: [],
			);
			await localRepositories.pull();
		},
	);
}
