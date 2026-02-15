import { DefaultConfigFolder } from "@/index";
import PackageDeployerConfiguration from "@/configuration/PackageDeployerConfiguration";

/**
 * Whitelist command
 */
export default function whitelistMain(
	yargs: any,
	config: PackageDeployerConfiguration,
) {
	return yargs.command(
		"whitelist",
		"Manage the whitelist",
		(yargs: any) => {
			return yargs.option("list-add", {
				type: "string",
				description: "Add a list of repositories comma separated",
			});
		},
		async (args: any) => {
			// The list of repositories to add to the whitelist
			if (args.listAdd) {
				// List of repositories to whitelist
				const repositories = args.listAdd.split(",");

				const whitelist = config.getWhitelist();

				// Add repositories to the configuration file
				for (const repository of repositories) {
					// Check that the repository wasn't added already
					if (whitelist.includes(repository)) {
						continue;
					}

					config.whitelistAdd(repository);
				}
			}

			// Save configuration
			await config.save(config.configurationPath);
		},
	);
}
