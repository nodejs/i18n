# Roles

The Localization process is based on two environments – GitHub and Crowdin. Both of them have role management, and the Node.js i18n working group has standardized it into a unified system.

## Crowdin

Per the [official docs](https://support.crowdin.com/modifying-project-participants-roles/#project-roles) of Crowdin, the project has different levels of responsibilities:

1. Owner – a person who created a project. Project ownership can not be changed.
2. Manager – has the same rights as a project owner except that they cannot delete the project.
3. Proofreader – does not have access to project settings, but can translate and approve strings. Also, proofreader can accept/discard join requests, promote others to proofreader, or block translators.
4. Translator – can translate strings, and vote for suggestions
5. Blocked – does not have any access to the project.

### Owner

All Node.js Crowdin projects are created by the [Node.js Crowdin Bot](https://github.com/nodejs-crowdin), and this account is actual owner.

### Manager

This member is an active contributor with extensive experience in the Node.js localization process and the Crowdin platform. Each Node.js Crowdin project has managers to handle these tasks:

- changing the role of members (translator/proofreader/manager)
- adding/removing languages
- resolving problems with GitHub⇔Crowdin integration/sync

To become a manager of the project, please create a new issue in the base repository ([see table](./GETTING_STARTED.md/#i18n-projects)).

### Proofreader

This role is kind of a translators’ team lead, who has enough experience to approve or reject translations. One member can be a proofreader for only one language.  (Exceptions are not made for multi-language speakers.) Proofreaders can translate content, but their main responsibility is to validate newly-translated content.

> NOTE: Unapproved translations never go live, which is why we recommend that proofreaders focus on the validation process instead of on new translations.

To become a proofreader for a locale, please create a new issue with request in the base repository of the project ([see table](./GETTING_STARTED.md/#i18n-projects)). To be sure of your experience, we require that you have first translated at least 1,000 strings in your locale as a translator, and attach proofs of your work to that issue.

### Translator

The main actor in the localization process, as the one which actually performs the translation.

To become a translator, simply read our guidelines and go ahead! We really appreciate your volunteering.

## GitHub

From the GitHub side we have just two types of roles:

- **Maintainer** - admin of some l10n team/repository
- **Contributor** - part of some l10n team/repository

To avoid any confusion with "team" and "repository" in context of our process, here is a quick description:

- **Teams** are groups of organization members that reflect your group's structure with cascading access permissions and mentions. Used for group mentions like `@nodejs/nodejs-es` in issues/PRs, or for targeted announcements.
- The **l10n repository** is a place for the translators to discuss language team specific questions. For example, glossary, priorities, guidelines etc. Translators are encouraged to communicate in their native language.

> NOTE: More details about l10n team/repositories can be found in the [Teams guide](./TEAMS.md)

## Maintainer

This is the user who manages l10n team issues/discussions and helps with global localization process updates on the repository. They have "write" access to the l10n repository.

To become a maintainer of l10n repository you should be an active contributor and translator. Create a new issue with request in the base repository of project ([see table](./GETTING_STARTED.md/#i18n-projects)).

## Contributor

A member of an l10n team, for example `@nodejs/nodejs-es`. The reason to be a part of the team is to receive notifications about global- and language-specific updates or questions.

---

Now, see the guidelines concerning [teams](./TEAMS.md) in Node.js localization.
