import { RepositoryInfo } from "@/types";

/**
 * Repository class
 */
export default class Repository {
	repositoryInfo: RepositoryInfo;

	/**
	 * Repository constructor
	 */
	constructor(repoInfo: RepositoryInfo) {
		this.repositoryInfo = repoInfo;
	}

	/**
	 * Get the GitHub SSH URL
	 * Format: git@github.com:owner/repository.git
	 */
	get sshUrl(): string {
		return `git@github.com:${this.repositoryInfo.fullName}.git`;
	}
}
