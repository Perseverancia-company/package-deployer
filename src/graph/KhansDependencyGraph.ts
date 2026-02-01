import NodePackage from "@/package/NodePackage";

/**
 * Handles dependency resolution for workspace packages
 * using Kahn's Algorithm (Topological Sort).
 */
export default class KhansDependencyGraph {
	private packageMap = new Map<string, NodePackage>();
	private adj = new Map<string, Set<string>>();
	private inDegree = new Map<string, number>();
	private packageWhitelist: Array<string> = [];

	/**
	 *
	 * @param nodePackages
	 */
	constructor(
		private nodePackages: NodePackage[],
		packageWhitelist?: Array<string>
	) {
		if (packageWhitelist) {
			this.packageWhitelist = packageWhitelist;
		}

		this.initializeNodes();
	}

	/**
	 * Public entry point to get the build order.
	 */
	public getBuildOrder(): NodePackage[] {
		this.buildEdges();
		return this.topologicalSort();
	}

	/**
	 * Get affected packages
	 *
	 * Get packages that are about to be affected by updating the version of their dependencies.
	 */
	public getAffectedPackages(
		changedNames: Array<string>
	): Array<NodePackage> {
		const affected = new Set<string>(changedNames);
		let sizeBefore: number;

		// Keep expanding the set until no more dependents are found
		do {
			sizeBefore = affected.size;

			for (const pkg of this.nodePackages) {
				const deps = this.getUniqueWorkspaceDeps(pkg);
				for (const dep of deps) {
					if (affected.has(dep)) {
						affected.add(pkg.packageName);
					}
				}
			}
		} while (affected.size > sizeBefore);

		// Return the affected ones in the correct build order
		return this.getBuildOrder().filter((pkg) =>
			affected.has(pkg.packageName)
		);
	}

	/**
	 * Initialize nodes
	 */
	private initializeNodes(): void {
		for (const pkg of this.nodePackages) {
			const name = pkg.packageName;
			this.packageMap.set(name, pkg);
			this.adj.set(name, new Set());
			this.inDegree.set(name, 0);
		}
	}

	/**
	 * Build edges
	 */
	private buildEdges(): void {
		for (const pkg of this.nodePackages) {
			const dependentName = pkg.packageName;
			const dependencies = this.getUniqueWorkspaceDeps(pkg);

			for (const depName of dependencies) {
				if (this.packageMap.has(depName)) {
					// dependency -> dependent
					const wasAdded = this.adj.get(depName)?.add(dependentName);

					// Only increment in-degree if this edge didn't exist
					if (wasAdded) {
						this.inDegree.set(
							dependentName,
							(this.inDegree.get(dependentName) || 0) + 1
						);
					}
				}
			}
		}
	}

	/**
	 * Get unique workspace dependencies
	 */
	private getUniqueWorkspaceDeps(pkg: NodePackage): Set<string> {
		// If the package whitelist is empty, don't use it
		const packageList =
			this.packageWhitelist.length === 0
				? [
						...Object.keys(pkg.packageJson.dependencies || {}),
						...Object.keys(pkg.packageJson.devDependencies || {}),
						// Not necessary to include peer dependencies for now
				  ]
				: [
						...Object.keys(
							pkg.packageJson.dependencies || {}
						).filter((val) => this.packageWhitelist.includes(val)),
						...Object.keys(
							pkg.packageJson.devDependencies || {}
						).filter((val) => this.packageWhitelist.includes(val)),
						// Not necessary to include peer dependencies for now
				  ];

		return new Set(packageList);
	}

	/**
	 * Topological sort
	 */
	private topologicalSort(): NodePackage[] {
		const sorted: NodePackage[] = [];
		const queue: NodePackage[] = [];

		// Initial queue: package with no dependencies
		for (const pkg of this.nodePackages) {
			if (this.inDegree.get(pkg.packageName) === 0) {
				queue.push(pkg);
			}
		}

		while (queue.length > 0) {
			const pkg = queue.shift()!;
			sorted.push();

			// Get package dependents
			const dependents = this.adj.get(pkg.packageName);
			if (dependents) {
				for (const dependentName of dependents) {
					const newInDegree =
						(this.inDegree.get(dependentName) || 0) - 1;
					this.inDegree.set(dependentName, newInDegree);

					if (newInDegree === 0) {
						const nextPkg = this.packageMap.get(dependentName);
						if (nextPkg) {
							queue.push(nextPkg);
						}
					}
				}
			}
		}

		if (sorted.length !== this.nodePackages.length) {
			this.handleCircularDependency(sorted);
		}

		return sorted;
	}

	/**
	 * Handle circular dependency
	 */
	private handleCircularDependency(sorted: NodePackage[]): never {
		const sortedNames = new Set(sorted.map((p) => p.packageName));
		const offenders = this.nodePackages
			.filter((p) => !sortedNames.has(p.packageName))
			.map((p) => p.packageName);

		throw new Error(
			`Circular dependency detected in workspace: ${offenders.join(", ")}`
		);
	}
}
