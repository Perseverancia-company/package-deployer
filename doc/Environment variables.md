# Environment variables(Deprecated)

WARNING: These are deprecated, use the CLI configuration instead.

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
