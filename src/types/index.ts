export interface IAppInfo {
	packageName: string;
	path: string;
	name: string;
}

export interface ITaskDeploymentResult {
	packageName: string;
	name: string;
	success: boolean;
}

/**
 * Package deployer configuration
 */
export interface IPackageDeployerConfiguration {
	// Packages path
	packagesPath: string;
	// Blacklisted repositories to not deploy
	blacklist: Array<string>;
	// Github profile url of the user to clone repositories
	githubProfileUrl?: string;
	// The github token of the user to clone the repositories
	githubToken?: string;
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
