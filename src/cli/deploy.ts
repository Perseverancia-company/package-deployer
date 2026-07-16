import { Octokit } from "@octokit/rest";

import PackageDeployerConfiguration from "@/configuration/PackageDeployerConfiguration";
import AppState from "@/data/AppState";
import { syncAll } from "@/lib/sync";

/**
 * Deploy all packages
 */
export default async function deployMain(
	yargs: any,
	config: PackageDeployerConfiguration,
	state: AppState,
	octokit: Octokit,
) {
	return yargs.command(
		"deploy",
		"Clone/pull all repositories and deploy all packages",
		(yargs: any) => {
			return yargs;
		},
		async (args: any) => {
			await syncAll(config, state, octokit);
		},
	);
}
