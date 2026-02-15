import PackageDeployerConfiguration from "@/configuration/PackageDeployerConfiguration";
import { setRepositoriesRemotePushUrls } from "@/repository";
import LocalRepositoryList from "@/repository/LocalRepositoryList";
import path from "path";

/**
 * Local config command
 */
export default function localConfigMain(
	yargs: any,
	config: PackageDeployerConfiguration,
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
				})
				.option("bare-repositories-path", {
					type: "string",
					description:
						"The path to the bare repositories, the local repositories will be pushed to these if they exist.",
					default: path.join("/srv", "git", "user", "Javascript"),
				});
		},
		async (args: any) => {
			const bareRepositoriesPath: string = args.bareRepositoriesPath;

			// Set preferred configuration on every repository
			if (args.preferredConfiguration) {
				// Read all the repositories at the path
				const localRepositories = await LocalRepositoryList.fromPath(
					args.path,
				);

				// Set repositories remote push urls
				await setRepositoriesRemotePushUrls(
					localRepositories,
					bareRepositoriesPath,
				);

				console.log("🚀 Configuration update complete.");
			}
		},
	);
}
