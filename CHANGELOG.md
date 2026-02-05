# Changelog

## 3.2.0

Added

- Update repositories command
Pushes or pulls repositories based on their last commit date.
Should be preferred before 'push' or 'pull' command.

## 3.1.0

Added

- Repositories push command to use the whitelist
- Repositories pull command to use the whitelist
To not push or pull the rest of repositories that don't really matter.

## 3.0.0

Added

-   Package manager abstract class
    -   NPM class
    -   PNPM class
-   Pull all repositories if they are newer
-   Update command
    -   Update repository information
    -   Update all repositories if the remote is newer
    -   Update all packages
-   Incremental package updates
-   Packages filter class
-	Deployment state class

## 2.10.0

-   Push all command

## 2.9.0

-   Pull all command

## 2.8.0

-   Configure repository remotes

## 2.5.0

-   Default package configuration

## 2.1.2

Important fixes

-   Npm commands to work on windows
-   Deployment to run in order

## 2.1.0

-   Changed `pkgdep config` to `pkgdep config set`

## 2.0.0

-   Github integration
-   Print command
-   Configuration command
-   Sync command
-   Repositories command
    -   Clone all repositories

## 1.0.0

-   Create build graph
-   Deploy packages
