#!/usr/bin/env node

const fs = require('fs')
const got = require('got')
const path = require('path')
const download = require('download')
const decompress = require('decompress')
const mkdirp = require('mkdirp').sync
const temp = require('temp')

async function collect () {
  const {body:nodeVersion} = await got('https://semver.io/node/stable')
  const tarballUrl = `https://github.com/nodejs/node/archive/v${nodeVersion}.tar.gz`
  console.log('downloading', tarballUrl)
  const tarball = await download(tarballUrl)
  const tempDir = temp.mkdirSync('nodey-node')
  const tarballFilename = path.join(tempDir, 'tarball.tgz')
  fs.writeFileSync(tarballFilename, tarball)
  const files = await decompress(tarballFilename, tempDir)
  const tempDocsDirectory = path.join(tempDir, `node-${nodeVersion}`, 'doc')
  const targetDocsDirectory = path.join(__dirname, `../content/v${nodeVersion}/en-US/doc`)
  mkdirp(targetDocsDirectory)
  fs.renameSync(tempDocsDirectory, targetDocsDirectory)
}

collect()