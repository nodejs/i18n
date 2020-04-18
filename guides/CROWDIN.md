# Crowdin

The Node.js localization effort uses [Crowdin](https://crowdin.com), an awesome platform for collaborative translation.
It's free for open source projects, and anyone who understands multiples languages is welcome to join, regardless of
their technical experience or familiarity with the Node.js project. Below you'll find a quick review of Crowdin's main features that we are using in our process.

## Glossary

We have a [Crowdin Glossary](../crowdin-glossary.json) that contains terms which are noted as shared or translatable across the projects. If a term is missing, please add it by creating a PR or let us know by opening a new issue! This glossary is used in the Crowdin translation UI to give translators more context about technical terms, some of which should not be translated from their original English form.

## GitHub integration

Crowdin pulling updates of original content, and on other side all approved translations going to be pushed to connected repository automatically and well formatted.

## Priorities

There is a lot of content to translate, and to manage priorities we're using [Crowdin Prioritizing Files](https://support.crowdin.com/files-management/#prioritizing-files) system. Before translating something, please take a look at the priority level mark:

![priorities](https://user-images.githubusercontent.com/28801003/79640499-9a2fec00-819a-11ea-8eb3-ce0343791b8f.png)

## Translation Memory

Versioned documentation means that some content is not changed between versions. As result, we have duplicates, which are pre-translated with [Translation Memory](https://support.crowdin.com/translation-memory/). In addition, TM can be shared between all projects inside the Node.js organization.
