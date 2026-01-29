import { appsToNodePackages, getAllApps } from "@/apps";
import { dependencyBuildOrder } from "@/graph";
import PackageDeployerConfiguration from "@/PackageDeployerConfiguration";
import RepositoryList from "@/repository/RepositoryList";
import { Octokit } from "@octokit/rest";

/**
 * Print things
 */
export default async function printMain(
	yargs: any,
	config: PackageDeployerConfiguration,
	octokit: Octokit
) {
	return yargs.command(
		"print",
		"Print things",
		(args: any) => {
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
		async (args: any) => {
			// Print packages excluding those of the blacklist
			if (args["packages"]) {
				const allPackages = await getAllApps(config.getPackagesPath(), {
					blacklist: config.getBlacklist(),
				});
				console.log(`All packages: `, allPackages);
			}

			if (args["build-order"]) {
				const allPackages = await getAllApps(config.getPackagesPath(), {
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
	);
}
