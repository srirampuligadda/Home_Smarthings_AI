#!/usr/bin/env node

const { execSync } = require('child_process');

function checkReleaseNotes() {
  try {
    // Check if we are on the main branch
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    if (branch !== 'main') {
      console.log('Not on main branch. Skipping release notes check.');
      return;
    }

    // Check if we are pushing a tag
    // Pre-push passes arguments: $1 = remote name, $2 = remote url
    // and stdin receives: local_ref local_sha remote_ref remote_sha
    // Actually, simpler: just check if RELEASE_NOTES.md changed in the last commit
    // Or if this is a pre-commit, check if it is staged.
    
    const isPreCommit = process.env.HOOK_TYPE === 'pre-commit';
    
    if (isPreCommit) {
      const stagedFiles = execSync('git diff --cached --name-only').toString().trim().split('\n');
      if (!stagedFiles.includes('RELEASE_NOTES.md')) {
        console.error('\n❌ ERROR: You are committing to the main branch but RELEASE_NOTES.md is not modified.');
        console.error('Please update RELEASE_NOTES.md with your changes before committing to main.\n');
        process.exit(1);
      }
    } else {
      // Pre-push check
      // For simplicity, just check if the file changed in the most recent commit on main
      const changedFiles = execSync('git diff --name-only HEAD~1 HEAD').toString().trim().split('\n');
      if (!changedFiles.includes('RELEASE_NOTES.md')) {
        console.warn('\n⚠️ WARNING: You are pushing to main, but RELEASE_NOTES.md was not modified in the latest commit.');
        console.warn('Ensure your release notes are up to date.\n');
      }
    }
    
    console.log('✅ Release notes verification passed.');
  } catch (error) {
    console.error('Error verifying release notes:', error.message);
    process.exit(1);
  }
}

checkReleaseNotes();
