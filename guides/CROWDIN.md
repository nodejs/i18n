# Crowdin

The Node.js localization effort uses [Crowdin](https://crowdin.com), an awesome platform for collaborative translation.
It's free for open source projects, and anyone who understands multiples languages is welcome to join, regardless of
their technical experience or familiarity with the Node.js project. Below you'll find a quick review of Crowdin's main features that we are using in our process.

## Glossary

We have a [Crowdin Glossary](../crowdin-glossary.json) that contains terms which are noted as shared or translatable across the projects. If a term is missing, please add it by creating a PR or let us know by opening a new issue! This glossary is used in the Crowdin translation UI to give translators more context about technical terms, some of which should not be translated from their original English form.

## GitHub integration

Crowdin pulls updates of original content from GitHub. On the other side, all approved translations are automatically pushed to the connected repository with the correct formats.

## Priorities

There is a lot of content to translate. To manage priorities, we're using the [Crowdin Prioritizing Files](https://support.crowdin.com/files-management/#prioritizing-files) system. Before translating something, please take a look at the priority level mark:

![Picture showing a column with up and down arrows to indicate higher or lower priority](https://user-images.githubusercontent.com/28801003/79640499-9a2fec00-819a-11ea-8eb3-ce0343791b8f.png)

## Translation Memory

[Translation Memory (TM)](https://support.crowdin.com/translation-memory/) is a collection of source strings and their translations which is filled in automatically after each translation. This can be used to speed up the translation of the same (or similar) strings in two ways:

- **pre-translation** - These suggestions can be applied for all strings in a project. This is triggered only by a project manager.
- **suggestion tips for translators**
    ![Picture showing translated text with a pop-up recommendation for translators](https://user-images.githubusercontent.com/28801003/79671195-455b9800-81d1-11ea-996c-dc8025125d35.png)

By default, TM is scoped to a project, but it can be shared within an entire organization, such that translations from [api-docs](https://crowdin.com/project/nodejs) can be used in [nodejs-website](https://crowdin.com/project/nodejs-website). We recommend using TM suggestions to ensure consistent terminology across the project, as well as for the speed and effort improvements.

In the case of the [api-docs](https://crowdin.com/project/nodejs) project, for example, we have a lot of duplicates between versions. To avoid translating the same strings many times, we pre-translated them using the Translation Memory.
