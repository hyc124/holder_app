import { requestApi } from '../../../common/js/ajax'
export const InitTabsTags = [
  {
    title: 'ALL',
    key: 0,
    data: [],
  },
  {
    title: 'A-G',
    key: 1,
    data: [],
  },
  {
    title: 'H-N',
    key: 2,
    data: [],
  },
  {
    title: 'O-T',
    key: 3,
    data: [],
  },
  {
    title: 'U-Z',
    key: 4,
    data: [],
  },
]

//查询一类标签数据
export const GetTagsOneData = (param: any, loginToken: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/tag/getConfig', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        // console.log(resData.dataList)
        resolve(resData.dataList)
      })
  })
}
//查询企业标签数据
export const GetCompanyTagsData = (param: any, loginToken: any) => {
  return new Promise(resolve => {
    $api
      .request('/task/tag/findTag', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        // console.log(resData.dataList)
        resolve(resData.dataList)
      })
  })
}
//更新标签数据
export const UpdateCustomTagsData = (param: any, loginToken: any) => {
  return new Promise((resolve, reject) => {
    $api
      .request('/task/tag/addMore', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}
//更新标签展示顺序数据
export const UpdateTagsSortData = (param: any, loginToken: any) => {
  return new Promise((resolve, reject) => {
    $api
      .request('/task/tag/saveConfig', param, {
        headers: { loginToken: loginToken, 'Content-Type': 'application/json' },
      })
      .then(resData => {
        resolve(resData)
      })
      .catch(err => {
        reject(err)
      })
  })
}
//获取企业权限
export const getCompanyAuths = (param: any) => {
  return new Promise((resolve: any) => {
    requestApi({
      url: '/team/permission/getUserPermission',
      param: param,
    })
      .then(res => {
        if (res.success) {
          resolve(res)
        } else {
          resolve(false)
        }
      })
      .catch(() => {
        resolve(false)
      })
  })
}
export const initCompanyAll = (arr: any) => {
  //遍历公司
  const companyAll: any = []
  arr.map((item: any, index: number) => {
    companyAll.push({
      id: item.id,
      name: item.name,
      key: index,
      tagsCustomData: JSON.parse(JSON.stringify(InitTabsTags)),
    })
  })
  console.log(companyAll)
  // setConpanyTagsCustomData(companyAll)
  return companyAll
}
/**
 * 查询某个接口是否有权限
 */
export const getTagAuthStatus = (api: string, authList: any) => {
  if (authList.includes(api)) {
    return true
  } else {
    return false
  }
}
export const SortPositon = (property: string) => {
  return function(a: { [x: string]: any }, b: { [x: string]: any }) {
    const value1 = a[property]
    const value2 = b[property]
    return value1 - value2
  }
}
export const TagArea = (arr: any) => {
  const AG: any = []
  const HN: any = []
  const OT: any = []
  const UZ: any = []
  const regAG = new RegExp('^[A-G]+$')
  const regHN = new RegExp('^[H-N]+$')
  const regOT = new RegExp('^[O-T]+$')
  const regUZ = new RegExp('^[U-Z]+$')

  arr.forEach((item: any) => {
    if (regAG.test(item.initial)) {
      AG.push(item)
    } else if (regHN.test(item.initial)) {
      HN.push(item)
    } else if (regOT.test(item.initial)) {
      OT.push(item)
    } else if (regUZ.test(item.initial)) {
      UZ.push(item)
    }
  })

  const newAG = AG.sort(SortPositon('initial'))
  const newHN = HN.sort(SortPositon('initial'))
  const newOT = OT.sort(SortPositon('initial'))
  const newUZ = UZ.sort(SortPositon('initial'))
  return [newAG, newHN, newOT, newUZ]
}
