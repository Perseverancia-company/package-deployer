import pc from "picocolors";
import NodePackage from "@/package/NodePackage";
import KhansDependencyGraph from "./KhansDependencyGraph";

// Helper to create a mock NodePackage that satisfies the class requirements
const createMockPkg = (
	name: string,
	deps: string[] = [],
	devDeps: string[] = []
): NodePackage => {
	return {
		packageName: name,
		packageJson: {
			dependencies: Object.fromEntries(deps.map((d) => [d, "1.0.0"])),
			devDependencies: Object.fromEntries(
				devDeps.map((d) => [d, "1.0.0"])
			),
		},
	} as unknown as NodePackage;
};

describe("KhansDependencyGraph", () => {
	let consoleErrorSpy: jest.SpyInstance;

	beforeEach(() => {
		// Silence console.error during tests to keep the output clean
		consoleErrorSpy = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	describe("getBuildOrder", () => {
		it("should return packages in a valid topological order (A -> B -> C)", () => {
			const pkgA = createMockPkg("pkg-a");
			const pkgB = createMockPkg("pkg-b", ["pkg-a"]);
			const pkgC = createMockPkg("pkg-c", ["pkg-b"]);

			// Intentionally passing them out of order to the constructor
			const graph = new KhansDependencyGraph([pkgC, pkgA, pkgB]);
			const order = graph.getBuildOrder().map((p) => p.packageName);

			expect(order).toEqual(["pkg-a", "pkg-b", "pkg-c"]);
		});

		it("should handle branching dependencies (A -> B, A -> C, B & C -> D)", () => {
			const pkgA = createMockPkg("pkg-a");
			const pkgB = createMockPkg("pkg-b", ["pkg-a"]);
			const pkgC = createMockPkg("pkg-c", ["pkg-a"]);
			const pkgD = createMockPkg("pkg-d", ["pkg-b", "pkg-c"]);

			const graph = new KhansDependencyGraph([pkgD, pkgC, pkgB, pkgA]);
			const order = graph.getBuildOrder().map((p) => p.packageName);

			expect(order[0]).toBe("pkg-a");
			expect(order[3]).toBe("pkg-d");
			// B and C can be in any order in the middle
			expect(order).toContain("pkg-b");
			expect(order).toContain("pkg-c");
		});

		it("should throw an error when a circular dependency is detected", () => {
			// A -> B -> A
			const pkgA = createMockPkg("pkg-a", ["pkg-b"]);
			const pkgB = createMockPkg("pkg-b", ["pkg-a"]);

			const graph = new KhansDependencyGraph([pkgA, pkgB]);

			expect(() => graph.getBuildOrder()).toThrow(
				"Build halted due to circular dependencies."
			);
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe("getAffectedPackages", () => {
		it("should return the changed package and all its dependents", () => {
			// Structure: models -> backend -> app
			//            models -> deployer
			const models = createMockPkg("@perseverancia/models");
			const backend = createMockPkg("@perseverancia/backend", [
				"@perseverancia/models",
			]);
			const deployer = createMockPkg("@perseverancia/package-deployer", [
				"@perseverancia/models",
			]);
			const app = createMockPkg("@perseverancia/perseverancia", [
				"@perseverancia/backend",
			]);

			const graph = new KhansDependencyGraph([
				models,
				backend,
				deployer,
				app,
			]);

			const affected = graph.getAffectedPackages([
				"@perseverancia/models",
			]);
			const names = affected.map((p) => p.packageName);

			expect(names).toContain("@perseverancia/models");
			expect(names).toContain("@perseverancia/backend");
			expect(names).toContain("@perseverancia/package-deployer");
			expect(names).toContain("@perseverancia/perseverancia");

			// Ensure the returned array is in build order (models must be first)
			expect(names[0]).toBe("@perseverancia/models");
		});

		it("should not include unrelated packages", () => {
			const pkgA = createMockPkg("pkg-a");
			const pkgB = createMockPkg("pkg-b"); // Independent

			const graph = new KhansDependencyGraph([pkgA, pkgB]);
			const affected = graph.getAffectedPackages(["pkg-a"]);

			expect(affected.map((p) => p.packageName)).toEqual(["pkg-a"]);
			expect(affected.map((p) => p.packageName)).not.toContain("pkg-b");
		});
	});

	describe("Dependency Types", () => {
		it("should recognize both dependencies and devDependencies", () => {
			const pkgA = createMockPkg("pkg-a");
			const pkgB = createMockPkg("pkg-b", [], ["pkg-a"]); // pkg-a is a devDep

			const graph = new KhansDependencyGraph([pkgA, pkgB]);
			const order = graph.getBuildOrder().map((p) => p.packageName);

			expect(order).toEqual(["pkg-a", "pkg-b"]);
		});
	});
});
