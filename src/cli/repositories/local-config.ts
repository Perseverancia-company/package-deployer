import PackageDeployerConfiguration from "@/configuration/PackageDeployerConfiguration";
import { setRepositoriesRemotePushUrls } from "@/repository";
import LocalRepositoryList from "@/repository/LocalRepositoryList";

/**
 * Local config command
 */
export default function localConfigMain(
	yargs: any,
	config: PackageDeployerConfiguration
) {
	return yargs.command(
		"local-config",
		"Configure local repositories",
		(yargs: any) => {
			return yargs
				.option("path", {
					type: "string",
					description:
						"The path to the repositories, defaults to the default repositories path",
					default: config.getPackagesPath(),
				})
				.option("preferred-configuration", {
					type: "boolean",
					description:
						"Set the preferred configuration check documentation for specifics",
					default: false,
				});
		},
		async (args: any) => {
			// Set preferred configuration on every repository
			if (args.preferredConfiguration) {
				// Read all the repositories at the path
				const localRepositories = await LocalRepositoryList.fromPath(
					args.path,
				);

				await setRepositoriesRemotePushUrls(localRepositories);

				console.log("🚀 Configuration update complete.");
			}
		},
	);
}
