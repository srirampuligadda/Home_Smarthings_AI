## Why

To establish a clear, trackable, and compulsory versioning strategy for the codebase. This ensures that every baseline release (starting with 1.0) is properly tagged in the git repository and that `RELEASE_NOTES.md` accurately reflects the changes shipped in each version. It enforces discipline in documenting new features, bug fixes, and breaking changes.

## What Changes

- Establish a git tagging convention starting with baseline `v1.0.0`.
- Create a `RELEASE_NOTES.md` file (or update `CHANGELOG.md`) that documents changes for the 1.0 release.
- Add a pre-commit or CI/CD hook (or documentation process) that makes it compulsory to update the release notes with the latest version and changes when a new tag is pushed or a PR is merged.

## Capabilities

### New Capabilities
- `release-management`: Defines the standard for git tagging, semantic versioning, and the compulsory maintenance of release notes.
- `ci-validation`: (Optional) Automation rules to enforce release note updates before allowing branch merges or tag creation.

### Modified Capabilities
- (None)

## Impact

- **Developers**: Must update release notes before cutting a new release.
- **Git Repository**: Introduces git tags (`v1.0.0`, etc.) and a permanent `RELEASE_NOTES.md` file.
- **Workflow**: Adds a mandatory validation step (manual or automated) for release note compliance.
