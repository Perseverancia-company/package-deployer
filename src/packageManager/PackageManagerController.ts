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
	 * Don't update package versions
	 *
	 * In pnpm this is the argument "--no-save"
	 * In npm don't do anything
	 */
	abstract lockPackageJson(): this;

	/**
	 * Force
	 */
	abstract force(): this;

	/**
	 * Update
	 */
	abstract update(): this;

	/**
	 * Add a package to update
	 */
	abstract addPackage(packageName: string): this;

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
