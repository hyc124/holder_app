import { OkrDateModule } from '@/src/components/okrDate/okrDate'
import { Dropdown } from 'antd'
import React, { useEffect, useState } from 'react'
import { selectDateDisplay } from '../../fourQuadrant/getfourData'
import { editOkrDetailApi, queryPeriodApi } from './okrDetailApi'

export const PeriodDate = (props: {
  dataParam: {
    attach: any
    teamId: any
    periodText: any
    periodId: any
    id: any
    typeId: any
    parentId: any
    mainId: any
    disabled?: boolean
  }
  changePeriodIdHandle: any
}) => {
  const { nowUserId } = $store.getState()
  const { attach, teamId, periodText, periodId, id, typeId, parentId, mainId, disabled } = props.dataParam
  const { changePeriodIdHandle } = props
  const [state, setState] = useState({
    visible: false, //显示周期下拉框
    // dataState: dataStateOut,
    periodList: [],
    periodId: '',
    nowHository: 1,
    periodText: '',
  })
  useEffect(() => {
    if (state.visible) {
      queryPeriod()
    }
  }, [state.visible])
  useEffect(() => {
    setState({ ...state, periodText })
  }, [id])
  const queryPeriod = () => {
    const { nowUserId } = $store.getState()
    const mySelf = '0'
    let ascriptionId = attach?.typeId || '',
      ascriptionType = attach?.type || ''
    if (ascriptionId < 0) {
      ascriptionId = ''
    }
    if (ascriptionType < 0) {
      ascriptionType = ''
    }
    // 查询周期是否显示历史周期
    selectDateDisplay().then((res: any) => {
      const nowHository = res.data.isClosed ? 1 : 0
      const param: any = {
        teamId,
        mySelf,
        ascriptionId: ascriptionId || nowUserId,
        ascriptionType: ascriptionType || 0,
        isClosed: nowHository,
      }
      // console.log('periodId:', periodId, state.dataState.periodId)
      // 查询周期列表
      queryPeriodApi(param).then((res: any) => {
        setState({
          ...state,
          //   dataState: dataStateOut,
          nowHository,
          periodList: res,
          periodId,
        })
      })
    })
  }

  /**
   * 编辑周期
   */
  const changePeriodId = ({ periodId, periodText }: any) => {
    const newParam: any = {
      id: id || '', //当前节点
      typeId: typeId || '', //任务id
      parentId: parentId || '', //父级元素id
      mainId: mainId || '', //根节点id
      operateUser: nowUserId, //操作人
      periodId: periodId,
    }
    return new Promise(resolve => {
      editOkrDetailApi(newParam).then((res: any) => {
        setState({ ...state, periodText })
        changePeriodIdHandle({ periodId, periodText })
      })
    })
  }
  const periodDropdown = () => {
    return (
      <OkrDateModule
        periodList={state.periodList}
        periodId={state.periodId}
        hideAllperiod={true}
        nowHository={state.nowHository}
        AfterchoseeData={(data: any) => {
          if (data) {
            changePeriodId(data)
          }
        }}
        changeListData={(val: any) => {
          console.log('changeListData', val)
        }}
        isEdit={true}
      />
    )
  }

  // 详情类型：workPlanType 2:O 3:KR
  return (
    <Dropdown
      visible={state.visible}
      overlay={periodDropdown()}
      trigger={['click']}
      disabled={disabled}
      placement="bottomCenter"
      // 只有O才有权限
      //   disabled={!editAuth || workPlanType != 2}
      onVisibleChange={flag => {
        state.visible = flag
        setState({ ...state, visible: flag })
      }}
    >
      {/* <div className={`time_filter ${editAuth ? 'editHoverBlue ' : ''}`}> */}
      <div
        onClick={e => {
          e.stopPropagation()
        }}
        className={`time_filter`}
      >
        {state.periodText && <span>{state.periodText}</span>}
      </div>
    </Dropdown>
  )
}
