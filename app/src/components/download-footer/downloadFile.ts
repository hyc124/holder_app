import fs from 'fs'
import request from 'request'
import path from 'path'
import * as Maths from '@/src/common/js/math'
import { downloadFileListsFn, adddownloadFilesFn } from './download-footer'
import { remote } from 'electron'
import { getChatToken } from '@/src/views/chatwin/getData/getData'
const { BrowserWindow, app } = remote
const API_HOST = process.env.API_HOST
const API_PROTOCOL = process.env.API_PROTOCOL
const FILEHOST = process.env.API_FILE_HOST
//存储附件的文件夹
// let myDir = 'C:\\oaDownLoad\\'
const myDir = app.getPath('downloads')
//存储下载历史的文件见
// const historyDir = 'c:\\oa'
const historyDir = app.getPath('appData')
//Mac系统修改下载地址
// if (process.platform === 'darwin') {
//   myDir = '/Applications/holder.app/Contents/Downloads/'
//   // historyDir = '/Applications/holder.app/Contents/Downloads/'
// }
//保存历史下载记录的地址
const _Savepath = path.join(historyDir, './', 'downLoadHistory.bar')
//重复后设置新名称
// let newCreateFileName = ''

// const isDirSync = (aPath: fs.PathLike) => {
//   try {
//     return fs.statSync(aPath).isDirectory()
//   } catch (e) {
//     if (e.code === 'ENOENT') {
//       return false
//     } else {
//       throw e
//     }
//   }
// }
interface StandingbookProps {
  type: string
  url: any
  params?: any
}
interface DownloadPorps {
  url?: string
  fileName: string
  fileKey: string
  fileSize: any
  dir: string
  fromType?: string
  companyId?: any
  customOption?: StandingbookProps
  isOffice?: boolean
}

//下载附件
export const downloadFile = async ({
  url,
  fileName,
  fileKey,
  fileSize,
  dir,
  fromType,
  companyId,
  customOption, //台账标记
  isOffice, //公告office下载
}: DownloadPorps) => {
  const dialog = remote.dialog
  const focusWin: any = BrowserWindow.getFocusedWindow()
  const resData = dialog.showSaveDialogSync(focusWin, {
    title: '另存文件',
    defaultPath: myDir + '/' + fileName,
    // 限制能够选择的文件为某些类型
    filters: getFiltersArr(fileName),
  })
  if (resData) {
    //当前下载文件的唯一key
    const fileSymbol = Maths.uuid()
    //文件路径
    const filePath = resData

    //下载地址
    const downloadFile: any = {
      fileName,
      showFileName: fileName,
      fileKey,
      fileSize,
      fileSymbol,
      dir,
      fromType: fromType || 'win',
      percent: 0,
      status: 'downloading',
    }

    const { nowUserId } = $store.getState()
    const $fileUrl = `${FILEHOST}/api/WebEditor/DownloadFile?fileGuid=${fileKey}` //新版附件下载地址
    let newFileUrl = !!customOption ? customOption.url : $fileUrl
    // 如果是导出底表模版，则从阿里云下载
    if (url === 'exportBaseFormReport') {
      newFileUrl = `${API_PROTOCOL}${API_HOST}/tools/oss/downloadFile?fileKey=${fileKey}&fileName=${fileName}&dir=${dir}`
    }
    //公告office下载
    if (isOffice) {
      newFileUrl = `${FILEHOST}/api/File/DownloadPDF?fileGuid=${fileKey}&userId=${nowUserId.toString()}`
      // newFileUrl = `http://192.168.102.170:5000/api/File/DownloadPDF?fileGuid=8ed2501b-d145-4370-85e2-0ef547a5fc48`
    }
    //下载附件操作
    const chatParam = {
      companyId: $store.getState().nowAccount,
      userId: $store.getState().nowUserId,
      otherFile: 1,
    }
    const defaltParam = {
      companyId: companyId || $store.getState().selectTeamId,
      userId: $store.getState().nowUserId,
    }

    const $$TokenParams = fromType === 'chatwin' ? chatParam : defaltParam
    const FILETOKEN = await getChatToken($$TokenParams)
    downLoadFileHandler({
      remoteFile: newFileUrl,
      filePath: filePath,
      fileName: fileName,
      onProgress: (nowBytes: number) => {
        const percent = parseFloat(String(((nowBytes / fileSize) * 100).toFixed(2)))
        downloadFileListsFn('percent', fileSymbol, percent, '')
      },
      onBeforeDownload: (newName: string, localPath: string) => {
        downloadFile.showFileName = newName
        downloadFile.localPath = localPath
        adddownloadFilesFn(downloadFile)
      },
      token: FILETOKEN,
      customOption: customOption,
    }).then(() => {
      if (downloadFile.status === 'cancel') return
      downloadFileListsFn('status', fileSymbol, 100, 'done')
      //成功后将历史记录存入本地
      const currentJson = {
        account: $store.getState().nowAccount,
        currentTime: new Date().getTime(),
        currentFileName: downloadFile.showFileName,
        localPath: downloadFile.localPath,
        currentStatus: 2,
      }
      // 检测文件夹是否存在再存入文件
      fs.exists(historyDir, function(exists) {
        if (!exists) {
          fs.mkdir(historyDir, function(err) {
            if (err) console.error(err)
          })
        }
        writeHistory(currentJson)
      })
    })
  }
}

/**
 * 根据文件名获取需要过滤的文件类型
 * @param fileName 文件名全称带后缀
 */
const getFiltersArr = (fileName: string) => {
  // 初始化所有文件类型的过滤
  const filtersArr = [{ name: 'All Files', extensions: ['*'] }]
  const fileNames = fileName.split('.')
  // 当文件名存在后缀时，截取最后一个后缀作为后缀，添加文件类型过滤
  if (fileNames.length > 1) {
    const suffix = fileNames[fileNames.length - 1]
    filtersArr.push({ name: suffix, extensions: [suffix] })
  }
  return filtersArr
}

/**
 * 保存历史下载记录
 * @param historyJson 写入数据
 */
const writeHistory = (historyJson: {
  account: string
  currentTime: number
  currentFileName: any
  currentStatus: number
}) => {
  let newdata: any[] = []
  fs.readFile(_Savepath, 'UTF-8', function(err, res) {
    if (!err && res != '') {
      newdata = JSON.parse(res)
    }
    newdata.push(historyJson)
    writeFile(JSON.stringify(newdata))
  })
}

// 写入文件到本地
const writeFile = (cont: string) => {
  fs.writeFile(_Savepath, cont, function(err) {
    if (!err) {
      // throw err;
    }
  })
}

//替换重复名称
// const setNewFileName = (oldName: string, num: number, ext: string) => {
//   const newFileName = oldName + '(' + num + ').' + ext
//   const nowPath = myDir + newFileName
//   if (fs.existsSync(nowPath)) {
//     //存在的话不可用
//     // setNewFileName(oldName, num + 1, ext)
//   } else {
//     //不存在可用
//     newCreateFileName = newFileName
//   }
// }

//检测是否为中文，true表示是中文，false表示非中文
const isChinese = (str: string) => {
  return !!/.*[\u4e00-\u9fa5]+.*$/.test(str)
}

//执行下载
const downLoadFileHandler = ({
  fileName,
  filePath,
  remoteFile,
  onProgress,
  onBeforeDownload,
  token,
  customOption,
}: any) => {
  return new Promise<any>((resolve, reject) => {
    // 文件存放路径
    // mac与win截取字符需做区分
    const path = filePath.substring(0, filePath.lastIndexOf(process.platform == 'darwin' ? '/' : '\\') + 1)

    // 文件临时名
    const fileNameTem = new Date().getTime()
    // 文件后缀
    const suffix = '.' + fileName.split('.')[fileName.split('.').length - 1]
    // 临时文件地址，下载成功后修改为正式地址，防止下载还未完成就取消下载，sf.unlink方法不会即时删除，如果在下载成功后才将文件删除，就会出现找不到文件的情况
    const localPath: string = path + fileNameTem + suffix
    let receivedBytes = 0

    //判断文件是否存在，如果存在则修改文件名
    // fs.stat(filePath, function(err) {
    // if (!err) {
    //   //文件已存在
    //   const index1 = fileName.lastIndexOf('.')
    //   const oldName = fileName.substring(0, index1) //文件除后缀的名字
    //   const ext = fileName
    //     .toLowerCase()
    //     .split('.')
    //     .splice(-1)[0]
    //   const fileNum = 1
    //   setNewFileName(oldName, fileNum, ext) //获取新名字
    //   localPath = myDir + newCreateFileName
    // } else {
    //   newCreateFileName = fileName
    // }
    // 做底部文件下载信息展示用
    onBeforeDownload(fileName, filePath)
    //请求下载
    const queryPrams: any = {
      method: 'GET',
      uri: isChinese(remoteFile) ? encodeURI(remoteFile) : remoteFile,
      headers: { loginToken: $store.getState().loginToken, token: token },
    }
    if (customOption && customOption.type == 'businessError') {
      queryPrams.qs = customOption.params
    }
    const req = request(queryPrams)
    const out = fs.createWriteStream(localPath)
    req.pipe(out)
    //下载过程中进度
    req.on('data', function(chunk) {
      receivedBytes += chunk.length
      onProgress(receivedBytes)
    })
    //下载完成
    req.on('end', function() {
      // 下载完成后，将临时文件地址修改为正式的
      fs.renameSync(localPath, filePath)

      resolve(true)
    })
    //下载失败
    req.on('error', function(err) {
      console.log(err)
    })
    // })
  })
}
