# Getting started

**Thank you for volunteering to translate Node.js content to your language!**

By translating Node.js content (website, docs, tutorials), you are directly impacting developers around the world. Your efforts will help developers in more countries to learn Node.js! Thank you so much for volunteering your time!

This project adheres to the Contributor Covenant [code of conduct](https://github.com/nodejs/admin/blob/master/CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to report@nodejs.org.

The following is a set of guidelines for contributing to Node.js localization effort. This info acceptable to next Node.js localization projects:

### i18n projects

| Name              | GitHub                                                    | Managers team                        | Crowdin                                                              | URL                                                                         |
| :---------------- | :-------------------------------------------------------- | :----------------------------------- | :------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| API Documentation | [nodejs/i18n](https://github.com/nodejs/i18n)             | @nodejs/crowdin-managers-api-docs    | [api-docs](https://crowdin.com/project/nodejs)                       | [nodejs.org/docs/latest/api](https://nodejs.org/docs/latest/api/index.html) |
| Website           | [nodejs/nodejs.org](https://github.com/nodejs/nodejs.org) | @nodejs/crowdin-managers-website     | [nodejs-website](https://crowdin.com/project/nodejs-website)         | [nodejs.org](https://nodejs.org)                                            |
| New website       | [nodejs/nodejs.dev](https://github.com/nodejs/nodejs.dev) | @nodejs/crowdin-managers-website-dev | [nodejs-website-dev](https://crowdin.com/project/nodejs-website-dev) | [nodejs.dev](https://nodejs.dev)                                            |

## Translation process

Node.js localization effort uses [Crowdin](https://crowdin.com/), an awesome platform for collaborative translation. It keeps translators and developers separately, so you don't need to think about any technical stuff if you're simply want localize content. To get started, log in to Crowdin with your GitHub account, then open one of projects to translate:

- [api-docs](https://crowdin.com/project/nodejs)
- [nodejs-website](https://crowdin.com/project/nodejs-website)
- [nodejs-website-dev](https://crowdin.com/project/nodejs-website-dev)

For more information how to work with Crowdin please read official [guide for volunteer translators](https://support.crowdin.com/for-volunteer-translators/) or watch the [video](https://www.youtube.com/watch?v=bxdC7MfrO7A) prepared by Andriy Poznakhovskyy member of the Node.js i18n.

### Step #1: Translation

After successfully logging in to Crowdin and selecting a project to translate, find your language on the list.

> NOTE: If you cannot find your locale in list, please create a new issue in base repo ([see table](/#i18n-projects)) with mention to managers team

All translations going to be approved by other translators, and then automatically pushed to GitHub repository, so you don't need to go outside Crowdin platform. Don't open pull requests to translate Node.js, and focus just on translation content.

> NOTE: If you find an error in the original docs, feel free to open PR to the base repository ([see table](/#i18n-projects)).

### Step #2: Proofread

We really appreciate any contribution, but should validate translated content, so after you submitted your translation it's going to be approved by other translator with proofreader role. Find more details about roles in [roles guideline](./ROLES.md).

### Step #3: Sync

Crowdin automatically create PR with updates to base GitHub repository around 24 hours after updates was approved. If you think that's something goes wrong with sync process, please create a new issue with managers mention.

## Communication process

We propose a few ways to communicate:

- Slack:
  - [node-js/#i18n](https://node-js.slack.com/archives/C8S7FCNR1) - for general questions
  - [openjs-foundation/#i18n](https://openjs-foundation.slack.com/archives/CUH8WBHBL) - for general questions
- Crowdin:
  - [conversations](https://support.crowdin.com/conversations/) - direct and group chats to communicate with other translators
  - [comments](https://support.crowdin.com/online-editor/#communicating-with-other-project-members) - discuss translation directly
- GitHub:
  - [nodejs/i18n](https://github.com/nodejs/i18n) - create issue/PR if you have not language specific question
  - l10n repositories and teams - for language/team specific questions, find full list in [teams guideline](https://github.com/nodejs/i18n/blob/master/TEAMS.md)

Feel free to choose most comfortable way for your goals, but we'd like to recommend to use GitHub for most cases. It's standardized and controlled by Node.js community.

Localization process for each language have specific questions, that should be discussed and agreed somewhere, and for these reasons we've created l10n teams for each current active locale. Main aim is to gather people interested in taking part in the translation process in one place, so that it can be used as a source of help when problems/doubts arise during the translation process. To contact a specific l10n team, all you need is an account on GitHub.

> NOTE: You don't have to be a member of this group to start translating

---

Check next guideline about [roles](./ROLES.md) in Node.js localization.
