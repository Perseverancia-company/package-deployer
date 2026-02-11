import PackageDeployerConfiguration from "@/packageDeployer/PackageDeployerConfiguration";
import NodePackageList from "@/package/NodePackageList";
import { PNPM } from "..";

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

			// Switch to pnpm
			const promises = [];
			for (const pkg of packageList.nodePackages) {
				// If it's an npm package switch to pnpm
				if (pkg.packageManagerType === "npm") {
					promises.push(
						(async () => {
							// Delete node modules
							await pkg.deleteNodeModules();

							// Run pnpm install on it
							const pnpm = new PNPM(pkg.path);
							await pnpm.install().run();
						})(),
					);
				}
			}
		},
	);
}
