/*!
Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com

Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/

/*
 * Generate a random uuid.
 *
 * USAGE: Math.uuid(length, radix)
 *   length - the desired number of characters
 *   radix  - the number of allowable values for each character.
 *
 * EXAMPLES:
 *   // No arguments  - returns RFC4122, version 4 ID
 *   >>> Math.uuid()
 *   "92329D39-6F5C-4520-ABFC-AAB64544E172"
 *
 *   // One argument - returns ID of the specified length
 *   >>> Math.uuid(15)     // 15 character ID (default base=62)
 *   "VcydxgltxrVZSTV"
 *
 *   // Two arguments - returns ID of the specified length, and radix. (Radix must be <= 62)
 *   >>> Math.uuid(8, 2)  // 8 character ID (base=2)
 *   "01001010"
 *   >>> Math.uuid(8, 10) // 8 character ID (base=10)
 *   "47473046"
 *   >>> Math.uuid(8, 16) // 8 character ID (base=16)
 *   "098F4D35"
 */
// Private array of chars to use
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')

export const uuid = (len?: number, radic?: any) => {
  const chars = CHARS,
    uuid: any[] = [],
    radix = radic || chars.length
  let i

  if (len) {
    // Compact form
    for (i = 0; i < len; i++) {
      uuid[i] = chars[0 | (Math.random() * radix)]
    }
  } else {
    // rfc4122, version 4 form
    let r

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-'
    uuid[14] = '4'

    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | (Math.random() * 16)
        uuid[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r]
      }
    }
  }

  return uuid.join('')
}

// A more performant, but slightly bulkier, RFC4122v4 solution.  We boost performance
// by minimizing calls to random()
export const uuidFast = () => {
  const chars = CHARS,
    uuid = new Array(36)
  let rnd = 0
  let r
  for (let i = 0; i < 36; i++) {
    if (i == 8 || i == 13 || i == 18 || i == 23) {
      uuid[i] = '-'
    } else if (i == 14) {
      uuid[i] = '4'
    } else {
      if (rnd <= 0x02) rnd = (0x2000000 + Math.random() * 0x1000000) | 0
      r = rnd & 0xf
      rnd = rnd >> 4
      uuid[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r]
    }
  }
  return uuid.join('')
}

// A more compact, but less performant, RFC4122v4 solution:
export const uuidCompact = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// export const getFileSize = (size: number) => {
//   let fileSize: any = (size / 1024).toFixed(2)
//   if (fileSize > 1024) {
//     fileSize = fileSize / 1024
//     return fileSize.toFixed(2) + 'M'
//   } else {
//     return fileSize + 'K'
//   }
// }
// 图片格式集合
export const imgesGatter = ['bmp', 'jpg', 'png', 'gif', 'jpeg']

export const getFileSize = (fileSize: any) => {
  //处理文件大小
  let mSize: any = (fileSize / (1024 * 1024)) * 100
  mSize = mSize.toFixed(0) / 100
  if (mSize == 0) {
    const result: any = ((fileSize / 1024) * 100).toFixed(0)
    mSize = result / 100 + 'KB'
  } else {
    mSize = mSize + 'M'
  }
  return mSize
}

//支持的格式
export const getFileIcon = (fileSuffix: string, type?: string) => {
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

//处理上传时间
export const formatDateTime = (dateValue: any) => {
  const date = new Date(parseInt(dateValue))
  const y = date.getFullYear()
  let m: number | string = date.getMonth() + 1
  m = m < 10 ? '0' + m : m
  let d: number | string = date.getDate()
  d = d < 10 ? '0' + d : d
  const h = date.getHours()
  let minute: number | string = date.getMinutes()
  minute = minute < 10 ? '0' + minute : minute
  return y + '/' + m + '/' + d + ' ' + h + ':' + minute
}

export const getBase64 = (file: any) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}
