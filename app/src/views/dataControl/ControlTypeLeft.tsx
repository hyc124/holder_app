import React, { useState, useReducer, useRef, useEffect, useContext } from 'react'
import './dataControl.less'
import { Input, Spin } from 'antd'
import SearchNavigation from './SearchNavigation'

import ControlTree from './controlTree'
import { queryFormByKeyword, queryFormStructure } from './dataControlApi'
import NoneData from '@/src/components/none-data/none-data'

const ControlTypeList = (props: any) => {
  // const inputRef: any = useRef(null)
  //   数据中心左列表树组件
  const controlTreeRef: any = useRef(null)
  const [state, setState] = useState<any>({
    orgLoading: false,
    showSearch: false,
    searchVal: '',
    // curMarkId: 0, //当前选中仪表盘
    // curTeamId: 0, //当前选中部门
    // curTypeId: 0, //当前选中类型
    // dashboardName: '', //当前选中仪表盘名字
    searchList: null, //搜索结果list
    controlList: [], //数据中心左侧边list
    curNode: {
      curMarkId: 0, //当前选中仪表盘
      curTeamId: 0, //当前选中部门
      curTypeId: 0, //当前选中类型
      dashboardName: '', //当前选中仪表盘名字
    },
  })
  useEffect(() => {
    getControlList()
  }, [])
  // 初始化数据中心列表
  const getControlList = () => {
    queryFormStructure().then((res: any) => {
      if (res) {
        const list = JSON.parse(JSON.stringify(res.dataList))
        state.controlList = list
        setState({ ...state })
        controlTreeRef.current.setState(true)
      }
    })
  }
  //   搜索结果标蓝
  const getChangeName = (val: any) => {
    const newVal = val.replace(state.searchVal, `<span class="blod_blue">${state.searchVal}</span>`)
    return newVal
  }
  //   搜索
  const changeSearchVal = (val: any) => {
    queryFormByKeyword(val).then((res: any) => {
      state.searchList = res.dataList
      setState({ ...state })
    })
  }
  return (
    <Spin spinning={state.orgLoading}>
      <div className={`pageLeftCon flex-1 flex column overflow_hidden clac100`}>
        <div className={`content_list flex column ${state.showSearch ? 'forcedHide' : ''}`}>
          {/* 仪表盘默认展示列表 */}
          {/* <div className={`flex column ${state.showSearch ? 'forcedHide' : ''}`}> */}
          <SearchNavigation
            title="数据中心"
            showSearchFn={(val: any) => {
              setState({ ...state, orgLoading: false, showSearch: val })
              controlTreeRef.current.setState(false)
            }}
          />
          <ControlTree
            ref={controlTreeRef}
            rightView={props.rightView}
            dataParam={{
              controlList: state.controlList,
              showSearch: state.showSearch,
              curNode: state.curNode,
            }}
            setCurMarkId={curParams => {
              setState({ ...state, curNode: curParams })
              props.getQueryDashboardUrl(curParams)
            }}
          />
          {/* </div> */}
        </div>
        {/* 仪表盘搜索结果列表  */}
        <div className={`searchList_box ${state.showSearch ? '' : 'forcedHide'}`}>
          <div className="searchList_sn_title">
            <div
              onClick={() => {
                $('.org_fold_icon.chose').removeClass('posLeft')
                setState({ ...state, showSearch: false, searchList: null, searchVal: '' })
                controlTreeRef.current.setState(true)
              }}
            >
              <i className="goback-icon"></i>
              数据中心
            </div>
          </div>
          <Input
            allowClear
            autoFocus={true}
            ref={function(input) {
              if (input != null) {
                input.focus()
              }
            }}
            value={state.searchVal}
            placeholder="请输入仪表盘名字"
            className="org_menu_search baseInput radius16 border0 bg_gray"
            prefix={
              <span
                className="search-icon-boxs"
                onClick={() => {
                  console.log(state.searchVal)
                  changeSearchVal(state.searchVal)
                }}
              >
                <em className="search-icon-t-btn"></em>
              </span>
            }
            onChange={(e: any) => {
              state.searchVal = e.target.value || ''
              setState({ ...state })
            }}
            onPressEnter={(e: any) => {
              state.searchVal = e.target.value || ''
              setState({ ...state })
              if (e.target.value) {
                changeSearchVal(e.target.value)
              } else {
                state.searchList = null
                setState({ ...state })
              }
            }}
          />
          {/* 搜索列表 */}
          <div className={`orgSearchList flex-1`}>
            <ul>
              {state.searchList && state.searchList?.length === 0 && (
                <NoneData
                  imgSrc={$tools.asAssetsPath(`/images/noData/no_search.png`)}
                  showTxt="未搜索到结果"
                  imgStyle={{ width: 70, height: 66 }}
                  containerStyle={{ marginTop: 200 }}
                />
              )}

              {state.searchList?.length > 0 &&
                state.searchList?.map((item: any) => {
                  return (
                    <li
                      className={`${
                        state.curNode.curMarkId == item.markId &&
                        state.curNode.curTeamId == item.teamId &&
                        state.curNode.curTypeId == item.curTypeId &&
                        state.curNode.dashboardName == item.dashboardName
                          ? 'active'
                          : ''
                      }`}
                      key={item.markId}
                      onClick={() => {
                        const curNode = {
                          curMarkId: item.markId,
                          curTeamId: item.teamId,
                          curTypeId: item.curTypeId,
                          dashboardName: item.dashboardName,
                        }
                        setState({
                          ...state,
                          curNode,
                        })
                        props.rightView.current?.getQueryDashboardUrl(curNode)
                        props.getQueryDashboardUrl(curNode)
                      }}
                    >
                      <div
                        className={`dashbordName`}
                        dangerouslySetInnerHTML={{
                          __html: item.dashboardName ? getChangeName(item.dashboardName) : '',
                        }}
                      ></div>
                      <div className="typeTeam flex center-v">
                        <span>{item.typeName}</span>
                        <span className="line"></span>
                        <span className="text-ellipsis flex-1">{item.teamName}</span>
                      </div>
                    </li>
                  )
                })}
            </ul>
          </div>
        </div>
        {/* )} */}
      </div>
    </Spin>
  )
}
export default ControlTypeList
