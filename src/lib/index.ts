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
 *
 * Warning:
 * It also copies .git directory
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

	// Iterate over the node packages and copy them to their folder
	const copyOptions = {
		recursive: true,
		filter: (source: string, dest: string) => {
			// Check whether the current one is node modules or not
			const isNodeModules = source
				.split(path.sep)
				.includes("node_modules");

			// Ignore when it's node modules
			return !isNodeModules;
		},
	};
	for (const pkg of nodePackages) {
		// Choose either apps or packages based on whether the package is private or not
		const destination =
			pkg.packageJson.private === true
				? path.join(appsFolder, path.basename(pkg.path))
				: path.join(packagesFolder, path.basename(pkg.path));

		// Copy files to the destination with the given options
		await fsp.cp(pkg.path, destination, copyOptions);
	}

	// Init npm
	const command = ["cd", monorepoPath, "&&", "npm", "init", "-y"].join(" ");
	const npmInit = await execPromise(command);

	// Read package json
	const pkgJson = await PackageJson.load(
		path.join(monorepoPath, "package.json")
	);
	// Set name to master
	pkgJson.setName("@perseverancia/master");
	// Add global workspaces
	pkgJson.addWorkspace("apps/*");
	pkgJson.addWorkspace("packages/*");
	await pkgJson.save();

	// Copy files from this repository
	const files = [".gitignore", ".npmrc", ".prettierrc", "LICENSE"];
	let promiseList = [];
	for (const fileName of files) {
		// Copy file over promise
		const filePath = path.join(process.cwd(), fileName);

		// File destination
		const fileDestination = path.join(monorepoPath, fileName);
		const filePromise = fsp.copyFile(filePath, fileDestination);

		// Append to the promise list
		promiseList.push(filePromise);
	}
	await Promise.all(promiseList);
}
