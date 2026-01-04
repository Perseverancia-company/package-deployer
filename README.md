# Package deployer

Simple app to deploy all given packages.

## Usage

[Usage](./doc/CLI.md)

## Development Rules

Rules that have to be followed when developing this repository.

1. Don't add my own dependencies.

When adding my own dependencies they need to be built and published before, but that beats the point of this very app.

## Environment variables

These are some environment variables used for configuration.

```bash
# Github token to list repositories from
GITHUB_TOKEN=YOUR_TOKEN

# Packages path
PACKAGES_PATH=PACKAGES_PATH
```

Although these can be used, it would be better to set them using the CLI.

```bash
pkdep config --packages-path PACKAGES_PATH --github-token GITHUB_TOKEN
```
