# Centre Fall Fieldnotes

Fall 2026 player and coach reports for four Centre intrasquads and two October 24 games against Lindsey Wilson. The static app includes pitching, hitting, fielding snapshots, player reports, a pitch lab, full PA review, fitted ball-flight replays and source-linked development findings.

**Release 05:** 1,524 reviewed source records; 1,521 eligible pitches; 82 eligible pitch-type corrections; 385 scored plate appearances across both teams; 214 balls in play and 162 usable flights. Centre and Lindsey Wilson statistics stay separate. Graham Johnson's LW 2 #317 is scored a single following user confirmation on October 26.

## Publication setup

The intended repository is `AustinsAnalytics/centre-fall-fieldnotes`. This prepared project can be kept private while reviewed. The workflow runs checks on pushes and PRs. Deployment is gated to a public repository; making the repository public exposes all of its included app data. No original raw export or prior-season master is included here.

To publish with GitHub Pages:

1. Make the repository public when ready to share the app and its included player data.
2. In **Settings → Pages**, set the publishing source to **GitHub Actions**.
3. Open **Actions → Verify and publish Fieldnotes → Run workflow** on `main`.
4. Share the successful deployment URL. Expected project URL: https://austinsanalytics.github.io/centre-fall-fieldnotes/

Only `site/` is deployed, after verification passes. The site needs no build, secrets, API keys or external runtime. A public repository also allows inspection of the checks. `noindex` is not authentication. GitHub Pages is a public website in this setup.

GitHub documentation: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Local preview

```sh
python3 -m http.server 4386 --bind 127.0.0.1 --directory site
```

Open http://127.0.0.1:4386. For Cloudflare Pages, upload the **contents of site/** or use this repository with no build command and output directory `site`.

## Verify

Node 24; no npm dependencies:

```sh
mkdir -p audit
node pipeline/verify_site.cjs
node pipeline/verify_app.cjs
node pipeline/verify_replay_app.cjs
node pipeline/verify_workbench.cjs
node pipeline/verify_release05.cjs
```

The full raw-data and trajectory reconciliation, reviewed TrackMan exports, source repair ledger and reproducible data-cleaning pipeline are retained in the local `Fall26/Fall26_Studio` project. This repository tests the publication snapshot; it does not automatically classify new raw data.

## Future sessions

Review and rebuild new data in the local Fall26 project, including pitch types, identity/scoring repairs, game/team boundaries and coverage. Preserve source files and accepted historical decisions. Reconcile changed scope assertions, regenerate the poster, and test the site. Then copy the complete updated `site/` and applicable verification scripts here and commit to `main`. The workflow checks and deploys the reviewed snapshot.

## Reading the data

Team focus applies to the selected team's pitchers in pitching/fielding, and hitters in hitting/replay. Game review labels both teams explicitly. The lab can inspect either side or all pitches. Every rate shows its sample or definition.

Evidence grades describe shape support, not confirmed grip/intent. Five incomplete sequences contribute pitches but no invented batting result. Pitcher changes retain a single PA; terminal-pitch accounting avoids double-counting outcomes. No positions were supplied for the LW games. Replays stop inside the supplied fit's tracking/hang-time limits, and catches are inferred only from air-ball result tags. Fielder routes, catch locations, fielding chances and predictive ability grades are not fabricated.

Use **Data review** and **How to read this** for the full definitions and repair trail. The poster and reviewed decision/PA CSVs are downloadable in the app.
