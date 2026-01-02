import { RepositoryFileConfiguration } from "@/types";
import { Octokit } from "@octokit/rest";
import fsp from "fs/promises";

/**
 * Repository list
 */
export default class RepositoryList {
	configurationFilePath: string;
	configuration: RepositoryFileConfiguration;
	octokit: Octokit;
	
	/**
	 * Constructor
	 */
	constructor(configurationFilePath: string, repoConfig: RepositoryFileConfiguration, octokit: Octokit) {
		this.configurationFilePath = configurationFilePath;
		this.configuration = repoConfig;
		this.octokit = octokit;
	}
	
	/**
	 * Get from a given path
	 */
	static async fromPath(configurationFilePath: string, octokit: Octokit) {
		try {
			const content = await fsp.readFile(configurationFilePath, "utf-8");
			const config = JSON.parse()
		} catch(err) {
			
		}
	}
}
