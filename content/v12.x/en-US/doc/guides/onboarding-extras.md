# Additional onboarding information

## Labels

### Subsystems

* `lib/*.js` (`assert`, `buffer`, etc.)
* `build`
* `doc`
* `lib / src`
* `test`
* `tools`

More than one subsystem may be valid for any particular issue or pull request.

### General

* `confirmed-bug`: Bugs you have verified
* `discuss`: Things that need larger discussion
* `feature request`: Any issue that requests a new feature
* `good first issue`: Issues suitable for newcomers to fix
* `meta`: Governance, policies, procedures, etc.
* `tsc-agenda`: Open issues and pull requests with this label will be added to
  the Technical Steering Committee meeting agenda

---

* `author-ready` - A pull request is _author ready_ when:
  * There is a CI run in progress or completed.
  * There is at least one Collaborator approval (or two TSC approvals for
    semver-major PRs).
  * There are no outstanding review comments.

Please always add the `author ready` label to pull requests that qualify.
Please always remove it again as soon as the conditions are not met anymore,
such as if the CI run fails or a new outstanding review comment is posted.

---

* `semver-{minor,major}`
  * be conservative – that is, if a change has the remote *chance* of breaking
    something, go for semver-major
  * when adding a semver label, add a comment explaining why you're adding it
  * minor vs. patch: roughly: "does it add a new method / does it add a new
    section to the docs"
  * major vs. everything else: run last versions tests against this version, if
    they pass, **probably** minor or patch

### LTS/version labels

We use labels to keep track of which branches a commit should land on:

* `dont-land-on-v?.x`
  * For changes that do not apply to a certain release line
  * Also used when the work of backporting a change outweighs the benefits
* `land-on-v?.x`
  * Used by releasers to mark a PR as scheduled for inclusion in an LTS release
  * Applied to the original PR for clean cherry-picks, to the backport PR
    otherwise
* `backport-requested-v?.x`
  * Used to indicate that a PR needs a manual backport to a branch in order to
    land the changes on that branch
  * Typically applied by a releaser when the PR does not apply cleanly or it
    breaks the tests after applying
  * Will be replaced by either `dont-land-on-v?.x` or `backported-to-v?.x`
* `backported-to-v?.x`
  * Applied to PRs for which a backport PR has been merged
* `lts-watch-v?.x`
  * Applied to PRs which the LTS working group should consider including in a
    LTS release
  * Does not indicate that any specific action will be taken, but can be
    effective as messaging to non-collaborators
* `lts-agenda`
  * For things that need discussion by the LTS working group
  * (for example semver-minor changes that need or should go into an LTS
    release)
* `v?.x`
  * Automatically applied to changes that do not target `master` but rather the
    `v?.x-staging` branch

Once a release line enters maintenance mode, the corresponding labels do not
need to be attached anymore, as only important bugfixes will be included.

### Other labels

* Operating system labels
  * `macos`, `windows`, `smartos`, `aix`
  * No `linux` label because it is the implied default
* Architecture labels
  * `arm`, `mips`, `s390`, `ppc`
  * No `x86{_64}` label because it is the implied default
