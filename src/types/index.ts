export interface IAppInfo {
	packageName: string;
	path: string;
	name: string;
}

export interface IPackageDeployerConfiguration {
	blacklist: Array<string>;
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
