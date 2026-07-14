import pc from "picocolors";

import DefaultAppFolder from "@/configuration/DefaultAppFolder";
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
	daf: DefaultAppFolder
) {
	return yargs.command(
		"set",
		"Set configuration",
		(yargs: any) => {
			return yargs
				.option("app-path", {
					type: "string",
					description: "Set app path",
				})
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
				.option("logging", {
					type: "boolean",
					description: "Set logging",
					default: config.configuration.logging,
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
				})
				.option("update-repositories-every", {
					type: "number",
					description:
						"Update repositories every time set in this option, in seconds",
				});
		},
		async (args: any) => {
			// App path configuration
			if (args.appPath) {
				daf.setAppPath(args.appPath);
				config.setAppPath(args.appPath);
				console.log(pc.green("✅ Apps path set"));
			}

			// Packages path
			if (args.packagesPath) {
				config.setPackagesPath(args.packagesPath);
				console.log(pc.green("✅ Packages path set"));
			}

			// Github token
			if (args.githubToken) {
				config.setGithubToken(args.githubToken);
				console.log(pc.green("✅ Github token set"));
			}

			// Github user link
			if (args.githubUserLink) {
				config.setGithubUserUrl(args.githubUserLink);
				console.log(pc.green("✅ Github user link set"));
			}

			// Set registry url
			if (args.registryUrl) {
				config.setRegistryUrl(args.registryUrl);
				console.log(pc.green("✅ Registry url set"));
			}

			// Set registry username
			if (args.registryUsername) {
				config.setRegistryUsername(args.registryUsername);
				console.log(pc.green("✅ Registry username set"));
			}

			// Set registry password
			if (args.registryPassword) {
				config.setRegistryPassword(args.registryPassword);
				console.log(pc.green("✅ Registry password set"));
			}

			// Set update repositories every
			if (args.updateRepositoriesEvery) {
				config.setUpdateRepositoriesEvery(
					args.updateRepositoriesEvery * 1000
				);
				console.log(pc.green("✅ Update repositories every set"));
			}

			// Set logging, it's toggled whenever the user runs the command
			config.setLogging(args.logging);

			await Promise.all([
				config.save(config.configurationPath),
				daf.saveGlobalConfiguration(),
			]);
		}
	);
}
