import PackageDeployerConfiguration from "@/PackageDeployerConfiguration";
import { PackageDeployer } from "..";

/**
 * Deploy all packages
 */
export default async function deployMain(
	yargs: any,
	config: PackageDeployerConfiguration,
) {
	return yargs.command(
		"deploy",
		"Read a folder and deploy all packages",
		(args: any) => {},
		async (args: any) => {
            // Initialize package deployer and deploy all
			const pkgDeployer = new PackageDeployer(config);
			await pkgDeployer.deploy();
		},
	);
}
