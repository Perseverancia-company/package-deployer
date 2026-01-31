import { spawn } from "child_process";

/**
 * Promisified spawn
 *
 * @returns
 */
export function promisifiedSpawn(
	command: string,
	args: string[] = [],
	options: {
		cwd?: string;
		shell?: boolean;
	} = {}
) {
	return new Promise<number>((resolve, reject) => {
		// 'spawn' is often preferred as it doesn't use a shell by default (safer),
		// and handles large output by streaming.
		const child = spawn(command, args, {
			stdio: "inherit",
			// Expand given options
			...(options ? options : {}),
		});

		// stdio: 'inherit' pipes the child's stdin/stdout/stderr directly to the parent,
		// which is often desired for setup scripts or interactive tools.

		// Reject promise on error
		child.on("error", (err) => {
			console.error(`Failed to start subprocess: ${err}`);
			reject(err);
		});

		// The 'close' event is emitted when the stdio streams of a child process have been closed.
		child.on("close", (code) => {
			// 0 exit code means success, therefore we resolve with that
			if (code === 0) {
				resolve(code);
			} else {
				// Reject the promise if the exit code is not 0
				reject(new Error(`Command exited with code ${code}`));
			}
		});
	});
}
