# List of tasks to do

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

## CLI

- [x] Deploy packages
- [x] Print packages
- [x] Config
	- [x] Set packages path
	- [x] Set github profile
	- [x] Set github credentials
	- [x] Add a package to the blacklist
- [x] Repositories
	- [x] Clone all
	- [x] Combine
	- [ ] Local config
		- [ ] Preferred configuration
			- [ ] Set remote as push url
			- [ ] Set local path as push url
- [ ] Remove repositories that don't have package.json
That is they aren't nodejs packages

## Github integration

- [x] Read all repositories of a user in github
	- [x] Clone them all
