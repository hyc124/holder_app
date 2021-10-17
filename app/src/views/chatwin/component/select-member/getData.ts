import { requestApi } from '../../../../common/js/ajax'

// 查询所有企业
export const findCompany = (options: any) => {
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
        // setCompanyList(allowTeams)
        resolve(allowTeams)
      } else {
        resolve([])
      }
    })
  })
}
