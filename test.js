const fs = require('fs')
const path = require('path')
const walk = require('walk-sync').entries
const targetNodeVersions = require('./lib/target-node-versions')
const contentDir = path.join(__dirname, 'content')
const fetchedVersions = fs.readdirSync(contentDir)

test('has source content for every target node version', () => {
  expect(targetNodeVersions.length).toBeGreaterThan(1)
  expect(targetNodeVersions.map(version => 'v' + version)).toEqual(fetchedVersions)
})

test('only includes markdown files', () => {
  fetchedVersions.forEach(version => {
    const docsDir = path.join(contentDir, version)
    const files = walk(docsDir, {directories: false})
    expect(files.every(file => file.relativePath.endsWith('.md')))
  })
})

test('includes expected files for every version', () => {
  fetchedVersions.forEach(version => {
    const docsDir = path.join(contentDir, version)
    const filenames = walk(docsDir, {directories: false})
      .map(file => file.relativePath)

    // top-level doc directories
    const topLevel = filenames.map(filename => filename.split(path.sep)[2])
    expect(topLevel.includes('api')).toBe(true)
    expect(topLevel.includes('changelogs')).toBe(true)
    expect(topLevel.includes('guides')).toBe(true)

    // API docs
    const apiFiles = filenames.filter(filename => filename.startsWith('en-US/doc/api/'))
    expect(apiFiles.length).toBeGreaterThan(50)
  })
})
