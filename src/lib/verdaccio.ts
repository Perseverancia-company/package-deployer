import PackageDeployerConfiguration from "@/packageDeployer/PackageDeployerConfiguration";
import VerdaccioClient from "./VerdaccioClient";

/**
 * Get verdaccio instance from the configuration
 */
export default async function getVerdaccioFromConfiguration(
	config: PackageDeployerConfiguration
) {
	// Get verdaccio url
	const [registryUrl, registryUsername, registryPassword] = [
		config.getRegistryUrl(),
		config.getRegistryUsername(),
		config.getRegistryPassword(),
	];
	const verdaccioUrl = registryUrl ? registryUrl : "http://localhost:4873";

	if (!registryUsername) {
		throw new Error(
			"Registry username is not set, cannot do incremental build."
		);
	}

	if (!registryPassword) {
		throw new Error(
			"Registry password is not set, cannot do incremental build."
		);
	}

	// We use verdaccio to get the remote packages
	const verdaccioClient = new VerdaccioClient(
		verdaccioUrl,
		registryUsername,
		registryPassword
	);

	return verdaccioClient;
}
