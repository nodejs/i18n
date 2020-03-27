#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const download = require('download')
const walk = require('walk-sync').entries
const { nodeVersions } = require('../package.json')

collect()

async function collect () {
  for (const major in nodeVersions) {
    const version = nodeVersions[major]
    await getDocsForNodeVersion(major, version).catch(err => {
      console.error(`problem fetching version: ${version}`)
      console.error(err)
    })
  }
}

async function getDocsForNodeVersion (major, version) {
  const docDir = path.join(__dirname, `../content/${major}/en-US/doc`)
  const tempDir = path.join(__dirname, `../temp/${major}`)

  // TODO exit early if docs for this version have already been downloaded

  // download repo bundle and extract to a temporary directory
  const tarballUrl = `https://github.com/nodejs/node/archive/${version}.tar.gz`
  console.log('downloading', tarballUrl)
  await download(tarballUrl, tempDir, { extract: true })

  // move docs from temp dir to this repo
  const tempDocDir = path.join(tempDir, `node-${version.replace('v', '')}`, 'doc')

  // removes files other than markdown
  walk(tempDocDir, { directories: false })
    .filter(file => path.extname(file.relativePath.toLowerCase()) !== '.md')
    .forEach(file => fs.unlinkSync(path.join(tempDocDir, file.relativePath)))

  await fs.copy(tempDocDir, docDir)

  fs.remove(tempDir)
}
