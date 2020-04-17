#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const download = require('download')

const getVersions = require('./getVersions')
const { supportedVersions } = require('../package.json')

collect()

async function collect () {
  const nodeVersions = await getVersions(supportedVersions)
  for (const major in nodeVersions) {
    const version = nodeVersions[major]
    await getDocsForNodeVersion(major, version).catch(err => {
      console.error(`problem fetching version: ${version}`)
      console.error(err)
    })
  }
}

async function getDocsForNodeVersion (major, version) {
  const docDir = path.join(__dirname, `../content/${major}/en-US`)
  const downloadOptions = {
    extract: true,
    strip: 1,
    filter: file => path.extname(file.path) === '.md' && file.path.startsWith('doc')
  }

  // clean out english translations to ensure old files are removed
  fs.remove(docDir)

  // download repo bundle and extract
  const tarballUrl = `https://github.com/nodejs/node/archive/${version}.tar.gz`
  console.log('downloading', tarballUrl)
  await download(tarballUrl, docDir, downloadOptions)
}
