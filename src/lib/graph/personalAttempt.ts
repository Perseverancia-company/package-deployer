import NodePackage from "@/package/NodePackage";

/**
 * TODO: My dependency build order
 *
 * An attempt to do it myself, it is too hard to continue...
 *
 * @deprecated Don't use this function
 */
export function myDependencyBuildOrder(nodePackages: Array<NodePackage>) {
	// Create a shallow copy of the array
	let packagesCopy = [...nodePackages];

	let packageTree: any = {};

	// Order the packages by their dependency tree
	let buildOrder = [];
	for (const nodePkg of nodePackages) {
		// Get all the dependencies
		const dependencies = {
			...nodePkg.packageJson.dependencies,
			...nodePkg.packageJson.devDependencies,
		};

		// We will look for keys starting with @perseverancia
		let perDeps = [];
		for (const key of Object.keys(dependencies)) {
			if (key.startsWith("@perseverancia")) {
				perDeps.push(key);
			}
		}

		// If there are no dependencies, it's an edge, or leaf node
		const isLeaf = perDeps.length === 0;
		if (isLeaf) {
			buildOrder.push(nodePkg);

			// From the copy remove this package
			packagesCopy = packagesCopy.filter(
				(pkg) => pkg.packageName === nodePkg.name
			);

			continue;
		}

		packageTree[nodePkg.packageName] = {};
		const currentNode = packageTree[nodePkg.packageName];
		for (const dep of perDeps) {
			const packageDependency = packagesCopy.filter(
				(pkg) => pkg.packageName === dep
			);
			// currentNode[dep]
		}
	}

	return buildOrder;
}
