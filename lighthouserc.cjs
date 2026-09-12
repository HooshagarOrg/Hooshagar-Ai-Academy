/** @type {import('@lhci/cli').Config} */
module.exports = {
  ci: {
    collect: {
      url: [
        'http://127.0.0.1:3000/',
        'http://127.0.0.1:3000/login',
      ],
      numberOfRuns: 1,
      startServerCommand: '',
      settings: {
        preset: 'desktop',
        formFactor: 'desktop',
        screenEmulation: { disabled: true },
        throttlingMethod: 'devtools',
        maxWaitForLoad: 45000,
        pauseAfterLoadMs: 1000,
        networkQuietThresholdMs: 500,
        cpuQuietThresholdMs: 0,
        skipAudits: ['uses-http2'],
        chromeFlags: '--no-sandbox --disable-dev-shm-usage --ignore-certificate-errors',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
}
