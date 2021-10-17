export const deskParams: any = {}
export const setDeskParams = ({ code, param }: any) => {
  deskParams[code] = param
}
// 当前所选企业下tab统计数据
export let deskTabsCount: any = []
export const setDeskTabsCount = ({ dataList }: any) => {
  deskTabsCount = dataList
}
