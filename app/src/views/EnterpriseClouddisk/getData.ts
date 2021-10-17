import { requestApi } from '@/src/common/js/ajax'
import { getFileToken } from '@/src/components/newFileUpload/actions'
import { message } from 'antd'
import { remote } from 'electron'
import { resolve } from 'path'

const fileServiceUrl = process.env.API_FILE_HOST

/****
 * get请求
 *
 * *** */
const httpGet = (url: any, data: any, successCallback: any, errorCallback: any) => {
  const { nowUserId } = $store.getState()
  const userId = data.userId == null ? nowUserId : data.userId
  return getFileToken({ companyId: `${data.companyId}`, userId: `${userId}` }).then((token: any) =>
    $.ajax({
      type: 'get',
      url: url,
      data: data,
      timeout: 3000,
      crossDomain: true,
      async: false,
      beforeSend: function(XMLHttpRequest) {
        XMLHttpRequest.setRequestHeader('Token', token.data.token)
      },
      success: successCallback,
      error: errorCallback,
    })
  )
}

/****
 * post 请求
 *
 * *** */
const httpPost = (url: any, data: any, successCallback: any, errorCallback: any) => {
  const { nowUserId } = $store.getState()
  const userId = data.userId == null ? nowUserId : data.userId
  return getFileToken({ companyId: `${data.companyId}`, userId: `${userId}` }).then((token: any) =>
    $.ajax({
      type: 'post',
      url: url,
      data: JSON.stringify(data),
      timeout: 3000,
      crossDomain: true,
      async: false,
      contentType: 'application/json',
      dataType: 'json',
      beforeSend: function(XMLHttpRequest) {
        XMLHttpRequest.setRequestHeader('Token', token.data.token)
      },
      success: successCallback,
      error: errorCallback,
    })
  )
}

/**
 *  查询所有企业
 * @param options
 *   username： 用户账号
 *   nowUserId ：用户id
 * @returns
 */
export const findAllCompany = (options: any) => {
  const param = {
    username: options.nowAccount,
    userId: options.nowUserId,
    type: -1,
  }
  return new Promise(resolve => {
    requestApi({
      url: '/team/enterpriseInfo/findByTypeAndUser',
      param: param,
      json: true,
    }).then(res => {
      if (res.success) {
        const list = res.data.dataList || []
        let allowTeams: any[] = []
        // 限制显示的企业
        let allowTeamId: any =
          options.allowTeamId && options.allowTeamId.length > 0 ? options.allowTeamId : undefined
        if (!allowTeamId && options.teamId) {
          allowTeamId = [options.teamId]
        }
        if (allowTeamId) {
          list.map((item: any) => {
            allowTeamId.map((teamId: any) => {
              if (item.id == teamId) {
                allowTeams.push(item)
              }
            })
          })
        }
        // 展示所有企业
        else {
          allowTeams = list
        }
        resolve(allowTeams)
      } else {
        resolve([])
      }
    })
  })
}

/***
 * 分页查询
 */
export const getPageList = (param: any) => {
  return new Promise(resolve => {
    httpPost('', param, null, null).then(res => {
      resolve(res)
    })
  })
}

const successCallback = (res: any) => {
  return res.data
}

const errorCallback = (err: any) => {
  if (err.code != 1) {
    //弹出错误消息
    message.error(err.msg)
  }
}

/***
 * 获取文件占用空间大小
 */
export const getSpaceSize = (params: any) => {
  return httpPost(
    `${fileServiceUrl}/api/EnterpriseCloudDisk/GetCloudDiskSpaceSizeByCompanyId`,
    params,
    successCallback,
    errorCallback
  )
}

/***
 * 收藏
 */
export const AddCollect = (params: any) => {
  return httpPost(
    `${fileServiceUrl}/api/EnterpriseCloudDisk/AddCollect`,
    params,
    successCallback,
    errorCallback
  )
}

/***
 * 取消收藏
 */
export const CancelCollect = (params: any) => {
  return httpGet(
    `${fileServiceUrl}/api/EnterpriseCloudDisk/CancelCollect`,
    params,
    successCallback,
    errorCallback
  )
}

/***
 * 收藏列表
 */
export const getCollectList = (params: any) => {
  return httpPost(
    `${fileServiceUrl}/api/EnterpriseCloudDisk/GetCollectList`,
    params,
    successCallback,
    errorCallback
  )
}

/***
 * 浏览列表
 */
export const getBrowseList = (params: any) => {
  return httpPost(
    `${fileServiceUrl}/api/EnterpriseCloudDisk/GetBrowseList`,
    params,
    successCallback,
    errorCallback
  )
}

/**
 * 批量下载文件
 * @param params
 * @returns
 */
export const downloadZipFiles = (params: any) => {
  return httpPost(
    `${fileServiceUrl}/api/EnterpriseCloudDisk/DownloadZipFiles`,
    params,
    successCallback,
    errorCallback
  )
}

/**
 * 获取工作文档
 * @param params
 * @returns
 */
export const getWorkFileList = (params: any) => {
  return httpPost(
    `${fileServiceUrl}/api/EnterpriseCloudDisk/GetWorkFileList`,
    params,
    successCallback,
    errorCallback
  )
}

/***
 * 浏览
 */
export const AddBrowse = (params: any) => {
  return httpPost(`${fileServiceUrl}/api/EnterpriseCloudDisk/AddBrowse`, params, successCallback, errorCallback)
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

export const imgesGatter = ['bmp', 'jpg', 'png', 'gif', 'jpeg']

//文件为图片-获取文件地址
export const fileIcon = (item: any, viewModel?: any) => {
  let type = '_S' //小图标
  if (viewModel == 2) {
    type = '_L' //大图标
  }
  const fileName = item.hasOwnProperty('fileName') && item.fileName ? item.fileName : ''
  const fileSuffix = fileName
    .toLowerCase()
    .split('.')
    .splice(-1)[0]
  //文件为图片-获取文件地址
  const imgIcon = imgesGatter.includes(fileSuffix) ? item.officeUrl : getFileIcon(fileSuffix, type)
  return {
    imgIcon: imgIcon,
    suffix: fileSuffix,
  }
}

//支持的格式
export const getFileIcon = (fileSuffix: string, type?: string) => {
  const fixType = type ? type : ''
  //统一图标前缀路径
  const fileImgPrefix = $tools.asAssetsPath('/images/etpCloudDisk/')
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
    'rar',
  ]
  if (fileImgSupportArr.includes(fileSuffix)) {
    if (fileSuffix == 'ppt' || fileSuffix == 'pptx') {
      return fileImgPrefix + 'ppt' + fixType + '.png'
    } else if (fileSuffix == 'docx' || fileSuffix == 'doc') {
      return fileImgPrefix + 'doc' + fixType + '.png'
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
