# CLI

CLI usage guide.

## Configuration

Set configuration.

Set packages path to not need to give it every time.

```bash
pkgdep config set --packages-path PATH_TO_PACKAGES
```

Set github token

```bash
pkgdep config set --github-token GITHUB_TOKEN
```

Set github user link

```bash
pkgdep config set --github-user-url GITHUB_USER_URL
```

Blacklist

```bash
pkgdep config blacklist --name PACKAGE_NAME --add 
```

## Deployment

Deploy all apps, including workspaces.

The apps packages are installed, they are built and then published.

```bash
pkgdep deploy
```

## Print

Print information to the terminal.

Print all packages found at the configured packages path.

```bash
pkgdep print --packages
```

Print packages build order.

```bash
pkgdep print --build-order
```

## Repositories

Handle user repositories

Clone all repositories

```bash
pkgdep repositories --clone-all
```

## Sync

Sync configuration

Sync repositories

```bash
pkgdep sync --repositories
```
