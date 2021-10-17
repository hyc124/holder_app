//入口为我的规划状态新增规划 选择企业相关信息
import { Modal, Radio, message, Avatar } from 'antd'
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import '@/src/common/js/jsmind/jsmind.less'
import { findAllCompanyApi, findEnableCompanyApi } from '../../task/creatTask/getData'
import { TempOData } from '../../fourQuadrant/fourQuadrant'
import OkrSetting from '../component/OkrSetting'
import { getTreeParam } from '@/src/common/js/tree-com'
import CreatTask from '../../task/creatTask/creatTask'
import OkrListOrg from './okr-list-org'
import DetailRight from '../../task/taskDetails/detailRight'
import { loadLocales } from '@/src/common/js/intlLocales'
import { CreateTaskModal } from '../../task/creatTask/createTaskModal'
import { CreateObjectModal } from '../../task/creatTask/createObjectModal'

const WorkPlanMindModal = forwardRef((props: any, ref) => {
  // isOkr：创建目标okr查询企业
  const { isOkr, visible } = props
  const [orgList, setOrgList] = useState<any>([])
  const [state, setState] = useState({ value: 0, cmyName: '', visible: visible || false })
  const { nowUserId, nowAccount } = $store.getState()
  // 创建目标弹框组件
  const createObjectRef = useRef<any>({})
  const radioStyle = {
    display: 'block',
    height: '30px',
    lineHeight: '30px',
    width: '100%',
  }
  useEffect(() => {
    if (visible) {
      initFn()
    }
  }, [visible])

  /**
   * 暴露给父级的方法
   */
  useImperativeHandle(ref, () => ({
    initFn,
  }))

  /**
   * 初始化方法
   */
  const initFn = () => {
    // 初始化多语言配置
    loadLocales()
    // 创建目标okr时：查询开启okr的所有企业
    if (isOkr) {
      findEnableCompanyApi().then((res: any) => {
        setOrgList(res.dataList || [])
      })
    } else {
      findAllCompanyApi({
        type: -1,
        userId: nowUserId,
        username: nowAccount,
      }).then((resData: any) => {
        setOrgList(resData)
      })
    }
    setState({ ...state, visible: true })
  }

  const handleOk = () => {
    if (state.value == 0) {
      message.warning($intl.get('selectCmyMsg'))
      return
    }
    if (props.isShowAddPlan) {
      props.isShowAddPlan(false)
    } else {
      setState({ ...state, visible: false })
    }
    //我的规划更新 选择的企业相关信息
    $store.dispatch({
      type: 'MYPLAN_ORG',
      data: { cmyId: state.value, curType: -1, cmyName: state.cmyName, curId: state.value },
    })
    // 跳转到四象限创建目标
    //四象限跳转界面后在请求接口
    // $tools.createWindow('okrFourquadrant')
    const param = {
      visible: true,
      createType: 'add',
      from: 'workbench',
      nowType: 0, //0个人任务 2企业任务 3部门任务
      teaminfo: {
        teamId: state.value,
        ascriptionId: state.value,
        ascriptionType: 2,
      }, //企业信息
      callbacks: (param: any, code: any) => {},
    }
    createObjectRef.current && createObjectRef.current.getState(param)
  }
  const handleCancel = () => {
    if (props.isShowAddPlan) {
      props.isShowAddPlan(false)
    } else {
      setState({ ...state, visible: false })
    }
  }
  const onChange = (e: any) => {
    setState({
      ...state,
      value: e.target.value,
      cmyName: orgList.filter((item: { id: any }) => item.id === e.target.value)[0].name,
    })
  }
  return (
    <>
      <Modal
        title={$intl.get('selectCompany')}
        visible={state.visible}
        okText={$intl.get('Save')}
        cancelText={$intl.get('cancel')}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        {state.visible &&
          orgList.map((item: any) => {
            return (
              <Radio.Group key={item.id} onChange={onChange} value={state.value}>
                <Radio style={radioStyle} value={item.id} name={item.name}>
                  {item.name}
                </Radio>
              </Radio.Group>
            )
          })}
      </Modal>
      <CreateObjectModal ref={createObjectRef} />
    </>
  )
})

const ListDetailLarge = (props: any) => {
  const {
    okrCircleAuth,
    okrRatingAuth,
    periodEnable,
    // , refresh
    // addObjectAuth,
  } = props
  // 合并state
  const [detailState, setState] = useState<any>({
    chooseData: {},
    refresh: 0,
    nowListData: [...props.data] || [],
    periodEnable,
  })
  //打开创建任务（草稿任务）
  const [opencreattask, setOpencreattask] = useState({
    visible: false,
    orgInfo: {},
    type: 0,
    taskId: '',
    taskFlag: 0,
  })

  // 点击断点派发
  const [statusChoose, setStatusChoose] = useState(false)
  // 设置OKR
  const [okrSetting, setOkr] = useState(false)

  // 左侧列表
  const leftTreeRef = useRef<any>({})
  // 右侧宽详情
  const rightRef = useRef<any>({})
  // 创建任务弹框组件
  const createTaskRef = useRef<any>({})
  useEffect(() => {
    console.log(props.data)
    if (props.data) {
      setStatusChoose(false)
      setState({
        ...detailState,
        chooseData: props.data[0] || {},
        // refresh: refresh ? refresh : detailState.refresh + 1,
        refresh: detailState.refresh + 1,
        nowListData: [...props.data],
        periodEnable,
      })
      $store.dispatch({ type: 'DIFFERENT_OkR', data: 1 }) //工作台1或者工作规划0数据点击
      $store.dispatch({ type: 'FROM_PLAN_TYPE', data: { fromToType: 1, createType: 1 } })

      // setPeriodList(props.mianData.periodList || [])
      // console.log('periodEnable:', periodEnable, detailState)
    }
  }, [props.data, periodEnable])

  /**
   * 刷新详情右侧
   */
  const refreshRight = ({ id }: { id: number | string }) => {
    rightRef.current && rightRef.current.setQuery({ id })
  }

  /**
   * 打开创建任务
   */
  const openCreateTask = (infoObj: any) => {
    const createType = infoObj.type == 1 ? 'edit' : infoObj.type == 2 ? 'addChild' : 'add'
    const param: any = {
      visible: true,
      from: 'work-plan', //来源
      createType,
      endTime: '',
      addHandly: TempOData.createPlan,
      taskFlag: infoObj.taskFlag, //2草稿任务
      taskmanageData: {
        orgInfo: opencreattask.orgInfo,
      },
      id: infoObj.taskId, //任务id
      taskType: 0,
      callbacks: (_: any) => {
        leftTreeRef &&
          leftTreeRef.current &&
          leftTreeRef.current.refreshTaskTree({ optType: 'editorTask', taskIds: [opencreattask.taskId] })
      },
    }
    if (createType == 'addChild') {
      param.parentId = TempOData.createPlan.typeId
      param.parentId = { parentId: TempOData.createPlan.typeId, parentTaskName: TempOData.createPlan.name }
      param.mainId = TempOData.mainId
    }
    createTaskRef.current && createTaskRef.current.setState(param)
  }

  // okr 数据组织结构操作
  const handleOkrList = (paramObj: any) => {
    const { type, typeId, taskFlag, hasAuth, noDataRefresh } = paramObj
    if (noDataRefresh) {
      setState({
        ...detailState,
        nowListData: [],
      })
      return
    }
    // 如果草稿任务、有权限则弹出创建任务窗口
    if (type == 1 && taskFlag == 2 && hasAuth) {
      //打开草稿详情
      // setOpencreattask({
      //   ...opencreattask,
      //   visible: true,
      //   type: 1,
      //   taskId: typeId,
      //   taskFlag: taskFlag,
      // })
      openCreateTask({
        type: 1,
        taskId: typeId,
        taskFlag,
      })
      return
    }
    //更新当前操作对象
    // setState({ ...detailState, chooseData: paramObj, refresh: detailState.refresh + 1 })

    // 如果操作项是 O
    if (type == 2) {
      // setStatusChoose(false)
      $store.dispatch({ type: 'DIFFERENT_OkR', data: 1 }) //工作台1或者工作规划0数据点击
      $store.dispatch({ type: 'FROM_PLAN_TYPE', data: { fromToType: 1, createType: 1 } })
    }
  }

  return (
    <>
      <div className="okr_list_detail">
        {/* 左侧okr列表 */}
        <OkrListOrg
          ref={leftTreeRef}
          data={detailState.nowListData}
          // refresh={detailState.refresh}
          // chooseData={detailState.chooseData}
          statusChoose={statusChoose}
          handleOkrList={handleOkrList}
          refreshRight={refreshRight}
          periodDisable={detailState.periodEnable == false ? true : false}
        />
      </div>
      {/* =====右侧宽详情====== */}
      {/* 20210311新版okr详情 */}
      <DetailRight
        ref={rightRef}
        leftOrgRef={leftTreeRef}
        className="OKRDetailContent okrWideDetail"
        from={'OKR_wideDetail'}
        taskId={detailState.chooseData.typeId}
        refresh={detailState.refresh}
        handleOkrList={handleOkrList}
        refreshTaskTree={(paramObj: any) => {
          leftTreeRef.current && leftTreeRef.current.refreshTaskTree(paramObj)
        }}
        noData={!detailState.nowListData || detailState.nowListData.length == 0 ? false : true}
        periodDisable={detailState.periodEnable == false ? true : false}
      />
      {/* okr设置窗口 */}
      {okrSetting && (
        <OkrSetting
          params={{
            visible: okrSetting,
            ratingAuth: okrRatingAuth,
            circleAuth: okrCircleAuth,
            teamId: getTreeParam($store.getState().workokrTreeId).cmyId,
            changData: false,
            onCancel: (data?: any) => {
              if (data) {
                props.setChange(1)
              }
              setOkr(false)
            },
            onSure: (data?: any) => {
              if (data) {
                props.setChange(1)
              }
              setOkr(false)
            },
          }}
        ></OkrSetting>
      )}
      {/* 创建任务 */}
      {opencreattask.visible && (
        <CreatTask
          param={{ visible: opencreattask.visible }}
          datas={{
            from: 'work-plan', //来源
            isCreate: opencreattask.type, //创建0 编辑1 创建子任务2
            taskid: opencreattask.taskId, //任务id
            taskdata: TempOData.createPlan, //任务信息
            nowType: 0, //0个人任务 2企业任务 3部门任务
            teaminfo: '', //企业信息
            endTime: '',
            addHandly: TempOData.createPlan,
            taskFlag: opencreattask.taskFlag, //2草稿任务
            taskmanageData: {
              orgInfo: opencreattask.orgInfo,
            },
          }}
          setvisible={(state: any) => {
            setOpencreattask({ ...opencreattask, visible: state })
          }}
          callbacks={() => {
            // 刷新详情和左侧列表
            leftTreeRef &&
              leftTreeRef.current &&
              leftTreeRef.current.refreshTaskTree({ optType: 'editorTask', taskIds: [opencreattask.taskId] })
          }}
        ></CreatTask>
      )}

      <CreateTaskModal ref={createTaskRef} />
    </>
  )
}

export { WorkPlanMindModal, ListDetailLarge }
