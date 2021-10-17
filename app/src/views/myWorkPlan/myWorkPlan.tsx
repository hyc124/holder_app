import { loadLocales } from '@/src/common/js/intlLocales'
import React, { forwardRef, useEffect, useRef, useState } from 'react'
import MyNewPlanList from './myNewPlanList'
import './myWorkPlan.less'
import NewPlanModel from './newPlanModel'
import { PlanListOrg } from './plan-list-org'
import WorkPlanMapArea from './workPlanMap/workPlanMap'
export const planContext = React.createContext({})

export let setMovePlanModal: any = null
/**
 * 工作规划新版3.26
 */
const MyWorkPlan = () => {
  // const listTableRef: any = null
  const [nowMyPlan, senowMyPlan] = useState({
    orgLoading: true, //组织架构loading图标显示状态
    mainLoading: false, //右侧内容loading图标显示状态
    parentFolderId: 0, //当前选择的父任务id
    name: '', //当前选择的名称
    // 刷新右侧文件内容
    // rightRefresh: 0,
    // 右侧显示内容
    rightShow: 1,
    planId: '',
    mainId: '',
    typeId: '',
    mindParam: { mainId: '', planId: '', toNewAddMind: false }, //脑图参数，toNewAddMind:新增脑图跳转
    optType: '', //左侧操作类型
  })

  // 左侧列表dom
  const planLeftRef = useRef(null)
  // 缓存右侧 文件内容dom
  const myNewPlanListRef = useRef(null)
  // 规划脑图组件
  const planMindRef = useRef<any>(null)
  // 初始化监听
  useEffect(() => {
    // 初始化多语言配置（刷新界面时会重新加载）
    loadLocales()
  }, [])
  /**
   * 右侧显示内容
   */
  const planRightShow = ({ showType, planId, mainId, name, parentFolderId, toNewAddMind, optType }: any) => {
    const param: any = { ...nowMyPlan, rightShow: showType }
    if (String(mainId)) {
      param.mainId = mainId
    }
    if (planId) {
      param.planId = planId
    }
    if (name) {
      param.name = name
    }
    if (parentFolderId) {
      param.parentFolderId = parentFolderId
    }
    if (optType) {
      param.optType = optType
    }
    const mindParam = { planId, mainId, name, toNewAddMind, optType }
    // 规划脑图局部刷新
    if (showType == 2 && optType) {
      planMindRef.current && planMindRef.current.refreshMind(mindParam)
      return
    }
    param.mindParam = mindParam
    senowMyPlan(param)
  }

  return (
    <planContext.Provider
      value={{
        // 当前规划模式
        planLeftRef,
      }}
    >
      <section className="NeworkPlanContainer">
        <aside className="planOrgContainer">
          {/* 规划列表 */}
          <PlanListOrg
            planRightShow={planRightShow}
            ref={planLeftRef}
            myNewPlanListRef={myNewPlanListRef}
          ></PlanListOrg>
        </aside>
        <main className="planRightContainer">
          {/* 规划右侧内容展示 id:当前查询的id,type:当前查询的类型*/}
          {nowMyPlan.rightShow == 1 ? (
            <MyNewPlanList
              ref={myNewPlanListRef}
              planRightShow={planRightShow}
              param={{
                id: nowMyPlan.mainId,
                parentFolderId: nowMyPlan.parentFolderId,
                name: nowMyPlan.name,
                optType: nowMyPlan.optType,
              }}
            />
          ) : (
            ''
          )}
          {/* 规划脑图 */}
          {nowMyPlan.rightShow == 2 ? <WorkPlanMapArea ref={planMindRef} param={nowMyPlan.mindParam} /> : ''}
          <MovePlanModal />
        </main>
      </section>
    </planContext.Provider>
  )
}

/**
 * 移动规划弹框
 */
const MovePlanModal = forwardRef(() => {
  const [state, setState] = useState<any>({
    visible: false,
    moveData: {},
  })
  useEffect(() => {
    // 给外部使用的setState方法
    setMovePlanModal = (paramObj: any) => {
      setState({ ...paramObj })
    }
    return () => {
      setMovePlanModal = null
    }
  }, [])
  return (
    <>
      <NewPlanModel
        text={'移动'}
        visible={state.visible}
        nowselRow={state.moveData}
        refreshLeftTree={state.refreshLeftTree}
        setStateChange={(data: any, typeName: string) => {
          //关闭弹窗和保存移动的弹窗
          setState({ ...state, visible: false })
          if (data) {
            if (typeName) {
              state.btnSolveOpt && state.btnSolveOpt('move', state.moveData)
            }
          }
        }}
      />
    </>
  )
})
export default MyWorkPlan
