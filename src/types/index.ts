import NPM from "@/packageManager/NPM";
import PNPM from "@/packageManager/PNPM";

export interface IPackageInfo {
	version: string;
	packageName: string;
	path: string;
	name: string;
}

export type PackageManagerEngine = NPM | PNPM;

export interface ITaskDeploymentResult {
	packageName: string;
	name: string;
	success: boolean;
}

/**
 * Whether to allow or disallow packages
 */
export interface RepositoryAllowanceListing {
	blacklist: Array<string>;
	whitelist: Array<string>;
	use: "whitelist" | "blacklist";
}

/**
 * Package deployer configuration
 */
export interface IPackageDeployerConfiguration {
	// Packages path
	packagesPath: string;
	// Repositories allow listing
	repositoriesListing: RepositoryAllowanceListing;
	// Blacklisted packages to not manage
	packagesBlacklist: Array<string>;
	// Github profile url of the user to clone repositories
	githubProfileUrl?: string;
	// The github token of the user to clone the repositories
	githubToken?: string;
	
	// Registry
	// The package registry url
	registryUrl?: string;
	// Username and password
	registryUsername?: string;
	registryPassword?: string;
}

export interface RepositoryInfo {
	name: string;
	fullName: string;
	private: boolean;
	description: string | null;
	url: string;
	language: string | null;
	updatedAt: string | null;
}

export interface RepositoryFileConfiguration {
	lastUpdated: Date;
	repositories: Array<RepositoryInfo>;
}

export interface LocalRepositoryInfo {
	name: string;
	path: string;
}
