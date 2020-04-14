# Roles

Localization process based on two environments – GitHub and Crowdin. Both of them have roles management, and Node.js i18n group standardized it into one system.

## Crowdin

From [official docs](https://support.crowdin.com/modifying-project-participants-roles/#project-roles) of Crowdin, project members hierarchy looks like:

1. Owner – a person who created a project. Project ownership can not be changed
2. Manager – has the same rights as a project owner except project deleting
3. Proofreader – does not have access to project settings, can translate and approve strings. Also, proofreader can accept/discard join requests and promote to proofreader or block translators
4. Translator – can translate strings and vote for suggestions
5. Blocked – does not have access to the project

### Owner

All Node.js Crowdin projects created by [Node.js Crowdin Bot](https://github.com/nodejs-crowdin), and this account is actual owner.

### Manager

This member is an active contributor with extensive experience in the Node.js localization process and Crowdin platform. Each Node.js Crowdin project has managers to handle general issues:

- change role of members (translator/proofreader/manager)
- add/remove language
- problems with GitHub<--->Crowdin integration/sync

To become a manager of project, please create a new issue with request in base repository ([see table](./GETTING_STARTED.md/#i18n-projects)).

### Proofreader

This role is kind of a translators team lead, who has enough experience to approve/decline translations. One member can be a proofreader just for one language without exceptions for multi language speakers, because it helps to focus on details. Proofreader can translate content, but main goal is to validate incoming content.

> NOTE: Not approved translation never go live, that's why we recommend for proofreaders to focus on validation process instead of translating

To become a proofreader of locale, please create a new issue with request in base repository of project ([see table](./GETTING_STARTED.md/#i18n-projects)). To be sure in your experience, we require translate at least 1000 strings in your locale as translator, and attach proofs to issue.

### Translator

Main player in localization process, who actually make translation.

To become a translator, just read our guidelines and go ahead! We really appreciate your volunteering.

## GitHub

From GitHub side we have just two type of roles:

- maintainer - admin of some l10n team/repository
- contributor - part of some l10n team/repository

To avoid any confusion with "team" and "repository" in context of our process, here is a quick description:

- Teams are groups of organization members that reflect your company or group's structure with cascading access permissions and mentions. Used for group mentions like `@nodejs/nodejs-es` in issues/PRs, or for target announcements.
- l10n repository is basement for translators to discuss language team specific questions. For example, glossary, priorities, guidelines etc. Here translators can speak in their native language.

> NOTE: More details about l10n team/repositories you can find in [Teams guide](./TEAMS.md)

## Maintainer

User who manages l10n team issues/discussions, helps with global localization process updates under controlled repository. Has "write" access to l10n repository.

To become a maintainer of l10n repository you should be active contributor and translator. Create a new issue with request in base repository of project ([see table](./GETTING_STARTED.md/#i18n-projects)).

## Contributor

Member of l10n team, for example `@nodejs/nodejs-es`. The reason to be a part of team is only receive notifications about global and language specific updates/questions.

---

Check next guideline about [teams](./TEAMS.md) in Node.js localization.
