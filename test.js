const fs = require('fs')
const path = require('path')
const walk = require('walk-sync').entries
const { nodeVersions } = require('./package.json')
const semver = require('semver')
const contentDir = path.join(__dirname, 'content')

test('defines nodeVersions', () => {
  const majors = Object.keys(nodeVersions)
  const expectedMajors = ['v13.x', 'v12.x', 'v10.x', 'v8.x']
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
      const files = walk(docsDir, { directories: false })
      expect(files.length).toBeGreaterThan(60)
      expect(files.every(file => file.relativePath.endsWith('.md')))
    })
  })
})
