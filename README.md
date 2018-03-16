# Node.js Internationalization

## About

The Node.js i18n Working Group is dedicated to the support and improvement of both Internationalization (i18n) and Localization (l10n) within the [Node.js](https://github.com/nodejs/node) project. This Working Group serves as a function of the [Node.js Community Committee](https://github.com/nodejs/community-committee).

_Small note: If you do not speak English, go to the [Need Translators?](#need-translators) section._

#### What we're responsible for
* The ongoing translation of the [Node.js](https://github.com/nodejs/node) project's textual content into every language of its users.
* The implementation of i18n support including [ECMA-402](https://tc39.github.io/ecma402/) within [Node.js](https://github.com/nodejs/node).
* Ensuring Node.js is compliant with common standards like [Unicode](https://unicode.org/), [CLDR](http://cldr.unicode.org/), and harmonized with other globalization efforts.

#### What i18n (Internationalization) means to us
Maintaining the ability for Node.js to [effectively support](https://nodejs.org/api/intl.html#intl_internationalization_support) the cultural & socio-linguistic preferences of all international users, through:
* [Unicode](https://unicode.org) processing and related services to support text written in all human languages.
* APIs and implementations which support the specific cultural & socio-linguistic preferences, such as localized methods for displaying dates & times.
* The ability for [Node.js](https://github.com/nodejs/node) and its related modules & applications to be translated into distinct human languages.

#### What l10n (Localization) means to us
* Making the Node.js project's API documentation, site, and tutorial content available in every language.
* The responsibility to provide translators with a useful platform to work in.
* The responsibility to provision Node.js with all l10n assets, through coordination with [Node.js](https://github.com/nodejs/node) core contributors.
* Members of this group are not responsible for performing the act of translation itself.

## Summary of our Responsibilities
1. Supporting l10n groups who are actively translating the content of [Node.js](https://github.com/nodejs/node) into their own languages.
2. i18n support for [Node.js](https://github.com/nodejs/node), and its related initiatives.
3. Ensuring i18n compliance with all relevant standards such as [Unicode](https://unicode.org) and [ECMA-402](https://github.com/tc39/ecma402).
4. Continual refinement and maintenance of the i18n Working Group's processes, platform service accounts, and related module repositories & source code.

### Our Current Trajectory
Please read [this article](https://medium.com/the-node-js-collection/internationalizing-node-js-fe7761798b0a) to get up to speed on our current trajectory.


## Inter-project relationships
In order to ensure best practices, this working group may work directly with representatives of similar and related i18n efforts from other external projects. For example:
* [Electron i18n](https://github.com/electron/i18n)
* [W3C i18n Working Group](https://www.w3.org/International/core/Overview)
* [ECMA-402](https://github.com/tc39/ecma402) (Together with ECMA-262, specifies the i18n features of JavaScript)
* [V8 i18n](https://github.com/v8/v8/wiki/i18n-support) (implements ECMA-402 in Node.js)
* [Unicode](https://unicode.org):
  - [The Unicode Standard](https://unicode.org/standard/) (defines how text is encoded)
  - [CLDR](http://cldr.unicode.org) (Common Locale Data Repository)
  - [ICU](http://icu-project.org) (C/C++ i18n library used by v8 and Node.js)

## Current Members
| Name                  | GitHub                                            | Twitter                                                 |
|:----------------------|:--------------------------------------------------|:--------------------------------------------------------|
| Adam Miller           | [amiller-gh](https://github.com/amiller-gh)       | [millea9](https://twitter.com/millea9)                  |
| Andrew Bus            | [iAndrewCA](https://github.com/iAndrewCA)         | [AndrewPaulBus](https://twitter.com/AndrewPaulBus)      |
| Antoine Olivier       | [Toinane](https://github.com/Toinane)             | [Toinane](https://twitter.com/Toinane)                  |
| Amor                  | [amor520](https://github.com/amor520)             | [amor90s](https://twitter.com/amor90s)                  |
| Ben Michel            | [obensource](https://github.com/obensource)       | [obensource](https://twitter.com/obensource)            |
| Benjamin Zaslavsky    | [Tiriel](https://github.com/Tiriel)               | [Ben_Tiriel](https://twitter.com/Ben_Tiriel)            |
| Dhruv Jain            | [maddhruv](https://github.com/maddhruv)           | [maddhruv](https://twitter.com/maddhruv)                |
| Franz de Copenhague   | [FranzDeCopenhague](https://github.com/FranzDeCopenhague) | [FranzDeCopenhague](https://twitter.com/FranzDeCopenhag) |
| Jonathan Cardoso      | [JCMais](https://github.com/JCMais)               | [_jonathancardos](https://twitter.com/_jonathancardos)  |
| Laurent Goderre       | [LaurentGoderre](https://github.com/LaurentGoderre) | [LaurentGoderre](https://twitter.com/LaurentGoderre)  |
| Łukasz Szewczak       | [lukaszewczak](https://github.com/lukaszewczak)   | [lukaszewczak](https://twitter.com/lukaszewczak)        |
| Rachel White          | [rachelnicole](https://github.com/rachelnicole)   | [ohhoe](https://twitter.com/ohhoe)                      |
| Raja Sekar            | [rajzshkr](https://github,com/rajzshkr)           | [rajzshkr](https://twitter.com/rajzshkr)                |
| Richard Littauer      | [RichardLitt](https://github.com/RichardLitt)     | [richlitt](https://twitter.com/richlitt)                |
| Ryo Aramaki           | [ryo-a](https://github.com/ryo-a)                 | [geo_vitya](https://twitter.com/geo_vitya)              |
| Sam Yamashita         | [sotayamashita](https://github.com/sotayamashita) | [sota0805](https://twitter.com/sota0805)                |
| Steven R. Loomis      | [srl295](https://github.com/srl295)               | [srl295](https://twitter.com/srl295)                    |
| Tiago Danin           | [TiagoDanin](https://github.com/TiagoDanin)       | [_TiagoEDGE](https://twitter.com/_TiagoEDGE)            |
| Vanessa Yuen          | [vanessayuenn](https://github.com/vanessayuenn)   | [vanessayuenn](https://twitter.com/vanessayuenn)        |
| Volkan Nazmi Metin    | [Volem](https://github.com/Volem)                 | [volemnic](https://twitter.com/volemnic)                |
| Wexpo Lyu             | [laosb](https://github.com/laosb)                 | [it99p](https://twitter.com/it99p)                      |
| Zeke Sikelianos       | [zeke](https://github.com/zeke)                   | [zeke](https://twitter.com/zeke)                        |

## Current l10n groups we support
* [Spanish (nodejs-es)](https://github.com/nodejs/nodejs-es)
* [Portuguese (nodejs-pt)](https://github.com/nodejs/nodejs-pt)
* [Turkish (nodejs-tr)](https://github.com/nodejs/nodejs-tr)
* [German (nodejs-de)](https://github.com/nodejs/nodejs-de)
* [Japanese (nodejs-ja)](https://github.com/nodejs/nodejs-ja)
* [Ukrainian (nodejs-uk)](https://github.com/nodejs/nodejs-uk)
* [Russian (nodejs-ru)](https://github.com/nodejs/nodejs-ru)
* [Arabic (nodejs-ar)](https://github.com/nodejs/nodejs-ar)
* [Hungarian (nodejs-hu)](https://github.com/nodejs/nodejs-hu)
* [Greek (nodejs-el)](https://github.com/nodejs/nodejs-el)
* [Tamil (nodejs-ta)](https://github.com/nodejs/nodejs-ta)
* [Georgian (nodejs-ka)](https://github.com/nodejs/nodejs-ka)
* [Taiwan (nodejs-zh-TW)](https://github.com/nodejs/nodejs-zh-TW)
* [French (nodejs-fr)](https://github.com/nodejs/nodejs-fr)
* [Finnish (nodejs-fi)](https://github.com/nodejs/nodejs-fi)
* [Dutch (nodejs-nl)](https://github.com/nodejs/nodejs-nl)
* [Persian (nodejs-fa)](https://github.com/nodejs/nodejs-fa)
* [Vietnamese (nodejs-vi)](https://github.com/nodejs/nodejs-vi)
* [Indonesian (nodejs-id)](https://github.com/nodejs/nodejs-id)
* [Swahili (nodejs-sw)](https://github.com/nodejs/nodejs-sw)
* [Chinese (nodejs-zh-CN)](https://github.com/nodejs/nodejs-zh-CN)
* [Hebrew (nodejs-he)](https://github.com/nodejs/nodejs-he)
* [Polish (nodejs-pl)](https://github.com/nodejs/nodejs-pl)
* [Italian (nodejs-it)](https://github.com/nodejs/nodejs-it)
* [Norwegian (nodejs-no)](https://github.com/nodejs/nodejs-no)
* [Malay (nodejs-ms)](https://github.com/nodejs/nodejs-ms)
* [Hindi (nodejs-hi)](https://github.com/nodejs/nodejs-hi)
* [Bulgarian (nodejs-bg)](https://github.com/nodejs/nodejs-bg)
* [Bengali (nodejs-bn)](https://github.com/nodejs/nodejs-bn)
* [Danish (nodejs-da)](https://github.com/nodejs/nodejs-da)
* [Macedonian (nodejs-mk)](https://github.com/nodejs/nodejs-mk)
* [Czech (nodejs-cs)](https://github.com/nodejs/nodejs-cs)
* [Swedish (nodejs-sv)](https://github.com/nodejs/nodejs-sv)

## Joining
If you're interested in joining this group, or would like to leave a question or comment for its members - please [create an issue](https://github.com/nodejs/i18n/issues/new) or submit a pull request.

## Need Translators?

If you cannot speak or read English easily, we can provide translators for this group's documents and during our video meetings. Please get in touch with [Ben Michel](https://twitter.com/obensource) or [Zeke Sikelianos](https://twitter.com/zeke) and ask for help for your language.

----
_This document was influenced by the [nodejs/Intl](https://github.com/nodejs/Intl/blob/master/README.md) working group's mandate, and is seen as a continuation of that work._
