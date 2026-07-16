import pc from "picocolors";
import AppState from "@/data/AppState";
import { NodePackageList, PackageDeployerConfiguration } from "@/index";

/**
 * Packages command
 */
export default async function packagesMain(
	yargsInstance: any,
	config: PackageDeployerConfiguration,
	state: AppState,
) {
	return yargsInstance.command(
		"packages",
		"Manage packages, this options and commands apply to all packages",
		(yargs: any) => {
			return yargs
				.option("delete-node-modules", {
					type: "boolean",
					description: "Delete node modules",
				})
				.option("install", {
					type: "boolean",
					description: "Install packages on every package",
				})
				.option("dry-run", {
					type: "boolean",
					description:
						"Dry run, that is, don't apply changes, just show what would have changed",
				});
		},
		async (args: any) => {
			// Get package list
			const packageList = await NodePackageList.fromPackagesPath(
				config.getPackagesPath(),
			);

			if (args.deleteNodeModules) {
				const tasks = packageList
					.getNodePackages()
					.map((pkg) => {
						return (async () => {
							if (config.getLogging()) {
								console.log(
									`Delete 'node_modules' for package ${pc.cyan(pkg.packageName)}`,
								);
							}
							await pkg.deleteNodeModulesSafe();
						})();
					});

				await Promise.all(tasks);
			}

			if (args.install) {
				const tasks = packageList
					.getNodePackages()
					.map((pkg) => {
						return (async () => {
							if (config.getLogging()) {
								console.log(
									`Installing packages for package ${pc.cyan(pkg.packageName)}`,
								);
							}
							await pkg.install();
						})();
					});

				await Promise.all(tasks);
			}
		},
	);
}
