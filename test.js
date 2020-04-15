const fs = require('fs-extra')
const path = require('path')
const walk = require('walk-sync')
const difference = require('lodash.difference')
const { supportedVersions } = require('./package.json')

const contentDir = path.join(__dirname, 'content')
const versions = fs.readdirSync(contentDir)
const originalSourceLocale = 'en-US'

describe('original content', () => {
  test('exist for all supported versions', () => {
    expect(supportedVersions.sort()).toEqual(versions.sort())
    versions.forEach((major) => {
      const languages = fs.readdirSync(path.join(contentDir, major))
      expect(languages.includes(originalSourceLocale)).toBe(true)
    })
  })

  test('includes only markdown files', () => {
    expect(versions.length).toBeGreaterThan(1)
    versions.forEach((version) => {
      const docsDir = path.join(
        contentDir,
        version,
        originalSourceLocale,
        'doc'
      )
      const files = walk.entries(docsDir, { directories: false })
      expect(files.length).toBeGreaterThan(0)
      expect(files.every((file) => file.relativePath.endsWith('.md')))
    })
  })
})

describe('translated content', () => {
  test('saves original structure', () => {
    versions.forEach((version) => {
      const languages = fs.readdirSync(path.join(contentDir, version))
      const originalPath = path.join(
        contentDir,
        version,
        originalSourceLocale,
        'doc'
      )
      const originalFiles = walk(originalPath, { directories: false })
      languages.forEach((language) => {
        const translatedPath = path.join(contentDir, version, language, 'doc')
        const translatedFiles = walk(translatedPath, {
          directories: false
        })
        const translatedOriginDiff = difference(translatedFiles, originalFiles)

        // can be used to remove mismatch files
        // translatedOriginDiff.map(filePath => fs.remove(path.join(translatedPath, filePath)))

        expect(translatedOriginDiff).toEqual([])
      })
    })
  })
})
