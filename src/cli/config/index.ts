import fsp from "fs/promises";
import path from "path";
import { Octokit } from "@octokit/rest";

import PackageDeployerConfiguration from "@/configuration/PackageDeployerConfiguration";
import blacklistMain from "./blacklist";
import setMain from "./set";
import whitelistMain from "./whitelist";

/**
 * Configuration
 */
export default async function configurationMain(
	yargs: any,
	config: PackageDeployerConfiguration
) {
	return yargs.command(
		"config",
		"Configuration management",
		function (yargs: any) {
			// Run subcommands
			blacklistMain(yargs, config);
			setMain(yargs, config);
			whitelistMain(yargs, config);

			return yargs
				.option("select", {
					type: "string",
					description: "Select what type of allow list to use",
				})
				.option("delete-blacklisted", {
					type: "boolean",
					description:
						"Delete repositories on the local machine, that are on the blacklist.",
				});
		},
		async (args: any) => {
			// Select
			if (args.select) {
				const select = args.select;

				// Select list type
				if (select === "blacklist" || select === "whitelist") {
					// Set list type
					config.setListType(select);
				} else {
					throw new Error(
						"Select can be only 'blacklist' or 'whitelist'",
					);
				}
			}

			// Save configuration
			await config.save(config.configurationPath);

			// Delete local repositories
			if (args.deleteBlacklisted) {
				// Read repositories at path
				const packagesPath = config.getPackagesPath();
				const repositories = await fsp.readdir(packagesPath);
				const blacklist = config.getBlacklist();
				for (const repoName of repositories) {
					// Remove repositories in the blacklist
					if (blacklist.includes(repoName)) {
						// Get repository path
						const fullRepoPath = path.join(packagesPath, repoName);

						// Remove directory
						await fsp.rm(fullRepoPath, {
							recursive: true,
						});
					}
				}
			}
		},
	);
}
