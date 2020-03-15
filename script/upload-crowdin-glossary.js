require('dotenv-safe').load()

const globals = require('globals')
const nodeCoreModules = require('builtins')('10.0.0')
const glossary = require('crowdin-glossary')({project: 'nodejs'})
const { glossary: crowdinGlossary } = require('../crowdin-glossary.json')

main()

async function main () {
  // JavaScript builtins like Array, Map, String, etc
  Object.keys(globals.builtin).forEach(term => {
    if (Object.keys(glossary.entries).includes(term)) return
    glossary.add(term, 'This is a JavaScript builtin and should usually not be translated')
  })

  // Node.js core modules
  nodeCoreModules.forEach(coreModule => {
    if (Object.keys(glossary.entries).includes(coreModule)) return
    glossary.add(coreModule, 'This is a Node.js core module and should usually not be translated')
  })

  // Node.js documentations glossary
  // crowdin-glossary.json
  crowdinGlossary.forEach(item => {
    const [term, description] = item
    if (Object.keys(glossary.entries).includes(term)) return
    glossary.add(term, description)
  })

  glossary.upload()
}
