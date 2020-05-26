const assert = require('assert')
const path = require('path')
const walk = require('walk-sync')
const { chain } = require('lodash')
const { supportedVersions } = require('./package.json')

const separator = '/'
const contentDir = path.join(__dirname, 'content')
const allPages = walk(contentDir, { directories: false })
  .filter(filename => filename.endsWith('.md'))
  .map(filename => {
    const fullPath = path.join(contentDir, filename)
    const nodeVersion = filename.split(separator)[0]
    const locale = filename.split(separator)[1]
    const filePath = filename
      .split(separator)
      .slice(2)
      .join(separator)
    return { locale, nodeVersion, filePath, fullPath }
  })

async function getPages (nodeMajor, locale) {
  // set defaults
  nodeMajor = nodeMajor || supportedVersions[0] // latest
  locale = locale || 'en-US'

  assert(supportedVersions.includes(nodeMajor), `Invalid major version of Node.js: ${nodeMajor}. Valid versions are ${supportedVersions.join(', ')}`)

  return allPages
    .filter(page => page.nodeVersion === nodeMajor)
    .filter(page => page.locale === locale)
}

const locales = chain(allPages)
  .map('locale')
  .uniq()
  .compact()
  .sort()
  .value()

module.exports = {
  allPages,
  getPages,
  locales,
  supportedVersions
}
