const semver = require('semver')
const superagent = require('superagent')

// Alternate resource is GitHub releases - https://api.github.com/repos/nodejs/node/releases
const url = 'https://nodejs.org/dist/index.json'

const fetchReleases = async () => {
  try {
    const res = await superagent.get(url).set({
      'User-Agent': 'superagent'
    })
    return res.body
  } catch (err) {
    console.error(err)
  }
}

module.exports = async (supportedVersions) => {
  const releases = await fetchReleases()
  if (!releases) {
    throw new Error('Something went wrong with release fetching')
  }

  return supportedVersions.reduce((prev, el) => {
    const targetRelease = releases.find(({ version }) =>
      semver.satisfies(version, el)
    )
    return {
      ...prev,
      [el]: targetRelease.version
    }
  }, {})
}
