import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fsp from "fs/promises";

import PackageDeployerConfiguration from "../PackageDeployerConfiguration";
import { appsToNodePackages, getAllApps } from "../apps";
import { dependencyBuildOrder } from "@/graph";
import { Octokit } from "@octokit/rest";

/**
 * Main
 */
async function main() {
	const config = await PackageDeployerConfiguration.load();
	
	// Initialize octokit
	const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

	return yargs()
		.option("packages-path", {
			demandOption: true,
			type: "string",
			description: "Path to the packages to deploy",
		})
		.middleware(
			async (args) => {},
			true // 'true' runs the middleware before validation (good for setup)
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
					});
			},
			async (args) => {
				// Print packages excluding those of the blacklist
				if (args["packages"]) {
					const allPackages = await getAllApps(
						args["packages-path"],
						{
							blacklist: config.getBlacklist(),
						}
					);
					console.log(`All packages: `, allPackages);
				}

				if (args["build-order"]) {
					const allPackages = await getAllApps(
						args["packages-path"],
						{
							blacklist: config.getBlacklist(),
						}
					);
					const nodePackages = await appsToNodePackages(allPackages);
					const buildOrder = dependencyBuildOrder(nodePackages);
					console.log(`Build order: `, buildOrder);
				}
			}
		)
		.command(
			"deploy",
			"Read a folder and deploy all packages",
			(args) => {},
			async (args) => {
				// Get all packages at the given path
				const allPackages = await getAllApps(args["packages-path"], {
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
