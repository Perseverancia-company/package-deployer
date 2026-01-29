# Package deployment

Package deployment is about deploying packages in the right way, building a dependency graph and then building, and publishing all packages.

A smarter way would be to deploy only the packages that have beenn updated and have different versions locally(in a git repository) from the remote(verdaccio).

## TODO

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

- [ ] Smart deployment
	- [ ] Get newer packages
	- [ ] Get packages that depend on newer packages
	- [ ] Update packages, build and publish them
