# CLI

CLI usage guide.

## Configuration

Set configuration.

Set packages path to not need to give it every time.

```bash
npm run cli -- config set --packages-path PATH_TO_PACKAGES
```

Set github token

```bash
npm run cli -- config set --github-token GITHUB_TOKEN
```

Set github user link

```bash
npm run cli -- config set --github-user-url GITHUB_USER_URL
```

## Packages path

The path where packages are to be deployed, this is required for most commands.

```bash
npm run cli -- --packages-path PATH_TO_PACKAGES
```

## Deployment

Deploy all apps at a given path, including workspaces.

The apps packages are installed, they are built and then published.

```bash
npm run cli -- deploy --packages-path PATH_TO_PACKAGES
```

## Print

Print information to the terminal.

Print all packages found at the given path.

```bash
npm run cli -- print --packages-path PATH_TO_PACKAGES --packages
```

Print packages build order.

```bash
npm run cli -- print --packages-path PATH_TO_PACKAGES --packages
```
