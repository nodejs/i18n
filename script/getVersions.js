#!/usr/bin/env node

const semver = require('semver')
const superagent = require('superagent')

const url = 'https://api.github.com/repos/nodejs/node/releases'

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
    const targetRelease = releases.find(({ tag_name: tagName }) =>
      semver.satisfies(tagName, el)
    )
    return {
      ...prev,
      [el]: targetRelease.tag_name
    }
  }, {})
}
