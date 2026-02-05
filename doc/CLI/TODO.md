# CLI

- [x] Deploy packages
- [x] Print packages
- [x] Config
	- [x] Set packages path
	- [x] Set github profile
	- [x] Set github credentials
	- [x] Add a package to the blacklist
	- [ ] Toggle logging
- [x] Repositories
	- [x] Clone all
	- [x] Combine
	- [x] Local config
		- [x] Preferred configuration
			Must be idempotent, that is, no matter how many times it is run, it always gives the same results.
			- [x] Set remote as push url
			- [x] Set local path as push url
	- [x] Pull all
		- [x] Use whitelist
	- [x] Push all
		- [x] Use whitelist
- [ ] Remove repositories that don't have package.json
That is they aren't nodejs packages
