# Package deployer

Simple app to deploy all given packages.

## Usage

```bash
npm run cli -- --packages-path PATH_TO_PACKAGES
```

## Development Rules

Rules that have to be followed when developing this repository.

1. Don't add pre-build steps or my own dependencies.

When adding my own dependencies they need to be built and published before, but that beats the point of this very app.

## Environment variables

These are some environment variables used for configuration.

```bash
# Github token to list repositories from
GITHUB_TOKEN=YOUR_TOKEN
```

## List of tasks to do

- [x] Get all packages at a path
	- [x] When gathering the list, add a black list to ignore some packages
	This is principally useful for the main monorepo "perseverancia-deployment"

- [x] Configuration file
	- [x] YAML file(because it's easy to read)
	- [x] Blacklist names

- [x] Print packages obtained

Would serve as a dry run to check if the blacklist works

- [x] Order packages by dependencies(dependency graph)
- [x] Command to print build order

- [x] Package deployment
	- [x] Run "npm install" on the package
	- [x] Run "npm build"
	- [x] Finally "npm publish"

- [x] Save package deployment result as json

### CLI

- [x] Deploy packages
- [x] Print packages
- [ ] Remove packages that don't have package.json
At the given path
That is they aren't nodejs packages

### Github integration

- [ ] Read all repositories of a user in github
	- [ ] Clone them all
		- [ ] Create a blacklist
