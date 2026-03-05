const esbuild = require('esbuild')
const { config } = require(`./config.${process.argv[2]}`)

// esbuild 0.17+ requires using context() API for watch mode
if (config.watch) {
  const { watch, ...buildConfig } = config
  esbuild.context(buildConfig).then(ctx => {
    ctx.watch()
    console.log('Watching for changes...')
  }).catch(() => process.exit(1))
} else {
  esbuild.build(config).catch(() => process.exit(1))
}
