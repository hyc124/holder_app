import React, { useState, useEffect } from 'react'
// import { searchPlanList as searchPlanListApi } from './workPlanApi'
import { orgSearchList } from '../../common/js/api-com'
/**
 * 任务搜索列表
 */
const PlanSearchList = (props: any) => {
  const getParam = props.param || {}
  const [searchList, setSearchList] = useState<any>([])
  useEffect(() => {
    if (props.searchVal !== '') {
      searchPlanList()
    }
  }, [props.searchVal])
  const searchPlanList = () => {
    const param = {
      keywords: props.searchVal,
      orgIds: getParam.allCompanyIds,
    }
    orgSearchList(param).then((res: any) => {
      if (res) {
        setSearchList(res.data.dataList || [])
      }
    })
  }
  return (
    <ul>
      {searchList &&
        searchList.map((item: any, i: number) => {
          let cmyName = ''
          let deptList
          let roleName
          let roleId
          let departName
          let departId
          let cmyId = ''
          if (item.deptchain) {
            cmyId = item.deptchain.split('@')[1]
            deptList = item.deptchain.split('@')[2].split('###')
            if (deptList.length > 3) {
              departId = deptList[0]
              departName = deptList[1]
              roleId = deptList[2]
              roleName = deptList[3]
            } else {
              departId = deptList[0]
              departName = deptList[1]
            }
          }
          // 查询企业名称
          for (const i in getParam.allCompany) {
            const item = getParam.allCompany[i]
            if (item.id == cmyId) {
              cmyName = item.name || ''
              break
            }
          }
          const showTxt = `${cmyName ? cmyName + '-' : ''}${departName ? departName + '-' : ''}${
            roleName ? roleName + '-' : ''
          }${item.username}`
          const thisNodeId = `account_${item.id}_0_${item.username}@parentId_${departId}_3_${departName}@company_${cmyId}_2_${cmyName}@role_${roleId}_31_${roleName}`

          return (
            <li
              key={i}
              onClick={() => {
                props.searchSelect({ treeId: thisNodeId })
              }}
            >
              {showTxt}
            </li>
          )
        })}
    </ul>
  )
}

export { PlanSearchList }
