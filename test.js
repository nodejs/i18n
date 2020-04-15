const fs = require('fs')
const path = require('path')
const walk = require('walk-sync').entries
const { supportedVersions } = require('./package.json')
const contentDir = path.join(__dirname, 'content')
const dircompare = require('dir-compare');

test('includes source English content for all major versions', () => {
  const fetchedMajors = fs.readdirSync(contentDir).sort()
  const targetMajors = supportedVersions.sort()
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
      expect(files.length).toBeGreaterThan(0)
      expect(files.every(file => file.relativePath.endsWith('.md')))
    })
  })
})

describe('no translated files that aren\'t in en-US', () => {

  const options = { compareSize: false, noDiffSet: false };

  const fetchedMajors = fs.readdirSync(contentDir).sort()

  fetchedMajors.forEach(major => {
    const languages = fs.readdirSync(path.join(contentDir, major))
    const path1 = path.join(contentDir, major, 'en-US');

    languages.forEach(lang => {
      if (lang === 'en-US') return
      test(`${major} ${lang}`, () => {
        const path2 = path.join(contentDir, major, lang);

        const result = dircompare.compareSync(path1, path2, options)

        if (result.differences > 0 )
        {
          result.diffSet.forEach(diff => {
            // only look for files only existing in translated content
            if (diff.state === "right") {
              expect(path.join(diff.relativePath, diff.name2)).toBeUndefined()
            }
          })
        }
        else
        {
          expect(result.differences).toEqual(0)
        }
      })
    })
  })
})