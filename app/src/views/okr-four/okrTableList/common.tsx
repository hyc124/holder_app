//组装数据添加快捷入口对象
export const addFastKr = ({ list, parentRow }: any) => {
  const newList = [...list]
  let insertNum = 0
  let iskrnode = false
  //添加KR快捷入口需要插入到KR最后一个
  if (newList?.length > 0) {
    for (let i = 0; i < newList.length; i++) {
      if (newList[i].type == 1) {
        insertNum = i
        iskrnode = true
        break
      }
    }
    if (!iskrnode) {
      insertNum = newList.length
    }
  } else {
    insertNum = 0
  }

  newList.splice(insertNum, 0, { type: 31, hasAuth: parentRow?.hasAuth, parentRow })
  return newList
}
