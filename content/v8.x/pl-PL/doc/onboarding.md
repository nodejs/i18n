# Proces Adaptacyjny

Ten dokument jest zakresem rzeczy, o których mówimy nowym Współpracownikom w ich sesji adaptacyjnej.

## Tydzień przed sesją adaptacyjną

* Upewnij się, że nowy Współpracownik korzysta z uwierzytelniania dwuskładnikowego na jego Koncie GitHub. Jeśli nie włączono uwierzytelniania dwuskładnikowego, nie dawaj podwyższonych przywilejów konta, takich jak możliwość gruntownego kodowania w głównym repozytorium lub kontynuowanie zadań integracyjnych (CI).

## Piętnaście minut przed sesją adaptacyjną

* Przed sesją adaptacyjną, dodaj nowego współpracownika do [zespołu Współpracowników](https://github.com/orgs/nodejs/teams/collaborators), i do [zespołu Członków](https://github.com/orgs/nodejs/teams/members), jeśli do niego jeszcze nie należą. Zauważ, że jest to krok, który daje podwyższone przywileje konta, więc nie wykonuj tego kroku (ani żadnych dalszych), chyba że dwuskładnikowe uwierzytelnianie jest włączone na koncie GitHub nowego Współpracownika.

## Sesja adaptacyjna

* Ta sesja obejmie: 
    * [ustawienia lokalne](#local-setup)
    * [cele projektu & wartości](#project-goals--values)
    * [zarządzanie listą problemów](#managing-the-issue-tracker)
    * [przeglądanie PR-ami](#reviewing-prs)
    * [wyładowywanie Pr-ów](#landing-prs)

## Ustawienia lokalne

* git:
    
    * Upewnij się, że masz ustawione whitespace=fix: `ustawienia git --globalne -- dodaj apply.whitespace fix`
    * Zawsze wznawiaj PR z własnego rozwidlenia github 
        * Gałęzie w repozytorium nodejs/node są tylko dla opublikowanych wierszy
    * [Zobacz "Aktualizowanie Node.js z Upstream"](./onboarding-extras.md#updating-nodejs-from-upstream)
    * Stwórz nową gałąź dla każdego PR, które przesyłasz.
    * Członkostwo: Zastanów się nad upublicznieniem członkostwa w Node.js organizacji GitHub. Ułatwia to identyfikację Współpracowników. Instrukcje, jak to zrobić są dostępne w [Publikowanie lub ukrywanie członkostwa organizacji](https://help.github.com/articles/publicizing-or-hiding-organization-membership/).

* Powiadomienia:
    
    * Użyj [https://github.com/powiadomienia](https://github.com/notifications) lub załóż e-mail
    * Obserwowanie głównego repozytorium zaleje twoją skrzynkę odbiorczą (kilkaset powiadomień w typowe dni powszednie), więc bądź przygotowany

* `#node-dev` on [webchat.freenode.net](https://webchat.freenode.net/) is the best place to interact with the TSC / other Collaborators
    
    * Jeśli po sesji pojawią się jakieś pytania, to jest dobre miejsce do ich zadania!
    * Presence is not mandatory, but please drop a note there if force-pushing to `master`

## Cele projektu & wartości

* Współpracownicy są wspólnymi właścicielami projektu
    
    * Projekt ma cele dla swoich współpracowników

* Istnieją pewne cele i wartości wyższego szczebla
    
    * Empatia wobec użytkowników ma znaczenie (częściowo dlatego, że mamy w zespole ludzi)
    * Generalnie: staraj się być miły dla ludzi!
    * The best outcome is for people who come to our issue tracker to feel like they can come back again.

* Mamy [Zasady Postępowania](https://github.com/nodejs/admin/blob/master/CODE_OF_CONDUCT.md), który oczekuje się o przestrzeganie *i* pociągnięcia innych do odpowiedzialności

## Zarządzanie listą problemów

* Masz (przeważnie) wolną rękę; nie wahaj się zamknąć problemu, jeśli masz pewność, że należy go zamknąć
    
    * Bądź miły w zamykaniu problemów! Daj ludziom do zrozumienia dlaczego, a te problemy i PR-y można w razie potrzeby ponownie otworzyć

* [**See "Labels"**](./onboarding-extras.md#labels)
    
    * Istnieje [bot](https://github.com/nodejs-github-bot/github-bot), który stosuje etykiety podsystemów (na przykład, `doc`,`test`, `zapewnić`, lub `bufor`), abyśmy wiedzieli, jakie części kodu bazują na modyfikacjach żądania zmiany. Nie jest to oczywiście idealne. Czuj się swobodnie wysyłając znaczące etykiety i usuwając nieznaczące z żądania zmian i problemów.
    * Użyj etykiety `tsc-review`, jeśli temat jest kontrowersyjny lub nie nadchodzi wniosek po dłuższym czasie.
    * `semver-{minor,major}`: 
        * If a change has the remote *chance* of breaking something, use the `semver-major` label
        * When adding a semver label, add a comment explaining why you're adding it. Do it right away so you don't forget!

* [**See "Who to CC in issues"**](./onboarding-extras.md#who-to-cc-in-issues)
    
    * This will come more naturally over time
    * For many of the teams listed there, you can ask to be added if you are interested 
        * Some are WGs with some process around adding people, others are only there for notifications

* When a discussion gets heated, you can request that other Collaborators keep an eye on it by opening an issue at the private [nodejs/moderation](https://github.com/nodejs/moderation) repository.
    
    * This is a repository to which all members of the `nodejs` GitHub organization (not just Collaborators on Node.js core) have access. Its contents should not be shared externally.
    * You can find the full moderation policy [here](https://github.com/nodejs/TSC/blob/master/Moderation-Policy.md).

## Reviewing PRs

* The primary goal is for the codebase to improve.
* Secondary (but not far off) is for the person submitting code to succeed. A pull request from a new contributor is an opportunity to grow the community.
* Review a bit at a time. Do not overwhelm new contributors. 
    * It is tempting to micro-optimize and make everything about relative performance. Don't succumb to that temptation. We change V8 often. Techniques that provide improved performance today may be unnecessary in the future.
* Be aware: Your opinion carries a lot of weight!
* Nits (requests for small changes that are not essential) are fine, but try to avoid stalling the pull request. 
    * Note that they are nits when you comment: `Nit: change foo() to bar().`
    * If they are stalling the pull request, fix them yourself on merge.
* Minimum wait for comments time 
    * There is a minimum waiting time which we try to respect for non-trivial changes, so that people who may have important input in such a distributed project are able to respond.
    * For non-trivial changes, leave the pull request open for at least 48 hours (72 hours on a weekend).
    * If a pull request is abandoned, check if they'd mind if you took it over (especially if it just has nits left).

* Approving a change
    
    * Collaborators indicate that they have reviewed and approve of the changes in a pull request using Github’s approval interface
    * Some people like to comment `LGTM` (“Looks Good To Me”)
    * You have the authority to approve any other collaborator’s work.
    * You cannot approve your own pull requests.
    * When explicitly using `Changes requested`, show empathy – comments will usually be addressed even if you don’t use it. 
        * If you do, it is nice if you are available later to check whether your comments have been addressed
        * If you see that the requested changes have been made, you can clear another collaborator's `Changes requested` review.
        * Use `Changes requested` to indicate that you are considering some of your comments to block the PR from landing.

* What belongs in Node.js:
    
    * Opinions vary – it’s good to have a broad collaborator base for that reason!
    * If Node.js itself needs it (due to historic reasons), then it belongs in Node.js 
        * That is to say, url is there because of http, freelist is there because of http, etc.
    * Things that cannot be done outside of core, or only with significant pain (for example `async_hooks`)

* Continuous Integration (CI) Testing:
    
    * <https://ci.nodejs.org/> 
        * It is not automatically run. You need to start it manually.
    * Log in on CI is integrated with GitHub. Try to log in now!
    * You will be using `node-test-pull-request` most of the time. Go there now! 
        * Consider bookmarking it: https://ci.nodejs.org/job/node-test-pull-request/
    * To get to the form to start a job, click on `Build with Parameters`. (If you don't see it, that probably means you are not logged in!) Click it now!
    * To start CI testing from this screen, you need to fill in two elements on the form: 
        * The `CERTIFY_SAFE` box should be checked. By checking it, you are indicating that you have reviewed the code you are about to test and you are confident that it does not contain any malicious code. (We don't want people hijacking our CI hosts to attack other hosts on the internet, for example!)
        * The `PR_ID` box should be filled in with the number identifying the pull request containing the code you wish to test. For example, if the URL for the pull request is `https://github.com/nodejs/node/issues/7006`, then put `7006` in the `PR_ID`.
        * The remaining elements on the form are typically unchanged with the exception of `POST_STATUS_TO_PR`. Check that if you want a CI status indicator to be automatically inserted into the PR.
    * If you need help with something CI-related: 
        * Use #node-dev (IRC) to talk to other Collaborators.
        * Use #node-build (IRC) to talk to the Build WG members who maintain the CI infrastructure.
        * Use the [Build WG repo](https://github.com/nodejs/build) to file issues for the Build WG members who maintain the CI infrastructure.

## Landing PRs

* [See the Collaborator Guide: Landing Pull Requests](https://github.com/nodejs/node/blob/master/COLLABORATOR_GUIDE.md#landing-pull-requests)

## Exercise: Make a PR adding yourself to the README

* Example: <https://github.com/nodejs/node/commit/ce986de829457c39257cd205067602e765768fb0> 
    * For raw commit message: `git log ce986de829457c39257cd205067602e765768fb0 -1`
* Collaborators are in alphabetical order by GitHub username.
* Optionally, include your personal pronouns.
* Label your pull request with the `doc` subsystem label.
* Run CI on your PR.
* After one or two approvals, land the PR. 
    * Be sure to add the `PR-URL: <full-pr-url>` and appropriate `Reviewed-By:` metadata!
    * [`core-validate-commit`][] helps a lot with this – install and use it if you can!
    * [`node-core-utils`][] fetches the metadata for you.

## Final notes

* Don't worry about making mistakes: everybody makes them, there's a lot to internalize and that takes time (and we recognize that!)
* Almost any mistake you could make can be fixed or reverted.
* The existing Collaborators trust you and are grateful for your help!
* Other repositories: 
    * <https://github.com/nodejs/TSC>
    * <https://github.com/nodejs/build>
    * <https://github.com/nodejs/nodejs.org>
    * <https://github.com/nodejs/readable-stream>
    * <https://github.com/nodejs/LTS>
    * <https://github.com/nodejs/citgm>
* The Node.js Foundation hosts regular summits for active contributors to the Node.js project, where we have face-to-face discussion about our work on the project. The foundation has travel funds to cover participants' expenses including accommodation, transportation, visa fees etc. if needed. Check out the [summit](https://github.com/nodejs/summit) repository for details.