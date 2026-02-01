import pc from "picocolors";

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
			sorted.push(pkg);

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
	private handleCircularDependency(sorted: NodePackage[]) {
		return this.detectCircularDependency(sorted);
	}

	/**
	 * Detect circular dependency
	 */
	private detectCircularDependency(sorted: NodePackage[]): never {
		const sortedNames = new Set(sorted.map((p) => p.packageName));
		const nodesInCycles = this.nodePackages.filter(
			(p) => !sortedNames.has(p.packageName)
		);

		// We will use DFS to find the specific path of the cycle
		const visited = new Set<string>();
		const stack = new Set<string>();
		const path: Array<string> = [];

		// Find the cycles
		const findCycle = (node: string): Array<string> | null => {
			visited.add(node);
			stack.add(node);
			path.push(node);

			const neighbors = this.adj.get(node) || new Set();
			for (const neighbor of neighbors) {
				if (stack.has(neighbor)) {
					// Cycle found! Return the path from the neighbor onwards
					const cycleStartIdx = path.indexOf(neighbor);
					return [...path.slice(cycleStartIdx), neighbor];
				}

				if (!visited.has(neighbor)) {
					const result = findCycle(neighbor);
					if (result) {
						return result;
					}
				}
			}

			stack.delete(node);
			path.pop();
			return null;
		};

		let specificCycle: Array<string> | null = null;
		for (const pkg of nodesInCycles) {
			specificCycle = findCycle(pkg.packageName);
			if (specificCycle) {
				break;
			}
		}

		console.error(
			pc.red(
				pc.bold(
					"\n❌ FATAL: Circular dependency detected in Perseverancia!"
				)
			)
		);
		if (specificCycle) {
			console.error(
				pc.yellow(`Trace: ${pc.cyan(specificCycle.join(" ➔ "))}`)
			);
		} else {
			console.error(
				pc.yellow(
					`Unsortable packages: ${nodesInCycles
						.map((p) => p.packageName)
						.join(", ")}`
				)
			);
		}

		throw new Error("Build halted due to circular dependencies.");
	}
}
