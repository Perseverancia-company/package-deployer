import { Octokit } from "@octokit/rest";
import fsp from "fs/promises";
import simpleGit from "simple-git";
import pc from "picocolors";

import LocalRepositoryList from "./LocalRepositoryList";
import { execPromise } from "@/lib";
import path from "path";

/**
 * Get all repositories
 *
 * @returns
 */
export async function getAllRepositories(octokit: Octokit) {
	try {
		// Using paginate ensures you get EVERY repo, even if you have hundreds
		const repos = await octokit.paginate(
			octokit.rest.repos.listForAuthenticatedUser,
			{
				visibility: "all", // Options: 'all', 'public', 'private'
				affiliation: "owner", // Ensures you only get repos you own (not just members of)
				per_page: 100, // Maximum per request to reduce number of calls
			},
		);

		console.log(`Successfully fetched ${repos.length} repositories.`);

		// Map the data to only the fields you likely need for 'Perseverancia'
		const repoList = repos.map((repo) => ({
			name: repo.name,
			fullName: repo.full_name,
			private: repo.private,
			description: repo.description,
			url: repo.html_url,
			language: repo.language,
			updatedAt: repo.updated_at,
		}));

		console.table(repoList);
		return repoList;
	} catch (error: any) {
		console.error("Error fetching repositories:", error.message);
	}
}

/**
 * Set repositories remote push urls
 */
export async function setRepositoriesRemotePushUrls(
	localRepositories: LocalRepositoryList,
	bareRepositoriesPath: string,
) {
	for (const repo of localRepositories.repositories) {
		console.log(`Checking configuration for: ${repo.name}...`);
		try {
			// Get current fetch URL (the primary one)
			const fetchUrlRaw = await execPromise("git remote get-url origin", {
				cwd: repo.path,
				encoding: "utf8",
			});
			const fetchUrl = fetchUrlRaw.stdout.trim();

			// Get all currently set PUSH URLs
			// --all is important because there can be multiple
			let existingPushUrls: string[] = [];
			try {
				const output = await execPromise(
					"git remote get-url --push --all origin",
					{
						cwd: repo.path,
						encoding: "utf8",
					},
				);
				existingPushUrls = output.stdout
					.split("\n")
					.map((u) => u.trim())
					.filter(Boolean);
			} catch {
				// If no push URLs are set, git returns an error code.
				// In that case, the fetchUrl is used by default for pushing.
				existingPushUrls = [];
			}

			// Add GitHub Push URL if missing
			if (!existingPushUrls.includes(fetchUrl)) {
				await execPromise(
					`git remote set-url --add --push origin ${fetchUrl}`,
					{
						cwd: repo.path,
					},
				);
				console.log(`[${repo.name}] Added GitHub push URL.`);
			}

			// Define our target URLs
			const localBarePath = path.join(
				bareRepositoriesPath,
				`${repo.name}.git`,
			);
			try {
				// Check if the local bare repository path actually exists
				await fsp.access(localBarePath);

				// Add Local Bare Push URL if missing
				if (!existingPushUrls.includes(localBarePath)) {
					await execPromise(
						`git remote set-url --add --push origin ${localBarePath}`,
						{ cwd: repo.path },
					);
					console.log(`[${repo.name}] Added Local Bare push URL.`);
				}
			} catch (error) {
				// This block triggers if fsp.access fails
				console.warn(
					`⚠️ [${repo.name}] Skipping local backup: Path ${localBarePath} does not exist.`,
				);
			}
		} catch (err) {
			console.error(
				`❌ Skipped ${repo.name}: Not a git repository or origin missing.`,
			);
		}
	}
}

/**
 * Update repository
 *
 * Push or pull repository depending on the given date.
 */
export async function updateRepository(repositoryPath: string) {
	const git = simpleGit(repositoryPath);

	// Fetch the latest metadata
	await git.fetch();

	// Get the latest local commit date
	const localLog = await git.log({ n: 1 });
	if (!localLog.latest) {
		throw new Error("Couldn't fetch the local repository date");
	}
	const localDate = new Date(localLog.latest.date);

	// Get the latest remote commit date (tracking branch)
	// We assume 'origin/main' or 'origin/master'.
	// Using '@{u}' (upstream) is the most robust way to reference the remote tracking branch.
	const remoteLog = await git.log(["-1", "@{u}"]);
	if (!remoteLog.latest) {
		throw new Error("Couldn't fetch the remote date");
	}
	const remoteDate = new Date(remoteLog.latest.date);

	// Check if the remote date is greater than the local date
	if (remoteDate > localDate) {
		await git.pull();
		console.log(pc.green("✅ Local repository updated successfully."));
	} else if (remoteDate < localDate) {
		await git.push();
		console.log(pc.green("✅ Remote repository updated successfully."));
	} else {
		console.log(pc.gray("✨ Everything is up to date. No action needed."));
	}
}

/**
 * Pull if newer
 */
export async function pullRepositoryIfNewer(repositoryPath: string) {
	const git = simpleGit(repositoryPath);

	// Fetch the latest metadata
	await git.fetch();

	// Get the latest local commit date
	const localLog = await git.log({ n: 1 });
	if (!localLog.latest) {
		throw new Error("Couldn't fetch the local repository date");
	}
	const localDate = new Date(localLog.latest.date);

	// Get the latest remote commit date (tracking branch)
	// We assume 'origin/main' or 'origin/master'.
	// Using '@{u}' (upstream) is the most robust way to reference the remote tracking branch.
	const remoteLog = await git.log(["-1", "@{u}"]);
	if (!remoteLog.latest) {
		throw new Error("Couldn't fetch the remote date");
	}
	const remoteDate = new Date(remoteLog.latest.date);

	// Check if the remote date is greater than the local date
	if (remoteDate > localDate) {
		// Update local repository
		await git.pull();
	}
}
