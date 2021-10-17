// export class DetailData {
//   affiliation: any
//   constructor() {
//     this.affiliation = null
//   }
// }
/**
 * 详情数据仓库
 */
export let detailStore: any = {}
export const setDetailStore = ({ all, key, val }: { key?: string; val?: any; all?: boolean }) => {
  if (all) {
    detailStore = val
  } else if (key) {
    detailStore[key] = val
  }
}
