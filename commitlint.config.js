module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // new feature
        'fix',      // bug fix
        'chore',    // tooling, deps, config — no production code change
        'docs',     // documentation only
        'style',    // formatting, missing semicolons — no logic change
        'refactor', // code restructure without feature or fix
        'perf',     // performance improvement
        'test',     // adding or updating tests
        'build',    // build system or external dependency changes
        'ci',       // CI/CD config changes
        'revert',   // revert a prior commit
      ],
    ],

    // Subject must be clear and descriptive
    'subject-case': [2, 'always', 'lower-case'],
    'subject-min-length': [2, 'always', 10],   // forces meaningful description
    'subject-max-length': [2, 'always', 100],
    'subject-empty': [2, 'never'],             // subject is mandatory

    // Scope
    'scope-case': [2, 'always', 'lower-case'],

    // Body
    'body-leading-blank': [2, 'always'],       // blank line before body
    'body-max-line-length': [1, 'always', 120],

    // Footer
    'footer-leading-blank': [2, 'always'],
  },
  helpUrl: 'https://github.com/badersalis/gidana-mobile/blob/main/CONTRIBUTING.md',
};
