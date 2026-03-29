import PackagesFilter from "./PackagesFilter";

// Mocking dependencies
const createMockPkg = (
	name: string,
	packageName: string,
	version: string,
	isPrivate: boolean = false
) => ({
	name,
	packageName,
	version,
	packageJson: { private: isPrivate },
});

describe("PackagesFilter", () => {
	let mockConfig: any;
	let mockNodePackageList: any;
	let deployedPackages: Map<string, { version: string }>;

	beforeEach(() => {
		// 1. Setup Mock Configuration
		mockConfig = {
			configuration: {
				repositoriesListing: { use: "blacklist" },
			},
			getWhitelist: jest.fn().mockReturnValue([]),
			getBlacklist: jest.fn().mockReturnValue([]),
		};

		// 2. Setup Mock Package List
		mockNodePackageList = {
			getNodePackages: jest.fn().mockReturnValue([]),
		};

		// 3. Setup Deployed Packages Map
		deployedPackages = new Map();
	});

	describe("Whitelist / Blacklist Filtering", () => {
		it("should filter out packages in the blacklist", () => {
			const pkgA = createMockPkg("repo-a", "pkg-a", "1.0.0");
			const pkgB = createMockPkg("repo-b", "pkg-b", "1.0.0");

			mockConfig.configuration.repositoriesListing.use = "blacklist";
			mockConfig.getBlacklist.mockReturnValue(["repo-b"]);

			const filter = new PackagesFilter(
				mockConfig,
				mockNodePackageList,
				deployedPackages
			);
			const result = filter.filterGivenPackagesByConfiguration([
				pkgA,
				pkgB,
			] as any);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("repo-a");
		});

		it("should only include packages in the whitelist", () => {
			const pkgA = createMockPkg("repo-a", "pkg-a", "1.0.0");
			const pkgB = createMockPkg("repo-b", "pkg-b", "1.0.0");

			mockConfig.configuration.repositoriesListing.use = "whitelist";
			mockConfig.getWhitelist.mockReturnValue(["repo-a"]);

			const filter = new PackagesFilter(
				mockConfig,
				mockNodePackageList,
				deployedPackages
			);
			const result = filter.filterGivenPackagesByConfiguration([
				pkgA,
				pkgB,
			] as any);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("repo-a");
		});
	});

	describe("ignoreApps Logic", () => {
		it("should filter out private packages (apps) when ignoreApps is true", () => {
			const lib = createMockPkg("lib-a", "lib-a", "1.0.0", false);
			const app = createMockPkg("app-a", "app-a", "1.0.0", true); // private: true

			const filter = new PackagesFilter(
				mockConfig,
				mockNodePackageList,
				deployedPackages,
				{
					ignoreApps: true,
				}
			);

			const result = filter.filterGivenPackagesByConfiguration([
				lib,
				app,
			] as any);

			expect(result).toHaveLength(1);
			expect(result[0].packageName).toBe("lib-a");
		});
	});

	describe("affectedPackages", () => {
		it("should identify packages that are not yet deployed", () => {
			const pkgA = createMockPkg("repo-a", "pkg-a", "1.0.0");
			mockNodePackageList.getNodePackages.mockReturnValue([pkgA]);

			const filter = new PackagesFilter(
				mockConfig,
				mockNodePackageList,
				deployedPackages
			);
			const result = filter.affectedPackages();

			expect(result).toContain(pkgA);
		});

		it("should identify packages where local version is higher than remote", () => {
			const pkgA = createMockPkg("repo-a", "pkg-a", "1.1.0");
			mockNodePackageList.getNodePackages.mockReturnValue([pkgA]);
			deployedPackages.set("pkg-a", { version: "1.0.0" });

			const filter = new PackagesFilter(
				mockConfig,
				mockNodePackageList,
				deployedPackages
			);
			const result = filter.affectedPackages();

			expect(result).toContain(pkgA);
		});

		it("should ignore packages where remote is equal or higher", () => {
			const pkgA = createMockPkg("repo-a", "pkg-a", "1.0.0");
			mockNodePackageList.getNodePackages.mockReturnValue([pkgA]);
			deployedPackages.set("pkg-a", { version: "1.0.0" });

			const filter = new PackagesFilter(
				mockConfig,
				mockNodePackageList,
				deployedPackages
			);
			const result = filter.affectedPackages();

			expect(result).toHaveLength(0);
		});
	});

	describe("getIncrementalBuildOrder", () => {
		it("should return affected packages and their dependents in order", () => {
			// Setup: lib-core -> lib-ui
			const core = createMockPkg("core", "lib-core", "1.1.0"); // Updated
			const ui = createMockPkg("ui", "lib-ui", "1.0.0"); // Not updated, but depends on core

			// Mock the structure of the NodePackage for the Graph
			const coreFull = { ...core, packageJson: { dependencies: {} } };
			const uiFull = {
				...ui,
				packageJson: { dependencies: { "lib-core": "1.1.0" } },
			};

			mockNodePackageList.getNodePackages.mockReturnValue([
				coreFull,
				uiFull,
			]);
			deployedPackages.set("lib-core", { version: "1.0.0" }); // Needs update
			deployedPackages.set("lib-ui", { version: "1.0.0" }); // Up to date

			const filter = new PackagesFilter(
				mockConfig,
				mockNodePackageList,
				deployedPackages
			);

			const result = filter.getIncrementalBuildOrder();

			// Even though 'ui' didn't change version, it's affected because 'core' changed.
			expect(result.map((p) => p.packageName)).toEqual([
				"lib-core",
				"lib-ui",
			]);
		});
	});
});
