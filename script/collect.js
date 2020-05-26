#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const download = require('download')
const walk = require('walk-sync')
const { difference } = require('lodash')

const getVersions = require('./getVersions')
const { supportedVersions } = require('../package.json')

const contentDir = path.join(__dirname, 'content')
const originalSourceLocale = 'en-US'

collect()

async function collect () {
  const nodeVersions = await getVersions(supportedVersions)
  for (const major in nodeVersions) {
    const version = nodeVersions[major]
    await getDocsForNodeVersion(major, version).catch((err) => {
      console.error(`problem fetching version: ${version}`)
      console.error(err)
    })
  }
}

async function getDocsForNodeVersion (major, version) {
  const docDir = path.join(contentDir, major, originalSourceLocale)
  const downloadOptions = {
    extract: true,
    strip: 1,
    filter: (file) =>
      path.extname(file.path) === '.md' && file.path.startsWith('doc')
  }

  // clean out english translations to ensure old files are removed
  fs.remove(docDir)

  // download repo bundle and extract
  const tarballUrl = `https://github.com/nodejs/node/archive/${version}.tar.gz`
  console.log('downloading', tarballUrl)
  await download(tarballUrl, docDir, downloadOptions)
  await cleanupTranslations(major)
}

const cleanupTranslations = async (version) => {
  const languages = fs.readdirSync(path.join(contentDir, version))
  const originalPath = path.join(
    contentDir,
    version,
    originalSourceLocale,
    'doc'
  )
  const originalFiles = walk(originalPath, { directories: false })
  await Promise.all(
    languages.map((language) => {
      const translatedPath = path.join(contentDir, version, language, 'doc')
      const translatedFiles = walk(translatedPath, {
        directories: false
      })
      const translatedOriginDiff = difference(translatedFiles, originalFiles)
      return Promise.all(
        translatedOriginDiff.map((filePath) => {
          const fileToRemovePath = path.join(translatedPath, filePath)
          console.log('Removed:', fileToRemovePath)
          return fs.remove(fileToRemovePath)
        })
      )
    })
  )
}
