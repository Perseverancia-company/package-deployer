#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

import PackageDeployerConfiguration from "../configuration/PackageDeployerConfiguration";
import RepositoriesFolder from "@/repository/RepositoriesFolder";
import repositoriesMain from "./repositories";
import configurationMain from "./config";
import updateMain from "./update";
import deployMain from "./deploy";
import printMain from "./print";
import syncMain from "./sync";
import buildMain from "./build";
import switchMain from "./switch";
import revertSwitchMain from "./revert-switch";
import DefaultAppFolder from "@/configuration/DefaultAppFolder";

/**
 * Main
 */
async function main() {
	// Read dotenv
	dotenv.config({});

	// Run some asynchronous tasks
	const [daf] = await Promise.all([
		DefaultAppFolder.fromGlobalConfiguration(),
	]);

	const [config] = await Promise.all([
		PackageDeployerConfiguration.load({
			appPath: daf.appPath,
			configPath: daf.configurationPath,
		}),
		daf.createFolders(),
	]);

	await Promise.all([
		new RepositoriesFolder(config.repositoriesPath).createFolder(),
	]);

	// Github token
	const githubToken =
		process.env.GITHUB_TOKEN ?? config.configuration.githubToken;
	if (!githubToken) {
		console.warn("No github token found");
	}

	// Packages path
	const packagesPath =
		process.env.PACKAGES_PATH ?? config.configuration.packagesPath;
	if (!packagesPath) {
		console.warn(
			"No packages path found, be sure to set it using `config --packages-path PACKAGES_PATH`",
		);
	}

	// Initialize octokit
	const octokit = new Octokit({ auth: githubToken });

	// Run commands
	const yargsInstance = yargs();
	await buildMain(yargsInstance);
	await configurationMain(yargsInstance, config, octokit);
	await deployMain(yargsInstance, config);
	await printMain(yargsInstance, config, octokit);
	await repositoriesMain(yargsInstance, config, octokit);
	await revertSwitchMain(yargsInstance, config);
	await syncMain(yargsInstance, config, octokit);
	await switchMain(yargsInstance, config);
	await updateMain(yargsInstance, config, octokit);

	return yargsInstance.help().parse(hideBin(process.argv));
}

main();
