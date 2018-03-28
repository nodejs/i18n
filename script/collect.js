#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const download = require('download')
const mkdirp = require('mkdirp').sync
const temp = require('temp')
const walk = require('walk-sync').entries
const targetNodeVersions = require('../lib/target-node-versions')

collect()

async function collect () {
  for (const version of targetNodeVersions) {
    await getDocsForNodeVersion(version)
  }
}

async function getDocsForNodeVersion (version) {
  const docDir = path.join(__dirname, `../content/v${version}/en-US/doc`)

  // exit early if docs for this version have already been downloaded
  if (fs.existsSync(docDir)) {
    console.log(`docs for ${version} have already been collected; skipping`)
    return
  }

  // download repo bundle and extract to a temporary directory
  const tarballUrl = `https://github.com/nodejs/node/archive/v${version}.tar.gz`
  console.log('downloading', tarballUrl)
  const tempDir = temp.mkdirSync()
  await download(tarballUrl, tempDir, {extract: true})

  // move docs from temp dir to this repo
  const tempDocDir = path.join(tempDir, `node-${version}`, 'doc')
  mkdirp(docDir)
  fs.renameSync(tempDocDir, docDir)

  // keep .md files and remove all others
  walk(docDir, {directories: false})
    .filter(file => path.extname(file.relativePath.toLowerCase()) !== '.md')
    .forEach(file => fs.unlinkSync(path.join(docDir, file.relativePath)))
}
