/**
 * Package manager controller
 */
export default abstract class PackageManagerController {
	packagePath: string;

	/**
	 * Set the package path
	 */
	constructor(packagePath: string) {
		this.packagePath = packagePath;
	}

	/**
	 * Install command
	 */
	abstract install(): this;

	/**
	 * Run command (e.g., pnpm run <script>)
	 */
	abstract runCommand(): this;

	/**
	 * Build command
	 */
	abstract build(): this;
	
	/**
	 * Publish command
	 */
	abstract publish(): this;

	/**
	 * Set arg to not use/update lockfile
	 */
	abstract noPackageLock(): this;

	/**
	 * Run the built command
	 */
	abstract run(): Promise<any>;
}
