import PackageDeployerConfiguration from "@/configuration/PackageDeployerConfiguration";
import NodePackageList from "@/package/NodePackageList";
import PackageDeployerOrchestrator from "@/packageDeployer/PackageDeployerOrchestrator";
import DeploymentState from "@/data/DeploymentState";

/**
 * Deploy all packages
 */
export default async function deployMain(
	yargs: any,
	config: PackageDeployerConfiguration
) {
	return yargs.command(
		"deploy",
		"Read a folder and deploy all packages",
		(yargs: any) => {
			return yargs
				.option("ignore-apps", {
					type: "boolean",
					description:
						"Ignore applications(to detect them, just whether the package is private is checked)",
				});
		},
		async (args: any) => {
			const ignoreApps = args.ignoreApps;

			// Get package list
			const packageList = await NodePackageList.fromPackagesPath(
				config.getPackagesPath()
			);

			// Deployment state
			const deploymentState = await DeploymentState.load(config.configurationPath);

			// Orchestrator
			const orchestrator = new PackageDeployerOrchestrator(
				config,
				packageList,
				deploymentState,
				{
					ignoreApps,
				}
			);
			await orchestrator.incrementalDeployment();
		}
	);
}
