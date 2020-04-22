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

[Translation Memory or TM](https://support.crowdin.com/translation-memory/) is collection of the source strings and their translations, that fills automatically after each translation was added. Can be used to speed up the translation of the same or similar strings in two ways:

- suggestion tips for translators
    ![image](https://user-images.githubusercontent.com/28801003/79671195-455b9800-81d1-11ea-996c-dc8025125d35.png)
- pre-translation - process to apply these suggestions for all strings in a project, but can be triggered only by project manager

By default, TM scoped by project, but can be shared inside organization, so translations from [api-docs](https://crowdin.com/project/nodejs) can be used in [nodejs-website](https://crowdin.com/project/nodejs-website). We recommend to use TM suggestions to make consistent translations and to speed up process in general. 

In case of [api-docs](https://crowdin.com/project/nodejs) project we have a lot of duplicates between versions, and to not translate the same strings many times, we pre-translated it by TM.
