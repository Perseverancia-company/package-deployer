# Package deployer

Simple app to deploy all given packages.

## Rules

Rules that have to be followed when developing this repository.

1. Don't add pre-build steps or my own dependencies.

When adding my own dependencies they need to be built and published before, but that beats the point of this very app.

## List of tasks to do

- [x] Get all packages at a path
	- [x] When gathering the list, add a black list to ignore some packages
	This is principally useful for the main monorepo "perseverancia-deployment"
