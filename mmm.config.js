module.exports = {
  test: {
    coverageIgnores: ['src/**'],
  },
  components: [
    {
      type: 'ts-web-app',
      name: 'example',
      entryPath: 'src/example',
      outputPath: 'dist/example',
      htmlTemplatePath: 'src/example/index.html',
    },
    {
      type: 'ts-lib',
      name: 'lib',
      entryPath: 'src/index.ts',
      outputPath: 'lib',
    },
  ],
}
