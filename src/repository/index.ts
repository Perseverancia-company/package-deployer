import { Octokit } from "@octokit/rest";

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
			}
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
