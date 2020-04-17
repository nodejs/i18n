# Proces Adaptacyjny

This document is an outline of the things we tell new Collaborators at their onboarding session.

## Tydzień przed sesją adaptacyjną

* Confirm that the new Collaborator is using two-factor authentication on their GitHub account. Unless two-factor authentication is enabled, do not give an account elevated privileges such as the ability to land code in the main repository or to start continuous integration (CI) jobs.

## Piętnaście minut przed sesją adaptacyjną

* Prior to the onboarding session, add the new Collaborator to [the Collaborators team](https://github.com/orgs/nodejs/teams/collaborators), and to [the Members team](https://github.com/orgs/nodejs/teams/members) if they are not already part of it. Note that this is the step that gives the account elevated privileges, so do not perform this step (or any subsequent steps) unless two-factor authentication is enabled on the new Collaborator's GitHub account.

## Sesja adaptacyjna

* Ta sesja obejmie: 
    * [ustawienia lokalne](#local-setup)
    * [cele projektu & wartości](#project-goals--values)
    * [zarządzanie listą problemów](#managing-the-issue-tracker)
    * [przeglądanie PR](#reviewing-prs)
    * [wyładowywanie Pr](#landing-prs)

## Ustawienia lokalne

* git:
    
    * Upewnij się, że masz ustawione whitespace=fix: `git config --global --add apply.whitespace fix`
    * Zawsze wznawiaj PR z własnego rozwidlenia github 
        * Gałęzie w repozytorium nodejs/node są tylko dla opublikowanych wierszy
    * [Zobacz "Aktualizowanie Node.js z Upstream"](./onboarding-extras.md#updating-nodejs-from-upstream)
    * Stwórz nową gałąź dla każdego PR, które przesyłasz.
    * Membership: Consider making your membership in the Node.js GitHub organization public. Ułatwia to identyfikację Współpracowników. Instructions on how to do that are available at [Publicizing or hiding organization membership](https://help.github.com/articles/publicizing-or-hiding-organization-membership/).

* Powiadomienia:
    
    * Użyj [https://github.com/powiadomienia](https://github.com/notifications) lub załóż e-mail
    * Obserwowanie głównego repozytorium zaleje twoją skrzynkę odbiorczą (kilkaset powiadomień w typowe dni powszednie), więc bądź przygotowany

* `#node-dev` na [webchat.freenode.net](https://webchat.freenode.net/) jest najlepszym miejscem do interakcji z TSC / innymi Współpracownikami
    
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

* [**Zobacz "Etykiety"**](./onboarding-extras.md#labels)
    
    * Istnieje [bot](https://github.com/nodejs-github-bot/github-bot), który stosuje etykiety podsystemów (na przykład, `doc`,`test`, `zapewnić`, lub `bufor`), abyśmy wiedzieli, jakie części kodu bazują na modyfikacjach żądania zmiany. Nie jest to oczywiście idealne. Czuj się swobodnie wysyłając znaczące etykiety i usuwając nieznaczące z żądania zmian i problemów.
    * Use the `tsc-review` label if a topic is controversial or isn't coming to a conclusion after an extended time.
    * `semver-{minor,major}`: 
        * Jeśli zmiana ma nikłą *szansę* złamania czegoś, użyj znacznika `semver-major`
        * Dodając etykietę semver, dodaj komentarz wyjaśniający, dlaczego ją dodajesz. Zrób to od razu, żebyś nie zapomniał!

* [**See "Who to CC in issues"**](./onboarding-extras.md#who-to-cc-in-issues)
    
    * Będzie to bardziej naturalnie z czasem
    * Wiele z zespołów tutaj wymienionych, możesz poprosić aby być dodany, jeśli jesteś zainteresowany 
        * Some are WGs with some process around adding people, others are only there for notifications

* Kiedy dyskusja się zaostrzyła, możesz poprosić innych Współpracowników o śledzenie tego, otwierając problem w prywatnym repozytorium [nodejs/moderation](https://github.com/nodejs/moderation).
    
    * Jest to repozytorium, do którego mają dostęp wszyscy członkowie `nodejs` organizacji GitHub (nie tylko Współpracownicy rdzenia Node.js). Jego zawartość nie powinna być udostępniana na zewnątrz.
    * Możesz znaleźć pełną politykę moderacji [tutaj](https://github.com/nodejs/TSC/blob/master/Moderation-Policy.md).

## Przeglądanie PR

* Podstawowym celem bazy kodu jest jego udoskonalenie.
* Drugorzędnym (ale bliskim pierwszemu) jest dla osoby przesyłającej kod odnieść sukces. A pull request from a new contributor is an opportunity to grow the community.
* Nie sprawdzaj wszystkiego za jednym razem. Nie przytłaczaj nowych współpracowników. 
    * It is tempting to micro-optimize and make everything about relative performance. Nie ulegajcie tej pokusie. Często zmieniamy silnik V8. Techniques that provide improved performance today may be unnecessary in the future.
* Bądź świadomy: Twoja opinia wiele znaczy!
* Nits (requests for small changes that are not essential) are fine, but try to avoid stalling the pull request. 
    * Zauważ, że twoje komentarze to nits: `Nit: change foo() to bar().`
    * Jeśli blokują one żądanie ściągnięcia, napraw je sam przy scalaniu.
* Minimalny czas oczekiwania dla komentarzy 
    * There is a minimum waiting time which we try to respect for non-trivial changes, so that people who may have important input in such a distributed project are able to respond.
    * For non-trivial changes, leave the pull request open for at least 48 hours (72 hours on a weekend).
    * If a pull request is abandoned, check if they'd mind if you took it over (especially if it just has nits left).

* Zatwierdzanie zmiany
    
    * Collaborators indicate that they have reviewed and approve of the changes in a pull request using Github’s approval interface
    * Niektórzy ludzie lubią komentować `LGTM` (“Dla Mnie Wygląda Dobrze”)
    * Masz upoważnienie do zatwierdzenia pracy innego współpracownika.
    * Nie możesz zatwierdzać własnych żądań zmian.
    * When explicitly using `Changes requested`, show empathy – comments will usually be addressed even if you don’t use it. 
        * If you do, it is nice if you are available later to check whether your comments have been addressed
        * If you see that the requested changes have been made, you can clear another collaborator's `Changes requested` review.
        * Use `Changes requested` to indicate that you are considering some of your comments to block the PR from landing.

* Co należy do Node.js:
    
    * Opinie są różne - z tego powodu dobrze jest mieć szeroką bazę współpracowników!
    * Jeśli sam Node.js tego potrzebuje (ze względów przeszłości), to należy to do Node.js 
        * To znaczy, że url jest tam z powodu http, freelist jest tam z powodu http, itp.
    * Rzeczy, których nie można zrobić poza rdzeniem lub tylko przy znacznym ucierpieniu (na przykład `async_hooks`)

* Testowanie w Continuous Integration (CI):
    
    * <https://ci.nodejs.org/> 
        * Nie jest to uruchamiane automatycznie. Musisz uruchomić to ręcznie.
    * Log in on CI is integrated with GitHub. Spróbuj się zalogować teraz!
    * Przez większość czasu będziesz używać `node-test-pull-request`. Przejdź tam teraz! 
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