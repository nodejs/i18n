#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const download = require('download')
const walk = require('walk-sync')
const { difference } = require('lodash')

const getVersions = require('./getVersions')
const { supportedVersions } = require('../package.json')

const contentDir = path.join(__dirname, '../content')
const originalSourceLocale = 'en-US'

collect()

async function collect () {
  const nodeVersions = await getVersions(supportedVersions)

  // Add all the versions into a group and run parallelly to
  // improve the speed of download
  const parallelDownloadVersions = new Array(nodeVersions.length)
  for (const major in nodeVersions) {
    const version = nodeVersions[major]
    parallelDownloadVersions.push(getDocsForNodeVersion(major, version))
  }

  await Promise.all(parallelDownloadVersions)
}

async function getDocsForNodeVersion (major, version) {
  const docDir = path.join(contentDir, major, originalSourceLocale)
  const downloadOptions = {
    extract: true,
    strip: 1,
    filter: (file) =>
      path.extname(file.path) === '.md' && file.path.startsWith('doc')
  }

  try {
    // clean out english translations to ensure old files are removed
    await fs.remove(docDir)

    // download repo bundle and extract
    const tarballUrl = `https://github.com/nodejs/node/archive/${version}.tar.gz`
    console.log('\x1B[93mDownloading', tarballUrl, '\x1B')
    await download(tarballUrl, docDir, downloadOptions)
    await cleanupTranslations(major)
    console.log('\x1B[92m ✓ Successfully', tarballUrl, 'Downloaded.\x1B')
  } catch (error) {
    console.error('\x1B[91m ✘ Problem fetching version:', version, '\x1B')
    console.error(error)
  }
}

const cleanupTranslations = async (version) => {
  const languages = await fs.readdir(path.join(contentDir, version))
  const originalPath = path.join(
    contentDir,
    version,
    originalSourceLocale,
    'doc'
  )
  const originalFiles = walk(originalPath, { directories: false })

  languages.map((language) => {
    const translatedPath = path.join(contentDir, version, language, 'doc')
    const translatedFiles = walk(translatedPath, {
      directories: false
    })

    const translatedOriginDiff = difference(translatedFiles, originalFiles)

    return Promise.all(
      translatedOriginDiff.map((filePath) => {
        const fileToRemovePath = path.join(translatedPath, filePath)
        console.log('\x1B[96m Removed:', fileToRemovePath, '\x1B')
        return fs.remove(fileToRemovePath)
      })
    )
  })
}
