import NodePackageList from "@/package/NodePackageList";
import { PackageDeployerConfiguration } from "..";
import pLimit from "p-limit";
import simpleGit, { CleanOptions } from "simple-git";

/**
 * Revert switch main
 */
export default async function revertSwitchMain(
	yargs: any,
	config: PackageDeployerConfiguration,
) {
	return yargs.command(
		"revert-switch",
		"Revert the switch command, assuming the changes weren't added",
		(yargs: any) => {
			return yargs;
		},
		async (args: any) => {
			// Get package list
			const packageList = await NodePackageList.fromPackagesPath(
				config.getPackagesPath(),
			);

			// Process 3 packages at a time
			const limit = pLimit(3);
			const tasks = packageList.nodePackages
				.filter((pkg) => pkg.packageManagerType === "pnpm")
				.map((pkg) => {
					// We wrap this logic in the limit function
					return limit(async () => {
						console.log(
							`Reverting changes to package ${pkg.packageName}...`,
						);
						try {
							// Delete node modules just in case
							try {
								await pkg.deleteNodeModules();
							} catch (err) {}

							// Create git instance
							const git = simpleGit(pkg.path);

							// Get the current status of the repository
							const status = await git.status();
							if (!status.isClean()) {
								// Do git restore (discards changes to tracked files)
								// Equivalent to: git checkout -- .
								await git.checkout(".");

								// Do git clean using force (removes untracked files and directories)
								// Equivalent to: git clean -fd
								// 'f' for force, 'd' for directories
								await git.clean(
									CleanOptions.FORCE + CleanOptions.RECURSIVE,
								);

								console.log(
									`Successfully reverted ${pkg.packageName}`,
								);
							} else {
								console.log(
									`No changes found in ${pkg.packageName}. Skipping.`,
								);
							}
						} catch (err) {
							console.error(
								`Failed to revert ${pkg.packageName}:`,
								err,
							);
						}
					});
				});
		},
	);
}
