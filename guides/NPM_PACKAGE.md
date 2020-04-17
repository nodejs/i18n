# npm package

This repository can be installed as an npm package. The goal is to make the English and localized Node.js docs more easily consumable and re-usable in different projects.

## Installation

This package is not published to the npm registry, but can be installed directly from GitHub.

You can install from the repo's master branch:

```sh
npm install nodejs/i18n
# or
yarn add nodejs/i18n
```

Or install from a specific branch or tag:

```sh
npm install nodejs/i18n#some-branch
# or
yarn add nodejs/i18n#some-branch
```

## Usage (raw Markdown files)

Once you've installed the package, you'll have all the markdown files in your local `node_modules/node-i18n` directory.

Here's the file structure:

```sh
# node majors
$ ls -A1 node_modules/node-i18n/content
v10.x
v12.x
v13.x
```

---

```sh
# locales
$ ls -A1 node_modules/node-i18n/content/v10.x
af-ZA
ar-SA
bg-BG
ca-ES
cs-CZ
da-DK
...
```

## Usage (JavaScript module)

The npm module provides a basic JavaScript API for convenience.

Require the module using its package.json `name`:

```js
const i18n = require('node-i18n')

// or..
const { allPages, getPages, locales, supportedVersions } = require('node-i18n')
```

## Module API

### `allPages`

An array of page objects in all languages and all supported Node.js versions. Each object looks like this:

```yml
locale: 'af-ZA',
nodeVersion: 'v10.x',
filePath: 'doc/STYLE_GUIDE.md',
fullPath: '/Users/z/git/nodejs/i18n/content/v10.x/af-ZA/doc/STYLE_GUIDE.md'
```

### `getPages([nodeMajor, locale])`

An async convenience function that returns a subset of pages by Node.js version and locale.

- `nodeMajor` String, optional. A major version range string like `v12.x`. Defaults to the latest version.
- `locale` String, optional. Defaults to `en-US`

### `locales`

An array of all the locale codes used in the project, like `en-US`, `es-ES`, etc.

### `supportedVersions`

An array of the major Node.js version ranges supported in the project, like `v12.x` and `v10.x`.
