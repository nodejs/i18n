# The i18N API Team

**Thank you for volunteering to help Node.js work with all languages!**

By helping Node.js APIs maintain world-class internationalization support,
you are impacting developers and users around the world.
Thank you so much for volunteering your time!

(Note: If you want to help with the _translation_ of Node.js and its documentation,
see instead [this guide](./GETTING_STARTED.md).)

This project adheres to the Contributor Covenant [code of conduct](https://github.com/nodejs/admin/blob/master/CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to report@nodejs.org.

## GitHub Team and Label

The [`@nodejs/i18n-api`](https://github.com/orgs/nodejs/teams/i18n-api)
GitHub team is responsible for the international APIs in Node.js. Please
@-mention this team in issues and pull requests that need attention.

The [`i18n-api`](https://github.com/nodejs/node/labels/i18n-api) label is
used in the main Node.js repository for i18n-related issues and PRs.
You can help by watching these issues and participating.

## Docs

<https://nodejs.org/dist/latest/docs/api/intl.html> and its versions/translations
is the main internationalization documentation for Node.js.
You can help by keeping this content up to date (and translated!)

## Related Standards / Projects

You can help by being familiar with these projects, and how changes impact Node.js
and its users. You can help make sure Node.js is compliant with these specifications.
These are all projects which invite public participation.

- [ECMA-262](https://tc39.github.io/ecma262/) is the specification for the
ECMAScript language, and includes specification for international-related
functionality in the core language.

- [ECMA-402](https://tc39.github.io/ecma402/) is the specification for
complementary langauge-sensitive functionality in ECMAScript, such as the
`Intl` object.

- The [International Components for Unicode (ICU)](http://site.icu-project.org/)
project from Unicode is a Unicode and i18n library which provides the C++
implementation used by the v8 engine to implement ECMA-262 and ECMA-402, and is
also used directly by Node.js for additional feature support.

- The [Common Locale Data Repository (CLDR)](http://cldr.unicode.org)
project from Unicode provides the locale data for hundreds of languages which
Node.js supports.  This data is integrated into and used by the ICU project.

- Finally, [Unicode](https://www.unicode.org) itself is the specification for
all electronic text processing. By using Unicode, Node.js is able to represent
all of the world’s languages.

## Filing and maintaining issues

With so many interrelated and interlocked projects, it can be a challenge to know
who is responsible for tracking and fixing a bug. For example, is a bug (or feature
request) something that belongs in Node.js? Or, is it an ICU bug? Is it incorrect
data in CLDR? Is it a deficiency in the ECMA specification?

Here is an attempt at providing some guidance.
Some of these are basic, but are worth repeating.
Note that these are general guidelines, there are always
exceptions.

### Things that might not be a bug

- Bugs already fixed in a later version of Node.js

    You may have thought of this already, but: try updating Node.js,
    try using the latest version. Try searching for the issue as well
    to see if it is already filed.

- Issue with a specific environment

    If there is a “custom” setting for the `--with-intl=` or ICU source
    options when building node, try again using the standard build.

- Incorrect linguistic parameters (such as locale code)

    Make sure the language codes or locale settings are as expected
    and conformant to the appropriate standards.

### Issues concerning incorrect locale data

Examples of this would be:

- “The spelling of Tuesday is wrong in Japanese.”
- “I expected `1,234.56` instead of `1.234,56`.”

If something is purely a locale data issue, please
see the [CLDR](http://cldr.unicode.org) project. As
the OpenJS foundation is a Liaison member of Unicode,
we have an official channel to track issues with Unicode. First, make sure
that the issue isn't already handled by CLDR. Then, open a new issue with
CLDR.

### Issues concerning performance

Most operations are implemented in ICU or in v8 itself rather than in Node.js
source code. Check with v8 and the ICU teams.

### Issues concerning ICU version mismatches

If you are trying to build a newer (or older) ICU than Node.js otherwise expects,
there may be issues that are true ICU bugs, or things that Node.js needs to work
around. There also may be updates to v8 needed.

See [Maintaining ICU](https://github.com/nodejs/node/blob/master/doc/guides/maintaining-icu.md).

### Issues concerning recent Time Zone changes

A newer ICU may already
incorporate the fix needed, otherwise it may be possible to perform a one-off
update.
See [Maintaining ICU: Time Zone Data](https://github.com/nodejs/node/blob/master/doc/guides/maintaining-icu.md#time-zone-data).

### Issues that are ECMA feature requests

If you are requesting functionality that is in ICU or specified in CLDR and not
yet available in the ECMA API surface, please see the ECMA-262 and ECMA-402
projects, where there is always ongoing development of new features.

If the feature is not yet available in ICU or specified in CLDR data, then
an ICU and/or CLDR issue may also need to be filed.

### If in doubt, open an issue

None of this is intended to discourage you from filing an issue,
but the intent is to guide the interaction between different issues.

