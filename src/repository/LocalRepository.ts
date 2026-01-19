/**
 * Local repository
 */
export default class LocalRepository {
	name: string;
	path: string;

	/**
	 * Constructor
	 */
	constructor(name: string, repoPath: string) {
		this.name = name;
		this.path = repoPath;
	}

	/**
	 * Get path
	 */
	getPath() {
		return this.path;
	}

	/**
	 * Get name
	 */
	getName() {
		return this.name;
	}
}
