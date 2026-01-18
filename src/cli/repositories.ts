import { Octokit } from "@octokit/rest";
import fsp from "fs/promises";
import path from "path";

import DefaultConfigFolder from "@/DefaultConfigFolder";
import PackageDeployerConfiguration from "@/PackageDeployerConfiguration";
import RepositoryList from "@/repository/RepositoryList";
import { cloneAllAtPath, generateMonorepo } from "@/lib";
import LocalRepositoryList from "@/repository/LocalRepositoryList";

/**
 * Repositories command
 */
export default async function repositoriesMain(
	yargs: any,
	config: PackageDeployerConfiguration,
	octokit: Octokit,
) {
	return yargs.command(
		"repositories",
		"Repositories management",
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
					},
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
					},
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
							// Get the whitelist if allowed
							let whitelist: Array<string> | undefined =
								undefined;
							if (useWhitelist) {
								whitelist = config.getWhitelist();
							}

							// Clone all at path
							await cloneAllAtPath(
								config.getPackagesPath(),
								octokit,
								whitelist,
							);
						}
					},
				)
				.command(
					"combine",
					"Combinate all packages into a single monorepo",
					(yargs: any) => {
						return yargs
							.option("path", {
								type: "string",
								description:
									"The path to the packages, defaults to the default packages path",
								default: config.getPackagesPath(),
							})
							.option("monorepo-path", {
								type: "string",
								description:
									"The absolute path where the monorepo will be located",
								default: DefaultConfigFolder.monorepoPath(),
							});
					},
					async (args: any) => {
						// Check that the packages path exists
						const pkgsPath = args.path;

						// Create the monorepo path
						const monorepoPath = args.monorepoPath;

						await generateMonorepo(pkgsPath, monorepoPath, config);
					},
				)
				.command(
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
							const localRepositories =
								await LocalRepositoryList.fromPath(args.path);
							
							
						}
					},
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
						"Select can be only 'blacklist' or 'whitelist'",
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
		},
	);
}
