const fs = require('fs')
const path = require('path')
const walk = require('walk-sync').entries
const {nodeVersions} = require('./package.json')
const semver = require('semver')
const contentDir = path.join(__dirname, 'content')
const i18n = require('.')

test('defines nodeVersions', () => {
  const majors = Object.keys(nodeVersions)
  const expectedMajors = ['v10.x', 'v8.x', 'v6.x']
  expect(expectedMajors).toEqual(majors)

  const versions = Object.values(nodeVersions)
  expect(versions.every(semver.valid)).toBe(true)
  expect(versions.every(version => version.startsWith('v'))).toBe(true)
})

test('includes source English content for all major versions', () => {
  const fetchedMajors = fs.readdirSync(contentDir).sort()
  const targetMajors = Object.keys(nodeVersions).sort()
  expect(targetMajors).toEqual(fetchedMajors)

  fetchedMajors.forEach(major => {
    const languages = fs.readdirSync(path.join(contentDir, major))
    expect(languages.includes('en-US')).toBe(true)
  })
})

xtest('includes translated content for all major versions', () => {
  // pending Crowdin integration
})

test('includes only markdown files, ignoring images and other files', () => {
  const versions = fs.readdirSync(contentDir)
  expect(versions.length).toBeGreaterThan(1)
  versions.forEach(version => {
    const languages = fs.readdirSync(path.join(contentDir, version))
    expect(languages.length).toBeGreaterThan(0)
    languages.forEach(language => {
      const docsDir = path.join(contentDir, version, language, 'doc')
      const files = walk(docsDir, {directories: false})
      expect(files.length).toBeGreaterThan(60)
      expect(files.every(file => file.relativePath.endsWith('.md')))
    })
  })
})

test('i18 is an object with node versions as keys', () => {
  const versions = Object.keys(i18n).sort()
  const majors = Object.keys(nodeVersions).sort()
  expect(versions).toEqual(majors)
})

test('i18n[version].docs is an object with locales as keys', () => {
  const majorVersion = Object.keys(nodeVersions).sort().shift()
  const locales = Object.keys(i18n[majorVersion].docs)
  expect(locales).toContain('pl-PL')
  expect(locales).toContain('en-US')
})
