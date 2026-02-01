import fs from "fs";
import path from "path";
import { IPackageInfo } from "../types";
import NodePackage from "../package/NodePackage";

/**
 * Read app package.json
 */
export function appPackageJson(appPath: string): any | undefined {
	if (fs.existsSync(appPath)) {
		const packagePath = path.join(appPath, `package.json`);
		const rawPackageJson = fs.readFileSync(packagePath, {
			encoding: "utf8",
		});
		const packageJson = JSON.parse(rawPackageJson);
		return packageJson;
	}
}

/**
 * Get app info
 */
export async function getAppInfo(appPath: string) {
	// Check if it's a npm package
	const packageJsonPath = path.join(appPath, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return;
	}

	// Get package name
	const packageStr = fs.readFileSync(
		path.join(appPath, "package.json"),
		"utf8"
	);
	const packageJson = JSON.parse(packageStr);

	// Get package name, if there's none, return undefined
	const packageName = packageJson.name as string;
	if (!packageName) {
		return;
	}

	// Extract name from path (e.g., last folder name)
	const appName = path.basename(appPath);

	return {
		private: packageJson.private,
		version: packageJson.version,
		packageName,
		name: appName,
		path: appPath,
	};
}

/**
 * Get all packages info at a path
 *
 * Doesn't searches workspaces
 *
 * ## Blacklists
 *
 * 'blacklist' is for the folder name, which often times is just the repository name too.
 * 'packageNameBlacklist' is for the package names, if the name matches a package the package is excluded.
 */
export async function getAppsInfoAtPath(
	appsPath: string,
	options: {
		blacklist?: Array<string>;
		packageNameBlacklist?: Array<string>;
	} = {}
) {
	let apps: IPackageInfo[] = [];
	const blacklist = (options && options.blacklist) || [];
	const packageNameBlacklist =
		(options && options.packageNameBlacklist) || [];

	// Check if the folder exists
	if (fs.existsSync(appsPath)) {
		// Get all apps in the folder
		const foundApps = fs.readdirSync(appsPath);
		for (const appName of foundApps) {
			// If the name is in the repositories blacklist continue with the next one
			if (blacklist.includes(appName)) {
				continue;
			}

			// App path
			const appPath = path.join(appsPath, appName);

			// Check that it's a npm package
			const appInfo = await getAppInfo(appPath);
			if (appInfo) {
				// If the name is in the package name blacklist continue with the next one
				if (packageNameBlacklist.includes(appInfo.packageName)) {
					continue;
				}

				apps.push(appInfo);
			}
		}
	}

	return apps;
}

/**
 * Get workspaces packages
 */
export async function getWorkspacesPackages(
	appPath: string,
	workspaces: string[]
) {
	let newApps: IPackageInfo[] = [];

	for (const workspace of workspaces) {
		// We have to read all the apps of the workspace
		const workspacePathA = path.join(appPath, workspace);
		// Remove trailing "/*"
		const workspacePath = workspacePathA.slice(
			0,
			workspacePathA.length - 2
		);

		// Get apps and concatenate them
		const appsInfo = await getAppsInfoAtPath(workspacePath);
		newApps = newApps.concat(appsInfo);
	}

	return newApps;
}

/**
 * Get all apps
 *
 * Get all apps including those inside a workspace
 *
 * ## Blacklists
 *
 * 'blacklist' is for the folder name, which often times is just the repository name too.
 * 'packageNameBlacklist' is for the package names, if the name matches a package the package is excluded.
 */
export async function getAllApps(
	appsPath: string,
	options: {
		blacklist?: Array<string>;
		packageNameBlacklist?: Array<string>;
	} = {}
) {
	// 1. We get all apps
	const apps = await getAppsInfoAtPath(appsPath, options);

	let newApps: IPackageInfo[] = [];

	// 2. We check which ones have workspace/s
	for (const app of apps) {
		const packageJson = appPackageJson(app.path);

		// Get workspaces
		const workspaces = packageJson["workspaces"];
		if (workspaces) {
			const workspacePackages = await getWorkspacesPackages(
				app.path,
				workspaces
			);
			newApps = newApps.concat(workspacePackages);
		} else {
			newApps.push(app);
		}
	}

	return newApps;
}

/**
 * Get all packages
 *
 * Get all apps alias, it shouldn't have been called get all apps anyways
 *
 * ## Blacklists
 *
 * 'blacklist' is for the folder name, which often times is just the repository name too.
 * 'packageNameBlacklist' is for the package names, if the name matches a package the package is excluded.
 */
export async function getAllPackages(
	packagesPath: string,
	options: {
		blacklist?: Array<string>;
		packageNameBlacklist?: Array<string>;
	} = {}
) {
	return await getAllApps(packagesPath, options);
}

/**
 * Apps to node package
 */
export async function appsToNodePackages(packages: IPackageInfo[]) {
	// Create node packages class and push them to the list
	let nodePackagesPromise: Array<Promise<NodePackage>> = [];
	for (const nodePackage of packages) {
		nodePackagesPromise.push(NodePackage.fromPath(nodePackage.path));
	}
	const nodePackages = await Promise.all(nodePackagesPromise);

	return nodePackages;
}
