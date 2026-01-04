import fs from "fs";
import path from "path";
import { IAppInfo } from "./types";
import NodePackage from "./NodePackage";

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
		packageName,
		name: appName,
		path: appPath,
	};
}

/**
 * Get all apps info at a path
 *
 * Doesn't searches workspaces
 */
export async function getAppsInfoAtPath(
	appsPath: string,
	options: {
		blacklist?: Array<string>;
	} = {}
) {
	let apps: IAppInfo[] = [];
	const blacklist = (options && options.blacklist) || [];

	// Check if the folder exists
	if (fs.existsSync(appsPath)) {
		// Get all apps in the folder
		const foundApps = fs.readdirSync(appsPath);
		for (const appName of foundApps) {
			// If the name is in the blacklist continue with the next one
			if (blacklist.includes(appName)) {
				continue;
			}

			// App path
			const appPath = path.join(appsPath, appName);

			// Check that it's a npm package
			const appInfo = await getAppInfo(appPath);
			if (appInfo) {
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
	let newApps: IAppInfo[] = [];

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
 */
export async function getAllApps(
	appsPath: string,
	options: {
		blacklist?: Array<string>;
	} = {}
) {
	// 1. We get all apps
	const apps = await getAppsInfoAtPath(appsPath, options);

	let newApps: IAppInfo[] = [];

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
 * Apps to node package
 */
export async function appsToNodePackages(packages: IAppInfo[]) {
	// Create node packages class and push them to the list
	let nodePackagesPromise: Array<Promise<NodePackage>> = [];
	for (const nodePackage of packages) {
		nodePackagesPromise.push(NodePackage.fromPath(nodePackage.path));
	}
	const nodePackages = await Promise.all(nodePackagesPromise);

	return nodePackages;
}
