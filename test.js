const fs = require('fs-extra')
const path = require('path')
const walk = require('walk-sync')
const { difference, intersection } = require('lodash')
const { supportedVersions } = require('./package.json')

const contentDir = path.join(__dirname, 'content')
const versions = fs.readdirSync(contentDir)
const originalSourceLocale = 'en-US'

describe('original content', () => {
  test('all supported versions exist', () => {
    expect(intersection(supportedVersions, versions).length).toEqual(supportedVersions.length)
  })
  test('all supported versions includes original source', () => {
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

describe('npm module', () => {
  const {
    allPages,
    getPages,
    locales,
    supportedVersions
  } = require('.')

  test('exports `allPages` array', () => {
    expect(Array.isArray(allPages)).toBe(true)
    expect(allPages.length).toBeGreaterThan(1)
  })

  test('exports `locales` array', () => {
    expect(Array.isArray(locales)).toBe(true)
    expect(locales.length).toBeGreaterThan(1)
    expect(locales).toContain('en-US')
    expect(locales).toContain('es-ES')
  })

  test('exports `supportedVersions` object from package.json', () => {
    expect(Array.isArray(supportedVersions)).toBe(true)
    expect(supportedVersions).toEqual(require('./package.json').supportedVersions)
  })

  describe('getPages function', () => {
    test('is exported as a property of the module', () => {
      expect(typeof getPages).toBe('function')
    })

    test('returns an array of objects, and does not require any arguments', async () => {
      const pages = await getPages()
      expect(Array.isArray(pages)).toBe(true)
      expect(pages.length).toBeGreaterThan(0)
      pages.every(page => {
        expect(Object.keys(page)).toEqual(['locale', 'nodeVersion', 'filePath', 'fullPath'])
      })
    })

    test('accepts arguments for nodeVersion and locale', async () => {
      const pages = await getPages(supportedVersions[1], 'es-ES')
      expect(Array.isArray(pages)).toBe(true)
      expect(pages.length).toBeGreaterThan(0)
      pages.every(page => {
        expect(page.locale).toBe('es-ES')
        expect(page.nodeVersion).toBe(supportedVersions[1])
      })
    })
  })
})
