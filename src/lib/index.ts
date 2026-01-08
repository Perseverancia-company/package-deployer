import { exec } from "child_process";
import fsp from "fs/promises";
import path from "path";
import { promisify } from "util";

import { appsToNodePackages, getAllPackages } from "@/apps";
import PackageDeployerConfiguration from "@/PackageDeployerConfiguration";
import PackageJson from "@/PackageJson";

const execPromise = promisify(exec);

/**
 * Generate monorepo repository with all the packages at a given path
 *
 * Make sure these files exist in the working directory:
 * ".gitignore", ".npmrc", ".prettierrc", "LICENSE"
 */
export async function generateMonorepo(
	packagesPath: string,
	monorepoPath: string,
	config: PackageDeployerConfiguration
) {
	// Check that the packages path exists
	try {
		await fsp.stat(packagesPath);
	} catch (err) {
		throw new Error("The packages path doesn't exists");
	}

	// Create the monorepo path
	try {
		await fsp.mkdir(monorepoPath, { recursive: true });
	} catch (err) {
		throw new Error("Couldn't create the monorepo path");
	}

	// Create app and packages folder
	const appsFolder = path.join(monorepoPath, "apps");
	const packagesFolder = path.join(monorepoPath, "packages");
	try {
		await fsp.mkdir(appsFolder, { recursive: true });
		await fsp.mkdir(packagesFolder, { recursive: true });
	} catch (err) {
		throw new Error("Couldn't create app and packages folder");
	}

	// Get all packages
	const allPackages = await getAllPackages(packagesPath, {
		blacklist: config.getBlacklist(),
	});

	// Create node packages class
	const nodePackages = await appsToNodePackages(allPackages);

	// Iterate over the node packages
	for (const pkg of nodePackages) {
		// If it's private it's an app
		if (pkg.packageJson.private === true) {
			// TODO: Filter node modules out
			await fsp.cp(pkg.path, appsFolder, {
				// Idea
				// filter: (source, destination) => {
				// 	const containsNodeModulues =
				// 		source.search("node_modules");
				// 	return containsNodeModulues <= 0;
				// },
			});
		} else {
			// It's a package
			await fsp.cp(pkg.path, packagesFolder);
		}
	}

	// Init npm
	const command = ["cd", monorepoPath, "&&", "npm", "init", "-y"].join(" ");
	const npmInit = await execPromise(command);

	// Read package json
	const pkgJson = await PackageJson.load(
		path.join(monorepoPath, "package.json")
	);
	pkgJson.setName("@perseverancia/master");
	await pkgJson.save();

	// Copy files from this repository
	const files = [".gitignore", ".npmrc", ".prettierrc", "LICENSE"];
	let promiseList = [];
	for (const fileName of files) {
		// Copy file over promise
		const filePromise = fsp.copyFile(
			path.join(process.cwd(), fileName),
			monorepoPath
		);

		// Append to the promise list
		promiseList.push(filePromise);
	}
	await Promise.all(promiseList);
}
