## 1. Setup

- [x] 1.1 Initialize `RELEASE_NOTES.md` with baseline v1.0.0 entry
- [x] 1.2 Install Husky and `lint-staged` (if not already present)

## 2. Core Implementation

- [x] 2.1 Create Node.js script `scripts/verify-release-notes.js` to parse `RELEASE_NOTES.md` and verify it has uncommitted/staged modifications.
- [x] 2.2 Configure Husky `pre-commit` or `pre-push` hook in `package.json` to execute `node scripts/verify-release-notes.js`.

## 3. Testing and Verification

- [x] 3.1 Test commit/push without modifying `RELEASE_NOTES.md` (should fail)
- [x] 3.2 Test commit/push after modifying `RELEASE_NOTES.md` (should succeed)
- [x] 3.3 Create git tag `v1.0.0` and push it to origin to establish the baseline
