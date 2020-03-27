#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const request = require('request')
require('dotenv-safe').config()

const projectKey = process.env.CROWDIN_KEY

const url = `https://api.crowdin.com/api/project/nodejs/status?key=${projectKey}&json`

request.post(url)
  .on('error', err => console.error(err))
  .pipe(fs.createWriteStream(path.join(__dirname, '..', 'stats.json')))
