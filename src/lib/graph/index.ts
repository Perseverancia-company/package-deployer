import NodePackage from "../../package/NodePackage";

/**
 * Calculate dependency build order of a given list of node packages using Khan's algorithm
 */
export function dependencyBuildOrder(nodePackages: Array<NodePackage>) {
	// Create a map for quick lookup of packages by name
	const packageMap = new Map<string, NodePackage>();
	nodePackages.forEach((pkg) => {
		if (pkg.packageName) {
			packageMap.set(pkg.packageName, pkg);
		}
	});

	// Initialize graph structure in degrees and the queue for Khan's algorithms
	const adj: Map<string, Set<string>> = new Map();
	// How many packages depend on this one
	const inDegree: Map<string, number> = new Map();
	const queue: NodePackage[] = [];
	const sortedPackages: NodePackage[] = [];

	// Initialize all workspace packages in the maps
	nodePackages.forEach((pkg) => {
		const name = pkg.packageName;
		adj.set(name, new Set());
		inDegree.set(name, 0);
	});

	// Build graph and calculate in degrees
	for (const dependentPackage of nodePackages) {
		const dependentName = dependentPackage.packageName;

		// Iterate over all dependencies(direct and dev)
		const dependencies = {
			...dependentPackage.packageJson.dependencies,
			...dependentPackage.packageJson.devDependencies,
		};

		for (const dependencyName of Object.keys(dependencies)) {
			// Check if the dependency is one of the given packages
			if (packageMap.has(dependencyName)) {
				// Edge dependency to dependent
				// Dependency must be built before the dependent
				// In the graph: dependency -> dependent
				adj.get(dependencyName)?.add(dependentName);

				// Increment the in-degree of the dependent package
				// (it has one more dependency that has to be built first)
				inDegree.set(
					dependentName,
					(inDegree.get(dependentName) ?? 0) + 1,
				);
			}
		}
	}

	// Initializing Queue with packages having an in-degree of 0(no workspace dependencies)
	for (const pkg of nodePackages) {
		const name = pkg.packageName;
		if (inDegree.get(name) === 0) {
			queue.push(pkg);
		}
	}

	// Perform the Topological Sort(Kahn's Algorithm)
	while (queue.length > 0) {
		// Dequeue a package with no remaining dependencies
		const pkg = queue.shift()!;
		sortedPackages.push(pkg);
		const pkgName = pkg.packageName;

		// Get all packages that depend on the current package (neighbors in the adjacency list)
		const dependents = adj.get(pkgName);
		if (dependents) {
			for (const dependentName of dependents) {
				// Decrement the in-degree of the dependent
				const newInDegree = (inDegree.get(dependentName) ?? 0) - 1;
				inDegree.set(dependentName, newInDegree);

				// If a dependent's in-degree drops to 0, it means all its dependencies are met,
				// so it can be added to the queue for building
				if (newInDegree === 0) {
					const dependentPackage = packageMap.get(dependentName);
					if (dependentPackage) {
						queue.push(dependentPackage);
					}
				}
			}
		}
	}

	// Check for cycles
	if (sortedPackages.length !== nodePackages.length) {
		// Filter the original list:
		const cyclePackages = nodePackages
			.filter((pkg) => !sortedPackages.includes(pkg))
			.map((pkg) => pkg.packageJson.name);

		console.error(
			"Circular Dependency Detected! Packages involved:",
			cyclePackages,
		);

		// This indicates a circular dependency, which prevents a valid build order.
		throw new Error(
			"Error: Circular dependency detected in workspace packages. A valid build order cannot be determined",
		);
	}

	return sortedPackages;
}
