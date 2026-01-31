import { Octokit } from "@octokit/rest";
import os from "os";
import fsp from "fs/promises";
import { inject } from "postject";

import PackageDeployerConfiguration from "@/packageDeployer/PackageDeployerConfiguration";
import { execPromise } from "@/lib";

/**
 * Configuration
 */
export default async function configurationMain(
	yargs: any,
	config: PackageDeployerConfiguration,
	octokit: Octokit
) {
	return yargs.command(
		"build",
		"Build the app to executable",
		(args: any) => {
			return args;
		},
		async (args: any) => {
			const distPath = "./dist/cli/index.js";
			const mjsPath = "./dist/cli/index.mjs";

			// Create .mjs copy, to force ESM in the EXE file
			await fsp.copyFile(distPath, mjsPath);
			console.log(`✅ .mjs wrapper created`);

			// Create blob
			await execPromise("node --experimental-sea-config sea-config.json");
			console.log(`Created blob`);
			const exeFile = "pkgdep.exe";

			// Copy node exe
			if (os.platform() === "win32") {
				// Get the path to node.exe using process.execPath
				const nodeExePath = process.execPath;
				await fsp.copyFile(nodeExePath, exeFile);
				console.log(`Copied node.exe file over`);
			}

			const blobData = await fsp.readFile("sea-prep.blob");
			console.log("💉 Injecting blob using API...");

			await inject(exeFile, "NODE_SEA_BLOB", blobData, {
				sentinelFuse: "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
				machoId: "NODE_SEA_BLOB", // Only matters for macOS, but good to have
			});

			console.log("✨ Executable created successfully!");
		}
	);
}
