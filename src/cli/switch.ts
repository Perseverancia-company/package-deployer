import PackageDeployerConfiguration from "@/configuration/PackageDeployerConfiguration";
import NodePackageList from "@/package/NodePackageList";
import { PNPM } from "..";
import pLimit from "p-limit";

/**
 * Switch main
 */
export default async function switchMain(
	yargs: any,
	config: PackageDeployerConfiguration,
) {
	// Switch npm repositories to pnpm
	return yargs.command(
		"switch",
		"Switch all repositories from npm to pnpm",
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
				.filter((pkg) => pkg.packageManagerType === "npm")
				.map((pkg) => {
					// We wrap this logic in the limit function
					return limit(async () => {
						console.log(`Switching ${pkg.packageName} to pnpm...`);
						try {
							try {
								// Delete node modules
								await pkg.deleteNodeModules();
							} catch (err) {}

							try {
								// Remove package lock
								await pkg.deletePackageLock();
							} catch (err) {}

							// Run pnpm install on it
							const pnpm = new PNPM(pkg.path);
							await pnpm.install().run();

							console.log(
								`Successfully migrated ${pkg.packageName}`,
							);
						} catch (err) {
							console.error(
								`Failed to migrate ${pkg.packageName}:`,
								err,
							);
						}
					});
				});
		},
	);
}
