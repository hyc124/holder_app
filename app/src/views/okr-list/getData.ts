export const inquireAlignApi = (param: any, url: any) => {
  const { loginToken } = $store.getState()
  return new Promise(resolve => {
    $api
      .request(url, param, {
        headers: { loginToken: loginToken },
        formData: true,
      })
      .then(resData => {
        const showData = resData
        resolve(showData)
      })
      .catch(function(res) {
        resolve(res)
      })
  })
}
