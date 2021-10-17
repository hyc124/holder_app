/**
 * 统一获取文件图标方法
 * type 为空时 是普通图标  '_s'小图标  '_w'白色图标
 */
export const getFileIcon = (fileName: string, type?: string) => {
  const fileSuffix = fileName?.toLowerCase()
    .split('.')
    .splice(-1)[0]
  const fixType = type ? type : ''
  //统一图标前缀路径
  const fileImgPrefix = $tools.asAssetsPath('/images/fileIcon/')
  //支持的格式
  const fileImgSupportArr = [
    'ppt',
    'docx',
    'xlsx',
    'pdf',
    'mp4',
    'mp3',
    'zip',
    'rar',
    'doc',
    'pptx',
    'xls',
    'jpg',
    'gif',
    'png',
    'txt',
  ]
  if (fileImgSupportArr.includes(fileSuffix)) {
    if (fileSuffix == 'ppt' || fileSuffix == 'pptx') {
      return fileImgPrefix + 'ppt' + fixType + '.png'
    } else if (fileSuffix == 'docx' || fileSuffix == 'doc') {
      return fileImgPrefix + 'docx' + fixType + '.png'
    } else if (fileSuffix == 'xlsx' || fileSuffix == 'xls') {
      return fileImgPrefix + 'xlsx' + fixType + '.png'
    } else if (fileSuffix == 'zip' || fileSuffix == 'rar') {
      return fileImgPrefix + 'zip' + fixType + '.png'
    } else if (fileSuffix == 'jpg' || fileSuffix == 'gif' || fileSuffix == 'png') {
      return fileImgPrefix + 'png' + fixType + '.png'
    } else {
      return fileImgPrefix + fileSuffix + fixType + '.png'
    }
  } else {
    return fileImgPrefix + 'normal' + fixType + '.png'
  }
}
/**
 * 判断文件大小，显示为k/m
 * @param {*} size
 */
export const getFileSize = (size: any) => {
  let fileSize: any = (size / 1024).toFixed(2)
  if (fileSize > 1024) {
    fileSize = fileSize / 1024
    return fileSize.toFixed(2) + 'M'
  } else {
    return fileSize + 'K'
  }
}
