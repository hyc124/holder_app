//入口为我的规划状态新增规划 选择企业相关信息
import { Modal, Radio, message } from 'antd'
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import '@/src/common/js/jsmind/jsmind.less'
import { getAddprojectData } from '../workplan/addplanfu'
import { getTreeParam } from '../../common/js/tree-com'
import { useSelector } from 'react-redux'
import { findAllCompanyApi, findEnableCompanyApi, findWorkPlanTeam } from '../task/creatTask/getData'

const WorkPlanModal = forwardRef((props: any, ref) => {
  const { isOkr, visible } = props
  //获取组织结构
  const getplanTree = getTreeParam(useSelector((store: StoreStates) => store.workplanTreeId))
  //是否入口为我的规划
  const isMyplan = useSelector((store: StoreStates) => store.planMainInfo.isMyPlan)
  const [orgList, setOrgList] = useState<any>([])
  const [state, setState] = useState({ value: 0, cmyName: '', visible: visible || false })
  const { nowUserId, nowAccount } = $store.getState()
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
   * 初始化方法
   */
  const initFn = () => {
    const thenFn = (resData: any) => {
      setOrgList(resData)
      // if (resData && resData.length == 1) {
      //   state.value = resData[0].id
      //   state.cmyName = resData[0].name
      //   setState({ ...state, visible: true })
      //   handleOk()
      // }
    }
    // 创建目标okr时：查询开启okr的所有企业
    if (isOkr) {
      findEnableCompanyApi().then((res: any) => {
        thenFn(res.dataList || [])
      })
    } else if (props?.from == 'workplan' && props?.state == 0) {
      // 我的规划创建规划，查询开启规划权限企业列表
      findWorkPlanTeam({
        type: -1,
        userId: nowUserId,
        username: nowAccount,
      }).then((resData: any) => {
        if (resData.returnCode == -1) handleCancel()
        thenFn(resData)
      })
    } else {
      findAllCompanyApi({
        type: -1,
        userId: nowUserId,
        username: nowAccount,
      }).then((resData: any) => {
        thenFn(resData)
      })
    }
  }
  /**
   * 暴露给父级的方法
   */
  useImperativeHandle(ref, () => ({
    initFn,
    setState,
  }))
  const handleOk = () => {
    if (state.value == 0) {
      message.warning('请先选择企业')
      return
    }
    if (props.isShowAddPlan) {
      // props.isShowAddPlan(false)
    } else {
      setState({ ...state, visible: false })
    }
    if (props.handleOk) {
      props.handleOk(state.value, state.cmyName)
      return
    }
    if (props.from == 'okr_workbench') {
      //跳转到四象限设置新建规划
      openPlanWindow()
    } else {
      $store.dispatch({ type: 'DIFFERENT_OkR', data: 0 })
      //我的规划更新 选择的企业相关信息
      $store.dispatch({
        type: 'MYPLAN_ORG',
        data: { cmyId: state.value, curType: -1, cmyName: state.cmyName, curId: state.value },
      })
      $store.dispatch({
        type: 'FROM_PLAN_TYPE',
        data: { createType: 0, fromToType: Number(props.state) },
      })
      if (props.state == 1) {
        //四象限跳转界面后在请求接口
        $tools.createWindow('workplanMind')
        $store.dispatch({
          type: 'MINDMAPDATA',
          data: {
            id: 0,
            typeId: 0,
            name: '目标计划',
            teamName: state.cmyName,
            teamId: state.value,
            status: 1,
            mainId: '',
            type: 2,
          },
        })
      } else {
        //脑图先请求接口在跳转
        const myplanOrg = {
          cmyId: state.value,
          curType: -1,
          cmyName: state.cmyName,
          curId: state.value,
        }
        //调用公共创建规划
        getAddprojectData(getplanTree, myplanOrg, isMyplan, props.state)
      }
    }
  }
  // 打开四象限创建目标任务
  const openPlanWindow = () => {
    $store.dispatch({
      type: 'FROM_PLAN_TYPE',
      data: { createType: 0, fromToType: 1 },
    })
    $store.dispatch({
      type: 'MYPLAN_ORG',
      data: { cmyId: state.value, curType: -1, cmyName: state.cmyName, curId: state.value },
    })
    $store.dispatch({ type: 'DIFFERENT_OkR', data: 1 })
    $store.dispatch({ type: 'PLANOKRMAININFO', data: { isMyPlan: true } })
    $store.dispatch({
      type: 'MINDMAPOKRDATA',
      data: {
        id: 0,
        typeId: 0,
        name: '', //目标Objective
        teamName: state.cmyName,
        teamId: state.value,
        status: 1,
        mainId: '',
        type: 2,
      },
    })
    $tools.createWindow('okrFourquadrant')
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
    <Modal
      title="选择企业"
      className="teamModal"
      visible={state.visible}
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
  )
})

export default WorkPlanModal
