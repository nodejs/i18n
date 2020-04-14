require('dotenv-safe').config()

const globals = require('globals')
const builtins = require('builtins')
const semver = require('semver')
const glossary = require('crowdin-glossary')({ project: 'nodejs' })

const { supportedVersions } = require('../package.json')
const { glossary: crowdinGlossary } = require('../crowdin-glossary.json')

const main = async () => {
  // JavaScript builtins like Array, Map, String, etc
  Object.keys(globals.builtin).forEach(term => {
    if (!Object.keys(glossary.entries).includes(term)) {
      glossary.add(term, 'This is a JavaScript builtin and should usually not be translated')
    }
  })

  // Node.js core modules
  supportedVersions.forEach(ver => {
    const nodeCoreModules = builtins(semver.valid(ver));
    nodeCoreModules.forEach(coreModule => {
      if (!Object.keys(glossary.entries).includes(coreModule)) {
        glossary.add(coreModule, 'This is a Node.js core module and should usually not be translated')
      }
    })
  })

  // Node.js documentations glossary
  // crowdin-glossary.json
  crowdinGlossary.forEach(item => {
    const [term, description] = item
    if (!Object.keys(glossary.entries).includes(term)) {
      glossary.add(term, description)
    }
  })

  glossary.upload()
}

main()
