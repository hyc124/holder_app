import { clipboard } from 'electron'
/**
 * Created by syx on 2020/01/10.
 */

const CaptureImg = () => {
  return new Promise(resolve => {
    const { execFile } = require('child_process')
    const childprocess = require('child_process')
    if (process.platform === 'darwin') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      childprocess.exec(`screencapture -i -c`, (error: any, _stdout: any) => {
        console.log('308', error)
        if (!error) {
          //截图完成，在粘贴板中
          const pngs = clipboard.readImage().toDataURL()
          resolve(pngs)
        }
      })
    } else {
      const screenWindow = execFile($tools.asAssetsPath('/resources/screenshotcut/screen/capture.exe'))
      screenWindow.on('exit', function(code: any) {
        console.log(code)
        if (code) {
          const pngs = clipboard.readImage().toDataURL()
          resolve(pngs)
        }
      })
    }
  })
}

export default CaptureImg
