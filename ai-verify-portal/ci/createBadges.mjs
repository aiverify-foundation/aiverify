// Create badge icons for unit tests, coverage, lint, dependencies and licenses check
// Usage: node ci/createBadges.mjs <badgeToCreate>
// where <badgeToCreate> may be test, coverage, lint, dependency or license
// note that createBadges.mjs must be run from the root dir of the project.
import fs from 'fs';
import { makeBadge } from 'badge-maker';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

if (process.argv.length < 3) {
  console.log('badgeToCreate arg not provided');
  process.exit(-1);
}

const badgeToCreate = process.argv[2];
let color = 'red';

// Create coverage badge
if (badgeToCreate == 'coverage') {
  const covPct = codeCoverage();
  color = 'brightgreen';
  if (covPct < 20) color = 'red';
  else if (covPct < 70) color = '#ffa500'; // orange_2
  const covBadge = {
    label: 'coverage',
    message: covPct.toFixed(0) + '%',
    color: color,
  };
  const covSvg = makeBadge(covBadge);
  fs.writeFileSync('cov-badge.svg', covSvg);
}

// Create test results badge
if (badgeToCreate == 'test') {
  const { numPassedTests, numFailedTests } = testResults();
  color = numPassedTests != 0 && numFailedTests == 0 ? 'brightgreen' : 'red';
  const testBadge = {
    label: 'tests',
    message: numPassedTests + ' passed, ' + numFailedTests + ' failed',
    color: color,
  };
  const testSvg = makeBadge(testBadge);
  fs.writeFileSync('test-badge.svg', testSvg);
}

// Create lint results badge
if (badgeToCreate == 'lint') {
  const numProblems = checkLintErrors();
  if (numProblems.errors == 0 && numProblems.warnings == 0)
    color = 'brightgreen';
  else if (numProblems.errors > 0) color = 'red';
  else color = '#ffa500'; // orange_2
  const lintBadge = {
    label: 'lint',
    message:
      numProblems.errors + ' errors, ' + numProblems.warnings + ' warnings',
    color: color,
  };
  const lintSvg = makeBadge(lintBadge);
  fs.writeFileSync('lint-badge.svg', lintSvg);
}

// Create dependency check badge
if (badgeToCreate == 'dependency') {
  const numVulnerabilities = checkDependencies();
  color = 'red';
  let msg = 'error';
  if (numVulnerabilities) {
    if (numVulnerabilities == 0) color = 'brightgreen';
    else color = 'red';
    msg = numVulnerabilities + ' vulnerabilities';
  }
  const depBadge = {
    label: 'dependencies',
    message: msg,
    color: color,
  };
  const depSvg = makeBadge(depBadge);
  fs.writeFileSync('dep-badge.svg', depSvg);
}

// Create license check badge
if (badgeToCreate == 'license') {
  const numCopyleftLic = checkCopyleftLicenses().length;
  color = numCopyleftLic == 0 ? 'brightgreen' : 'red';
  const licBadge = {
    label: 'licenses',
    message: numCopyleftLic + ' copyleft',
    color: color,
  };
  const licSvg = makeBadge(licBadge);
  fs.writeFileSync('lic-badge.svg', licSvg);
}

// Create badge for shields.io
// const covBadge = {
//     schemaVersion: 1,
//     label: 'coverage',
//     message: covPct.toFixed(0) + '%',
//     color: color
// }
// console.log("covBadge:", JSON.stringify(covBadge))
// fs.writeFileSync(process.argv[2], JSON.stringify(covBadge))

// fs.writeFile(covBadgeFile, covSvg, err => {
//     if (err) {
//         console.log(`Error writing ${covBadgeFile}: ${err.message}`)
//         process.exit(1)
//     }
//     fs.writeFile(testBadgeFile, testSvg, err => {
//         if (err) {
//             console.log(`Error writing ${testBadgeFile}: ${err.message}`)
//             process.exit(1)
//         }
//         console.log(`Created ${covBadgeFile} and ${testBadgeFile}`)
//     })
// })

// return number of passed and failed tests.
function testResults() {
  // path reference in require() is relative to this js, not cwd
  const testSummary = require('../test-results.json');
  return {
    numPassedTests: testSummary.numPassedTests,
    numFailedTests: testSummary.numFailedTests,
  };
}

// return code coverage percent.
function codeCoverage() {
  // path reference in require() is relative to this js, not cwd
  const covSummary = require('../coverage/coverage-summary.json');

  return covSummary.total.statements.pct;
}

// return number of linter errors and warnings
function checkLintErrors() {
  // path reference in require() is relative to this js, not cwd
  const lintResults = require('../eslint-report.json');
  let numErrors = 0;
  let numWarnings = 0;
  lintResults.forEach((row) => {
    numErrors += row.errorCount;
    numErrors += row.fatalErrorCount;
    numWarnings += row.warningCount;
  });
  return { errors: numErrors, warnings: numWarnings };
}

// return number of vulnerabilities found by dependency checker.
function checkDependencies() {
  const text = fs.readFileSync('./npm-audit-report.md', {
    encoding: 'utf8',
    flag: 'r',
  });
  const pattern = /Found \*\*(\d+)\*\* vulnerabilities within/;
  const matches = text.match(pattern);
  if (matches) {
    const num = matches[1]; // Extract the captured group
    //console.log("Dep-check: vulnerabilities found:", num)
    return num;
  } else {
    //console.log("Dep-check error: pattern not found.")
    return null;
  }
}

// return string array of copyleft licenses found
function checkCopyleftLicenses() {
  const copyleftLic = [
    'GPL',
    'LGPL',
    'MPL',
    'AGPL',
    'EUPL',
    'CCDL',
    'EPL',
    'CC-BY-SA',
    'OSL',
    'CPL',
  ];
  const text = fs.readFileSync('./license-report.txt', {
    encoding: 'utf8',
    flag: 'r',
  });
  const foundLic = [];
  copyleftLic.forEach((lic) => {
    const licRegex = new RegExp(lic, 'i');
    if (licRegex.test(text)) {
      foundLic.push(lic);
    }
  });
  return foundLic;
}
