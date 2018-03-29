const fs = require('fs')
const path = require('path')
const walk = require('walk-sync').entries
const {nodeVersions} = require('./package.json')
const semver = require('semver')
const contentDir = path.join(__dirname, 'content')

test('defines nodeVersions, a non-empty array of semver-valid versions', () => {
  expect(Array.isArray(nodeVersions)).toBe(true)
  expect(nodeVersions.length).toBeGreaterThan(1)
  expect(nodeVersions.every(semver.valid)).toBe(true)
  expect(nodeVersions.every(version => version.startsWith('v'))).toBe(true)
})

test('includes source English content for all nodeVersions', () => {
  const fetchedVersions = fs.readdirSync(contentDir)
  expect(nodeVersions).toEqual(fetchedVersions)
  fetchedVersions.forEach(version => {
    const languages = fs.readdirSync(path.join(contentDir, version))
    expect(languages.includes('en-US')).toBe(true)
  })
})

xtest('includes translated content for all nodeVersions', () => {
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
