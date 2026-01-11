import fsp from "fs/promises";
import path from "path";
import { Octokit } from "@octokit/rest";

import DefaultConfigFolder from "@/DefaultConfigFolder";
import PackageDeployerConfiguration from "@/PackageDeployerConfiguration";
import RepositoryList from "@/repository/RepositoryList";

/**
 * Configuration
 */
export default async function configurationMain(
	yargs: any,
	config: PackageDeployerConfiguration,
	octokit: Octokit
) {
	return yargs.command(
		"config",
		"Configuration management",
		function (yargs: any) {
			return yargs
				.command(
					"blacklist",
					"Repositories blacklist",
					(yargs: any) => {
						return yargs.option("list-add", {
							type: "string",
							description:
								"Add a list of repositories comma separated",
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
					}
				)
				.command(
					"whitelist",
					"Manage the whitelist",
					(yargs: any) => {
						return yargs.option("list-add", {
							type: "string",
							description:
								"Add a list of repositories comma separated",
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
						await config.save(DefaultConfigFolder.getPath());
					}
				)
				.command(
					"clone",
					"Clone repositories",
					(yargs: any) => {
						return yargs
							.option("use-whitelist", {
								type: "boolean",
								description: "Use the configuration whitelist",
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
							const repositoryList =
								await RepositoryList.fromPath(
									RepositoryList.defaultConfigurationFile(),
									octokit
								);

							// Clone all repositories
							// They are processed in batchs internally
							if (!useWhitelist) {
								await repositoryList.cloneAll();
							} else {
								await repositoryList.cloneAll({
									whitelist: config.getWhitelist(),
								});
							}
						}
					}
				)
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
						"Select can be only 'blacklist' or 'whitelist'"
					);
				}
			}

			// Save configuration
			await config.save();

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
		}
	);
}
