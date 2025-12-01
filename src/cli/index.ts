import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import PackageDeployerConfiguration from "../PackageDeployerConfiguration";
import { getAllApps } from "../apps";
import NodePackage from "../NodePackage";

/**
 * Main
 */
async function main() {
	const config = await PackageDeployerConfiguration.load();

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
				return args.option("packages", {
					type: "boolean",
					description: "Print all the packages obtained",
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

				// Create node packages class and push them to the list
				let nodePackagesPromise: Array<Promise<NodePackage>> = [];
				for (const nodePackage of allPackages) {
					nodePackagesPromise.push(
						NodePackage.fromPath(nodePackage.path)
					);
				}
				const nodePackages = await Promise.all(nodePackagesPromise);

				// Deploy all packages
				let deployPromises = [];
				for (const nodePackage of nodePackages) {
					const handler = (async () => {
						await nodePackage.install();
						await nodePackage.build();
						await nodePackage.publish();
					})();
					deployPromises.push(handler);
				}
				await Promise.all(deployPromises);
			}
		)
		.help()
		.parse(hideBin(process.argv));
}

main();
