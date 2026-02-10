import DefaultConfigFolder from "@/configuration/DefaultConfigFolder";
import PackageDeployerConfiguration from "@/packageDeployer/PackageDeployerConfiguration";

/**
 * Blacklist command
 */
export default function blacklistMain(
	yargs: any,
	config: PackageDeployerConfiguration,
) {
	return yargs.command(
		"blacklist",
		"Repositories blacklist",
		(yargs: any) => {
			return yargs.option("list-add", {
				type: "string",
				description: "Add a list of repositories comma separated",
			});
		},
		async (args: any) => {
			// The list of repositories to add to the blacklist
			if (args.listAdd) {
				// List of repositories to blacklist
				const repositories = args.listAdd.split(",");

				const blacklist = config.getBlacklist();

				// Add repositories to the configuration file
				for (const repository of repositories) {
					// Check that the repository wasn't added already
					if (blacklist.includes(repository)) {
						continue;
					}

					config.blacklistAdd(repository);
				}
			}

			// Save configuration
			await config.save(DefaultConfigFolder.getPath());
		},
	);
}
