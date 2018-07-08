const fs = require('fs')
const path = require('path')
const walk = require('walk-sync')
const cleanDeep = require('clean-deep')
const hubdown = require('hubdown')
const localesByVersion = require('../lib/locales')

const contentDir = path.join(__dirname, '../content')
async function parseDocs (version, locales) {
  console.time(`parsed docs for ${version} in`)
  const markdownFiles = walk.entries(path.join(contentDir, version))
    .filter(file => file.relativePath.endsWith('.md'))
  console.log(`procesing ${markdownFiles.length} files in ${Object.keys(locales).length} locales for ${version} version`)
  let docs = await Promise.all(markdownFiles.map(parseFile))
  console.timeEnd(`parsed docs for ${version} in`)
  return docs
}

async function parseFile (file) {
  file.fullPath = path.join(file.basePath, file.relativePath)
  file.locale = file.relativePath.split('/')[0]
  file.slug = path.basename(file.relativePath, '.md')

  file.category = file.relativePath
    .split('/')
    .slice(2, -1)
    .join('/')

  const markdown = fs.readFileSync(file.fullPath, 'utf8')

  file.sections = await hubdown(markdown)

  // remove leftover file props from walk-sync
  delete file.mode
  delete file.size
  delete file.mtime
  delete file.relativePath
  delete file.basePath

  return cleanDeep(file)
}

async function main () {
  const docsByVersion = {}
  for (let {version, locales} of localesByVersion.slice(0, 1)) {
    const docs = await parseDocs(version, locales)
    const docsByLocale = Object.keys(locales)
      .reduce((acc, locale) => {
        acc[locale] = docs
          .filter(doc => doc.locale === locale)
        return acc
      }, {})

    docsByVersion[version] = {
      locales,
      docs: docsByLocale
    }
  }

  fs.writeFileSync(
    path.join(__dirname, '../index.json'),
    JSON.stringify(docsByVersion, null, 2)
  )
}

main()
