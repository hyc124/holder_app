import webpack, { Configuration } from 'webpack'

import devConfig from '../dev.config'
const BUILD_ENV: any = process.env.BUILD_ENV === 'dev' ? 'dev' : 'prod'
const { env: envConfig } = devConfig
const envType = BUILD_ENV === 'dev' ? devConfig.env['dev'] : devConfig.env['prod']
// console.log('build envType:', envType)
interface BuildConfig {
  env: keyof typeof devConfig.env
  webpackConfig: Configuration
  type: 'main' | 'renderer'
}

function build({ env, webpackConfig }: BuildConfig): Promise<typeof envType> {
  return new Promise((resolve, reject) => {
    webpack(webpackConfig, (err, stats) => {
      if (err) {
        throw err
      }

      process.stdout.write(
        stats.toString({
          colors: true,
          hash: true,
          version: true,
          timings: true,
          assets: true,
          chunks: false,
          children: false,
          modules: false,
        }) + '\n\n'
      )

      if (stats.hasErrors()) {
        reject(stats)
      } else {
        resolve(envConfig[env])
      }
    })
  })
}

export default build
