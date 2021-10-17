const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const semver = require('semver')
const EventEmitter = require('events')
const exec = require('child_process').exec
// const spawn = require('child_process').spawn
function tinyUpdater({
  currentVersion,
  configType = 'json',
  configUrl,
  configFilename,
  filePath,
  autoRun = false,
  configResBack,
}) {
  const emitter = new EventEmitter()
  // 不存在则创建文件夹
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath)
  }
  doUpdate()
  return emitter

  async function doUpdate() {
    const isMac = process.platform === 'darwin'
    // eslint-disable-next-line no-param-reassign
    configFilename = configFilename || 'config.json'
    // 1 下载配置文件
    await download({
      url: configUrl,
      filename: configFilename,
      filePath,
      withProgress: false,
    })
    // 2 根据从服务器下载的配置文件中的信息再下载安装包
    try {
      let fileInfo
      const isYml = configType === 'yml'
      if (isYml) {
        fileInfo = yaml.safeLoad(fs.readFileSync(path.join(filePath, configFilename), 'utf8'))
      } else {
        fileInfo = JSON.parse(fs.readFileSync(path.join(filePath, configFilename), 'utf8'))
      }

      if (semver.gt(fileInfo.version, currentVersion)) {
        // eslint-disable-next-line no-param-reassign
        let appFileName = isYml ? fileInfo.files[0].path : fileInfo.fileName
        if (!appFileName) {
          appFileName = 'holder.exe'
        }
        configResBack && configResBack({ ...fileInfo, appFileName })
        // 下载安装包
        const packInfo = await download({
          url: isYml ? fileInfo.files[0].url : fileInfo.url,
          filename: appFileName,
          filePath,
        })
        if (autoRun) {
          if (isMac) {
            exec(`open ${path.join(filePath, appFileName)}`)
          } else {
            exec(path.join(filePath, appFileName))
          }
        }
        emitter.emit('update-downloaded', { total: packInfo.totalLen, appFileName })
      } else {
        emitter.emit('error', new Error('latest version is not newer than current version'))
      }
    } catch (e) {
      emitter.emit('error', e)
    }
  }
  function download({ url, filename, filePath: downPath, withProgress = true }) {
    // 上次进度
    let preProgress = 0
    // 总大小
    let totalLen = 0
    return new Promise((resolve, reject) => {
      const agent = url.startsWith('https') ? https : http
      const file = path.join(downPath, filename)
      const fileStream = fs.createWriteStream(file)
      const req = agent.request(url, res => {
        let downLength = 0
        totalLen = parseInt(res.headers['content-length'], 10)
        res
          .on('data', data => {
            downLength += data.length
            const thisProgress = downLength / 1024 / 1024
            fileStream.write(data)
            if (withProgress) {
              if (thisProgress - preProgress > 10) {
                console.log(thisProgress, preProgress)
                preProgress = thisProgress
                emitter.emit('download-progress', totalLen, downLength)
              }
            }
          })
          .on('end', () => {
            fileStream.end()
          })

        fileStream.on('close', () => {
          resolve({ totalLen })
        })

        fileStream.on('error', e => {
          emitter.emit('error', e)
          fileStream.destroy()
          fs.remove(file)
          reject()
        })
      })
      req.on('error', () => {
        emitter.emit('error', e)
        fileStream.destroy()
        fs.remove(file)
        reject()
      })
      req.end()
    })
  }
}
module.exports = {
  tinyUpdater,
}
