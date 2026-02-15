import fsp from "fs/promises";
import path from "path";
import { Octokit } from "@octokit/rest";

import PackageDeployerConfiguration from "@/configuration/PackageDeployerConfiguration";

/**
 * Configuration
 */
export default async function configurationMain(
	yargs: any,
	config: PackageDeployerConfiguration,
	octokit: Octokit,
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
						await config.save(config.configurationPath);
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
						await config.save(config.configurationPath);
					},
				)
				.command(
					"set",
					"Set configuration",
					(yargs: any) => {
						return yargs
							.option("packages-path", {
								type: "string",
								description:
									"Set the packages path, where to clone and deploy.",
							})
							.option("github-token", {
								type: "string",
								description:
									"Set the github token to read and write repositories to/from",
							})
							.option("github-user-link", {
								type: "string",
								description: "Set the github user link",
							})
							.option("registry-url", {
								type: "string",
								description: "Set registry url",
							})
							.option("registry-username", {
								type: "string",
								description: "Set registry username",
							})
							.option("registry-password", {
								type: "string",
								description: "Set registry password",
							});
					},
					async (args: any) => {
						// Packages path
						if (args.packagesPath) {
							config.setPackagesPath(args.packagesPath);
						}

						// Github token
						if (args.githubToken) {
							config.setGithubToken(args.githubToken);
						}

						// Github user link
						if (args.githubUserLink) {
							config.setGithubUserUrl(args.githubUserLink);
						}

						// Set registry url
						if (args.registryUrl) {
							config.setRegistryUrl(args.registryUrl);
						}

						// Set registry username
						if (args.registryUsername) {
							config.setRegistryUsername(args.registryUsername);
						}

						// Set registry password
						if (args.registryPassword) {
							config.setRegistryPassword(args.registryPassword);
						}

						await config.save(config.configurationPath);
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
