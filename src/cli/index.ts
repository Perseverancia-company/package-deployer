import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import PackageDeployerConfiguration from "../PackageDeployerConfiguration";
import { getAllApps } from "../apps";

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
			async (args) => {}
		)
		.help()
		.parse(hideBin(process.argv));
}

main();
