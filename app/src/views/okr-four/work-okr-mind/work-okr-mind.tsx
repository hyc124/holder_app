import React, { useEffect, useReducer, useState } from 'react'
import './work-okr-mind.less'
import WorkPlanMindTitle from './WorkOkrMindTitle'
import FourQuadrant from '../../fourQuadrant/fourQuadrant'
import '@/src/common/js/jsmind/jsmind.less'
import '@/src/common/js/jsmind/jsmind.draggable'
import { statisticDistrApi, getHeaderStatus } from '../../work-plan-mind/getData'
import { useSelector } from 'react-redux'
import { findEditMember } from '../../workplan/WorkPlanOpt'
import { ipcRenderer } from 'electron'
import { loadLocales } from '@/src/common/js/intlLocales'
// reducer初始化参数
const initStates = {
  initData: {}, //列表及卡片点击的参数
  mindTitleData: [], //头部标签数据
  initStyle: {},
  orginfo: {},
  setPortraitlist: [], //常用联系人列表
  positionXY: {}, //定位
  mouselocation: {
    //点击获取鼠标位置
    x: '',
    y: '',
  },
  draftAuth: {
    //草稿权限
    authlist: [],
    auth: false,
  },
}
// state初始化initStates参数 action为dispatch传参
const reducer = (state: any, action: { type: any; data: any }) => {
  switch (action.type) {
    case 'init_data':
      return { ...state, initData: action.data }
    case 'setPortraitlist':
      return { ...state, setPortraitlist: action.data }
    case 'mind_title_tata':
      return { ...state, mindTitleData: action.data }
    case 'init_style':
      return { ...state, initStyle: action.data }
    case 'mouselocation':
      return { ...state, mouselocation: action.data }
    case 'positionXY':
      return { ...state, positionXY: { ...action.data } }
    case 'draftAuth':
      return { ...state, draftAuth: action.data }
    default:
      return state
  }
}
//重置okr数据
export const setmindmapdata = (datas: any) => {
  $store.dispatch({
    type: 'MINDMAPOKRDATA',
    data: {
      ...$store.getState().mindMapOkrData,
      ...datas,
    },
  })
}
//删除规划
let removemindOkrFn: any = null
export const removemindOkrFns = (val: any, data: any) => {
  removemindOkrFn(val, data)
}
// 更新左侧导航工作计划统计
export const planCount = () => {
  const params = {
    userId: $store.getState().nowUserId,
    account: $store.getState().nowAccount,
  }
  $api
    .request('/task/work/plan/countWork', params, {
      headers: { loginToken: $store.getState().loginToken },
      formData: true,
    })
    .then((data: any) => {
      if (data.returnCode === 0) {
        const count = data.data || 0
        if (count > 0) {
          jQuery('.my-plan-count').show()
        } else {
          jQuery('.my-plan-count').hide()
        }
      } else {
        jQuery('.my-plan-count').hide()
      }
    })
    .catch(function(res) {
      jQuery('.my-plan-count').hide()
    })
}

//***************************工作规划脑图***************************//
let mindId: any = ''
//缓存头部信息
let newmindTitleData: any = []
//删除、新增O不需要全局刷新
let isinitRef = false
const okrFourquadrant = () => {
  const [state, dispatch] = useReducer(reducer, initStates)
  //fromPlanTotype.createType 0创建 1详情
  const createType = useSelector((store: StoreStates) => store.fromPlanTotype.createType)
  //mindMapData:列表及卡片点击的参数
  const initData = useSelector((store: StoreStates) => store.mindMapOkrData)
  // const { mindMapOkrData } = $store.getState()
  //选择我的规划创建规划获取企业信息
  const myplanOrg = useSelector((store: StoreStates) => store.myPlanOrg)
  //用于刷新的方法 true:刷新
  const isrefresh = useSelector((store: StoreStates) => store.refreshFn.mindMap && store.refreshFn.mindMap.type)
  //下拉筛选[0, 1]0未完成 1已完成
  const planStateArr = useSelector((store: StoreStates) => store.planOkrStateArr)
  const [status, setStatus] = useState(false)
  // 点击断点派发
  const [statusChoose, setStatusChoose] = useState(false)

  removemindOkrFn = (val: any, data: any) => {
    Removemind(val, data)
  }
  //删除规划
  const Removemind = (val: any, data: any) => {
    if (val == 'removemind') {
      //删除整个规划
      newmindTitleData.map((item: any, index: number) => {
        if (item.id == data.id) {
          return newmindTitleData.splice(index, 1)
        }
      })
      dispatch({
        type: 'mind_title_tata',
        data: [...newmindTitleData],
      })
      if (newmindTitleData.length > 0) {
        switchMap(newmindTitleData[newmindTitleData.length - 1])
      } else {
        $store.dispatch({ type: 'MINDMAPOKRDATA', data: {} })
        ipcRenderer.send('close_okr_mind')
      }
      // 还原为非创建状态
      $store.dispatch({
        type: 'FROM_PLAN_TYPE',
        data: { createType: 1, fromToType: 1 },
      })
      // 刷新规划列表
      ipcRenderer.send('refresh_plan_list_main')
    }
  }
  /**
   * 初始化方法
   */
  const initFn = () => {
    setStatus(false)
    //界面初始化状态
    information()
    if (createType == 0) {
      //创建 -----------------------

      dispatch({
        type: 'init_data',
        data: initData,
      })

      WorkPlanMindTitleData({ ...initData, name: '' }, '0')
    } else {
      //详情 -----------------------
      if (initData.id) {
        dispatch({
          type: 'init_data',
          data: initData,
        })
        //头部标签数据处理
        WorkPlanMindTitleData(initData, '1')
        //查询草稿任务权限
        draftAuthFn(initData)
      }
    }
  }
  useEffect(() => {
    document.title = $intl.get('OKRTitle')
    // 初始化多语言配置
    loadLocales()
  }, [])
  /**
   * 监听窗口显示时初始化加载
   */

  //createType 0创建 1详情
  useEffect(() => {
    if (!isinitRef && $store.getState().differentOkr) {
      initFn()
    } else {
      isinitRef = false
    }
    console.log(planStateArr)
  }, [initData && initData.id, isrefresh == true, planStateArr, myplanOrg.cmyId, myplanOrg.curType]) //myplanOrg.cmyId  更换企业创建规划

  useEffect(() => {
    dispatch({
      type: 'positionXY',
      data: { x: 0, y: 0 },
    })
  }, [planStateArr, initData.id])

  //清除界面相关数据
  const information = () => {
    const winHeight = window.innerHeight
    changeStatus(false)
    dispatch({
      type: 'init_style',
      data: {
        init: {
          width: '100%',
          height: `${winHeight - 55}px`,
          transform: ['translate(0px, 0px)'],
          display: 'none',
        },
      },
    })
    setStatusChoose(false)
  }
  //查询草稿权限
  const draftAuthFn = (resData: any) => {
    let conAuth = false
    //查询草稿权限--------------
    if ($store.getState().mindMapOkrData.form != 'workbench') {
      findEditMember({
        id: resData.id,
        mainId: resData.mainId,
      }).then((res: any) => {
        if (res && res.length > 0) {
          for (let i = 0; i < res.length; i++) {
            if (res[i].id == $store.getState().nowUserId) {
              conAuth = true
              break
            }
          }
        }
        changeStatus(false)
        dispatch({
          type: 'draftAuth',
          data: {
            authlist: res,
            auth: conAuth,
          },
        })
      })
    }
  }
  //头部标签数据添加删除
  const WorkPlanMindTitleData = (resData: any, type: string) => {
    let isRun = true
    state.mindTitleData.map((item: any, index: number) => {
      if (item.id == resData.id) {
        isRun = false
        if (createType == 0) {
          item.ascriptionType = resData.ascriptionType
        }
      }
      if (item.id == '' && createType == 1) {
        return state.mindTitleData.splice(index, 1)
      }
      if (type.includes('del')) {
        if (item.id == type.split('-')[1]) {
          isRun = false
          return state.mindTitleData.splice(index, 1)
        }
      }
    })
    if (state.mindTitleData.length >= 5 && isRun) {
      state.mindTitleData.splice(0, 1)
    }
    if (isRun) {
      const mapTitleArr = {
        id: resData.id || '',
        typeId: resData.typeId || '',
        mainId: resData.mainId || '',
        name: resData.name || '',
        teamName: resData.teamName || '',
        status: resData.status || '',
        type: resData.type || '',
        teamId: resData.teamId || '',
        ascriptionType: resData.ascriptionType,
      }
      if (state.mindTitleData.length == 0) {
        const mapTitleArrs: any = []
        mapTitleArrs.push(mapTitleArr)
        state.mindTitleData = mapTitleArrs
        dispatch({
          type: 'mind_title_tata',
          data: mapTitleArrs,
        })
        newmindTitleData = mapTitleArrs
      } else {
        dispatch({
          type: 'mind_title_tata',
          data: [...state.mindTitleData, mapTitleArr],
        })
        newmindTitleData = [...state.mindTitleData, mapTitleArr]
      }
    }
  }
  //更新头部状态
  const settitStatus = (dataes?: any, name?: string) => {
    const param = {
      mainId: mindId || $store.getState().mindMapOkrData.mainId, //根节点id
    }
    if (dataes) {
      namechangeTitle(newmindTitleData, dataes, name)
    } else {
      getHeaderStatus(param).then((resDatas: any) => {
        namechangeTitle(newmindTitleData, resDatas, name)
      })
    }
  }
  const namechangeTitle = (listData: any, dataes: any, value?: string) => {
    listData.map((item: any, index: number) => {
      if (item.id == $store.getState().mindMapOkrData.id) {
        if (value == 'name') {
          item.name = dataes.name
        } else {
          if (dataes.ascriptionType || dataes.ascriptionType == 0) {
            item.ascriptionType = dataes.ascriptionType
          } else {
            item.status = dataes.data
          }
        }
      }
    })
    dispatch({
      type: 'mind_title_tata',
      data: [...listData],
    })
  }

  //*****************************************断点派发*****************************************//
  //更改选择模式
  const changeStatus = (item: boolean) => {
    setStatusChoose(item)
  }

  //断点派发及全部派发回调刷新
  const sevaDistr = (statusChoose: any, typeIds: any) => {
    //四象限
    $store.dispatch({ type: 'PLANOKRSTATEARR', data: '' })
    setTimeout(() => {
      $store.dispatch({ type: 'PLANOKRSTATEARR', data: '1,2' })
    }, 500)
    statisticDistr()
    //更新头部状态
    settitStatus()
  }
  //统计可派发得数量
  const statisticDistr = () => {
    const param = {
      mainId: state.initData.getMindId, //根节点id
      id: state.initData.id, //根节点ID
    }
    statisticDistrApi(param).then((resdata: any) => {
      jQuery('.countDistribute').text(`(${resdata.data})` || '')
    })
  }
  //*****************************************获取脑图节点*****************************************//
  //切换脑图
  const switchMap = (item: any) => {
    $store.dispatch({ type: 'MINDMAPOKRDATA', data: item })
    if (initData.id == item.id) {
      initFn()
      //四象限
      $store.dispatch({ type: 'PLANOKRSTATEARR', data: '' })
      setTimeout(() => {
        $store.dispatch({ type: 'PLANOKRSTATEARR', data: '1,2' })
      }, 500)
    }

    jQuery('.optBtnMoreList,.portrait_okrMain,.eidt_Kr_Process').hide()
  }
  return (
    <div className="work_okr_mind_content">
      <WorkPlanMindTitle
        data={state.initData}
        mindId={state.initData.mainId}
        teamName={state.initData.teamName}
        titleArr={state.mindTitleData}
        showMap={switchMap}
        status={status}
        changeStatus={changeStatus}
        statusChoose={statusChoose}
        sevaDistr={sevaDistr}
        auth={state.draftAuth.auth}
      ></WorkPlanMindTitle>
      <FourQuadrant
        id={state.initData.id || ''}
        typeId={state.initData.typeId || ''}
        status={statusChoose}
        planStateArr={createType ? planStateArr : undefined}
        settitStatus={settitStatus}
        changeStatus={changeStatus}
        key="workFourQuadrant"
      />
      {/* 选择派发 */}
      {statusChoose && state.initData.id ? <div className="choice_model">{$intl.get('selectMode')}</div> : ''}
    </div>
  )
}

export default okrFourquadrant
