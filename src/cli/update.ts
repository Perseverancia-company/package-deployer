import { Octokit } from "@octokit/rest";

import { syncAll } from "@/lib/sync";
import PackageDeployerConfiguration from "@/configuration/PackageDeployerConfiguration";

/**
 * Update things
 */
export default async function updateMain(
	yargs: any,
	config: PackageDeployerConfiguration,
	octokit: Octokit,
) {
	return yargs.command(
		"update",
		"Update everything, clone missing repositories(or all), package information, \n" +
			"pull repositories, database package information, etc.",
		(yargs: any) => {
			return yargs;
		},
		async (args: any) => {
			await syncAll(config, octokit);
		},
	);
}
