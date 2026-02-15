import { DefaultConfigFolder, generateMonorepo } from "@/index";
import PackageDeployerConfiguration from "@/configuration/PackageDeployerConfiguration";

/**
 * Combine command
 */
export default function combineMain(
	yargs: any,
	config: PackageDeployerConfiguration,
) {
	return yargs.command(
		"combine",
		"Combinate all packages into a single monorepo",
		(yargs: any) => {
			return yargs
				.option("path", {
					type: "string",
					description:
						"The path to the packages, defaults to the default packages path",
					default: config.getPackagesPath(),
				})
				.option("monorepo-path", {
					type: "string",
					description:
						"The absolute path where the monorepo will be located",
					default: config.monorepoPath,
				});
		},
		async (args: any) => {
			// Check that the packages path exists
			const pkgsPath = args.path;

			// Create the monorepo path
			const monorepoPath = args.monorepoPath;

			await generateMonorepo(pkgsPath, monorepoPath, config);
		},
	);
}
