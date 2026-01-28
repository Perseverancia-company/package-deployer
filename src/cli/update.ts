import PackageDeployerConfiguration from "@/PackageDeployerConfiguration";
import RepositoryList from "@/repository/RepositoryList";
import { Octokit } from "@octokit/rest";
import yargs from "yargs";

/**
 * Update things
 */
export default async function updateMain(
	yargs: any,
	config: PackageDeployerConfiguration,
	octokit: Octokit
) {
	return yargs.command(
		"update",
		"Update everything, package information, pull repositories, database package information, etc.",
		(yargs: any) => {
			return yargs;
		},
		async (args: any) => {
			// Get(locally) or fetch(from github) repository list
			const repositoryList = await RepositoryList.sync(
				RepositoryList.defaultConfigurationFile(),
				octokit
			);

			// Save
			await repositoryList.save();
		}
	);
}
