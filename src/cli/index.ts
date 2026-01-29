#!/usr/bin/env node

import os from "os";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";
import fsp from "fs/promises";
import { inject } from "postject";

import PackageDeployerConfiguration from "../PackageDeployerConfiguration";
import { appsToNodePackages, getAllApps } from "../apps";
import { dependencyBuildOrder } from "@/graph";
import DefaultConfigFolder from "@/DefaultConfigFolder";
import RepositoriesFolder from "@/repository/RepositoriesFolder";
import PackageDeployer from "@/PackageDeployer";
import RepositoryList from "@/repository/RepositoryList";
import repositoriesMain from "./repositories";
import configurationMain from "./config";
import updateMain from "./update";
import deployMain from "./deploy";

const execPromise = promisify(exec);

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
			"No packages path found, be sure to set it using `config --packages-path PACKAGES_PATH`",
		);
	}

	// Initialize octokit
	const octokit = new Octokit({ auth: githubToken });

	// Run commands
	const yargsInstance = yargs();
	await configurationMain(yargsInstance, config, octokit);
	await deployMain(yargsInstance, config);
	await repositoriesMain(yargsInstance, config, octokit);
	await updateMain(yargsInstance, config, octokit);

	return yargsInstance
		.command(
			"build",
			"Build the app to executable",
			(args) => {
				return args;
			},
			async (args) => {
				const distPath = "./dist/cli/index.js";
				const mjsPath = "./dist/cli/index.mjs";

				// Create .mjs copy, to force ESM in the EXE file
				await fsp.copyFile(distPath, mjsPath);
				console.log(`✅ .mjs wrapper created`);

				// Create blob
				await execPromise(
					"node --experimental-sea-config sea-config.json",
				);
				console.log(`Created blob`);
				const exeFile = "pkgdep.exe";

				// Copy node exe
				if (os.platform() === "win32") {
					// Get the path to node.exe using process.execPath
					const nodeExePath = process.execPath;
					await fsp.copyFile(nodeExePath, exeFile);
					console.log(`Copied node.exe file over`);
				}

				const blobData = await fsp.readFile("sea-prep.blob");
				console.log("💉 Injecting blob using API...");

				await inject(exeFile, "NODE_SEA_BLOB", blobData, {
					sentinelFuse:
						"NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
					machoId: "NODE_SEA_BLOB", // Only matters for macOS, but good to have
				});

				console.log("✨ Executable created successfully!");
			},
		)
		.command(
			"print",
			"Print things",
			(args) => {
				return args
					.option("packages", {
						type: "boolean",
						description: "Print all the packages obtained",
					})
					.option("build-order", {
						type: "boolean",
						description: "Print the build order",
					})
					.option("configuration", {
						type: "boolean",
						description: "Print configuration",
					})
					.option("user-repositories", {
						type: "boolean",
						description: "Print user repositories",
					});
			},
			async (args) => {
				// Print packages excluding those of the blacklist
				if (args["packages"]) {
					const allPackages = await getAllApps(packagesPath, {
						blacklist: config.getBlacklist(),
					});
					console.log(`All packages: `, allPackages);
				}

				if (args["build-order"]) {
					const allPackages = await getAllApps(packagesPath, {
						blacklist: config.getBlacklist(),
					});
					const nodePackages = await appsToNodePackages(allPackages);
					const buildOrder = dependencyBuildOrder(nodePackages);
					console.log(`Build order: `, buildOrder);
				}

				if (args.configuration) {
					console.log(`Configuration: \n`, config);
				}

				if (args.userRepositories) {
					// Get(locally) or fetch(from github) repository list
					const repositoryList = await RepositoryList.fromPath(
						RepositoryList.defaultConfigurationFile(),
						octokit,
					);

					console.log(
						`Repository list: \n`,
						repositoryList.getRepositories(),
					);
				}
			},
		)
		.command(
			"sync",
			"Sync configuration",
			(args) => {
				return args.option("repositories", {
					type: "boolean",
					description: "Get repositories information",
				});
			},
			async (args) => {
				// Get repository information from github
				if (args.repositories) {
					// Get(locally) or fetch(from github) repository list
					const repositoryList = await RepositoryList.sync(
						RepositoryList.defaultConfigurationFile(),
						octokit,
					);

					// Save
					await repositoryList.save();
				}
			},
		)
		.help()
		.parse(hideBin(process.argv));
}

main();
