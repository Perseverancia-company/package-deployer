export interface IAppInfo {
	packageName: string;
	path: string;
	name: string;
}

export interface IPackageDeployerConfiguration {
	blacklist: Array<string>;
}

export interface RepositoryInfo {
	link: string;
}

export interface RepositoryFileConfiguration {
	githubUsername: string;
	lastUpdated: Date;
	repositories: Array<RepositoryInfo>;
}
