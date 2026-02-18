import { PackageDeployerConfiguration } from "@/index";

/**
 * Set main
 *
 * @param yargs
 * @param config
 */
export default function setMain(
	yargs: any,
	config: PackageDeployerConfiguration,
) {
	return yargs.command(
		"set",
		"Set configuration",
		(yargs: any) => {
			return yargs
				.option("packages-path", {
					type: "string",
					description:
						"Set the packages path, where to clone and deploy.",
				})
				.option("github-token", {
					type: "string",
					description:
						"Set the github token to read and write repositories to/from",
				})
				.option("github-user-link", {
					type: "string",
					description: "Set the github user link",
				})
				.option("registry-url", {
					type: "string",
					description: "Set registry url",
				})
				.option("registry-username", {
					type: "string",
					description: "Set registry username",
				})
				.option("registry-password", {
					type: "string",
					description: "Set registry password",
				});
		},
		async (args: any) => {
			// Packages path
			if (args.packagesPath) {
				config.setPackagesPath(args.packagesPath);
			}

			// Github token
			if (args.githubToken) {
				config.setGithubToken(args.githubToken);
			}

			// Github user link
			if (args.githubUserLink) {
				config.setGithubUserUrl(args.githubUserLink);
			}

			// Set registry url
			if (args.registryUrl) {
				config.setRegistryUrl(args.registryUrl);
			}

			// Set registry username
			if (args.registryUsername) {
				config.setRegistryUsername(args.registryUsername);
			}

			// Set registry password
			if (args.registryPassword) {
				config.setRegistryPassword(args.registryPassword);
			}

			await config.save(config.configurationPath);
		},
	);
}
