/**
 * Packages command
 */
export default async function packagesMain(yargsInstance: any) {
	return yargsInstance.command(
		"packages",
		"Manage packages, this options and commands apply to all packages",
		(yargs: any) => {
			return yargs
				.option("delete-node-modules", {
					type: "boolean",
					description: "Delete node modules",
				})
				.option("dry-run", {
					type: "boolean",
					description:
						"Dry run, that is, don't apply changes, just show what would have changed",
				});
		},
		async (args: any) => {},
	);
}
