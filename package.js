Package.describe({
  name: 'jav:utt',
  version: '1.0.0',
  summary: 'OAuth handler for UTT',
  git: 'https://github.com/Javdu10/tunguska-imgur.git',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use('ecmascript');
  api.use('accounts-ui', ['client', 'server']);
  api.use('oauth2', ['client', 'server']);
  api.use('oauth', ['client', 'server']);
  api.use('http', ['server']);
  api.use(['underscore', 'service-configuration'], ['client', 'server']);
  api.use(['random', 'templating'], 'client');

  api.export('Utt');

  api.addFiles(
    ['utt_configure.html', 'utt_configure.js'],
    'client');

  api.addFiles('utt_server.js', 'server');
  api.addFiles('utt_client.js', 'client');
});
