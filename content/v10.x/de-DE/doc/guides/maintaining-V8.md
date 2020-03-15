# Aktualisierung von npm in Node.js

## Hintergrund

V8 folgt dem Chrom-Release-Zeitplan. Der Unterstützungshorizont für Chromium ist anders als der Support-Horizont für Node.js. Als Ergebnis wird Node.js muss mehrere Versionen von V8 länger unterstützen als Upstream benötigt zu unterstützen. Der V8 Store bei Node.js hat keinen offiziellen Wartungsprozess zu einem nicht unterstützten Zweig von LTS verloren.

Dieses Dokument versucht den aktuellen Wartungsprozess zu beschreiben, schlägt vor Workflow zum Verwalten des V8-Zweigs in Node.js LTS und aktuell an veröffentlicht und erläutert, wie Node.js und V8-Teams bei Google helfen können.

## V8 Release Zeitplan

V8 and Chromium follow a [roughly 6-week release cadence](https://www.chromium.org/developers/calendar). At any given time there are three V8 branches that are **active**.

Zum Beispiel zum Zeitpunkt dieses Schreibens:

* **Stable**: V8 5.4 is currently shipping as part of Chromium stable. This branch was created approx. 6 weeks before from when V8 5.3 shipped as stable.
* **Beta**: V8 5.5 is currently in beta. It will be promoted to stable next; approximately 6 weeks after V8 5.4 shipped as stable.
* **Master**: V8 tip-of-tree corresponds to V8 5.6. This branch gets regularly released as part of the Chromium **canary** builds. This branch will be promoted to beta next when V8 5.5 ships as stable.

Alle älteren Zweige sind aufgegeben und werden nicht vom V8-Team gewartet.

### V8-Merge-Prozess-Übersicht

Der Prozess für die Rückportierung von Fehlerkorrekturen in aktive Zweige ist offiziell dokumentiert [im V8-Wiki](https://github.com/v8/v8/wiki/Merging%20&%20Patching). Der Zusammenfassung des Prozesses ist:

* V8 unterstützt nur aktive Zweige. There is no testing done on any branches older than the current stable/beta/master.
* A fix needing backport is tagged w/ *merge-request-x.x* tag. This can be done by anyone interested in getting the fix backported. Issues with this tag are reviewed by the V8 team regularly as candidates for backporting.
* Fixes benötigen etwas Backzeit, bevor sie für Backporting freigegeben werden können. This means waiting a few days to ensure that no issues are detected on the canary/beta builds.
* Once ready, the issue is tagged w/ *merge-approved-x.x* and one can do the actual merge by using the scripts on the [wiki page](https://github.com/v8/v8/wiki/Merging%20&%20Patching).
* Merge-anforderungen einen verlassenen zweig werden zuruckgewiesen.
* Nur bug-fixes fut backporting akzeptiert.

## Node.js-Supportanforderungen

Zu einem bestimmten Zeitpunkt muss Node.js einige verschiedene V8-Zweige verwalten für die verschiedenen Current, LTS und Nightly werden. Zur zeit diese liste enthält die folgenden zweige<sup>1</sup>:

<table>
  <tr>
   <td><strong>Release</strong>
   </td>
   <td><strong>Support Start</strong>
   </td>
   <td><strong>Support End</strong>
   </td>
   <td><strong>V8 version</strong>
   </td>
   <td><strong>V8 branch released</strong>
   </td>
   <td><strong>V8 branch abandoned</strong>
   </td>
  </tr>
  <tr>
   <td>Node.js 4.x
   </td>
   <td>2015-10-01
   </td>
   <td>April 2018
   </td>
   <td>4.5
   </td>
   <td>2015-09-01
   </td>
   <td>2015-10-13
   </td>
  </tr>
  <tr>
   <td>Node.js 6.x
   </td>
   <td>2016-04-01
   </td>
   <td>April 2019
   </td>
   <td>5.1
   </td>
   <td>2016-05-31
   </td>
   <td>2016-06-26
   </td>
  </tr>
  <tr>
   <td>Node.js 8.x
   </td>
   <td>2017-05-30
   </td>
   <td>December 2019
   </td>
   <td>6.1 (soon to be 6.2)
   </td>
   <td>2017-10-17 (6.2)
   </td>
   <td>~2017-12-05 (6.2)
   </td>
  </tr>
    <tr>
   <td>Node.js 9.x
   </td>
   <td>2017-10-31
   </td>
   <td>April 2018
   </td>
   <td>6.2
   </td>
   <td>2017-10-17
   </td>
   <td>~2017-12-05
   </td>
  </tr>
  <tr>
   <td>master
   </td>
   <td>N/A
   </td>
   <td>N/A
   </td>
   <td>6.2
   </td>
   <td>2017-10-17
   </td>
   <td>~2017-12-05
   </td>
  </tr>
</table>

Die versionen von V8, die in Node.js v4.x, v6.x und 8.x verwendet wurden, waren bereits vorhanden aufgegeben von stromaufwärts V8. Node.js muss jedoch weiterhin unterstützt werden diese Zweige für viele Monate (Aktuelle Zweige) oder mehrere Jahre (LTS-Filialen).

## Wartungsprozess

Sobald ein Fehler in Node.js durch V8 verursacht wurde, ist der erste Schritt Identifizieren der Versionen von Node.js und V8 betroffen. Der Fehler kann in vorhanden sein mehrere verschiedene Orte, von denen jeder eine etwas andere folgt verarbeiten.

* Unfixed bugs. The bug exists in the V8 master branch.
* Fixed, but needs backport. The bug may need porting to one or more branches.
  * Backporting to active branches.
  * Backporting to abandoned branches.
* Backports identified by the V8 team. Bugs identified by upstream V8 that we haven't encountered in Node.js yet.

### Unfixierten vorgelagerten bugs

Wenn der Fehler auf dem Zweig [Node.js `Kanarienvogel` Zweig] reproduziert werden kann, oder V8- Tip-of-tree, und der Testfall ist gültig, dann muss der Fehler behoben werden stromaufwärts zuerst.

* Beginnen Sie mit dem Öffnen eines Fehlers mit [dieser Vorlage](https://bugs.chromium.org/p/v8/issues/entry?template=Node.js%20upstream%20bug).
* Make sure to include a link to the corresponding Node.js issue (if one exists).
* If the fix is simple enough, you may fix it yourself; [contributions](https://github.com/v8/v8/wiki/Contributing) are welcome.
* Der Build-Wasserfall von V8 testet Ihre Veränderung.
* Sobald der Fehler behoben ist, muss er möglicherweise noch zurückportiert werden, wenn er in einem anderen V8 vorhanden ist Zweige, die noch aktiv sind oder Zweige sind, die Node.js interessiert. Befolgen Sie den folgenden Vorgang für die Rückportierung.

### Zurück zu Active Branches

Wenn der Fehler in einer der aktiven V8-Zweige vorhanden ist, müssen wir möglicherweise das Update erhalten rückportiert. Zu jeder gegebenen Zeit gibt es [zwei aktive Zweige](https://build.chromium.org/p/client.v8.branches/console) (Beta und stall) zusätzlich zum Maister. Die folgenden Schritte sind erforderlich den Fix rückportieren:

* Identify which version of V8 the bug was fixed in.
* Identify if any active V8 branches still contain the bug:
* A tracking bug is needed to request a backport.
  * Wenn nicht bereits ein V8-Fehler den Fix verfolgt, öffnen Sie eine neue Zusammenführungsanforderung Fehler mit dieser [Node.js spezifischen Vorlage ](https://bugs.chromium.org/p/v8/issues/entry?template=Node.js%20merge%20request).
  * If a bug already exists
    * Add a reference to the GitHub issue.
    * Attach *merge-request-x.x* labels to the bug for any active branches that still contain the bug. (e.g. merge-request-5.3, merge-request-5.4)
    * Add ofrobots-at-google.com to the cc list.
* Once the merge has been approved, it should be merged using the [merge script documented in the V8 wiki](https://github.com/v8/v8/wiki/Merging%20&%20Patching). Merging requires commit access to the V8 repository. If you don't have commit access you can indicate someone on the V8 team can do the merge for you.
* It is possible that the merge request may not get approved, for example if it is considered to be a feature or otherwise too risky for V8 stable. In such cases we float the patch on the Node.js side. See the process on 'Backporting to Abandoned branches'.
* Once the fix has been merged upstream, it can be picked up during an update of the V8 branch (see below).

### Backporting zu verlassenen Niederlassungen

Zweig V8 Links wird im repository-Knoten unterstützt.js. Das Update benötigt werden handverlesene, in den Knoten.js repository und V8-CI müssen die änderung testen.

* For each abandoned V8 branch corresponding to an LTS branch that is affected by the bug:
  * Checkout a branch off the appropriate *vY.x-staging* branch (e.g. *v6.x-staging* to fix an issue in V8 5.1).
  * Cherry-pick the commit(s) from the V8 repository.
  * On Node.js < 9.0.0: Increase the patch level version in `v8-version.h`. Dies wird keine Probleme mit der Versionierung verursachen, weil V8 dies nicht tut Veröffentlichen Sie andere Patches für diesen Zweig, damit Node.js die Patch-Version.
  * On Node.js >= 9.0.0: Increase the `v8_embedder_string` number in `common.gypi`.
  * In einigen Fällen erfordert der Patch möglicherweise zusätzlichen Aufwand, um zu verschmelzen, falls V8 hat wesentlich verändert. Bei wichtigen Fragen können wir uns auf die V8-Team, um Hilfe bei der Neuimplementierung des Patches zu erhalten.
  * Open a cherry-pick PR on `nodejs/node` targeting the *vY.x-staging* branch and notify the `@nodejs/v8` team.
  * Run the Node.js [V8 CI](https://ci.nodejs.org/job/node-test-commit-v8-linux/) in addition to the [Node.js CI](https://ci.nodejs.org/job/node-test-pull-request/). The CI uses the `test-v8` target in the `Makefile`, which uses `tools/make-v8.sh` to reconstruct a git tree in the `deps/v8` directory to run V8 tests.

The [`git-node`] tool can be used to simplify this task. Run `git node v8 backport <sha>` to cherry-pick a commit.

An example for workflow how to cherry-pick consider the bug [RegExp show inconsistent result with other browsers](https://crbug.com/v8/5199). From the bug we can see that it was merged by V8 into 5.2 and 5.3, and not into V8 5.1 (since it was already abandoned). Since Node.js `v6.x` uses V8 5.1, the fix needed to be cherry-picked. To cherry-pick, here's an example workflow:

* Download and apply the commit linked-to in the issue (in this case a51f429). `curl -L https://github.com/v8/v8/commit/a51f429.patch | git am -3
--directory=deps/v8`. If the branches have diverged significantly, this may not apply cleanly. It may help to try to cherry-pick the merge to the oldest branch that was done upstream in V8. In this example, this would be the patch from the merge to 5.2. The hope is that this would be closer to the V8 5.1, and has a better chance of applying cleanly. If you're stuck, feel free to ping @ofrobots for help.
* Modify the commit message to match the format we use for V8 backports and replace yourself as the author. `git commit --amend --reset-author`. You may want to add extra description if necessary to indicate the impact of the fix on Node.js. In this case the original issue was descriptive enough. Example:

```console
deps: cherry-pick a51f429 from V8 upstream

Original commit message:
  [regexp] Fix case-insensitive matching for one-byte subjects.

  The bug occurs because we do not canonicalize character class ranges
  before adding case equivalents. While adding case equivalents, we abort
  early for one-byte subject strings, assuming that the ranges are sorted.
  Which they are not.

  R=marja@chromium.org
  BUG=v8:5199

  Review-Url: https://codereview.chromium.org/2159683002
  Cr-Commit-Position: refs/heads/master@{#37833}

Refs: https://github.com/v8/v8/commit/a51f429772d1e796744244128c9feeab4c26a854
PR-URL: https://github.com/nodejs/node/pull/7833
```

* Open a PR against the `v6.x-staging` branch in the Node.js repo. Launch the normal and [V8 CI](https://ci.nodejs.org/job/node-test-commit-v8-linux/) using the Node.js CI system. We only needed to backport to `v6.x` as the other LTS branches weren't affected by this bug.

### Backports Identified by the V8 team

For bugs found through the browser or other channels, the V8 team marks bugs that might be applicable to the abandoned branches in use by Node.js. This is done through manual tagging by the V8 team and through an automated process that tags any fix that gets backported to the stable branch (as it is likely candidate for backporting further).

Such fixes are tagged with the following labels in the V8 issue tracker:

* `NodeJS-Backport-Review` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Review), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Review)): to be reviewed if this is applicable to abandoned branches in use by Node.js. This list if regularly reviewed by the Node.js team at Google to determine applicability to Node.js.
* `NodeJS-Backport-Approved` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Approved), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Approved)): marks bugs that are deemed relevant to Node.js and should be backported.
* `NodeJS-Backport-Done` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Done), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Done)): Backport for Node.js has been performed already.
* `NodeJS-Backport-Rejected` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Rejected), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Rejected)): Backport for Node.js is not desired.

The backlog of issues with such is regularly reviewed by the node-team at Google to shepherd through the backport process. External contributors are welcome to collaborate on the backport process as well. Note that some of the bugs may be security issues and will not be visible to external collaborators.

## Updating V8

Node.js keeps a vendored copy of V8 inside of the deps/ directory. In addition, Node.js may need to float patches that do not exist upstream. This means that some care may need to be taken to update the vendored copy of V8.

### Minor updates (patch level)

Because there may be floating patches on the version of V8 in Node.js, it is safest to apply the patch level updates as a patch. For example, imagine that upstream V8 is at 5.0.71.47 and Node.js is at 5.0.71.32. It would be best to compute the diff between these tags on the V8 repository, and then apply that patch on the copy of V8 in Node.js. This should preserve the patches/backports that Node.js may be floating (or else cause a merge conflict).

The rough outline of the process is:

```shell
# Assuming your fork of Node.js is checked out in $NODE_DIR
# and you want to update the Node.js master branch.
# Find the current (OLD) version in
# $NODE_DIR/deps/v8/include/v8-version.h
cd $NODE_DIR
git checkout master
git merge --ff-only origin/master
git checkout -b V8_NEW_VERSION
curl -L https://github.com/v8/v8/compare/${V8_OLD_VERSION}...${V8_NEW_VERSION}.patch | git apply --directory=deps/v8
# You may want to amend the commit message to describe the nature of the update
```

V8 also keeps tags of the form *5.4-lkgr* which point to the *Last Known Good Revision* from the 5.4 branch that can be useful in the update process above.

The [`git-node`] tool can be used to simplify this task. Run `git node v8 minor` to apply a minor update.

### Major Updates

We upgrade the version of V8 in Node.js master whenever a V8 release goes stable upstream, that is, whenever a new release of Chrome comes out.

Upgrading major versions would be much harder to do with the patch mechanism above. A better strategy is to

1. Audit the current master branch and look at the patches that have been floated since the last major V8 update.
1. Replace the copy of V8 in Node.js with a fresh checkout of the latest stable V8 branch. Special care must be taken to recursively update the DEPS that V8 has a compile time dependency on (at the moment of this writing, these are only trace_event and gtest_prod.h)
1. Reset the `v8_embedder_string` variable to "-node.0" in `common.gypi`.
1. Refloat (cherry-pick) all the patches from list computed in 1) as necessary. Some of the patches may no longer be necessary.

To audit for floating patches:

```shell
git log --oneline deps/v8
```

To replace the copy of V8 in Node.js, use the [`git-node`] tool. For example, if you want to replace the copy of V8 in Node.js with the branch-head for V8 5.1 branch:

```shell
cd $NODE_DIR
git node v8 major --branch=5.1-lkgr
```

This should be followed up with manual refloating of all relevant patches.

## Proposal: Using a fork repo to track upstream V8

The fact that Node.js keeps a vendored, potentially edited copy of V8 in deps/ makes the above processes a bit complicated. An alternative proposal would be to create a fork of V8 at `nodejs/v8` that would be used to maintain the V8 branches. This has several benefits:

* The process to update the version of V8 in Node.js could be automated to track the tips of various V8 branches in `nodejs/v8`.
* It would simplify cherry-picking and porting of fixes between branches as the version bumps in `v8-version.h` would happen as part of this update instead of on every change.
* It would simplify the V8-CI and make it more automatable.
* The history of the V8 branch in `nodejs/v8` becomes purer and it would make it easier to pull in the V8 team for help with reviewing.
* It would make it simpler to setup an automated build that tracks Node.js master + V8 lkgr integration build.

This would require some tooling to:

* A script that would update the V8 in a specific Node.js branch with V8 from upstream (dependent on branch abandoned vs. active).
* We need a script to bump V8 version numbers when a new version of V8 is promoted from `nodejs/v8` to `nodejs/node`.
* Enabled the V8-CI build in Jenkins to build from the `nodejs/v8` fork.

<!-- Footnotes themselves at the bottom. -->
### Notes

<sup>1</sup>Node.js 0.12 and older are intentionally omitted from this document as their support has ended.
