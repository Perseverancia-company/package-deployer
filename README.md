# Package deployer

Simple app to deploy all given packages.

## Usage

[Usage](./doc/CLI.md)

## Contributing

[Contributing](./doc/Contributing.md)

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
