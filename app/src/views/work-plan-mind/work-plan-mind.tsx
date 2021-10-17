import React, { useEffect, useReducer, useState } from 'react'
import './work-plan-mind.less'
import WorkPlanMindTitle from './WorkPlanMindTitle'
import WorkPlanMindRightMeun from './WorkPlanMindRightMeun'
import WorkPlanMindoperate from './WorkPlanMindoperate'
import FourQuadrant from '../fourQuadrant/fourQuadrant'
import '@/src/common/js/jsmind/jsmind.less'
import $jsmind from '@/src/common/js/jsmind/jsmind'
import '@/src/common/js/jsmind/jsmind.draggable'
import DetailModal from '@/src/views/task/taskDetails/detailModal'
import DownLoadFileFooter from '@/src/components/download-footer/download-footer'
import {
  getMindMapEmpty,
  getMindId,
  addTaskNode,
  editOKRtask,
  deleteNodesApi,
  okrMoveNodes,
  affiliationApi,
  confidenPortraitApi,
  statisticDistrApi,
  btnseventPlanSaveApi,
  getHeaderStatus,
  setSortNodes,
} from './getData'
import { findOperationBtn } from '../fourQuadrant/getfourData'
import { refJurisdictions } from './WorkPlanMindoperate'
import Rightmodal from './rightmodalMenu'
import { useSelector } from 'react-redux'
import { Spin, message, Avatar, DatePicker, Progress, Slider, Tooltip } from 'antd'
import Draggable from 'react-draggable'
import { getTreeParam } from '../../common/js/tree-com'
import locale from 'antd/es/date-picker/locale/zh_CN'
import { SelectMemberOrg } from '../../components/select-member-org/index'
import TaskMenu, { closeTaskDetails } from '../fourQuadrant/components/TaskMenu'
import moment from 'moment'

import { ipcRenderer } from 'electron'
import { shareToUserSave, findEditMember } from '../workplan/WorkPlanOpt'
import { jsmindFefFn } from './jsmindRefresh'
import { loadLocales } from '@/src/common/js/intlLocales'
// import { findAuthList, getAuthStatus } from '@/src/common/js/api-com'

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
    case 'org_info':
      return { ...state, orginfo: action.data }
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
//重置mindMapData
export const setmindmapdata = (datas: any) => {
  $store.dispatch({
    type: 'MINDMAPDATA',
    data: {
      ...$store.getState().mindMapData,
      ...datas,
    },
  })
}
//删除规划
let removemindFn: any = null
export const removemindFns = (val: any, data: any) => {
  removemindFn(val, data)
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
//获取渲染节点
let getItemsFu: any = null
export const getItemsFusHtml = (item: any) => {
  return getItemsFu(item)
}
//局部刷新更改数据
let updateRefDatas: any = null
export const updateRefDataFn = (type: string, typeId: any, refData: any) => {
  updateRefDatas(type, typeId, refData)
}
//***************************工作规划脑图***************************//
//存储jsmind对象
let jmCompany: any = null
let jmMindMapData: any = null
let mindId: any = ''
//开始结束时间
let timestype = 0
//是否点击断点派发
let stateBreaking = false
//缓存已选断点派发节点
let breakingArr: any = []
//缓存头部信息
let newmindTitleData: any = []
//删除、新增O不需要全局刷新
let isinitRef = false
const WorkPlanMind = () => {
  const [state, dispatch] = useReducer(reducer, initStates)
  //fromPlanTotype.createType 0创建 1详情
  const createType = useSelector((store: StoreStates) => store.fromPlanTotype.createType)
  //mindMapData:列表及卡片点击的参数
  const initData = useSelector((store: StoreStates) => store.mindMapData)
  //获取组织结构
  const getplanTree = getTreeParam(useSelector((store: StoreStates) => store.workplanTreeId))
  //选择我的规划创建规划获取企业信息
  const myplanOrg = useSelector((store: StoreStates) => store.myPlanOrg)
  //是否入口为我的规划
  const isMyplan = useSelector((store: StoreStates) => store.planMainInfo.isMyPlan)
  //用于刷新的方法 true:刷新
  const isrefresh = useSelector((store: StoreStates) => store.refreshFn.mindMap && store.refreshFn.mindMap.type)
  //下拉筛选[0, 1]0未完成 1已完成
  const planStateArr = useSelector((store: StoreStates) => store.planStateArr)
  //选人插件反选信息
  const [selMemberOrg, setSelMemberOrg] = useState<any>({})
  //常用联系人
  const [portraitshow, setPortraitshow] = useState(false)
  //右键任务事件处理
  const [rightmodal, setRightmodal] = useState(false)
  //右键任务事件数据
  const [rightmodalinfo, setRightmodalinfo] = useState<any>()
  //添加检查项默认添加传当前时间戳
  const [time, setTime] = useState<any>()
  // const [getProgress, setProgress] = useState(0)
  //右键按钮数据
  const [moreMenuList, setMenuList] = useState({
    rightMenuItem: {
      display: 'none',
      row: {},
    },
    moreMenu: [],
    taskinfo: {},
  })
  //显示隐藏任务详情
  const [opentaskdetail, setTaskdetail] = useState(false)
  let initid = $store.getState().mindMapData.id
  let initTypeId = $store.getState().mindMapData.typeId
  const isPlan = $store.getState().mindMapData.isPlan
  const initfrom = $store.getState().mindMapData.form
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(false)
  // 点击断点派发
  const [statusChoose, setStatusChoose] = useState(false)
  const doc: any = document
  if (initData.type != 2 && createType == 1) {
    const { fromPlanTotype } = $store.getState()
    $store.dispatch({ type: 'FROM_PLAN_TYPE', data: { ...fromPlanTotype, fromToType: 0 } })
  }

  //fromPlanTotype.fromToType 0脑图 1四象限
  const fromToType = useSelector((store: StoreStates) => store.fromPlanTotype.fromToType)
  /**
   * 初始化方法
   */
  const initFn = () => {
    setStatus(false)
    // 初始关闭打开的任务详情页
    closeTaskDetails?.()
    //界面初始化状态
    information()

    if (createType == 0) {
      //创建 -----------------------
      if (fromToType == 0) {
        addproject()
      } else {
        dispatch({
          type: 'init_data',
          data: initData,
        })
        WorkPlanMindTitleData(initData, '0')
      }
    } else {
      //详情 -----------------------
      if (initData.id) {
        //初始化查询脑图
        if (fromToType == 0) {
          showMindMapEmpty('', 'refStatus')
        }
        dispatch({
          type: 'init_data',
          data: initData,
        })
        // 获取全局头部标签数据
        const mindMapTitle = $store.getState().mindMapTitle
        //头部标签数据处理
        WorkPlanMindTitleData(mindMapTitle, '1')
        //查询草稿任务权限
        draftAuthFn(initData)
      }
    }
  }
  /**
   * 监听窗口显示时初始化加载
   */
  useEffect(() => {
    // 初始化多语言配置
    loadLocales()
    //显示屏蔽掉
    // ipcRenderer.on('window-show', () => {
    //   initFn()
    //   $tools.windowsInit(['workplanMind'])
    // })
    // 其他窗口修改任务进度，局部刷新该条数据
    ipcRenderer.on('refresh_operated_report', ipcOnFn)
  }, [])
  // 订阅进展汇报消息，刷新任务进度数据
  const ipcOnFn = (_: any, args: any) => {
    const { optType, data } = args
    if (optType != 'report') return
    refreshNodeMap('process', { data: data.process })
  }
  //createType 0创建 1详情
  useEffect(() => {
    if (!isinitRef && !$store.getState().differentOkr) {
      initFn()
    } else {
      isinitRef = false
    }
    // console.log(planStateArr)
  }, [initData.id, fromToType, isrefresh == true, planStateArr])

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
          display: $store.getState().fromPlanTotype.fromToType === 1 ? 'none' : 'block',
        },
      },
    })
    //清除刷新脑图
    const { refreshFn } = $store.getState().refreshFn
    $store.dispatch({
      type: 'REFRESHFN',
      data: {
        ...refreshFn,
        mindMap: {
          type: false,
          datas: null,
        },
      },
    })
    setStatusChoose(false)
  }
  //创建规划
  const addproject = () => {
    //更改此组件初始数据
    let orgname = ''
    if (isMyplan) {
      orgname = myplanOrg.cmyName || initData.teamName
    } else {
      orgname = initData.teamName
    }
    dispatch({
      type: 'init_data',
      data: {
        id: initData.id,
        typeId: initData.typeId,
        name: initData.name,
        teamName: orgname,
        mainId: initData.mainId,
      },
    })
    message.success('创建规划成功')
    draftAuthFn(initData)
    //头部标签数据处理
    WorkPlanMindTitleData(initData, '0')
    initid = initData.id
    initTypeId = initData.typeId
    showMindMapEmpty('')
    //创建成功后更改状态 创建-详情
    const { fromPlanTotype } = $store.getState()
    $store.dispatch({ type: 'FROM_PLAN_TYPE', data: { ...fromPlanTotype, createType: 1 } })
    // 刷新规划列表
    ipcRenderer.send('refresh_plan_list_main')
  }
  //切换脑图
  /**
   *
   * @param item 切换显示项
   * @param isDelId 是否来自删除切换
   * @param newmindTitleData 当前新规划标签数据
   */
  const switchMap = (item: any, isDelId?: boolean) => {
    $store.dispatch({ type: 'MINDMAPDATA', data: item, isDelId })
    if (initData.id == item.id) {
      initFn()
      //四象限更新
      if (fromToType == 1) {
        $store.dispatch({ type: 'PLANSTATEARR', data: '' })
        setTimeout(() => {
          $store.dispatch({ type: 'PLANSTATEARR', data: '1,2' })
        }, 500)
      }
    }
    jQuery('.optBtnMoreList,.portrait_okrMain,.eidt_Kr_Process').hide()
  }
  //查询草稿权限
  const draftAuthFn = (resData: any) => {
    let conAuth = false
    //查询草稿权限--------------
    if (initfrom != 'workbench') {
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
        jQuery('.OKR_map_content').attr('data-auth', String(conAuth))
        if (fromToType == 1) {
          changeStatus(false)
        }
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
    const isArr = Object.prototype.toString.call(resData) == '[object Array]'

    const activeItem = !isArr ? resData : $store.getState().mindMapData
    let isRun = true
    state.mindTitleData.map((item: any, index: number) => {
      if (item.id == activeItem.id && item.typeId == activeItem.typeId) {
        isRun = false
      }
      if (item.id === '' && createType == 1) {
        return state.mindTitleData.splice(index, 1)
      }
      if (state.mindTitleData.length >= 6) {
        return state.mindTitleData.splice(0, 1)
      }
      if (type.includes('del')) {
        if (item.id == type.split('-')[1]) {
          isRun = false
          return state.mindTitleData.splice(index, 1)
        }
      }
    })

    if (isRun) {
      let mapTitleArrs: any = []
      const mapTitleItem = {
        id: activeItem.id || '',
        typeId: activeItem.typeId || '',
        mainId: activeItem.mainId || '',
        name: activeItem.name || '',
        teamName: activeItem.teamName || '',
        status: activeItem.status || '',
        type: activeItem.type || '',
        teamId: activeItem.teamId || '',
      }
      if (state.mindTitleData.length == 0) {
        if (isArr) {
          mapTitleArrs = [...resData]
        } else {
          mapTitleArrs.push(mapTitleItem)
        }

        state.mindTitleData = mapTitleArrs
        dispatch({
          type: 'mind_title_tata',
          data: mapTitleArrs,
        })
        newmindTitleData = mapTitleArrs
      } else {
        dispatch({
          type: 'mind_title_tata',
          data: [...state.mindTitleData, mapTitleItem],
        })
        newmindTitleData = [...state.mindTitleData, mapTitleItem]
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
      if (item.id == initid) {
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
  //初始化查询脑图
  const showMindMapEmpty = (issetMindMap: any, type?: string) => {
    if (type != 'noupdate') {
      setLoading(true)
    }
    let param = {}
    let url = ''
    if (initfrom == 'workbench') {
      //工作台查看规划 -----------------------
      url = '/task/work/plan/findTree'
      param = {
        typeId: initTypeId,
        operateUser: $store.getState().nowUserId,
        isPlan: isPlan, //0任务 1规划
      }
      getMindMapEmpty(param, url).then((resDatas: any) => {
        const resData = resDatas.data
        const info = []
        info.push(resData)
        const nodeArray = jsonRecursion(info, '', 0)
        jmMindMapData = nodeArray || []
        showMindMap(nodeArray[0], 'destroy')
      })
    } else {
      //工作规划查看规划 -------------------------
      getMindId(initid).then((resMindId: any) => {
        mindId = resMindId
        url = '/task/work/plan/queryTree'
        param = {
          mainId: mindId, //根节点id
          id: initid,
          typeId: initTypeId,
          operateUser: $store.getState().nowUserId,
          level: '', //1查询当前层及以下所有任务
          hasOther: '1', //是否查询其他 0否 1是
          hasSelf: 1, //是否查询当前任务信息，0否 1是
          queryStatus: planStateArr || '1,2', //状态查询1未完成，2完成，3归档
        }
        getMindMapEmpty(param, url).then((resDatas: any) => {
          if (resDatas.returnCode == -1) {
            setLoading(false)

            newmindTitleData = newmindTitleData.filter((item: any) => item.id != initid)
            dispatch({
              type: 'mind_title_tata',
              data: [...newmindTitleData],
            })
            if (newmindTitleData.length == 0) {
              $store.dispatch({ type: 'MINDMAPDATA', data: {} })
              ipcRenderer.send('close_work_mind')
            }
            return false
          }
          const resData = resDatas.data
          const info = []
          info.push(resData)
          const nodeArray = jsonRecursion(info, '', 0)
          jmMindMapData = nodeArray || []
          if (type != 'noupdate') {
            showMindMap(nodeArray[0], 'destroy')
          }
          //需要更新mindMapData全局状态(编辑成O 取消标记等)
          if (issetMindMap == 'setmindmapdata' || type == 'refStatus') {
            setmindmapdata({
              id: resData.id,
              typeId: resData.typeId,
              name: resData.name,
              status: resData.status,
              mainId: '',
              type: resData.type, //规划类型 0 KR 任务
            })
            //更新头部状态
            settitStatus()
          }
          if (issetMindMap == 'refinitdata') {
            //更新initdata和头部信息
            dispatch({
              type: 'init_data',
              data: {
                id: resData.id,
                typeId: resData.typeId,
                name: resData.name,
                teamName: initData.teamName,
                mainId: resData.mainId,
              },
            })
            WorkPlanMindTitleData(
              {
                id: resData.id,
                typeId: resData.typeId,
                mainId: mindId,
                name: resData.name,
                teamName: initData.teamName,
                status: resData.status,
                type: resData.type,
                teamId: initData.teamId,
              },
              '0'
            )
          }
        })
      })
    }
  }
  //脑图操作事件
  const handleMind = (
    type: number,
    data: { evt: string; data: any[]; node: any; type: any; expanded: any; children: any; topic: any }
  ) => {
    //进度回车保存
    jQuery('.show_progress input')
      .off()
      .keyup(function(e: any) {
        if (e.keyCode == 13) {
          editprocessVal(e.target.value, jQuery(e.target).attr('data-val'))
        }
      })
    //记录点击展开脑图后断点派发节点
    if (stateBreaking) {
      changeStatus(stateBreaking)
    }
    const mindId = setNodedatas('').getMindId
    switch (String(data.evt)) {
      case 'expand_node': //展开节点
        if (data.children.length == 0) {
          const parameter = {
            nodeId: data.node,
            typeId: data.type,
            mindId: mindId,
            unfold: true,
            showMind: true,
          }
          topoRefreshMind(parameter, 'expand')
        }
        changeExpanded(data.expanded, data.type)
        break
      case 'collapse_node': //收起节点
        changeExpanded(data.expanded, data.type)
        break
      case 'add_right': //新增右侧节点
        addNodes(1)
        break
      case 'add_top': //新增上侧节点
        addNodes(4)
        break
      case 'add_bottom': //新增下侧节点
        addNodes(2)
        break
      case 'add_left': //新增左侧节点
        addNodes(3)
        break
      case 'remove_node': //删除节点
        deleteNodes()
        break
      case 'edit_text': //修改文字
        const datas = {
          type: 1,
          topic: data.topic,
          nodeId: data.node,
          typeId: data.type,
        }
        setNode(datas)
        break
      case 'move_node': //拖动
        const moveDatas = {
          fromId: data.data[0], //拖动当前Id
          toId: data.data[2], //拖动到的id
          fromParentId: data.data[4], //拖动前拖动元素的父级ID
          nodeid: data.data[0],
          beforeid: data.data[1],
          parentid: data.data[2],
          direction: data.data[3],
          beforePid: data.data[5],
          beforeNodes: data.data[6],
        }
        if (!editAuth('moveNodes', moveDatas)) {
          return
        }
        moveNodes(moveDatas)
        break
      case 'edit_starttimes': //修改开始时间
        timestype = 1
        dispatch({
          type: 'mouselocation',
          data: {
            x: data.data[0].clientX - 20,
            y: data.data[0].clientY + 15,
          },
        })
        break
      case 'edit_endtimes': //修改结束时间
        timestype = 2
        dispatch({
          type: 'mouselocation',
          data: {
            x: data.data[0].clientX - 20,
            y: data.data[0].clientY + 15,
          },
        })
        break
      default:
        return null
    }
  }
  //基础事件
  const initclick = () => {
    //点击空白处
    jQuery('.work_plan_mind_content')
      .off()
      .click(function(e: any) {
        const _con = jQuery('.optBtnMoreList') // 设置目标区域
        const _con2 = jQuery('.mindMenuList')
        if (!_con.is(e.target) && _con.has(e.target).length === 0) {
          setMenuList({
            rightMenuItem: { display: 'none', row: {} },
            moreMenu: [],
            taskinfo: {},
          })
        }
      })
    //定位
    jQuery('.scale-location span')
      .off()
      .on('click', function() {
        jmCompany.view.setZoom(1, jQuery('.scale-zoom i'))
        dispatch({
          type: 'positionXY',
          data: { x: 0, y: 0 },
        })
      })
    //缩放效果
    jQuery('.scale-zoom-plus')
      .off()
      .on('click', function() {
        jmCompany.view.zoomIn(jQuery('.scale-zoom i'))
      })
    jQuery('.scale-zoom-minus')
      .off()
      .on('click', function() {
        jmCompany.view.zoomOut(jQuery('.scale-zoom i'))
      })
    //工作台点击到脑图
    if (initfrom == 'workbench') {
      jQuery('#OKR_map_content').attr('data-pagetype', 'staticmind')
      jQuery('.WorkPlanMindTitle,.WorkPlanMindRightMeun,.WorkPlanMindoperate').hide()
      jQuery('jmnode')
        .off()
        .click(function() {
          const types = setNodedatas('').gettaskType
          if (types != '2' && types != '3') {
            setTaskdetail(true)
          }
        })
    } else {
      jQuery('#OKR_map_content').attr('data-pagetype', '')
      jQuery('.WorkPlanMindTitle,.WorkPlanMindRightMeun,.WorkPlanMindoperate').show()
    }
    //点击右侧列表
    jQuery('.WorkPlanMindRightMeun .rightCon')
      .off()
      .click(function() {
        jQuery('.optBtnMoreList,.portrait_okrMain,.eidt_Kr_Process').hide()
      })
  }
  //渲染脑图
  const showMindMap = (nodeArray: any, type: string) => {
    if (type == 'destroy') {
      doc.getElementById('OKR_map_content').innerHTML = ''
    }
    const mind = {
      meta: {
        name: 'jsMind-demo-tree',
        author: 'hizzgdev@163.com',
        version: '0.2',
      },
      format: 'node_tree',
      data: nodeArray,
    }
    const options = {
      container: 'OKR_map_content',
      theme: 'orange',
      editable: true,
      disableContextDrag: true,
    }
    jmCompany = new $jsmind(options)
    jmCompany.show(mind)
    jmCompany.add_event_listener(handleMind)
    setLoading(false)
    statisticDistr() //查询未派发计划个数
    rightClick() // 右键按钮 //TODO
    initclick()
  }
  //点击获取下一层脑图数据
  //unfold:是否刷新子节点
  //showMind:是否从新加载界面
  const topoRefreshMind = (parameter: any, form: string) => {
    if (parameter.showMind) {
      setLoading(true)
    }
    if (jmCompany.get_selected_node() && jmCompany.get_selected_node().isroot) {
      parameter.unfold = true
    }
    const url = '/task/work/plan/queryTree'
    const param = {
      mainId: mindId, //根节点id
      id: parameter.nodeId,
      typeId: parameter.typeId,
      operateUser: $store.getState().nowUserId,
      level: '', //1查询当前层及以下所有任务
      hasOther: '1', //是否查询其他 0否 1是
      hasSelf: 1, //是否查询当前任务信息，0否 1是
      queryStatus: planStateArr || '1,2', //状态查询1未完成，2完成，3归档
    }
    if (parameter.nodeId == 0) {
      setLoading(false)
      return
    }
    getMindMapEmpty(param, url).then((resDatas: any) => {
      if (resDatas.returnCode == 0) {
        const resData = resDatas.data
        const info: any[] = []
        info.push(resData)
        if (jmCompany.get_selected_node() && jmCompany.get_selected_node().isroot) {
          settitStatus()
        }
        function jsonRecursionChild(items: any) {
          for (let i = 0; i < items.length; i++) {
            const objArr: any[] = []
            const _taskId = items[i].typeId
            const newTreeId = parameter.typeId
            //点击展开节点【解决数据重复情况:当数据重复展示的时候收起其他重复的数据展示】
            if (form == 'expand') {
              const itemsNode = items[i]
              repetitionNodes(itemsNode, info)
            }
            //当前节点
            if (newTreeId == _taskId) {
              const _id = '###' + items[i].typeId + '###'
              const beforechildren = items[i].children || []
              const childrenData = info[0].children
              const _hasChild: any = childrenData.length > 0 ? 1 : 0
              if (parameter.unfold) {
                childrenData.map((item: any) => {
                  const _id = '###' + item.typeId + '###'
                  const _hasChild = item.hasChild
                  const expandedchild = false
                  objArr.push(getItemsFun(_id, _hasChild, item, expandedchild))
                  if (parameter.from == 'moveNodes') {
                    //拖动节点时更新数据时要还原之前的children和展开收起状态
                    for (let j = 0; j < beforechildren.length; j++) {
                      if (_id == beforechildren[j].id && beforechildren[j].children) {
                        const newHandleArr: any = objArr.filter(item => item.id == beforechildren[j].id)
                        newHandleArr[0].children = beforechildren[j].children
                        newHandleArr[0].expanded = beforechildren[j].expanded
                      }
                    }
                  }
                })
              }
              if (form == 'ref') {
                //局部刷新时获取当前展开收起的状态
                items[i] = getItemsFun(_id, _hasChild, resData, parameter.unfold) //替换当前节点
              } else {
                items[i] = getItemsFun(_id, _hasChild, resData, true) //替换当前节点
              }
              if (parameter.unfold) {
                items[i].children = objArr //替换子节点
              }
              if (form != 'expand') {
                break
              }
            }
            //有childs的时候递归
            if (
              items[i].children != undefined &&
              items[i].children != '' &&
              items[i].children != null &&
              items[i].children instanceof Array
            ) {
              jsonRecursionChild(items[i].children)
            }
          }
        }
        jsonRecursionChild(jmMindMapData)
        if (parameter.showMind) {
          showMindMap(jmMindMapData[0], 'destroy')
        }
      } else {
        setLoading(false)
      }
    })
  }
  //处理节点ID重复的数据
  const repetitionNodes = (itemsNode: any, info: any) => {
    const childrenData = info[0].children || []
    const parChildren = itemsNode.children || []
    let isrel = 0
    let isrelIndex = 0
    parChildren.map((paritem: any, index: number) => {
      for (let k = 0; k < childrenData.length; k++) {
        if (paritem.typeId == childrenData[k].typeId) {
          const parentNode = jmCompany.get_node(paritem.id).parent
          if (parentNode) {
            if (parentNode.data.taskType == 2) {
              isrel = 2
              isrelIndex = index
              parentNode.children.splice(index, 1)
              parentNode.data.nodeitem.children.splice(index, 1)
              break
            } else {
              isrel = 1
            }
          } else {
            isrel = 1
          }
          break
        }
      }
    })
    if (isrel == 1) {
      jmCompany.get_node(itemsNode.id).children = []
      jmCompany.get_node(itemsNode.id).data.nodeitem.children = []
      jmCompany.get_node(itemsNode.id).expanded = false
      itemsNode.expanded = false
      itemsNode.children = []
    } else if (isrel == 2) {
      itemsNode.children.splice(isrelIndex, 1)
    }
  }
  //处理脑图数据
  let _index = 0
  const jsonRecursion = (item: any, children: any, index: number) => {
    let newarr = []
    if (children) {
      newarr = children
    }
    for (let i = 0; i < item.length; i++) {
      _index++
      let _id = '###' + item[i].typeId + '###'
      let _hasChild = item[i].hasChild
      if (_index == 1) {
        //初始脑图root 顶层任务
        _id = '###' + item[i].typeId + '###'
        _hasChild = ''
        item[i].isroot = true
      }
      const obj: any = getItemsFun(_id, _hasChild, item[i], false)
      //有childs的时候递归
      if (
        item[i].children != undefined &&
        item[i].children != '' &&
        item[i].children != null &&
        item[i].children instanceof Array
      ) {
        obj.children = [] //有childs不断扩充新的children对象
        newarr.push(obj)
        jsonRecursion(item[i].children, obj.children, item[i].id)
      } else {
        newarr.push(obj)
      }
    }
    return newarr
  }
  //记录脑图展开收起
  const changeExpanded = (_type: any, _typeId: any) => {
    //遍历脑图节点递归函数 构造tree
    function jsonRecursionChild(items: any) {
      for (let i = 0; i < items.length; i++) {
        const _taskId = items[i].id.split('###')[1]
        if (_typeId == _taskId) {
          items[i].expanded = _type == true ? true : false
          jmCompany.get_node(`###${_typeId}###`).data.expanded = items[i].expanded
          break
        }
        //有childs的时候递归
        if (
          items[i].children != undefined &&
          items[i].children != '' &&
          items[i].children != null &&
          items[i].children instanceof Array
        ) {
          jsonRecursionChild(items[i].children)
        }
      }
    }
    jsonRecursionChild(jmMindMapData)
  }
  //公共脑图数据节点
  const getItemsFun = (_id: string, _hasChild: any, item: any, isExpanded: boolean) => {
    const obj: any = {
      id: _id,
      nodeId: item.id,
      topic: getItemHtml(item), //getItemHtml(item)
      names: item.name, //任务名称
      expanded: isExpanded || false, //是否展开
      hasChild: _hasChild, //是否有子任务
      direction: 'right', //局右
      icon: item.icon, //图标
      property: item.property, //任务属性(0公开 1私密)
      approvalStatus: item.approvalStatus, //审批状态
      status: item.status, //1 未派发 2 审核中 31/32 部分已派发 4 派发 3 部分派发  5 已完成
      flag: item.flag, //1 冻结 3归档
      cycleNum: item.cycleNum, //循环
      tagList: item.tagList, //标签
      process: item.process, //进度
      taskType: item.type, //1任务、2O 、3KR、4/41协同、5待办计划
      genreStatus: item.taskType, //0目标、1临时 、2职能、3项目
      typeId: item.typeId, //任务id
      cci: item.cci, //信心指数
      taskStatus: item.taskStatus, //任务状态 0未开启 1开启 2完成 3延迟 4变更 -1删除
      taskFlag: item.taskFlag, //任务标志(2草稿任务 --- 不等2走任务) -----
      startTime: item.startTime, //开始时间
      endTime: item.endTime, //结束时间
      day: item.day, //天
      liableUsername: item.liableUsername, //任务责任人
      liableUserProfile: item.liableUserProfile, //任务责任人头像
      nodeText: item.nodeText, //显示归属
      liableUser: item.liableUser, //任务责任人
      meetings: item.meetings, //会议
      files: item.files, //任务附件
      themes: item.themes, //主题数
      isOther: item.isOther, //0我的规划信息，1其他人的规划或任务
      ascriptionType: item.ascriptionType, //归属
      update: item.update, //是否可以编辑 true可以编辑(根据指派人控制的权限)
      nodeitem: item, //整个数据对象
    }
    return obj
  }
  // 进度输入值控制整数及小数点2位
  const changeInputVal = (e: any) => {
    const value = e.target.value
    const reg = /^(\-)*(\d+)\.(\d\d).*$/
    let newVal: any = ''
    if (typeof value === 'string') {
      newVal = !isNaN(Number(value)) ? value.replace(reg, '$1$2.$3') : ''
    } else if (typeof value === 'number') {
      newVal = !isNaN(value) ? String(value).replace(reg, '$1$2.$3') : ''
    }
    if (newVal.split('.')[1] && newVal.split('.')[1] == '00') {
      newVal = newVal.split('.')[0]
    }
    if (e.target.value > 100) {
      newVal = 100
    }
    e.target.value = newVal
  }
  //*****************************************断点派发*****************************************//
  //更改选择模式
  const changeStatus = (item: boolean) => {
    setStatusChoose(item)
    if (item) {
      // 点击断点派发
      stateBreaking = true
      jQuery('.root_o .okr_text_content,.isokr').css({ opacity: '0.4', filter: 'grayscale(10%) blur(0.8px)' })
      jQuery('.task_okr .okr_text_content').css({ opacity: '0.4', filter: 'grayscale(10%) blur(0.8px)' })
      jQuery('jmnode.accomplish .okr_text_content').css({
        opacity: '0.4',
        filter: 'grayscale(10%) blur(0.8px)',
      })
      jQuery('jmnode .node_portrait.portrait')
        .parents('.okr_text_content')
        .css({ opacity: '0.4', filter: 'grayscale(10%) blur(0.8px)' }) //没有人员也不能选择
      jQuery('.root_o,.task_okr,jmnode.accomplish,.planTabBox,.planAccomplish,.timeInput').css({
        'pointer-events': 'none',
      })
      jQuery('jmnode .node_portrait.portrait')
        .parents('jmnode')
        .css({ 'pointer-events': 'none' })
      jQuery('.WorkPlanMindoperate,.WorkPlanMindRightMeun,.add_mind_map,.pattern_type').hide()
      setPortraitshow(false)
      jQuery('.countDistribute').text(`(${breakingArr.length})`)
      //展开状态下反显历史选择节点
      breakingArr.map((item: any, index: number) => {
        jQuery('jmnode').map((items: any) => {
          if (
            jQuery(jQuery('jmnode')[items])
              .attr('nodeid')
              ?.split('###')[1] == item
          ) {
            jQuery(jQuery('jmnode')[items]).addClass('active')
          }
        })
      })
      //选择节点 ---------------------------------------
      breakingArrclick()
    } else {
      // 取消断点派发
      stateBreaking = false
      breakingArr = []
      $store.dispatch({ type: 'SELECT_DISTRIBUTE_DATE', data: breakingArr })
      jQuery('.root_o .okr_text_content,.isokr').css({ opacity: 'inherit', filter: 'inherit' })
      jQuery('.task_okr .okr_text_content').css({ opacity: 'inherit', filter: 'inherit' })
      jQuery('jmnode.accomplish .okr_text_content').css({ opacity: 'inherit', filter: 'inherit' })
      jQuery('.root_o,.task_okr,jmnode.accomplish,.planTabBox,.planAccomplish,.timeInput').css({
        'pointer-events': 'inherit',
      })
      jQuery('jmnode .node_portrait.portrait')
        .parents('.okr_text_content')
        .css({ opacity: 'inherit', filter: 'inherit' })
      jQuery('jmnode .node_portrait.portrait')
        .parents('jmnode')
        .css({ 'pointer-events': 'inherit' })
      jQuery('jmnode').removeClass('active')
      jQuery('.WorkPlanMindoperate,.WorkPlanMindRightMeun,.add_mind_map,.pattern_type').show()
    }
    rightClick()
  }
  //点击选择节点
  const breakingArrclick = () => {
    jQuery('jmnode')
      .off()
      .click(function(e) {
        if (!stateBreaking) {
          return
        }
        let jmnodes: any = ''
        if (jQuery(e.target).parents('jmnode').length == 0) {
          jmnodes = jQuery(e.target)
        } else {
          jmnodes = jQuery(e.target).parents('jmnode')
        }
        jmnodes.hasClass('active') ? jmnodes.removeClass('active') : jmnodes.addClass('active')
        if (jmnodes.hasClass('active')) {
          breakingArr.push(parseInt(jmnodes.attr('nodeid').split('###')[1]))
        } else {
          breakingArr.splice(
            breakingArr.findIndex((item: any) => item == parseInt(jmnodes.attr('nodeid').split('###')[1])),
            1
          )
        }
        jQuery('.countDistribute').text(`(${breakingArr.length})`)
        $store.dispatch({ type: 'SELECT_DISTRIBUTE_DATE', data: breakingArr })
      })
  }
  //断点派发及全部派发回调刷新
  const sevaDistr = (statusChoose: any, typeIds: any) => {
    console.log(statusChoose, typeIds)
    if (fromToType == 1) {
      //四象限
      $store.dispatch({ type: 'PLANSTATEARR', data: '' })
      setTimeout(() => {
        $store.dispatch({ type: 'PLANSTATEARR', data: '1,2' })
      }, 500)
    }
    if (!statusChoose) {
      //派发所有
      refreshNodeMap('distribute_all', {
        data: '106',
      })
    } else {
      refreshNodeMap('distribute_Choose', {
        data: typeIds,
      })
      // showMindMapEmpty('') //刷新全部
    }
    statisticDistr()
    //更新头部状态
    settitStatus()
  }
  //统计可派发得数量
  const statisticDistr = () => {
    const param = {
      mainId: setNodedatas('').getMindId, //根节点id
      id: setNodedatas('').getrootId, //根节点ID
    }
    statisticDistrApi(param).then((resdata: any) => {
      jQuery('.countDistribute').text(`(${resdata.data})` || '')
    })
  }
  //*****************************************脑图节点内容展示*****************************************//
  //标签类型
  const filterTaskType = (type: number) => {
    switch (Number(type)) {
      case 1:
        return <span className="taskTypeLabel boardXm">项目</span>
      default:
        return <span className="taskTypeLabel boardRw">任务</span>
      // case 0:
      //   return <span className="taskTypeLabel boardMb">目标</span>
      // case 1:
      //   return <span className="taskTypeLabel boardLs">临时</span>
      // case 2:
      //   return <span className="taskTypeLabel boardZn">职能</span>
      // case 3:
      //   return <span className="taskTypeLabel boardXm">项目</span>
    }
  }
  getItemsFu = (item: any) => {
    return getItemHtml(item)
  }
  //脑图节点内容
  const getItemHtml = (item: any) => {
    let isOkrtext = null
    let isOkrrate = null
    let OKRtext = null //图标
    let isOkrrateshow = false
    let okrRange = null // 信心指数
    const priIcon = $tools.asAssetsPath(`/images/task/${item.icon}.png`)
    if (item.type == '2' || item.type == '3') {
      //okr(图标/名称/信心指数)
      isOkrrateshow = true
      let _text = ''
      let isokrclass = ''
      if (item.type == 2) {
        _text = 'O'
        isokrclass = 'O_okr'
      } else if (item.type == 3) {
        _text = 'KR'
        isokrclass = 'KR_okr'
      }
      OKRtext = <span className={`isokr ${isokrclass}`}>{_text}</span>
      isOkrtext = (
        <div className="okr_text_Box text_Box_okr">
          {item.icon && (
            <span
              className="okr_icon"
              data-id={item.icon}
              // style={item.icon ? { background: `url(${priIcon}) no-repeat` } : {}}
            >
              <img
                src={priIcon}
                style={{
                  width: '100%',
                }}
              />
            </span>
          )}
          <span className="okr_task_name">{item.name}</span>
          {item.type == 3 ? <span className="confidence">{item.cci || 0}/10</span> : null}
          {item.files ? <span className="specail-show-file"></span> : null}
          {/* 附件 */}
          {item.themes ? <span className="specail-show-themes"></span> : null}
          {/* 沟通 */}
          <br />
          {getItemContent(item, 'message_task')}
          <br />
        </div>
      )
      if (item.type == '3') {
        //KR显示信心指数
        okrRange = (
          <div className="eidt_Kr_Process">
            <Slider
              min={0}
              max={10}
              onAfterChange={(value: any) => {
                dragConfidence(value)
              }}
              defaultValue={item.cci}
            />
          </div>
        )
      }
    } else {
      //任务
      let isdialogue = null
      let meetings = null
      let okrfiles = null
      let themes = null
      let isgenre = null
      isgenre = filterTaskType(item.taskType)
      const _propertyTrue = item.name == '******' //他人派发且私密任务
      if (item.type == '4' || item.type == '41') {
        //协同
        if (item.taskFlag == 0) {
          //派发成功
          isdialogue = <span className="isdialogue dialog_succeed"></span>
        } else {
          isdialogue = <span className="isdialogue"></span>
        }
      }
      if (item.process >= 0 && item.taskStatus != -1 && (item.status == 4 || item.status == 3)) {
        //进度
        isOkrrateshow = true
      }
      if (item.property > 0 && (item.status == 4 || item.status == 3) && _propertyTrue) {
        //私密派发
        themes = null
        meetings = null
        okrfiles = null
      }
      //任务名称及信息
      isOkrtext = (
        <div className="okr_text_Box text_Box_task">
          {item.icon && (
            <span
              className="okr_icon"
              data-id={item.icon}
              // style={item.icon ? { background: `url(${priIcon}) no-repeat` } : {}}
            >
              <img
                src={priIcon}
                style={{
                  width: '100%',
                }}
              />
            </span>
          )}
          {getItemContent(item, 'priority')}
          <span className="okr_task_name">{item.name}</span>
          {isdialogue}
          {meetings}
          {okrfiles}
          {themes}
          {isgenre}
          {item.files ? <span className="specail-show-file"></span> : null}
          {/* 附件 */}
          {item.themes ? <span className="specail-show-themes"></span> : null}
          <span className="icon_task">{getItemContent(item, 'icon')}</span>
          <br />
          {getItemContent(item, 'message_task')}
        </div>
      )
    }
    //头像---------------
    let nodePortrait = null
    let noPro = ''
    if (!item.liableUserProfile && !item.liableUsername) {
      noPro = 'portrait'
    }
    nodePortrait = (
      <div className={`node_portrait ${noPro}`}>
        <Tooltip title={item.liableUsername}>
          <Avatar className="oa-avatar" src={item.liableUserProfile} size={34}>
            {item.liableUsername ? item.liableUsername.substr(-2, 2) : '?'}
          </Avatar>
        </Tooltip>
        <span
          className="edit_portrait"
          onClick={(e: any) => {
            if (initfrom == 'workbench') {
              return
            }
            confidenPortrait(e)
          }}
        ></span>
      </div>
    )
    //是否完成------------
    let isaccomplish = ''
    if (item.status == 5 || item.taskStatus == 2) {
      //完成
      isaccomplish = ' accomplish complete'
    } else if (item.status == 4 || item.status == 3) {
      //派发
      isaccomplish = ' accomplish'
    }
    //进度 -------------------
    if (isOkrrateshow) {
      isOkrrate = (
        <div className="row_progress">
          <Progress
            strokeColor={'#4285f4'}
            trailColor={'#e9f2ff'}
            type={'circle'}
            percent={item.process}
            format={percent => `${percent}`}
            width={40}
            strokeWidth={12}
          ></Progress>
          <div className="show_progress">
            <input
              type="number"
              className="ant-input"
              min="0"
              max="100"
              data-val={item.typeId}
              onKeyPress={(event: any) => {
                const invalidChars = ['-', '+', 'e', 'E']
                if (invalidChars.indexOf(event.key) !== -1) {
                  event.preventDefault()
                }
              }}
              onChange={(e: any) => {
                changeInputVal(e)
              }}
              onBlur={e => {
                editprocessVal(e.target.value, item.typeId)
              }}
            />
          </div>
        </div>
      )
    }
    return (
      <div className={`okr_text_content ${isaccomplish}`}>
        {/* O/KR标识 */}
        {OKRtext}
        {/* 头像 */}
        {nodePortrait}
        {/* 内容 */}
        {isOkrtext}
        {/* 进度 */}
        {isOkrrate}
        {/* OKR信心指数 */}
        {okrRange}
      </div>
    )
  }
  //添加标记及图标信息
  const getItemContent = (item: any, type: string) => {
    if (type == 'icon') {
      //显示状态图标
      //添加循环图标
      const iconArr: any = []
      if (item.cycleNum >= 0) {
        if (item.cycleNum == 0) {
          iconArr.push(
            <span
              key={item.taskFlag}
              // style={{ background: `url(${$tools.asAssetsPath('/images/common/xun.png')}) no-repeat` }}
            >
              <img
                src={$tools.asAssetsPath('/images/common/xun.png')}
                style={{
                  width: '100%',
                }}
              />
            </span>
          )
        } else {
          return (
            <span
              key={item.taskFlag}
              style={{
                display: 'inline-block',
                width: 'inherit',
                padding: '0px 2px',
                height: '16px',
                textAlign: 'center',
                lineHeight: '16px',
                color: 'white',
                background: '#6DA7DB',
                borderRadius: '2px',
                fontSize: '12px',
                verticalAlign: 'text-bottom',
              }}
            >
              循{item.cycleNum}
            </span>
          )
        }
      }
      //添加审批图标
      if (item.status == 2 || item.approvalStatus > 0) {
        iconArr.push(
          <span
            key={item.taskFlag}
            // style={{ background: `url(${$tools.asAssetsPath('/images/common/shen.png')}) no-repeat` }}
          >
            <img
              src={$tools.asAssetsPath('/images/common/shen.png')}
              style={{
                width: '100%',
              }}
            />
          </span>
        )
      }
      //添加延迟图标
      if (item.taskStatus == 3) {
        iconArr.push(
          <span
            key={item.taskFlag}
            // style={{ background: `url(${$tools.asAssetsPath('/images/common/yan.png')}) no-repeat` }}
          >
            <img
              src={$tools.asAssetsPath('/images/common/yan.png')}
              style={{
                width: '100%',
              }}
            />
          </span>
        )
      }
      //添加完成图标
      if (item.taskStatus == 2) {
        iconArr.push(
          <span
            key={item.taskFlag}
            // style={{ background: `url(${$tools.asAssetsPath('/images/common/wan.png')}) no-repeat` }}
          >
            <img
              src={$tools.asAssetsPath('/images/common/wan.png')}
              style={{
                width: '100%',
              }}
            />
          </span>
        )
      }
      //添加删除图标
      if (item.taskStatus == -1) {
        iconArr.push(
          <span
            key={item.taskFlag}
            // style={{ background: `url(${$tools.asAssetsPath('/images/common/shan.png')}) no-repeat` }}
          >
            <img
              src={$tools.asAssetsPath('/images/common/shan.png')}
              style={{
                width: '100%',
              }}
            />
          </span>
        )
      }
      //添加私密图标
      if (item.property > 0) {
        iconArr.push(
          <span
            className="mi"
            key={item.taskFlag}
            // style={{ background: `url(${$tools.asAssetsPath('/images/common/si.png')}) no-repeat` }}
          >
            <img
              src={$tools.asAssetsPath('/images/common/si.png')}
              style={{
                width: '100%',
              }}
            />
          </span>
        )
      }
      //添加冻结图标
      if (item.taskFlag == 1) {
        iconArr.push(
          <span
            key={item.taskFlag}
            // style={{ background: `url(${$tools.asAssetsPath('/images/common/dong.png')}) no-repeat` }}
          >
            <img
              src={$tools.asAssetsPath('/images/common/dong.png')}
              style={{
                width: '100%',
              }}
            />
          </span>
        )
      }
      //添加归档图标
      if (item.taskFlag == 3) {
        iconArr.push(
          <span
            key={item.taskFlag}
            // style={{ background: `url(${$tools.asAssetsPath('/images/common/gui.png')}) no-repeat` }}
          >
            <img
              src={$tools.asAssetsPath('/images/common/gui.png')}
              style={{
                width: '100%',
              }}
            />
          </span>
        )
      }
      //添加强制汇报图标
      if (item.hasForce == 1) {
        iconArr.push(
          <Tooltip title={'强制汇报'} key={item.taskFlag + 22}>
            <span
            // style={{ background: `url(${$tools.asAssetsPath('/images/common/gui.png')}) no-repeat` }}
            >
              <img
                src={$tools.asAssetsPath('/images/common/mandatory.png')}
                style={{
                  width: '100%',
                }}
              />
            </span>
          </Tooltip>
        )
      }
      return <figure key={item.typeId}>{iconArr}</figure>
    } else if (type == 'message_task' || type == 'message_kr') {
      let startTime = ''
      let endTime = ''
      const day = item.day
      let nodeText = item.nodeText || ''
      let isshow = false //任务起止时间
      let isshow2 = true //任务归属
      let stylew = 'mixw65'
      let days = ''
      if (!item.nodeText) {
        nodeText = '  ?  '
        stylew = 'mixw50'
      } else {
        if (item.nodeText.length > 5 && item.nodeText.length <= 7) {
          stylew = 'ww100'
        } else if (item.nodeText.length > 8) {
          stylew = 'ww135'
        }
      }
      if (item.startTime) {
        if (item.startTime.indexOf('-') != -1) {
          startTime =
            item.startTime.split(' ')[0].split('-')[1] + '/' + item.startTime.split(' ')[0].split('-')[2]
        } else if (item.startTime.indexOf('/')) {
          startTime = item.startTime.split('/')[1] + '/' + item.startTime.split('/')[2].split(' ')[0]
        }
        isshow = true
      }
      if (item.endTime) {
        if (item.endTime.indexOf('-') != -1) {
          endTime = item.endTime.split(' ')[0].split('-')[1] + '/' + item.endTime.split(' ')[0].split('-')[2]
        } else if (item.endTime.indexOf('/')) {
          endTime = item.endTime.split('/')[1] + '/' + item.endTime.split('/')[2].split(' ')[0]
        }
        isshow = true
      }
      const _propertyTrue = item.nodeText == '******' //他人派发且私密任务
      if (item.property > 0 && (item.status == 4 || item.status == 3) && _propertyTrue) {
        //私密派发
        isshow = false
        isshow2 = false
      }
      if (type == 'message_kr') {
        days = ' 剩余'
      } else if (type == 'message_task') {
        if (item.status == 4 || item.status == 3) {
          //派发显示剩余 未派发显示共
          days = ' 剩余'
        } else {
          days = ' 共'
        }
      }
      return (
        <span className="okr_message">
          {isshow2 ? (
            <span
              className={`okr_affiliation ${stylew}`}
              onClick={() => {
                if (initfrom == 'workbench') {
                  return
                }
                selectUser('affiliation')
              }}
            >
              <i
                className="nodeaffiliation"
                data-userid={item.liableUser}
                data-username={item.nodeText}
                data-useraccount={item.userAccount}
                data-deptid={item.deptId}
                data-deptname={item.deptName}
                data-roleid={item.roleId}
                data-rolename={item.roleName}
                data-ascriptiontype={item.ascriptionType}
              ></i>
              {nodeText}
            </span>
          ) : null}
          {isshow ? (
            <span style={{ width: 'auto' }} className="task_day">
              {/* <i className="okr_startTime timeInput" data-time={item.startTime || ''}>
                {startTime || ' ? '}
              </i>{' '}
              ~
              <i className="okr_endTime timeInput" data-time={item.endTime || ''}>
                {endTime || ' ? '}
              </i> */}
              <DatePicker
                className="okr_startTime timeInput"
                style={{ width: item.startTime ? '38px' : '10px' }}
                locale={locale}
                bordered={false}
                showNow={false}
                showTime={{
                  defaultValue: item.startTime ? moment(new Date(item.startTime), 'MM/DD') : undefined,
                }}
                value={item.startTime ? moment(new Date(item.startTime), 'MM/DD') : null}
                format="MM/DD HH:mm"
                placeholder="?"
                allowClear={false}
                inputReadOnly={true}
                disabled={!item.update}
                onClick={e => {
                  e.stopPropagation()
                }}
                onOk={e => {
                  timestype = 1
                  setDate(e)
                }}
              />
              <span>~</span>
              <DatePicker
                className="okr_endTime timeInput"
                locale={locale}
                bordered={false}
                showNow={false}
                showTime={{
                  defaultValue: item.endTime ? moment(new Date(item.endTime), 'MM/DD') : undefined,
                }}
                value={moment(new Date(item.endTime), 'MM/DD')}
                format="MM/DD HH:mm"
                placeholder="?"
                allowClear={false}
                showToday={false}
                inputReadOnly={true}
                disabled={!item.update}
                onClick={e => {
                  e.stopPropagation()
                }}
                onOk={e => {
                  timestype = 2
                  setDate(e)
                }}
              />
              {day || day == 0 ? <span>{days}</span> : null}
              {day || day == 0 ? <span className="task_days blues">{day}</span> : null}
              {day || day == 0 ? <span>天</span> : null}
            </span>
          ) : null}
        </span>
      )
    }
  }
  //*****************************************脑图相关操作*****************************************//
  //选择成员插件
  const selectUser = (types: string) => {
    jQuery('.portrait_okrMain').hide()
    if (!editAuth('', '') || stateBreaking) {
      return
    }
    const params = {
      id: setNodedatas('').getTypeId, //当前节点
    }
    const url = '/task/getPersonByLiable'
    let selectLists: any = []
    // 查询已选成员
    btnseventPlanSaveApi(params, url).then((resData: any) => {
      const datas = resData.data
      selectLists = []
      if (datas.ascriptionId) {
        selectLists.push({
          cmyId: setNodedatas('').getcmyId,
          cmyName: setNodedatas('').getcmyName,
          ascriptionId: datas.ascriptionId,
          userId: datas.userId,
          userName: datas.username,
          curId: datas.userId,
          curName: datas.username,
          curType: 0,
          deptId: datas.deptId,
          deptName: datas.deptName,
          roleId: datas.roleId,
          roleName: datas.roleName,
        })
        if (datas.ascriptionType == 3 && !datas.deptName) {
          //部门
          selectLists[0].deptName = datas.ascriptionName
          selectLists[0].deptId = datas.ascriptionId
          selectLists[0].curName = datas.ascriptionName
          selectLists[0].curId = datas.ascriptionId
        } else if (datas.ascriptionType == 31 && !datas.roleName) {
          //岗位
          selectLists[0].roleName = datas.ascriptionName
          selectLists[0].roleId = datas.ascriptionId
          selectLists[0].curName = datas.ascriptionName
          selectLists[0].curId = datas.ascriptionId
        } else if (datas.ascriptionType == 2 && !datas.curName) {
          selectLists[0].curName = datas.ascriptionName
          selectLists[0].curId = datas.ascriptionId
        }
      }
      let initSelMemberOrg: any = {}
      initSelMemberOrg = {
        teamId: setNodedatas('').getcmyId,
        sourceType: '', //操作类型
        allowTeamId: [setNodedatas('').getcmyId],
        selectList: [...selectLists], //选人插件已选成员
        checkboxType: 'radio',
        isDel: false, //是否可以删除 true可以删除
        permissionType: types == 'affiliation' ? 1 : 3, //组织架构通讯录范围控制
        checkableType: [0, 2, 3], //部门 企业 人员都可选择
        visible: true,
      }
      setSelMemberOrg(initSelMemberOrg)
    })
  }
  //选择成员设置数据
  const selMemberSure = (dataList: any, info: { sourceType: string }) => {
    const datas = dataList[0]
    if (!datas) {
      return
    }
    if (info.sourceType == 'shareToUser') {
      const sourceItem = $store.getState().planModalObj.sourceItem || {}
      const typeIds: any = []
      dataList.map((item: any) => {
        typeIds.push(item.curId)
      })
      //共享到人-------------------
      shareToUserSave({
        id: sourceItem.id, //节点id
        type: 1, //类型：0个人 1项目组
        typeIds: typeIds, //类型id
        name: sourceItem.name,
        mainId: sourceItem.mainId,
        typeId: sourceItem.typeId,
      })
    } else {
      //更改归属 ------------------
      const taskStatus: any = setNodedatas('').getStatus //_status:1 未派发 2 审核中 31/32 部分已派发 4 派发 3 部分派发  5 已完成
      const taskType: any = setNodedatas('').gettaskType //O KR 2 3
      const selectedId: any = setNodedatas('').getSelectedNode
      if (selectedId.parent) {
        if (selectedId.parent.data.taskType == 1 && datas.curType == '2') {
          //大于第二层的任务不能选择企业归属
          message.warning('子任务不能选择为企业归属')
          return
        }
      }
      //派发走任务变更归属(调用任务变更属性接口) -----------------
      if ((taskStatus == 4 || taskStatus == 3) && taskType != 2 && taskType != 3) {
        affiliationFn('1', datas) // 更改任务归属(需判断走审批状态)
      } else {
        //未派发走任务变更归属(调用工作规划变更归属接口) -----------------
        affiliationFn('2', datas)
      }
    }
  }
  //变更归属
  const affiliationFn = (types: string, datas: any) => {
    if (types == '2') {
      //未派发
      const param = {
        id: setNodedatas('').getTypeId, //任务id
        ascriptionId: datas.curId, //归属Id
        ascriptionType: datas.curType, //归属类型0个人2企业 3部门
        deptId: datas.deptId || datas.cmyId, //部门Id
        roleId: datas.roleId, //岗位Id
        userId: datas.userId || datas.curId, //用户Id
        account: datas.account, //帐号
        operateUser: $store.getState().nowUserId,
        operateUserName: $store.getState().nowUser,
      }
      const url = '/task/transFer/workPlanTransferTask'
      affiliationApi(param, url).then((resData: any) => {
        // const parameter = {
        //   nodeId: setNodedatas('').getNodeId,
        //   typeId: setNodedatas('').getTypeId,
        //   mindId: setNodedatas('').getMindId,
        //   unfold: jmCompany.get_selected_node().expanded,
        //   showMind: true,
        // }
        // topoRefreshMind(parameter, 'ref')
        refreshNodeMap('affiliation_draft', {
          data: '',
        })
      })
    } else {
      //已派发
      let liableModel = {}
      if (datas.curType == 0) {
        liableModel = {
          deptId: datas.deptId,
          deptName: datas.deptName,
          roleId: datas.roleId,
          roleName: datas.roleName,
          userId: datas.userId || datas.curId,
          username: datas.userName || datas.curName,
        }
      }
      const param = {
        liable: liableModel, //领导责任
        attach: {
          star: '',
          type: datas.curType, //0 个人  2企业  3部门
          typeId: datas.curId,
        },
        id: setNodedatas('').getTypeId,
        operateUser: $store.getState().nowUserId,
        operateUserName: $store.getState().nowUser,
      }
      const url = '/task/modify/id'
      affiliationApi(param, url).then((resData: any) => {
        // const parameter = {
        //   nodeId: setNodedatas('').getNodeId,
        //   typeId: setNodedatas('').getTypeId,
        //   mindId: setNodedatas('').getMindId,
        //   unfold: jmCompany.get_selected_node().expanded,
        //   showMind: true,
        // }
        // topoRefreshMind(parameter, 'ref')
        refreshNodeMap('affiliation_payout', {
          data: '',
        })
        setPortraitshow(false)
      })
    }
  }
  //常用联系人查询
  const confidenPortrait = (e: any) => {
    if (!editAuth('', '') || stateBreaking) {
      return
    }
    setPortraitshow(true)
    dispatch({
      type: 'mouselocation',
      data: {
        x: e.clientX,
        y: e.clientY,
      },
    })
    const param = {
      userId: $store.getState().nowUserId,
      account: $store.getState().nowAccount,
      onlyUser: 1, //0不查岗位 1 查
      permissionType: 3, //0子管理 1任务 2关注人
      pageSize: 10,
      teamId: setNodedatas('').getcmyId, //归属id
      type: 0, //查询类型  1 团队  2 企业
    }
    const url = '/team/teamUserInfo/findContacts'
    confidenPortraitApi(param, url).then((resdata: any) => {
      const datas = resdata.dataList
      dispatch({
        type: 'setPortraitlist',
        data: datas,
      })
    })
    jQuery('.portrait_okrMain').show()
  }
  //设置常用联系人
  const setTopContacts = (param: any) => {
    const params = {
      id: setNodedatas('').getNodeId, //当前节点
      parentId: setNodedatas('').getParentId, //父级元素id
      mainId: setNodedatas('').getMindId, //根节点id
      typeId: setNodedatas('').getTypeId, //任务id
      operateUser: $store.getState().nowUserId, //操作人
      liableUser: param.liableUser,
      liableUsername: param.liableUsername,
      deptId: param.deptId,
      deptName: param.deptName,
      roleId: param.roleId,
      roleName: param.roleName,
    }
    const taskStatus: any = setNodedatas('').getStatus //_status:1 未派发 2 审核中 31/32 部分已派发 4 派发 3 部分派发  5 已完成
    const taskType: any = setNodedatas('').gettaskType //O KR 2 3
    //派发走任务变更归属(调用任务变更属性接口) -----------------
    if ((taskStatus == 4 || taskStatus == 3) && taskType != 2 && taskType != 3) {
      const datas = {
        curId: param.liableUser, //归属Id
        curType: 0, //归属类型0个人2企业 3部门
        deptId: param.deptId, //部门Id
        deptName: param.deptName,
        roleId: param.roleId, //岗位Id
        roleName: param.roleName,
        userId: param.liableUser, //用户Id
        userName: param.liableUsername,
        account: param.contactsAccount, //帐号
      }
      affiliationFn('1', datas) // 更改任务归属(需判断走审批状态)
    } else {
      //未派发走任务变更归属(调用工作规划变更归属接口) -----------------
      editOKRtask(params).then(() => {
        // const parameter = {
        //   nodeId: setNodedatas('').getNodeId,
        //   typeId: setNodedatas('').getTypeId,
        //   mindId: setNodedatas('').getMindId,
        //   unfold: jmCompany.get_selected_node().expanded,
        //   showMind: true,
        // }
        // topoRefreshMind(parameter, 'ref')
        refreshNodeMap('topContact_draft', {
          data: '',
        })
        setPortraitshow(false)
      })
    }
  }
  //改变信心指数
  const dragConfidence = (value: any) => {
    const params = {
      id: setNodedatas('').getNodeId, //当前节点
      parentId: setNodedatas('').getParentId, //父级元素id
      mainId: setNodedatas('').getMindId, //根节点id
      typeId: setNodedatas('').getTypeId, //任务id
      operateUser: $store.getState().nowUserId, //操作人
      cci: value, //信心指数
    }
    editOKRtask(params).then(() => {
      // const parameter = {
      //   nodeId: setNodedatas('').getNodeId,
      //   typeId: setNodedatas('').getTypeId,
      //   mindId: setNodedatas('').getMindId,
      //   unfold: jmCompany.get_selected_node().expanded,
      //   showMind: true,
      // }
      // topoRefreshMind(parameter, 'ref')
      refreshNodeMap('cci', {
        data: Number(value),
      })
    })
  }
  //修改进度
  const editprocessVal = (value: any, typeId: any) => {
    const params = {
      id: setNodedatas(typeId).getNodeId, //当前节点
      parentId: setNodedatas(typeId).getParentId, //父级元素id
      mainId: setNodedatas(typeId).getMindId, //根节点id
      typeId: setNodedatas(typeId).getTypeId, //任务id
      operateUser: $store.getState().nowUserId, //操作人
      process: value, //进度
    }
    editOKRtask(params).then(() => {
      if (setNodedatas(typeId).getisroot) {
        //更新头部状态
        settitStatus()
      }
      if (Number(value) == 100) {
        const parameter = {
          nodeId: setNodedatas(typeId).getNodeId,
          typeId: setNodedatas(typeId).getTypeId,
          mindId: setNodedatas(typeId).getMindId,
          // unfold: !params.parentId ? true : false,
          unfold: jmCompany.get_node('###' + typeId + '###').expanded,
          showMind: true,
        }
        topoRefreshMind(parameter, 'ref')
      } else {
        refreshNodeMap('process', {
          data: Number(value),
        })
      }
    })
  }
  //新增节点
  const addNodes = (type: number) => {
    const nodeId = setNodedatas('').getNodeId
    const typeId = setNodedatas('').getTypeId
    const mindId = setNodedatas('').getMindId
    const params = {
      id: setNodedatas('').getNodeId, //当前节点
      typeId: setNodedatas('').getTypeId,
      parentId: setNodedatas('').getParentId, //父级元素id
      mainId: setNodedatas('').getMindId, //mindId
      mainTypeId: setNodedatas('').getrootTypeId, //根节点typeid
      position: type, //添加方向 1右 2下 3左 4上
      teamId: setNodedatas('').getcmyId, //企业id
      teamName: setNodedatas('').getcmyName, //企业名称
    }
    addTaskNode(params).then((resdata: any) => {
      const isroots = setNodedatas('').getSelectedNode.isroot
      if (type == 3 && isroots) {
        //根节点新增父级 -------------------------------
        initid = resdata.id
        initTypeId = resdata.typeId
        //第一层新增 删除原有第一层头部数据
        WorkPlanMindTitleData(
          {
            id: resdata.id,
            typeId: resdata.typeId,
          },
          `del-${nodeId}`
        )
        //更新头部信息及状态
        showMindMapEmpty('refinitdata', 'refStatus')
        isinitRef = true
        return
      }
      //更新头部状态
      settitStatus()
      // //局部刷新 >>>>>>>>>
      refreshNodeMap('add', {
        type: type,
        data: resdata,
      })
      // if (type == 3 || type == 2 || type == 4) {
      //   //新增上 下 左 刷新父节点
      //   const parameter = {
      //     nodeId: setNodedatas('').getParentId,
      //     typeId: setNodedatas('').getparentTypeId,
      //     mindId: mindId,
      //     unfold: true,
      //     showMind: true,
      //   }
      //   topoRefreshMind(parameter, 'ref')
      // } else {
      //   const parameter = {
      //     nodeId: nodeId,
      //     typeId: typeId,
      //     mindId: mindId,
      //     unfold: true,
      //     showMind: true,
      //   }
      //   topoRefreshMind(parameter, 'ref')
      // }
    })
  }
  //编辑节点
  const setNode = (datas: any) => {
    if (datas.type == 1) {
      //修改文字 ---------------------
      const params = {
        id: datas.nodeId, //当前节点
        typeId: datas.typeId, //任务id
        parentId: setNodedatas('').getParentId, //父级元素id
        mainId: setNodedatas('').getMindId, //根节点id
        operateUser: $store.getState().nowUserId, //操作人
        name: datas.topic, //任务名称
      }
      editOKRtask(params).then((res: any) => {
        if (res.returnCode == -1 || datas.topic.trim() == '') {
          const _nodeid = jQuery('.okrnode').attr('nodeid')
          const selectedNode = jmCompany.get_node(_nodeid)
          jmCompany.update_node(selectedNode.id, selectedNode.topic, 'tsx')
          return
        }
        const nodeId = datas.nodeId
        const typeId = datas.typeId
        // const mindId = setNodedatas('').getMindId
        // const expanded = jmCompany.get_node('###' + typeId + '###').expanded
        // const parameter = {
        //   nodeId: nodeId,
        //   typeId: typeId,
        //   mindId: mindId,
        //   unfold: expanded,
        //   showMind: true,
        // }
        // topoRefreshMind(parameter, 'ref')
        //局部刷新 >>>>>>>>>
        refreshNodeMap('eidtName', {
          data: datas.topic,
          typeId: datas.typeId, //任务id
        })
        //修改根节点需要修改tab头部信息
        if (jmCompany.get_node('###' + typeId + '###').isroot) {
          newmindTitleData.map((item: any, index: number) => {
            if (item.id == nodeId) {
              return (item.name = datas.topic)
            }
          })
          dispatch({
            type: 'mind_title_tata',
            data: [...newmindTitleData],
          })
        }
      })
    }
  }
  //删除节点
  const deleteNodes = () => {
    const _typeId = ''
    const params = {
      id: setNodedatas(_typeId).getNodeId, //当前节点
      typeId: setNodedatas(_typeId).getTypeId, //任务id
      mainId: setNodedatas(_typeId).getMindId, //根节点id
      mainTypeId: setNodedatas(_typeId).getrootTypeId, //根节点typeid
      name: setNodedatas(_typeId).getSelectName, //任务名称
      operateUser: $store.getState().nowUserId, //操作人
      isDel: undefined, //是否删除O下面及所有任务
      firstId: setNodedatas(_typeId).getrootId, //第一个根节点ID
      isAll: '1', //删除单个还是整链 1整链
    }
    deleteNodesApi(params).then(() => {
      //刷新父节点
      const parameter = {
        nodeId: setNodedatas(_typeId).getParentId,
        typeId: setNodedatas(_typeId).getparentTypeId,
        mindId: mindId,
        unfold: true,
        showMind: true,
      }
      topoRefreshMind(parameter, 'ref')
    })
  }
  //拖动节点
  const moveNodes = (datas: any) => {
    const fromId = jmCompany.get_node(datas.fromId).data.nodeId
    const toId = jmCompany.get_node(datas.toId).data.nodeId
    const fromParentId = jmCompany.get_node(datas.fromParentId).data.nodeId
    const fromName = jmCompany.get_node(datas.fromId).data.names
    const toName = jmCompany.get_node(datas.toId).data.names
    const fromTasktype = jmCompany.get_node(datas.fromId).data.taskType
    const toTasktype = jmCompany.get_node(datas.toId).data.taskType
    const params = {
      parentId: fromParentId,
      fromId: fromId,
      toId: toId,
      formName: fromName,
      toName: toName,
      operateUser: $store.getState().nowUserId,
      toOrdinal: 1, //序号（暂时不做默认为1）
      mainId: setNodedatas('').getMindId, //根节点id
      id: 0, //后台默认参数
    }
    //kr在O下拖动直接进入排序
    if (fromTasktype == 3 && toTasktype == 2) {
      sortNodes(datas)
      moveRef(datas, params)
      return
    }
    //移动
    okrMoveNodes(params).then(() => {
      sortNodes(datas)
      moveRef(datas, params)
    })
  }
  //拖动刷新
  const moveRef = (datas: any, params: any) => {
    const toId = jmCompany.get_node(datas.toId).data.nodeId
    //更新数据
    const parameterF = {
      nodeId: jmCompany.get_node(datas.fromParentId).data.nodeId,
      typeId: jmCompany.get_node(datas.fromParentId).data.typeId,
      mindId: params.mainId,
      unfold: true,
      showMind: false,
      from: 'moveNodes',
    }
    const parameter = {
      nodeId: toId,
      typeId: jmCompany.get_node(datas.toId).data.typeId,
      mindId: params.mainId,
      unfold: true,
      showMind: false,
      from: 'moveNodes',
    }
    topoRefreshMind(parameterF, 'ref')
    const node = jmCompany.mind.move_node(datas.nodeid, datas.beforeid, datas.parentid, datas.direction)
    if (!!node) {
      topoRefreshMind(parameter, 'ref')
      //局部更新
      refreshNodeMap('movenodes', {
        fromId: datas.fromId,
        nodeid: datas.nodeid,
        beforeid: datas.beforeid,
        parentid: datas.parentid,
        direction: datas.direction,
        beforePid: datas.beforePid,
      })
    }
  }
  //排序
  const sortNodes = (datas: any) => {
    //排序
    const beforeNodesId = datas.beforeNodes ? datas.beforeNodes.data.typeId : 0
    const taskId = jmCompany.get_node(datas.fromId).data.typeId
    const parentTaskId = jmCompany.get_node(datas.toId).data.typeId
    const sortParams = {
      mainId: setNodedatas('').getMindId,
      taskId: taskId, //移动的任务id
      parentTaskId: parentTaskId, //移动后的规划的父任务id
      downTaskId: beforeNodesId, //移动后的任务位置的下面任务的id
      userId: $store.getState().nowUserId, //操作人
      status: planStateArr || '1,2', //状态查询1未完成，2完成，3归档
    }
    setSortNodes(sortParams).then(() => {})
  }
  //修改时间
  const setDate = (value: any) => {
    const times = moment(value).format('YYYY/MM/DD HH:mm')
    let startTime = setNodedatas('').getstartTime
    let endTime = setNodedatas('').getendTime
    if (timestype == 1) {
      //开始时间
      startTime = times
    } else if (timestype == 2) {
      //结束时间
      endTime = times
    }
    const params = {
      id: setNodedatas('').getNodeId, //当前节点
      typeId: setNodedatas('').getTypeId, //任务id
      parentId: setNodedatas('').getParentId, //父级元素id
      mainId: setNodedatas('').getMindId, //根节点id
      operateUser: $store.getState().nowUserId, //操作人
      startTime: startTime,
      endTime: endTime,
    }
    editOKRtask(params).then((resdata: any) => {
      // const parameter = {
      //   nodeId: setNodedatas('').getNodeId,
      //   typeId: setNodedatas('').getTypeId,
      //   mindId: setNodedatas('').getMindId,
      //   unfold: jmCompany.get_selected_node().expanded,
      //   showMind: true,
      // }
      // topoRefreshMind(parameter, 'ref')
      if (resdata.returnCode != -1) {
        refreshNodeMap('setDate', {
          timestype: timestype,
          data: times,
          startTime: startTime,
          endTime: endTime,
        })
      }
    })
  }
  //操作脑图判断相关权限
  const editAuth = (type: string, params: any) => {
    let isexecute = true
    if (type == 'moveNodes') {
      const nodePamder = jQuery(`jmexpander[nodeid="${params.toId}"]`)
      const nodePamdervis = jQuery(`jmexpander[nodeid="${params.toId}"]`).is(':visible')
      const mindMaptype = $store.getState().mindMapData.form
      if (nodePamder.text() == '+' && nodePamdervis) {
        message.warning('请先展开节点')
        return
      }
      if (mindMaptype == 'workbench') {
        return
      }
      const taskFlag = jmCompany.get_node(params.fromId).data.taskFlag //=2草稿任务 !=2派发后的任务
      const draftAuth = jQuery('.OKR_map_content').attr('data-auth') //'true'有操作权限--草稿
      const _update = jmCompany.get_node(params.fromId).data.update
      const status = jmCompany.get_node(params.fromId).data.status
      const taskStatus = jmCompany.get_node(params.fromId).data.taskStatus
      const _genreStatus = jmCompany.get_node(params.fromId).data.genreStatus
      const _genreParentStatus = jmCompany.get_node(params.toId).data.genreStatus
      const _genreType = jmCompany.get_node(params.toId).data.taskType //1:任务、2:O 、3:KR、4/41:协同、5:待办计划
      const isBreaking =
        jQuery('.breaking_distribute')
          .find('span')
          .text() == '取消选择' //断点派发
      if (draftAuth == 'false') {
        isexecute = false
        message.warning('没有权限拖动')
      } else if (isBreaking) {
        isexecute = false
      } else if (taskStatus == 2) {
        isexecute = false
        message.warning('已完成不能拖动')
      } else {
        isexecute = true
        // if (_genreStatus != _genreParentStatus && _genreType != 2 && _genreType != 3) {
        //   //任务类型不一致
        //   isexecute = false
        //   Modal.confirm({
        //     title: '操作提示',
        //     icon: <ExclamationCircleOutlined />,
        //     content: `拖动到此会将此${isgenreStatus(_genreStatus)}任务变成${isgenreStatus(
        //       _genreParentStatus
        //     )}任务，确认拖动？`,
        //     okText: '确认',
        //     cancelText: '取消',
        //     onOk() {
        //       isexecute = true
        //       moveNodes(params)
        //     },
        //   })
        // }
      }
      // if (!isexecute) {
      //   const nodeItem = jmCompany.get_node(params.fromId).data.nodeitem
      //   const _topic = getItemsFusHtml(nodeItem)
      //   jmCompany.update_node(jmCompany.get_node(params.fromId).id, _topic, 'tsx')
      // }
    } else {
      if (!setNodedatas('').getSelectedNode) {
        return
      }
      //权限s -----------------------------
      const taskFlag = setNodedatas('').getSelectedNode.data.taskFlag //=2草稿任务 !=2派发后的任务
      const tsakAuth = setNodedatas('').getSelectedNode.data.update //true有操作权限--任务
      const draftAuth = jQuery('.OKR_map_content').attr('data-auth') //'true'有操作权限--草稿
      if (taskFlag == 2 && draftAuth == 'false') {
        //草稿权限
        isexecute = false
      }
      if (taskFlag != 2 && !tsakAuth) {
        //任务权限
        isexecute = false
      }
      //权限e -----------------------------
    }
    return isexecute
  }
  //任务类型判断
  // const isgenreStatus = (type: any) => {
  //   let _text = ''
  //   if (type == 0) {
  //     _text = '目标'
  //   } else if (type == 1) {
  //     _text = '临时'
  //   } else if (type == 2) {
  //     _text = '职能'
  //   } else if (type == 3) {
  //     _text = '项目'
  //   }
  //   return _text
  // }
  //获取相关参数
  const getnodesParam = (id?: any, typeId?: any) => {
    const url = '/task/work/plan/queryTree'
    const param = {
      mainId: mindId, //根节点id
      id: id ? id : setNodedatas('').getNodeId,
      typeId: typeId ? typeId : setNodedatas('').getTypeId,
      operateUser: $store.getState().nowUserId,
      level: '', //1查询当前层及以下所有任务
      hasOther: '1', //是否查询其他 0否 1是
      hasSelf: 1, //是否查询当前任务信息，0否 1是
      queryStatus: planStateArr || '1,2', //状态查询1未完成，2完成，3归档
    }
    return {
      url,
      param,
    }
  }
  //*****************************************获取脑图节点*****************************************//
  //获取脑图节点
  const setNodedatas = (newtypeId: any) => {
    /**
     * _id: 选中节点的id(任务id typeId)
     * _nodeId:选中节点的唯一id
     * _typeId: 选中节点的任务id(任务id)
     * _selected_node:当前选中节点
     * _selected_nodeID:当前选中节点nodeid
     * _taskType:当前选中节点的类型 1:任务、2:O 、3:KR、4/41:协同、5:待办计划
     * _genreStatus://0目标、1临时 、2职能、3项目
     * _select_name:当前选中节点名称
     * _status:1 未派发 2 审核中 31/32 部分已派发 4 派发 3 部分派发  5 已完成
     * _property:1 私密 0 正常
     * mainId:mainid
     * taskFlag:1:冻结 3归档
     * taskStatus:任务状态 0未开启 1开启 2完成 3延迟 4变更 -1删除
     * isOther:0我的规划信息，1其他人的规划或任务
     * _parentId:父元素id
     * rootId:根节点id
     * _update:是否可以编辑 true可以编辑(根据指派人控制的权限)
     */
    let selectedNode: any = null
    let selectName = ''
    let nodeId = ''
    let typeId = ''
    let parentId = 0
    let parentTypeId = 0
    let rootNode = ''
    let rootId = ''
    let rootTypeId = ''
    let cmyId = ''
    let cmyName = ''
    let startTime = ''
    let endTime = ''
    let status = ''
    let taskType: any = ''
    let nodeitem = ''
    let rootName = ''
    let isroot = false
    const getMindId: any = mindId
    if (jmCompany) {
      if (jmCompany.get_selected_node()) {
        selectedNode = jmCompany.get_selected_node() // as parent of new node
        nodeId = jmCompany.get_selected_node().data.nodeId
        typeId = jmCompany.get_selected_node().data.typeId
        selectName = jmCompany.get_selected_node().data.names
        startTime = jmCompany.get_selected_node().data.startTime
        endTime = jmCompany.get_selected_node().data.endTime
        status = jmCompany.get_selected_node().data.status
        taskType = jmCompany.get_selected_node().data.taskType
        nodeitem = jmCompany.get_selected_node().data.nodeitem
        isroot = jmCompany.get_selected_node().isroot
        if (jmCompany.get_selected_node().parent) {
          parentId = jmCompany.get_selected_node().parent.data.nodeId
          parentTypeId = jmCompany.get_selected_node().parent.data.typeId
        } else {
          parentId = jmCompany.get_selected_node().data.nodeId
          parentTypeId = jmCompany.get_selected_node().data.typeId
        }
      }
    }
    const parents = document.getElementById('OKR_map_content')
    const roots = parents?.getElementsByClassName('root')[0]
    const mainIdInfo = roots?.getAttribute('nodeid')
    if (mainIdInfo) {
      rootId = jmCompany.get_node(mainIdInfo).data.nodeId
      rootTypeId = jmCompany.get_node(mainIdInfo).data.typeId
      rootName = jmCompany.get_node(mainIdInfo).data.names
      rootNode = jmCompany.get_node(mainIdInfo)
    } else {
      rootId = initid
    }
    if (createType == 1) {
      //入口为详情
      cmyId = initData.teamId
      cmyName = initData.teamName
    } else {
      if (isMyplan) {
        cmyId = myplanOrg.cmyId || initData.teamId
        cmyName = myplanOrg.cmyName || initData.teamName
      } else {
        cmyId = getplanTree.cmyId
        cmyName = getplanTree.cmyName
      }
    }
    if (newtypeId != '') {
      selectName = jmCompany.get_node('###' + newtypeId + '###').data.names
      nodeId = jmCompany.get_node('###' + newtypeId + '###').data.nodeId
      typeId = jmCompany.get_node('###' + newtypeId + '###').data.typeId
      parentId =
        jmCompany.get_node('###' + newtypeId + '###').parent &&
        jmCompany.get_node('###' + newtypeId + '###').parent.data.nodeId
      parentTypeId =
        jmCompany.get_node('###' + newtypeId + '###').parent &&
        jmCompany.get_node('###' + newtypeId + '###').parent.data.typeId
      isroot = jmCompany.get_node('###' + newtypeId + '###').isroot
    }
    return {
      getSelectedNode: selectedNode,
      getSelectName: selectName,
      getNodeId: nodeId,
      getTypeId: typeId,
      getMindId: getMindId,
      getParentId: parentId,
      getparentTypeId: parentTypeId,
      getrootName: rootName,
      getrootNode: rootNode,
      getrootId: rootId,
      getrootTypeId: rootTypeId,
      getcmyId: cmyId,
      getcmyName: cmyName,
      getstartTime: startTime,
      getendTime: endTime,
      getStatus: status,
      gettaskType: taskType,
      getnodeitem: nodeitem,
      getisroot: isroot,
    }
  }
  //*****************************************脑图右键回调*****************************************//
  //脑图右键
  const rightClick = () => {
    jQuery('jmnode').contextmenu(async function(e) {
      if (stateBreaking || jQuery(e.target).parents('.timeInput').length > 0) {
        return
      }
      initclick()
      jQuery('.optBtnMoreList').show()
      e.preventDefault() // 阻止右键菜单默认行为
      e.stopPropagation()
      setPortraitshow(false) //常用联系人
      jQuery('.eidt_Kr_Process').hide()
      const rightMenues = {
        display: 'block',
        pageX: e.pageX,
        pageY: e.pageY,
        row: {
          taskName: setNodedatas('').getnodeitem,
          mainId: setNodedatas('').getMindId,
        },
      }
      // 规划右键添加权限控制
      // const authList = await findAuthList({
      //   typeId: setNodedatas('').getcmyId,
      //   isOnlyGetAuth: true,
      // })
      // 获取规划权限
      // const workplanAuth = getAuthStatus('planFind', authList || [])
      // if (!workplanAuth) return
      const param = {
        id: setNodedatas('').getTypeId,
        userId: $store.getState().nowUserId,
        viewType: 3,
        mainId: setNodedatas('').getMindId,
      }

      findOperationBtn(param).then((resData: any) => {
        if (resData.returnCode == 0 && resData?.dataList && resData.dataList.length != 0) {
          setMenuList({
            rightMenuItem: rightMenues,
            moreMenu: resData.dataList,
            taskinfo: resData.data,
          })
        }
      })
    })
  }
  //右键按钮 1--共享到群 110 -- 共享到人 113--移动规划 与右键按钮数字对应
  const OpenMode = (value: string, data: any) => {
    setTime(undefined)
    if (value == '114' || value == '115') {
      if ((value == '115' && setNodedatas('').getisroot) || (value == '114' && setNodedatas('').getisroot)) {
        if (
          value == '114' &&
          setNodedatas('').getSelectedNode.children.length > 0 &&
          setNodedatas('').gettaskType == 2
        ) {
          //删除O单项判断是否有子任务(更新initData和头部数据) -----------------
          initid = data.data[0]
          initTypeId = data.data[1]
          //第一层新增 删除原有第一层头部数据
          WorkPlanMindTitleData(
            {
              id: setNodedatas('').getNodeId,
              typeId: setNodedatas('').getTypeId,
            },
            `del-${setNodedatas('').getNodeId}`
          )
          //更新头部信息及状态
          showMindMapEmpty('refinitdata', 'refStatus')
          isinitRef = true
        } else {
          //删除整链和删除单链的第一个根节点[判断是否关闭窗口及头部信息] -----------------
          Removemind('removemind', { id: setNodedatas('').getParentId })
        }
      } else {
        //删除单链
        const parameter = {
          nodeId: setNodedatas('').getParentId,
          typeId: setNodedatas('').getparentTypeId,
          mindId: setNodedatas('').getMindId,
          unfold: true,
          showMind: true,
        }
        topoRefreshMind(parameter, 'ref')
        statisticDistr()
        //更新头部状态
        settitStatus()
      }
    } else if (value == '101' || value == '102') {
      //标记成O KR
      if (value == '101') {
        initid = setNodedatas('').getNodeId
        initTypeId = setNodedatas('').getTypeId
        showMindMapEmpty('setmindmapdata', 'noupdate')
      }
      //局部刷新
      refreshNodeMap('signokr', {
        data: value,
      })
    } else if (value == '103') {
      //标记为协同
      refreshNodeMap('signsynergy', {
        data: value,
      })
    } else if (value == '104') {
      //取消标记
      const parameter = {
        nodeId: setNodedatas(data).getNodeId,
        typeId: setNodedatas(data).getTypeId,
        mindId: setNodedatas(data).getMindId,
        unfold: jmCompany.get_selected_node().expanded,
        showMind: true,
      }
      if (setNodedatas(data).getisroot) {
        initid = parameter.nodeId
        initTypeId = parameter.typeId
        showMindMapEmpty('setmindmapdata')
      } else {
        // topoRefreshMind(parameter, 'ref')
        refreshNodeMap('cancelsign', {
          data: value,
        })
      }
    } else if (value == '105' || value == '107') {
      //派发单项、撤回单项派发
      refreshNodeMap('distribute_one', {
        data: value,
      })
      statisticDistr()
      //更新头部状态
      settitStatus()
    } else if (value == '106' || value == '108') {
      //派发整链、撤回整链派发
      refreshNodeMap('distribute_whole', {
        data: value,
      })
      statisticDistr()
      //更新头部状态
      settitStatus()
    } else if (value == '110') {
      //共享到群
      let initSelMemberOrg: any = {}
      initSelMemberOrg = {
        teamId: $store.getState().mindMapData.teamId,
        sourceType: 'shareToUser', //操作类型
        allowTeamId: [$store.getState().mindMapData.teamId],
        selectList: [], //选人插件已选成员
        checkboxType: 'checkbox',
        permissionType: 3, //组织架构通讯录范围控制
        showPrefix: false, //不显示部门岗位前缀
        visible: true,
      }
      setSelMemberOrg(initSelMemberOrg)
    } else if (value == '113' || data == 'del') {
      if (setNodedatas('').getisroot) {
        //删除整链和删除单链的第一个根节点[判断是否关闭窗口及头部信息]
        Removemind('removemind', { id: setNodedatas('').getParentId })
      } else {
        //移动规划
        const parameter = {
          nodeId: setNodedatas('').getParentId,
          typeId: setNodedatas('').getparentTypeId,
          mindId: setNodedatas('').getMindId,
          unfold: true,
          showMind: true,
        }
        topoRefreshMind(parameter, 'ref')
      }
    } else {
      if (value == '112') {
        //图标
        refreshNodeMap('addIcon', {
          data: data,
        })
      } else if ((value == '1' && data == 1) || (value == '1' && data == 3)) {
        //启动data:1 取消完成data:3
        refreshNodeMap('taskStart', {
          data: data,
        })
      } else if (value == '6') {
        //移交
        refreshNodeMap('topContact_draft', {
          data: data,
        })
      } else {
        let unfolds = jmCompany.get_selected_node().expanded
        if (value == '5') {
          //指派刷新当前及子节点
          unfolds = true
        }
        const parameter = {
          nodeId: setNodedatas('').getNodeId,
          typeId: setNodedatas('').getTypeId,
          mindId: setNodedatas('').getMindId,
          unfold: unfolds,
          showMind: true,
        }
        topoRefreshMind(parameter, 'ref')
      }
    }
    if (value == '100') {
      //任务查询一次权限
      refJurisdictions()
    }
    setMenuList({
      rightMenuItem: { display: 'none', row: {} },
      moreMenu: [],
      taskinfo: {},
    })
  }
  //右键事件 右下角 编辑权限共享删除
  const callbackFn = (val: any, data: any) => {
    setTime(Date.parse(new Date().toString()))
    setRightmodal(true)
    setRightmodalinfo({
      type: val,
      data: data,
      teamId: setNodedatas('').getcmyId,
      rootId: setNodedatas('').getrootId, //根节点id
      rootTypeId: setNodedatas('').getrootTypeId, //根节点typeid
      mainId: setNodedatas('').getMindId, //根节点id
      rootName: setNodedatas('').getrootName, //根节点name
    })
    setMenuList({
      rightMenuItem: { display: 'none', row: {} },
      moreMenu: [],
      taskinfo: {},
    })
  }
  removemindFn = (val: any, data: any) => {
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
        switchMap(newmindTitleData[newmindTitleData.length - 1], data.id)
      } else {
        $store.dispatch({ type: 'MINDMAPDATA', data: {} })
        ipcRenderer.send('close_work_mind')
      }
      // 刷新规划列表
      ipcRenderer.send('refresh_plan_list_main')
    }
  }
  //*****************************************局部刷新*****************************************//
  const refreshNodeMap = async (type: any, nodeData: any, taskIds?: any[]) => {
    const selected_node = jmCompany.get_selected_node()
    const getNode = setNodedatas('') //节点
    const nodeId = setNodedatas('').getNodeId
    const typeId = setNodedatas('').getTypeId
    const mindId = setNodedatas('').getMindId
    if (type == 'add') {
      const datas = nodeData.data || ''
      const addtypeId = selected_node.data.typeId
      const nodePamderText = jQuery(`jmexpander[nodeid="${'###' + addtypeId + '###'}"]`).text()
      // 新增任务子任务是未展开状态 局部刷新
      if (nodePamderText == '+' && nodeData.type == 1) {
        const parameter = {
          nodeId: nodeId,
          typeId: typeId,
          mindId: mindId,
          unfold: true,
          showMind: true,
        }
        topoRefreshMind(parameter, 'ref')
        return
      }
      //局部刷新 ------
      jsmindFefFn(type, jmCompany, {
        type: nodeData.type,
        data: datas,
      })
      //请求一次缓存数据 -------
      let addnodeId = null
      let _addtypeId = null
      if (nodeData.type == 1) {
        //新增子任务
        addnodeId = nodeId
        _addtypeId = typeId
      } else if (nodeData.type == 3) {
        //新增父级节点
        addnodeId = selected_node.parent.parent ? selected_node.parent.parent.data.nodeId : ''
        _addtypeId = selected_node.parent.parent ? selected_node.parent.parent.data.typeId : ''
      } else {
        //新增同级上下
        addnodeId = selected_node.parent ? selected_node.parent.data.nodeId : ''
        _addtypeId = selected_node.parent ? selected_node.parent.data.typeId : ''
      }
      const parameterF = {
        nodeId: addnodeId,
        typeId: _addtypeId,
        mindId: mindId,
        unfold: true,
        showMind: false,
        from: 'moveNodes',
      }
      //请求一次缓存数据
      topoRefreshMind(parameterF, 'ref')
      rightClick() // 右键按钮
      initclick()
    } else if (
      type == 'topContact_draft' ||
      type == 'affiliation_draft' ||
      type == 'affiliation_payout' ||
      type == 'taskStart'
    ) {
      statisticDistr()
      //更改责任人及归属需要查询一次后台接口
      getMindMapEmpty(getnodesParam().param, getnodesParam().url).then((resDatas: any) => {
        if (resDatas.returnCode == 0) {
          const resData = resDatas.data
          jsmindFefFn(type, jmCompany, { data: resData })
        }
      })
    } else {
      //标记为协同选择人员后需要请求一次后台获取数据
      if (type == 'signsynergy' && !getNode.getSelectedNode.data.liableUser) {
        getMindMapEmpty(getnodesParam(nodeId).param, getnodesParam(typeId).url).then((resDatas: any) => {
          if (resDatas.returnCode == 0) {
            const resData = resDatas.data
            jsmindFefFn(type, jmCompany, { ...resData, data: nodeData.data })
          }
        })
      } else {
        jsmindFefFn(type, jmCompany, nodeData)
      }
    }
  }
  //更新刷新后脑图数据
  updateRefDatas = (type: string, typeId: any, refData: any) => {
    updateRefData(type, typeId, refData)
  }
  //更新刷新后脑图数据
  const updateRefData = (type: string, typeId: any, refData: any) => {
    //遍历脑图节点递归函数 构造tree
    function jsonRecursionChild(items: any) {
      for (let i = 0; i < items.length; i++) {
        const _taskId = items[i].id.split('###')[1]
        if (typeId == _taskId) {
          if (type == 'eidtName') {
            //更改名称-----
            items[i].names = refData.name
            items[i].topic = refData._topic
            jmCompany.get_node(`###${typeId}###`).data.names = refData.name
            break
          } else if (type == 'setDate') {
            //更改时间-----
            if (refData.timestype == 1) {
              items[i].startTime = refData.time
              jmCompany.get_node(`###${typeId}###`).data.startTime = refData.time
            } else {
              items[i].endTime = refData.time
              jmCompany.get_node(`###${typeId}###`).data.endTime = refData.time
            }
            items[i].day = refData.day
            jmCompany.get_node(`###${typeId}###`).data.day = refData.day
            items[i].topic = refData._topic
            break
          } else if (type == 'process') {
            //更改进度-----
            items[i].process = refData.process
            items[i].topic = refData._topic
            jmCompany.get_node(`###${typeId}###`).data.process = refData.process
            break
          } else if (type == 'cci') {
            //更改信心指数-----
            items[i].cci = refData.cci
            items[i].topic = refData._topic
            jmCompany.get_node(`###${typeId}###`).data.cci = refData.cci
            break
          } else if (
            type == 'topContact_draft' ||
            type == 'affiliation_draft' ||
            type == 'affiliation_payout'
          ) {
            //修改常用联系人||归属-----
            items[i].liableUsername = refData.data.liableUsername
            items[i].liableUserProfile = refData.data.liableUserProfile
            items[i].nodeText = refData.data.nodeText
            items[i].liableUser = refData.data.liableUser
            items[i].topic = refData._topic
            jmCompany.get_node(`###${typeId}###`).data.liableUsername = refData.data.liableUsername
            jmCompany.get_node(`###${typeId}###`).data.liableUserProfile = refData.data.liableUserProfile
            jmCompany.get_node(`###${typeId}###`).data.nodeText = refData.data.nodeText
            jmCompany.get_node(`###${typeId}###`).data.liableUser = refData.data.liableUser
          } else if (type == 'addIcon') {
            //更改图标-----
            items[i].icon = refData.data
            items[i].topic = refData._topic
            jmCompany.get_node(`###${typeId}###`).data.icon = refData.icon
          } else if (type == 'signokr') {
            //标记成o/kr-----
            items[i].taskType = refData.data == 101 ? 2 : 3
            if (refData.data == 102) {
              items[i].cci = 5
              jmCompany.get_node(`###${typeId}###`).data.cci = 5
            }
            items[i].topic = refData._topic
            jmCompany.get_node(`###${typeId}###`).data.taskType = refData.data == 101 ? 2 : 3
          } else if (type == 'signokrchildren') {
            //更改任务属性
            items[i].topic = refData._topic
          } else if (type == 'cancelsign') {
            //取消标记-----
            if (items[i].taskType == 3) {
              //取消KR
              items[i].taskType = refData.data
              items[i].topic = refData._topic
              jmCompany.get_node(`###${typeId}###`).data.taskType = refData.data
              jmCompany.get_node(`###${typeId}###`).data.status = 1
            }
          } else if (type == 'signsynergy' || type == 'cancelsynergy') {
            //标记为协同、取消标记协同-----
            items[i].taskType = refData.data
            items[i].topic = refData._topic
            jmCompany.get_node(`###${typeId}###`).data.taskType = refData.data
          } else if (type == 'distribute_one') {
            //派发单项、撤回单项派发-----
            items[i].status = refData.data == 105 ? 4 : 1
            if (refData.data == 107) {
              //撤回
              items[i].taskFlag = 2
            } else {
              //派发
              if (items[i].taskType == 1) {
                items[i].taskFlag = 0
              }
            }
            items[i].topic = refData._topic
          } else if (type == 'distribute_whole' || type == 'distribute_all' || type == 'distribute_Choose') {
            //派发整链、撤回整链-----
            items[i].status = refData.data
            if (refData.data == 1) {
              //撤回
              items[i].taskFlag = 2
            } else {
              //派发
              if (items[i].taskType == 1) {
                items[i].taskFlag = 0
              }
            }
            items[i].topic = refData._topic
          } else if (type == 'taskStart') {
            //启动、取消完成-----
            items[i].taskStatus = refData.data.taskStatus
            items[i].process = refData.data.process
            items[i].status = refData.data.status
            items[i].topic = refData._topic
            items[i].update = refData.data.update
            jmCompany.get_node(`###${typeId}###`).data.taskStatus = refData.data.taskStatus
            jmCompany.get_node(`###${typeId}###`).data.process = refData.data.process
            jmCompany.get_node(`###${typeId}###`).data.status = refData.data.status
            jmCompany.get_node(`###${typeId}###`).data.update = refData.data.update
          }
        }
        //有childs的时候递归
        if (
          items[i].children != undefined &&
          items[i].children != '' &&
          items[i].children != null &&
          items[i].children instanceof Array
        ) {
          jsonRecursionChild(items[i].children)
        }
      }
    }
    jsonRecursionChild(jmMindMapData)
  }

  return (
    <div className="work_plan_mind_content">
      <WorkPlanMindTitle
        data={state.initData}
        mindId={setNodedatas('').getMindId}
        teamName={initData.teamName || state.initData.teamName}
        titleArr={state.mindTitleData}
        showMap={switchMap}
        status={status}
        changeStatus={changeStatus}
        statusChoose={statusChoose}
        sevaDistr={sevaDistr}
        auth={state.draftAuth.auth}
      ></WorkPlanMindTitle>
      {fromToType == 0 && (
        <Spin spinning={loading} tip={'加载中，请耐心等待'}>
          <div className="workPlanMindMap" style={{ transform: 'scroll(0, 0)' }}>
            <Draggable
              cancel="jmnode"
              position={state.positionXY}
              defaultPosition={{ x: 0, y: 0 }}
              onStop={(e: any, data: any) => {
                dispatch({
                  type: 'positionXY',
                  data: { x: data.x, y: data.y },
                })
              }}
            >
              <div className="OKR_map_content" id="OKR_map_content" style={{ height: '962px' }}></div>
            </Draggable>
          </div>
        </Spin>
      )}
      {fromToType == 1 && (
        <FourQuadrant
          id={state.initData.id || ''}
          typeId={state.initData.typeId || ''}
          status={statusChoose}
          planStateArr={createType == 1 ? planStateArr : undefined}
          settitStatus={settitStatus}
          changeStatus={changeStatus}
        />
      )}
      {/* 右侧列表菜单 */}
      {initfrom != 'workbench' && <WorkPlanMindRightMeun></WorkPlanMindRightMeun>}
      {/* 底部按钮操作 */}
      {initfrom != 'workbench' && fromToType != 1 && createType != 0 && (
        <WorkPlanMindoperate
          mindId={setNodedatas('').getMindId}
          callbackFn={callbackFn}
          planid={state.initData.id}
        ></WorkPlanMindoperate>
      )}
      {/* 选人插件 */}
      {selMemberOrg.visible && (
        <SelectMemberOrg
          param={{
            ...selMemberOrg,
          }}
          action={{
            setModalShow: (visible: boolean) => {
              setSelMemberOrg({ ...selMemberOrg, visible: visible })
            },
            // 点击确认
            onSure: selMemberSure,
          }}
        />
      )}
      {/* 常用联系人 */}
      {portraitshow && (
        <div
          className="portrait_okrMain"
          style={{ left: `${state.mouselocation.x}px`, top: `${state.mouselocation.y}px` }}
        >
          <h5>常用联系人</h5>
          <div className="okr_linkman">
            <ul>
              {state.setPortraitlist.map((item: any, index: number) => {
                return (
                  <li
                    key={index}
                    onClick={() => {
                      setTopContacts({
                        liableUser: item.contactsUser,
                        liableUsername: item.contactsUsername,
                        contactsAccount: item.contactsAccount,
                        deptId: item.contactsDeptId || item.contactsTeamId,
                        deptName: item.contactsDeptName || item.contactsTeamName,
                        roleId: item.contactsRoleId,
                        roleName: item.contactsRoleName,
                      })
                    }}
                  >
                    <div className="left_box">
                      <Tooltip title={item.contactsUsername}>
                        <Avatar className="oa-avatar" src={item.profile} size={34}>
                          {item.contactsUsername ? item.contactsUsername.substr(-2, 2) : '?'}
                        </Avatar>
                      </Tooltip>
                    </div>
                    <div className="right_box">
                      <span className="name">{item.contactsUsername}</span>
                      <span>{item.contactsRoleName}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
          <h5>更多联系人</h5>
          <div
            className="more_linkman"
            onClick={() => {
              selectUser('user')
            }}
          >
            <div className="left_box">
              <span></span>
            </div>
            <div className="right_box">组织架构</div>
          </div>
        </div>
      )}
      {/* 选择派发 */}
      {statusChoose && createType == 1 && state.initData.id ? <div className="choice_model">选择模式</div> : ''}
      {/* 列表右键菜单 */}
      {moreMenuList.rightMenuItem.display === 'block' && (
        <TaskMenu
          btnList={moreMenuList.moreMenu}
          classData={moreMenuList.rightMenuItem}
          taskinfo={moreMenuList.taskinfo}
          okrAuth={editAuth('', '')}
          mindId={setNodedatas('').getMindId}
          parentId={setNodedatas('').getParentId}
          openMode={OpenMode}
          callbackFn={callbackFn}
        />
      )}
      {/* 右侧权限、删除规划、共享相关处理 */}
      {rightmodal && (
        <Rightmodal
          info={rightmodalinfo}
          openMode={OpenMode}
          removemind={Removemind}
          mindId={setNodedatas('').getMindId}
          visible={rightmodal}
          type={state.initData.type}
          hasChild={jmMindMapData[0]?.children.length}
          time={time}
          setvisible={(start: any) => {
            setRightmodal(start)
          }}
        ></Rightmodal>
      )}
      {/* 任务详情 */}
      {opentaskdetail && (
        <DetailModal
          param={{
            visible: opentaskdetail,
            from: 'taskManage',
            id: setNodedatas('').getTypeId,
            taskData: { id: setNodedatas('').getTypeId },
          }}
          setvisible={(state: any) => {
            setTaskdetail(state)
          }}
        ></DetailModal>
      )}
      {/* 缓存修改脑图节点数据 */}
      <div style={{ display: 'none' }} className="okrnode"></div>
      <DownLoadFileFooter fromType="workplanMind" />
    </div>
  )
}

export default WorkPlanMind
