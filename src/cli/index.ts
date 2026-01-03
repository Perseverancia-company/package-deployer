import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fsp from "fs/promises";
import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

import PackageDeployerConfiguration from "../PackageDeployerConfiguration";
import { appsToNodePackages, getAllApps } from "../apps";
import { dependencyBuildOrder } from "@/graph";
import DefaultConfigFolder from "@/DefaultConfigFolder";
import RepositoriesFolder from "@/repository/RepositoriesFolder";

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
			}
		)
		.command(
			"config",
			"Set configuration by key",
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
					config.configuration.packagesPath = args.packagesPath;
				}

				// Store user profile URL
				if (args.profileUrl) {
					config.configuration.githubProfileUrl = args.profileUrl;
				}

				// Store user github token
				if (args.githubToken) {
					config.configuration.githubToken = args.githubToken;
				}

				// Save configuration
				await config.save(DefaultConfigFolder.getPath());
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
				}
			}
		)
		.command(
			"deploy",
			"Read a folder and deploy all packages",
			(args) => {},
			async (args) => {
				// Get all packages at the given path
				const allPackages = await getAllApps(packagesPath, {
					blacklist: config.getBlacklist(),
				});

				// Create node packages class
				const nodePackages = await appsToNodePackages(allPackages);
				const buildOrder = dependencyBuildOrder(nodePackages);

				// Deploy all packages
				let deployPromises = [];
				for (const nodePackage of buildOrder) {
					const handler = (async () => {
						try {
							await nodePackage.install();
							await nodePackage.build();

							// Check that the package isn't private
							if (!nodePackage.packageJson.private) {
								await nodePackage.publish();
							}

							console.log(
								`Package ${nodePackage.packageName} deployed`
							);
							return {
								packageName: nodePackage.packageName,
								name: nodePackage.name,
								success: true,
							};
						} catch (err) {
							console.log(
								`Package ${nodePackage.packageName} failed to be deployed`
							);
							return {
								packageName: nodePackage.packageName,
								name: nodePackage.name,
								success: false,
							};
						}
					})();
					deployPromises.push(handler);
				}
				const packageDeploymentResult = await Promise.all(
					deployPromises
				);

				// Save as json
				await fsp.writeFile(
					"deploymentResult.json",
					JSON.stringify(packageDeploymentResult),
					{
						encoding: "utf-8",
					}
				);
			}
		)
		.help()
		.parse(hideBin(process.argv));
}

main();
