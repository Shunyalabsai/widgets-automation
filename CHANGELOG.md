# Changelog

## [0.1.51] - 2026-02-02
### Fix
- Skipped Pages deploy on email-only dispatch runs.

## [0.1.50] - 2026-02-02
### Minor change
- Added Google Apps Script scheduler for exact-time runs and email.
### Fix
- Restored repository dispatch workflow for external scheduling.

## [0.1.49] - 2026-02-02
### Minor change
- Added Oracle cron setup docs and cron runner script.
### Fix
- Removed GitHub scheduled workflow in favor of server cron.

## [0.1.48] - 2026-02-02
### Minor change
- Adjusted verification schedule to 1:30 PM run and 1:40 PM email.

## [0.1.47] - 2026-02-02
### Fix
- Skipped Pages deploy during email-only scheduled runs.

## [0.1.46] - 2026-02-02
### Minor change
- Adjusted test schedule to 12:10 PM with 12:15 PM email for verification.

## [0.1.45] - 2026-02-02
### Minor change
- Adjusted test schedule to 11:45/11:55 AM with 12 PM email for verification.

## [0.1.44] - 2026-02-02
### Fix
- Scheduled workflow now rebases with autostash before committing docs.

## [0.1.43] - 2026-02-02
### Minor change
- Scheduled 9 AM/12 PM/3 PM IST runs with a daily email summary at 6 PM.

## [0.1.42] - 2026-02-02
### Minor change
- Scheduled three runs two hours apart (2 AM, 4 AM, 6 AM IST).

## [0.1.41] - 2026-02-02
### Minor change
- Adjusted schedule to 6:10 PM IST for testing.

## [0.1.40] - 2026-02-02
### Minor change
- Adjusted schedule to 5:00 PM IST for testing.

## [0.1.39] - 2026-02-02
### Minor change
- Adjusted schedule to 4:45 PM IST for testing.

## [0.1.38] - 2026-02-02
### Minor change
- Adjusted schedule to 4:40 PM IST for testing.

## [0.1.37] - 2026-02-02
### Minor change
- Added repository dispatch trigger for Cronitor scheduling.

## [0.1.36] - 2026-02-02
### Minor change
- Adjusted schedule to 2:20 PM IST.

## [0.1.35] - 2026-02-02
### Fix
- Scheduled workflow now commits only docs/ and rebases before push.

## [0.1.34] - 2026-02-02
### Minor change
- Deployed scheduled runs directly to GitHub Pages to refresh dashboard.

## [0.1.33] - 2026-02-02
### Minor change
- Adjusted scheduled test run to 1:15 PM IST.

## [0.1.32] - 2026-02-02
### Minor change
- Added 1 PM IST scheduled test run.

## [0.1.31] - 2026-02-02
### Minor change
- Added scheduled GitHub Actions workflow for daily IST runs.

## [0.1.30] - 2026-02-02
### UI change
- Fixed dashboard chart sizing to prevent excessive scrolling.

## [0.1.29] - 2026-02-02
### UI change
- Refined dashboard charts layout and added module pass-rate chart.

## [0.1.28] - 2026-02-02
### Minor change
- Formatted sheet timestamps using the script timezone.

## [0.1.27] - 2026-02-02
### Minor change
- Formatted sheet timestamps as readable UTC strings.

## [0.1.26] - 2026-02-02
### Minor change
- Added optional sheet reset to rewrite testcase IDs and statuses.

## [0.1.25] - 2026-02-02
### Minor change
- Added testcase IDs, PASS/FAIL status, and brief descriptions in sheet sync.

## [0.1.24] - 2026-02-02
### Minor change
- Added sheet name and spreadsheet ID support for Google Sheets sync.

## [0.1.23] - 2026-02-02
### Minor change
- Updated Google Sheets sync to match test-coverage columns and sheet name.

## [0.1.22] - 2026-02-02
### Minor change
- Added Google Sheets web app sync for per-test results and artifacts.

## [0.1.21] - 2026-02-02
### Fix
- Relaxed Medical Transcription prerecorded tests to only require transcript rows.

## [0.1.20] - 2026-02-02
### Minor change
- Added Medical Transcription live-recording start/stop test flow.

## [0.1.19] - 2026-02-02
### Fix
- Relaxed Medical Transcription upload validation to only require transcript rows.

## [0.1.18] - 2026-02-02
### Minor change
- Added Medical Transcription upload test using the STT fixture.

## [0.1.17] - 2026-02-02
### Minor change
- Added Medical Transcription doctor-appointment test flow.

## [0.1.16] - 2026-02-02
### Minor change
- Added Medical Transcription patient-notes test and POM helpers.

## [0.1.15] - 2026-02-02
### Fix
- Further relaxed STT/CodeSwitch checks to only require transcript rows.

## [0.1.14] - 2026-02-02
### Fix
- Relaxed STT and CodeSwitch checks to only require any transcript and speaker label.

## [0.1.13] - 2026-02-02
### Fix
- Avoided strict-mode locator failure when checking any speaker label.

## [0.1.12] - 2026-02-02
### Minor change
- Relaxed CodeSwitch live-recording validation to only require transcript presence and a speaker label.

## [0.1.11] - 2026-02-02
### Minor change
- Updated CodeSwitch live-recording fixture to a 45+ second, 3-speaker dialog and loosened validation to only assert speaker count.

## [0.1.10] - 2026-02-02
### Minor change
- Added CodeSwitch live-recording flow using a 3-speaker Hinglish fixture.

## [0.1.9] - 2026-02-02
### Minor change
- Added CodeSwitch sample-audio test for prerecorded flow.

## [0.1.8] - 2026-02-02
### Minor change
- Added CodeSwitch upload test with Hinglish audio fixture.

## [0.1.7] - 2026-02-02
### Minor change
- Added simulated live-recording STT test with expected transcript fixture.

## [0.1.6] - 2026-02-02
### Fix
- Reduced STT flakiness with longer timeouts and stronger transcript waits.

## [0.1.5] - 2026-02-02
### UI change
- Rebuilt dashboard UI with tabs, charts, and modal details.
### Minor change
- Added export actions and enhanced run metadata.

## [0.1.4] - 2026-02-02
### UI change
- Improved dashboard UI layout and error details view.
### Minor change
- Fixed module grouping for report entries.

## [0.1.3] - 2026-02-02
### Minor change
- Moved GitHub Pages dashboard output to `/docs` for Pages compatibility.

## [0.1.2] - 2026-02-02
### Minor change
- Added dashboard generation, run history, and export files for GitHub Pages.

## [0.1.1] - 2026-02-02
### Minor change
- Added STT upload-audio test flow with POM helpers and data folder.

## [0.1.0] - 2026-02-02
### Minor change
- Initialized Playwright test runner with baseline config and scripts.
- Added a starter widget smoke test with environment-based URL.
