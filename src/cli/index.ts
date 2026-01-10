#!/usr/bin/env node

import os from "os";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import fsp from "fs/promises";
import { inject } from "postject";

import PackageDeployerConfiguration from "../PackageDeployerConfiguration";
import { appsToNodePackages, getAllApps } from "../apps";
import { dependencyBuildOrder } from "@/graph";
import DefaultConfigFolder from "@/DefaultConfigFolder";
import RepositoriesFolder from "@/repository/RepositoriesFolder";
import PackageDeployer from "@/PackageDeployer";
import RepositoryList from "@/repository/RepositoryList";
import { generateMonorepo } from "@/lib";

const execPromise = promisify(exec);

/**
 * Main
 */
async function main() {
	// Read dotenv
	dotenv.config({});

	// Run some asynchronous tasks
	const [_a] = await Promise.all([DefaultConfigFolder.createFolder()]);

	const [config] = await Promise.all([
		PackageDeployerConfiguration.load(DefaultConfigFolder.getPath()),
		new RepositoriesFolder().createFolder(),
	]);

	// Github token
	const githubToken =
		process.env.GITHUB_TOKEN ?? config.configuration.githubToken;
	if (!githubToken) {
		console.warn("No github token found");
	}

	// Packages path
	const packagesPath =
		process.env.PACKAGES_PATH ?? config.configuration.packagesPath;
	if (!packagesPath) {
		console.warn(
			"No packages path found, be sure to set it using `config --packages-path PACKAGES_PATH`"
		);
	}

	// Initialize octokit
	const octokit = new Octokit({ auth: githubToken });

	return yargs()
		.command(
			"build",
			"Build the app to executable",
			(args) => {
				return args;
			},
			async (args) => {
				const distPath = "./dist/cli/index.js";
				const mjsPath = "./dist/cli/index.mjs";

				// Create .mjs copy, to force ESM in the EXE file
				await fsp.copyFile(distPath, mjsPath);
				console.log(`✅ .mjs wrapper created`);

				// Create blob
				await execPromise(
					"node --experimental-sea-config sea-config.json"
				);
				console.log(`Created blob`);
				const exeFile = "pkgdep.exe";

				// Copy node exe
				if (os.platform() === "win32") {
					// Get the path to node.exe using process.execPath
					const nodeExePath = process.execPath;
					await fsp.copyFile(nodeExePath, exeFile);
					console.log(`Copied node.exe file over`);
				}

				const blobData = await fsp.readFile("sea-prep.blob");
				console.log("💉 Injecting blob using API...");

				await inject(exeFile, "NODE_SEA_BLOB", blobData, {
					sentinelFuse:
						"NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
					machoId: "NODE_SEA_BLOB", // Only matters for macOS, but good to have
				});

				console.log("✨ Executable created successfully!");
			}
		)
		.command(
			"combine",
			"Combinate all packages into a single monorepo",
			(yargs) => {
				return yargs
					.option("path", {
						type: "string",
						description:
							"The path to the packages, defaults to the default packages path",
						default: packagesPath,
					})
					.option("monorepo-path", {
						type: "string",
						description:
							"The absolute path where the monorepo will be located",
						default: DefaultConfigFolder.monorepoPath(),
					});
			},
			async (args) => {
				// Check that the packages path exists
				const pkgsPath = args.path;

				// Create the monorepo path
				const monorepoPath = args.monorepoPath;

				await generateMonorepo(pkgsPath, monorepoPath, config);
			}
		)
		.command(
			"config",
			"Set configuration by key",
			(args) => {
				return args
					.command(
						"blacklist",
						"Manage the package blacklist",
						(args) => {
							return args
								.option("name", {
									demandOption: true,
									type: "string",
									description:
										"Package name(including the workspace)",
								})
								.option("add", {
									type: "boolean",
									description:
										"Add an element to the blacklist",
								});
						},
						async (args) => {
							if (args.add) {
								config.blacklistAdd(args["name"]);
							}

							await config.save(DefaultConfigFolder.getPath());
						}
					)
					.command(
						"set",
						"Set configuration",
						(args) => {
							return args
								.option("packages-path", {
									type: "string",
									description:
										"Set the packages path to clone packages to, read and deploy from.",
								})
								.option("github-token", {
									type: "string",
									description: "User github token.",
								})
								.option("profile-url", {
									type: "string",
									description: "User profile url.",
								});
						},
						async (args) => {
							// Set packages path
							if (args.packagesPath) {
								config.configuration.packagesPath =
									args.packagesPath;
							}

							// Store user profile URL
							if (args.profileUrl) {
								config.configuration.githubProfileUrl =
									args.profileUrl;
							}

							// Store user github token
							if (args.githubToken) {
								config.configuration.githubToken =
									args.githubToken;
							}

							// Save configuration
							await config.save(DefaultConfigFolder.getPath());
						}
					);
			},
			async (args) => {}
		)
		.command(
			"deploy",
			"Read a folder and deploy all packages",
			(args) => {},
			async (args) => {
				const pkgDeployer = new PackageDeployer(config);
				await pkgDeployer.deploy();
			}
		)
		.command(
			"print",
			"Print things",
			(args) => {
				return args
					.option("packages", {
						type: "boolean",
						description: "Print all the packages obtained",
					})
					.option("build-order", {
						type: "boolean",
						description: "Print the build order",
					})
					.option("configuration", {
						type: "boolean",
						description: "Print configuration",
					})
					.option("user-repositories", {
						type: "boolean",
						description: "Print user repositories",
					});
			},
			async (args) => {
				// Print packages excluding those of the blacklist
				if (args["packages"]) {
					const allPackages = await getAllApps(packagesPath, {
						blacklist: config.getBlacklist(),
					});
					console.log(`All packages: `, allPackages);
				}

				if (args["build-order"]) {
					const allPackages = await getAllApps(packagesPath, {
						blacklist: config.getBlacklist(),
					});
					const nodePackages = await appsToNodePackages(allPackages);
					const buildOrder = dependencyBuildOrder(nodePackages);
					console.log(`Build order: `, buildOrder);
				}

				if (args.configuration) {
					console.log(`Configuration: \n`, config);
				}

				if (args.userRepositories) {
					// Get(locally) or fetch(from github) repository list
					const repositoryList = await RepositoryList.fromPath(
						RepositoryList.defaultConfigurationFile(),
						octokit
					);

					console.log(
						`Repository list: \n`,
						repositoryList.getRepositories()
					);
				}
			}
		)
		.command(
			"repositories",
			"Repositories",
			(args) => {
				return args
					.option("use-whitelist", {
						type: "boolean",
						description: "Use the configuration whitelist",
						default: false,
					})
					.option("clone-all", {
						type: "boolean",
						description: "Clone all repositories",
					});
			},
			async (args) => {
				// Use whitelist
				const useWhitelist = args.useWhitelist;

				// Clone all the repositories
				if (args.cloneAll) {
					// Get(locally) or fetch(from github) repository list
					const repositoryList = await RepositoryList.fromPath(
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
		.command(
			"sync",
			"Sync configuration",
			(args) => {
				return args.option("repositories", {
					type: "boolean",
					description: "Get repositories information",
				});
			},
			async (args) => {
				// Get repository information from github
				if (args.repositories) {
					// Get(locally) or fetch(from github) repository list
					const repositoryList = await RepositoryList.sync(
						RepositoryList.defaultConfigurationFile(),
						octokit
					);

					// Save
					await repositoryList.save();
				}
			}
		)
		.help()
		.parse(hideBin(process.argv));
}

main();
