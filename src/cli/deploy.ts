import PackageDeployerConfiguration from "@/packageDeployer/PackageDeployerConfiguration";
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
				})
				.option("incremental", {
					type: "boolean",
					description: "Incremental deployment(defaults to true)",
					default: true,
				});
		},
		async (args: any) => {
			const ignoreApps = args.ignoreApps;
			const incrementalEnabled = args.incremental;

			// Get package list
			const packageList = await NodePackageList.fromPackagesPath(
				config.getPackagesPath()
			);

			// Deployment state
			const deploymentState = await DeploymentState.load();

			const registryUsername = config.getRegistryUsername();
			const registryPassword = config.getRegistryPassword();
			if (registryPassword && registryUsername && incrementalEnabled) {
				console.log(`Smart(Incremental) package deployment`);

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
			} else {
				console.log(
					`No registry password nor username, defaulting to deploying all at once.\n`,
					`Make sure you set the registry username and password so that updates\n`,
					`are incremental, and you don't re-build what you already had.`
				);
				// Orchestrator
				const orchestrator = new PackageDeployerOrchestrator(
					config,
					packageList,
					deploymentState,
					{
						ignoreApps,
					}
				);
				await orchestrator.deploy();
			}
		}
	);
}
