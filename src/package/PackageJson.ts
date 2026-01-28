import fsp from "fs/promises";

/**
 * Package json
 */
export default class PackageJson {
	packageJson: any;
	path: string;

	/**
	 * Initialize
	 *
	 * @param packageJson
	 */
	constructor(packageJson: any, path: string) {
		this.packageJson = packageJson;
		this.path = path;
	}

	/**
	 * Set name
	 */
	setName(name: string) {
		this.packageJson.name = name;
	}

	/**
	 * Add a workspace
	 */
	addWorkspace(relativePath: string) {
		const workspaces = this.packageJson.workspaces;
		if (workspaces) {
			// Cast to array
			const workspacesArray: Array<string> = workspaces;
			workspacesArray.push(relativePath);
		} else {
			this.packageJson.workspaces = [relativePath];
		}
	}

	/**
	 * Load
	 */
	static async load(path: string) {
		// Read file
		const data = await fsp.readFile(path, {
			encoding: "utf-8",
		});

		// Parse package json
		const packageJson = JSON.parse(data);
		return new PackageJson(packageJson, path);
	}

	/**
	 * Save
	 */
	async save() {
		const data = JSON.stringify(this.packageJson);
		return await fsp.writeFile(this.path, data);
	}
}
