import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import RepositoryManager from "./RepositoryManager";
import LocalRepositoryList from "./LocalRepositoryList";
import AppState from "@/data/AppState";
import PackageDeployerConfiguration from "@/configuration/PackageDeployerConfiguration";

// Helper to construct highly focused minimal mocks
const createMockRepoList = (repos: Array<{ name: string; path: string }>) => {
	return {
		repositories: repos,
	} as unknown as LocalRepositoryList;
};

const createMockAppState = (lastUpdate?: Date) => {
	return {
		state: {
			lastRepositoriesUpdate: lastUpdate,
		},
	} as unknown as AppState;
};

const createMockConfig = (updateRepositoriesEvery: number) => {
	return {
		configuration: {
			updateRepositoriesEvery,
		},
	} as unknown as PackageDeployerConfiguration;
};

describe("RepositoryManager", () => {
	describe("filterRepositories", () => {
		it("should return all repositories if no whitelist is specified", () => {
			const repos = [
				{ name: "repo-a", path: "/path/to/a" },
				{ name: "repo-b", path: "/path/to/b" },
			];
			const repoList = createMockRepoList(repos);
			const state = createMockAppState();
			const config = createMockConfig(60000);

			const manager = new RepositoryManager(
				"/workspace",
				repoList,
				state,
				config
			);

			const result = manager.filterRepositories();
			expect(result).toEqual(repos);
		});

		it("should return only whitelisted repositories when a whitelist is provided", () => {
			const repos = [
				{ name: "repo-a", path: "/path/to/a" },
				{ name: "repo-b", path: "/path/to/b" },
				{ name: "repo-c", path: "/path/to/c" },
			];
			const repoList = createMockRepoList(repos);
			const state = createMockAppState();
			const config = createMockConfig(60000);

			const manager = new RepositoryManager(
				"/workspace",
				repoList,
				state,
				config,
				{
					whitelist: ["repo-a", "repo-c"],
				}
			);

			const result = manager.filterRepositories();
			expect(result).toEqual([
				{ name: "repo-a", path: "/path/to/a" },
				{ name: "repo-c", path: "/path/to/c" },
			]);
		});

		it("should return an empty array if none of the repositories are in the whitelist", () => {
			const repos = [{ name: "repo-a", path: "/path/to/a" }];
			const repoList = createMockRepoList(repos);
			const state = createMockAppState();
			const config = createMockConfig(60000);

			const manager = new RepositoryManager(
				"/workspace",
				repoList,
				state,
				config,
				{
					whitelist: ["repo-b"],
				}
			);

			const result = manager.filterRepositories();
			expect(result).toEqual([]);
		});
	});

	describe("shouldUpdateRepositories", () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("should return true if there is no record of a last update", () => {
			const repoList = createMockRepoList([]);
			const state = createMockAppState(undefined); // Missing lastRepositoriesUpdate
			const config = createMockConfig(60000);

			const manager = new RepositoryManager(
				"/workspace",
				repoList,
				state,
				config
			);

			expect(manager.shouldUpdateRepositories()).toBe(true);
		});

		it("should return false if the time passed since the last update is within the threshold", () => {
			const now = new Date("2026-07-14T12:00:00.000Z");
			vi.setSystemTime(now);

			// Last updated 30 seconds ago, threshold is 60 seconds (60000 ms)
			const lastUpdate = new Date(now.getTime() - 30_000);
			const repoList = createMockRepoList([]);
			const state = createMockAppState(lastUpdate);
			const config = createMockConfig(60_000);

			const manager = new RepositoryManager(
				"/workspace",
				repoList,
				state,
				config
			);

			expect(manager.shouldUpdateRepositories()).toBe(false);
		});

		it("should return true if the time passed since the last update exceeds the threshold", () => {
			const now = new Date("2026-07-14T12:00:00.000Z");
			vi.setSystemTime(now);

			// Last updated 90 seconds ago, threshold is 60 seconds (60000 ms)
			const lastUpdate = new Date(now.getTime() - 90_000);
			const repoList = createMockRepoList([]);
			const state = createMockAppState(lastUpdate);
			const config = createMockConfig(60_000);

			const manager = new RepositoryManager(
				"/workspace",
				repoList,
				state,
				config
			);

			expect(manager.shouldUpdateRepositories()).toBe(true);
		});
	});
});
