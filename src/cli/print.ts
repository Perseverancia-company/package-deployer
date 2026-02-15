import KhansDependencyGraph from "@/graph/KhansDependencyGraph";
import PackageDeployerConfiguration from "@/configuration/PackageDeployerConfiguration";
import RepositoryList from "@/repository/RepositoryList";
import { Octokit } from "@octokit/rest";

import { appsToNodePackages, getAllApps } from "@/lib/apps";
import getVerdaccioFromConfiguration from "@/lib/verdaccio";
import NodePackageList from "@/package/NodePackageList";
import DeploymentState from "@/data/DeploymentState";
import PackagesFilter from "@/packageDeployer/PackagesFilter";

/**
 * Print things
 */
export default async function printMain(
	yargs: any,
	config: PackageDeployerConfiguration,
	octokit: Octokit,
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
				})
				.option("remote-packages", {
					type: "boolean",
					description:
						"Print remote packages like verdaccio for instance(will try to print them all)",
				})
				.option("incremental-build-packages", {
					type: "boolean",
					description:
						"Print incremental build affected packages, that is, those that will be deployed",
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

				// Calculate the build order
				const dependencyGraph = new KhansDependencyGraph(nodePackages);
				console.log(`Build order: `, dependencyGraph.getBuildOrder());
			}

			// Print configuration
			if (args.configuration) {
				console.log(`Configuration: \n`, config);
			}

			if (args.userRepositories) {
				// Get(locally) or fetch(from github) repository list
				const repositoryList = await RepositoryList.fromPath(
					RepositoryList.defaultConfigurationFile(
						config.configurationPath,
					),
					octokit,
					config.repositoriesPath,
				);

				console.log(
					`Repository list: \n`,
					repositoryList.getRepositories(),
				);
			}

			if (args.printRemotePackages) {
				// Get packages
				const verdaccioClient =
					await getVerdaccioFromConfiguration(config);
				const packages = await verdaccioClient.getAllPackages();

				console.log(`Remote packages: `, packages);
			}

			if (args.incrementalBuildPackages) {
				// Get package list
				const packageList = await NodePackageList.fromPackagesPath(
					config.getPackagesPath(),
				);

				// Deployment state
				const deploymentState = await DeploymentState.load(
					config.configurationPath,
				);

				const packageFilter = new PackagesFilter(
					config,
					packageList,
					deploymentState.getDeploymentStateAsMap(),
				);

				console.log(
					`Remote packages: `,
					packageFilter
						.getIncrementalBuildOrder()
						.map((pkg) => pkg.packageName),
				);
			}
		},
	);
}
