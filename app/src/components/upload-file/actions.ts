// 查询图片地址
export const getPictureUrl = (params: any) => {
  return new Promise(resolve => {
    $mainApi
      .request('tools/oss/get/url', params, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
        formData: true,
      })
      .then((res: any) => {
        if (res.returnCode === 0) {
          resolve(res.data)
        }
      })
  })
}

export const getPreviewUrl = (params: any) => {
  return new Promise(resolve => {
    $mainApi
      .request('tools/oss/get/preview/url', params, {
        headers: {
          loginToken: $store.getState().loginToken,
        },
        formData: true,
      })
      .then((res: any) => {
        if (res.returnCode === 0) {
          resolve(res.data)
        }
      })
  })
}
