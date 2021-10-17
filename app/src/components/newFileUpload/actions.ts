import Axios from 'axios'
import qs from 'qs'

const fileServiceUrl = process.env.API_FILE_HOST;
// /Authentication/GetToken 获取接口token
export const getFileToken = (params: any) => {
  let data = qs.stringify(params)
  return new Promise(resolve => {
    Axios({
      method: 'post',
      url: `${fileServiceUrl}/Authentication/GetToken`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: data,
    }).then((res: any) => {
      if (res.data.code == 1) {
        resolve(res.data)
      }
    })
  })
}
// /api/File/GetListByFileID
export const getfileList = (params: any) => {
  let data = {
    companyId: params.selectTeamId,
    userId: params.nowUserId,
  }
  return new Promise(resolve => {
    Axios({
      method: 'get',
      url: `${fileServiceUrl}/api/File/GetListByFileID?companyId=${params.companyId}&userId=${params.userId}&fileId=${params.fileId}`,
      headers: {
        token: params.token,
      },
    }).then((res: any) => {
      resolve(res.data)
    })
    // Axios({
    //   method: 'GET',
    //   url: `http://192.168.100.105:5000/api/File/GetListByFileID`,
    //   headers: {
    //     loginToken: params.token,
    //   },
    //   params: {
    //     companyId: params.selectTeamId,
    //     userId: params.nowUserId,
    //   },
    // }).then((res: any) => {
    //   if (res.data.code == 1) {

    //   }
    // })
  })
}
