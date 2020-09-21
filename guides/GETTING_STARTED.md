# Getting started

**Thank you for volunteering to translate Node.js content to your language!**

By translating Node.js content (website, docs, tutorials), you are directly impacting developers around the world. Your efforts will help developers in more countries to learn Node.js! Thank you so much for volunteering your time!

(Note: If you want to help with the _APIs_ that make Node.js applications internationalized, see instead the [i18n API](./I18N-API.md) guide.)

This project adheres to the Contributor Covenant [code of conduct](https://github.com/nodejs/admin/blob/master/CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to report@nodejs.org.

The following is a set of guidelines for contributing to Node.js localization effort.

### i18n projects

| Name              | GitHub                                                    | Managers team                        | Crowdin                                                              | URL                                                                         |
| :---------------- | :-------------------------------------------------------- | :----------------------------------- | :------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| API Documentation | [nodejs/i18n](https://github.com/nodejs/i18n)             | @nodejs/crowdin-managers-api-docs    | [api-docs](https://crowdin.com/project/nodejs)                       | [nodejs.org/docs/latest/api](https://nodejs.org/docs/latest/api/index.html) |
| Website           | [nodejs/nodejs.org](https://github.com/nodejs/nodejs.org) | @nodejs/crowdin-managers-website     | [nodejs-website](https://crowdin.com/project/nodejs-website)         | [nodejs.org](https://nodejs.org)                                            |
| New website       | [nodejs/nodejs.dev](https://github.com/nodejs/nodejs.dev) | @nodejs/crowdin-managers-website-dev | [nodejs-website-dev](https://crowdin.com/project/nodejs-website-dev) | [nodejs.dev](https://nodejs.dev)                                            |

## Translation process

The Node.js localization effort uses [Crowdin](https://crowdin.com/), an awesome platform for collaborative translation. It keeps the translation and development
aspects separate, so you don't need to think about technical stuff if you're simply wanting to help localize content. To get started, log in to Crowdin with your GitHub account, then open one of these projects to translate:

- [api-docs](https://crowdin.com/project/nodejs)
- [nodejs-website](https://crowdin.com/project/nodejs-website)
- [nodejs-website-dev](https://crowdin.com/project/nodejs-website-dev)

For more information on how to work with Crowdin, please read the official [guide for volunteer translators](https://support.crowdin.com/for-volunteer-translators/) or watch the [video](https://www.youtube.com/watch?v=bxdC7MfrO7A) prepared by Andriy Poznakhovskyy (a member of the Node.js i18n WG).

### Step #1: Translation

After successfully logging in to Crowdin and selecting a project to translate, find your language on the list.

> NOTE: If you cannot find your locale in list, please create a new issue in base repo ([see table](/#i18n-projects)) with mention to managers team

All translations are made on Crowdin are automatically pushed to the GitHub repository by an integration, so you don't need to go outside the Crowdin platform to translate content. **Specifically, do not open pull requests with content translations!**

> NOTE: If you find an error in the original docs, feel free to open PR to the base repository ([see table](/#i18n-projects)).

### Step #2: Proofread

We really appreciate any contribution, but should validate translated content, so after you submit your translation, it will be reviewed by another translator with the “proofreader” role. Find more about roles in [roles guideline](./ROLES.md).

### Step #3: Sync

Crowdin automatically creates and updates a pull request to this GitHub repository within 24 hours after the updates are approved. If you think that something is going wrong with the sync process, please create a new issue here.

## Communication process

We have several ways to communicate:

- Slack:
  - [node-js/#i18n](https://node-js.slack.com/archives/C8S7FCNR1) - for general questions
  - [openjs-foundation/#i18n](https://openjs-foundation.slack.com/archives/CUH8WBHBL) - for general questions
- Crowdin:
  - [conversations](https://support.crowdin.com/conversations/) - direct and group chats to communicate with other translators
  - [comments](https://support.crowdin.com/online-editor/#communicating-with-other-project-members) - discuss translation directly
- GitHub:
  - [nodejs/i18n](https://github.com/nodejs/i18n) - create issue/PR if you have not language specific question
  - l10n repositories and teams - for language/team specific questions, find full list in [teams guideline](https://github.com/nodejs/i18n/blob/master/TEAMS.md)

Feel free to choose the method that is most comfortable for you, but we recommend using GitHub issues for most cases as it is managed by the i18n-WG community.

The localization process for each language sometimes raises specific questions that should be discussed. For this reason, we've created l10n teams for each current active locale (language). The main goal of these groups is to gather people interested in taking part in the translation process in one place so that they can help each other when questions or issues arise during the translation process. To contact a specific l10n team, all you need is an account on GitHub.

> NOTE: You don't have to be a member of the i18n working group to start translating, all you need is a GitHub account.

---

Check next guideline about [roles](./ROLES.md) in Node.js localization.
