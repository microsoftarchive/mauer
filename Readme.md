Package manager for the frontend, with a twist.

### Installation
`[sudo] npm -g install mauer@latest`


### Generating patches
* install the package with `mauer install [NAME]@[VERSION]`
* make changes
* generate the patch with `mauer diff [NAME] > patches/[NAME]@[VERSION]`
* next installs will pick up the patch automatically
