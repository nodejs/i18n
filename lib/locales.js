const fs = require('fs')
const path = require('path')
const contentDir = path.join(__dirname, '../content')

const {
  getLanguageName,
  getLanguageNativeName,
  getCountryCode,
  getCountryName
} = require('locale-code')

module.exports = fs.readdirSync(contentDir)
  .filter(file => fs.statSync(path.join(contentDir, file)).isDirectory())
  .map(version => {
    const locales = fs.readdirSync(path.join(contentDir, version))
      .filter(file => fs.statSync(path.join(contentDir, version, file)).isDirectory())
      .map(locale => {
        let result = {
          locale,
          languageName: getLanguageName(locale),
          languageNativeName: getLanguageNativeName(locale),
          countryCode: getCountryCode(locale),
          countryName: getCountryName(locale)
        }

        // Override some `locale-code` names
        if (locale === 'zh-TW') result.languageName = 'Chinese Traditional'
        if (locale === 'zh-CN') result.languageName = 'Chinese Simplified'
        if (locale === 'en-CA') result.languageName = 'English (Canada)'

        return result
      }).reduce((acc, locale) => {
        acc[locale.locale] = locale
        return acc
      }, {})

    let result = {
      version,
      locales
    }

    return result
  })
