import yargs from "yargs";
import { hideBin } from "yargs/helpers";

/**
 * Main
 */
async function main() {
	return yargs().help().parse(hideBin(process.argv));
}

main();
