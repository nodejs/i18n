#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const download = require('download')
const walk = require('walk-sync').entries
const {nodeVersions} = require('../package.json')

collect()

async function collect () {
  for (const version of nodeVersions) {
    await getDocsForNodeVersion(version)
  }
}

async function getDocsForNodeVersion (version) {
  try {
    const docDir = path.join(__dirname, `../content/${version}/en-US/doc`)
    const tempDir = path.join(__dirname, `../temp/${version}`)

    // exit early if docs for this version have already been downloaded
    if (fs.existsSync(docDir)) {
      console.log(`docs for ${version} have already been collected; skipping`)
      return
    }

    // download repo bundle and extract to a temporary directory
    const tarballUrl = `https://github.com/nodejs/node/archive/${version}.tar.gz`
    console.log('downloading', tarballUrl)
    await download(tarballUrl, tempDir, {extract: true})

    // move docs from temp dir to this repo
    const tempDocDir = path.join(tempDir, `node-${version.replace('v', '')}`, 'doc')
    await fs.move(tempDocDir, docDir)

    // keep .md files and remove all others
    walk(docDir, {directories: false})
      .filter(file => path.extname(file.relativePath.toLowerCase()) !== '.md')
      .forEach(file => fs.unlinkSync(path.join(docDir, file.relativePath)))

    fs.remove(tempDir)
  } catch (ex) {
    console.error(`error during getting docs for ${version}: ${ex}`)
  }
}
