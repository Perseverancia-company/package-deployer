import KhansDependencyGraph from "./KhansDependencyGraph";
import NodePackage from "@/package/NodePackage";

// Helper to create a mock NodePackage that satisfies the class structure
const createMockPackage = (
	name: string,
	deps: Record<string, string> = {},
	devDeps: Record<string, string> = {}
) => {
	return {
		packageName: name,
		packageJson: {
			dependencies: deps,
			devDependencies: devDeps,
		},
	} as unknown as NodePackage;
};

describe("KhansDependencyGraph", () => {
	let consoleErrorSpy: jest.SpyInstance;

	beforeEach(() => {
		// Silence console.error for circular dependency tests to keep output clean
		consoleErrorSpy = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	describe("getBuildOrder", () => {
		it("should return a simple linear build order", () => {
			const pkgA = createMockPackage("pkg-a");
			const pkgB = createMockPackage("pkg-b", { "pkg-a": "1.0.0" });

			const graph = new KhansDependencyGraph([pkgA, pkgB]);
			const result = graph.getBuildOrder().map((p) => p.packageName);

			expect(result).toEqual(["pkg-a", "pkg-b"]);
		});

		it("should handle complex branching (Diamond Shape)", () => {
			// Structure: A -> (B & C) -> D
			const pkgA = createMockPackage("pkg-a");
			const pkgB = createMockPackage("pkg-b", { "pkg-a": "1.0.0" });
			const pkgC = createMockPackage("pkg-c", { "pkg-a": "1.0.0" });
			const pkgD = createMockPackage("pkg-d", {
				"pkg-b": "1.0.0",
				"pkg-c": "1.0.0",
			});

			const graph = new KhansDependencyGraph([pkgA, pkgB, pkgC, pkgD]);
			const order = graph.getBuildOrder().map((p) => p.packageName);

			expect(order[0]).toBe("pkg-a");
			expect(order[3]).toBe("pkg-d");
			// B and C can be in any order in the middle
			expect(new Set(order.slice(1, 3))).toEqual(
				new Set(["pkg-b", "pkg-c"])
			);
		});

		it("should throw an error and log the trace when a circular dependency is detected", () => {
			// A -> B -> C -> A
			const pkgA = createMockPackage("pkg-a", { "pkg-c": "1.0.0" });
			const pkgB = createMockPackage("pkg-b", { "pkg-a": "1.0.0" });
			const pkgC = createMockPackage("pkg-c", { "pkg-b": "1.0.0" });

			const graph = new KhansDependencyGraph([pkgA, pkgB, pkgC]);

			expect(() => graph.getBuildOrder()).toThrow(
				"Build halted due to circular dependencies."
			);
			expect(consoleErrorSpy).toHaveBeenCalled();
		});
	});

	describe("getAffectedPackages", () => {
		it("should return all downstream dependents when a root package changes", () => {
			// A -> B -> C
			// D (Isolated)
			const pkgA = createMockPackage("pkg-a");
			const pkgB = createMockPackage("pkg-b", { "pkg-a": "1.0.0" });
			const pkgC = createMockPackage("pkg-c", { "pkg-b": "1.0.0" });
			const pkgD = createMockPackage("pkg-d");

			const graph = new KhansDependencyGraph([pkgA, pkgB, pkgC, pkgD]);
			const affected = graph
				.getAffectedPackages(["pkg-a"])
				.map((p) => p.packageName);

			expect(affected).toEqual(["pkg-a", "pkg-b", "pkg-c"]);
			expect(affected).not.toContain("pkg-d");
		});

		it("should return only the specific package if it has no dependents", () => {
			const pkgA = createMockPackage("pkg-a");
			const graph = new KhansDependencyGraph([pkgA]);

			const affected = graph
				.getAffectedPackages(["pkg-a"])
				.map((p) => p.packageName);
			expect(affected).toEqual(["pkg-a"]);
		});
	});

	describe("packageWhitelist", () => {
		it("should ignore dependencies not present in the whitelist", () => {
			// pkg-b depends on pkg-a and external-lib
			const pkgA = createMockPackage("pkg-a");
			const pkgB = createMockPackage("pkg-b", {
				"pkg-a": "1.0.0",
				"external-lib": "2.0.0",
			});

			// Whitelist only includes pkg-a
			const graph = new KhansDependencyGraph([pkgA, pkgB], ["pkg-a"]);
			const order = graph.getBuildOrder().map((p) => p.packageName);

			// Should still work because external-lib is filtered out
			expect(order).toEqual(["pkg-a", "pkg-b"]);
		});
	});
});
