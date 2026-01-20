# List of tasks to do

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
	- [x] Combine into a monorepo
	Create a copy of every repository as a monorepo.
	
	Cannot really be used because of the package-lock problem
	- [ ] Pull all repositories from the remote
	- [ ] Remove repositories that don't have package.json
	That is they aren't nodejs packages

## API

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
	- [x] Local config
		- [x] Preferred configuration
			Must be idempotent, that is, no matter how many times it is run, it always gives the same results.
			- [x] Set remote as push url
			- [x] Set local path as push url
	- [x] Pull all
	- [ ] Push all
- [ ] Remove repositories that don't have package.json
That is they aren't nodejs packages

## Github integration

- [x] Read all repositories of a user in github
	- [x] Clone them all

## Cancelled

- [-] Clone and combine
This should be interpreted as clone all nodejs repositories, combine and MOVE them into a monorepo.

Not really viable because each repository has their own package-lock, and if you wanted to make a commit you would have to restore the package lock.
