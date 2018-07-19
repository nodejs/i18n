const fs = require('fs')
const path = require('path')
const walk = require('walk-sync')
const hubdown = require('hubdown')
const localesByVersion = require('../lib/locales')
const db = require('level')('../db', {valueEncoding: 'json'})

const contentDir = path.join(__dirname, '../content')
async function parseDocs (nodeVersion, locales) {
  console.time(`parsed docs for ${nodeVersion} in`)
  const markdownFiles = walk.entries(path.join(contentDir, nodeVersion))
    .filter(file => file.relativePath.endsWith('.md'))
    
  console.log(`processing ${markdownFiles.length} files in ${Object.keys(locales).length} locales for ${nodeVersion} version`)

  for (let file of markdownFiles) {
    file.nodeVersion = nodeVersion
    file = await parseFile(file)
    const key = {
      nodeVersion: file.nodeVersion,
      locale: file.locale,
      path: file.path
    }
    await db.put(key, file)
    console.log(key)
  }
  console.timeEnd(`parsed docs for ${nodeVersion} in`)
}

async function parseFile (file) {
  // clone object so it's not a walk-sync `Entry` instance
  file = Object.assign({}, file)

  file.fullPath = path.join(file.basePath, file.relativePath)
  file.path = file.relativePath.split('/').slice(2).join('/')
  file.locale = file.relativePath.split('/')[0]

  const markdown = fs.readFileSync(file.fullPath, 'utf8')
  file.html = await hubdown(markdown)

  // remove leftover file props from walk-sync
  delete file.mode
  delete file.size
  delete file.mtime
  delete file.relativePath
  delete file.basePath
  delete file.fullPath

  return file
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
