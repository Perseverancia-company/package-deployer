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

Set registry username and password

```bash
pkgdep config set --registry-username USERNAME --registry-password PASSWORD
```

Set registry url

```bash
pkgdep config set --registry-url URL
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

Print configuration

```bash
pkgdep print --configuration
```

## Repositories

Handle user repositories, doesn't clones repositories that were already cloned.

Add repositories to the blacklist by using comma-separated values

```bash
pkgdep repositories blacklist --list-add REPOSITORY_1_NAME,REPOSITORY_2_NAME
```

Clone all repositories

```bash
pkgdep repositories clone --all
```

Clone all repositories in the whitelist

```bash
pkgdep repositories clone --all --use-whitelist
```

Combine all packages/repositories into a single monorepo

```bash
pkgdep repositories combine
```

Set preferred configuration to all repositories

What this does is:

-   Set the default url as a push url
-   Set a local path as a push url(if it exists)
    The repository in the local path are checked at "/srv/git/user/Javascript/{REPO_NAME}.git"

```bash
pkgdep repositories local-config --preferred-configuration
```

Pull all repositories from the remote

```bash
pkgdep repositories pull
```

Add repositories to the whitelist

```bash
pkgdep repositories whitelist --list-add REPOSITORY_1_NAME,REPOSITORY_2_NAME
```

Delete blacklisted repositories.

```bash
pkgdep repositories --delete-blacklisted
```

## Sync

Sync configuration

Sync repositories

```bash
pkgdep sync --repositories
```
