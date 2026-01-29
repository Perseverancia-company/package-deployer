#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

import PackageDeployerConfiguration from "../PackageDeployerConfiguration";
import DefaultConfigFolder from "@/DefaultConfigFolder";
import RepositoriesFolder from "@/repository/RepositoriesFolder";
import repositoriesMain from "./repositories";
import configurationMain from "./config";
import updateMain from "./update";
import deployMain from "./deploy";
import printMain from "./print";
import syncMain from "./sync";

/**
 * Main
 */
async function main() {
	// Read dotenv
	dotenv.config({});

	// Run some asynchronous tasks
	const [_a] = await Promise.all([DefaultConfigFolder.createFolder()]);

	const [config] = await Promise.all([
		PackageDeployerConfiguration.load(),
		new RepositoriesFolder().createFolder(),
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
			"No packages path found, be sure to set it using `config --packages-path PACKAGES_PATH`"
		);
	}

	// Initialize octokit
	const octokit = new Octokit({ auth: githubToken });

	// Run commands
	const yargsInstance = yargs();
	await configurationMain(yargsInstance, config, octokit);
	await deployMain(yargsInstance, config);
	await printMain(yargsInstance, config, octokit);
	await repositoriesMain(yargsInstance, config, octokit);
	await syncMain(yargsInstance, config, octokit);
	await updateMain(yargsInstance, config, octokit);

	return yargsInstance.help().parse(hideBin(process.argv));
}

main();
