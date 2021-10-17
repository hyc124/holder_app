import { Avatar, Dropdown, Menu, Spin, Progress } from 'antd'
import React, { forwardRef, useEffect, useImperativeHandle, useReducer, useState } from 'react'
import Draggable from 'react-draggable'
// import OKR_jsMind from '../../components/okr-jsmind/jsmind'
import OKR_jsMind from '../../components/my-jsmind/jsmind'
import './okr-mind.less'
import { inquireAlignApi } from './getData'
import { toOKRWindow } from '../task/taskDetails/detailRight'
import { setAppLoading } from '@/src/components/app-loading/appLoading'
import { queryOkrListById } from '../okr-four/okrTableList/okrTableListApi'
import { getMindNodeInfo } from '../myWorkPlan/workPlanMap/workPlanMap'
// import { getProgressRotate } from '../task/task-com/TaskCom'

// reducer初始化参数
const initStates = {
  positionXY: {}, //定位
}
// state初始化initStates参数 action为dispatch传参
const reducer = (state: any, action: { type: any; data: any }) => {
  switch (action.type) {
    case 'positionXY':
      return { ...state, positionXY: { ...action.data } }
    default:
      return state
  }
}
let refMIND: any = null
export const refMINDFn = () => {
  refMIND()
}
let jmCompany: any = null
let jmMindMapData: any = null
const doc: any = document
const OKRmind = forwardRef((props: any, ref) => {
  const [state, dispatch] = useReducer(reducer, initStates)
  const [loading, setLoading] = useState(false)
  const [mindId, setmindId] = useState()
  let nodeIndex = 0
  useEffect(() => {
    eliminate()
    init({})
    setmindId(props.id)
  }, [props.id])

  useImperativeHandle(ref, () => ({
    /**
     * 刷新对齐视图
     */
    okrMindRefresh,
  }))
  //清除
  const eliminate = () => {
    dispatch({
      type: 'positionXY',
      data: { x: 0, y: 0 },
    })
    $('.okr_view_mind').attr('data-scale', 1)
  }
  //初始化
  const init = ({ mindId, showKr }: { mindId?: any; showKr?: boolean }) => {
    setAppLoading(true)
    const param = {
      planId: mindId ? mindId : props.id,
      type: -1, //类型：0对齐zuo 1关联you -1 对齐+关联（默认）
    }
    const url = 'task/work/plan/relation/getRelationViewList'
    inquireAlignApi(param, url).then((res: any) => {
      setAppLoading(false)
      if (res.returnCode == 0) {
        const resData = res.dataList || []
        const nodeArray = jsonRecursion([...resData], '', showKr, true, 0)
        // const nodeArray2 = jsonRecursion([...resData], '', showKr, true, 2)
        jmMindMapData = nodeArray
        // nodeArray[1] = nodeArray2[0]
        // console.log(jmMindMapData)
        showMindMap(nodeArray, 'destroy')
      }
    })
  }

  //刷新
  refMIND = () => {
    init({ mindId })
  }
  //处理脑图数据
  let _index = 0
  const jsonRecursion = (item: any, children: any, showKr?: boolean, isRoot?: boolean, index?: number) => {
    let newarr = []
    if (children) {
      newarr = children
    }
    for (let i = 0; i < item.length; i++) {
      _index++
      nodeIndex = nodeIndex + 1
      let _id = '###' + item[i].planId + '-' + nodeIndex + '###' + index || ''
      let _hasChild = item[i].hasChild
      if (_index == 1) {
        //初始脑图root 顶层任务
        nodeIndex = nodeIndex + 1
        _id = '###' + item[i].planId + '-' + nodeIndex + '###'
        _hasChild = ''
        item[i].isroot = true
      }
      const obj: any = getItemsFun({
        keyId: _id,
        hasChild: _hasChild,
        item: item[i],
        isExpanded: false,
        showKr,
        isRoot,
      })
      //有childs的时候递归
      if (
        item[i].children != undefined &&
        item[i].children != '' &&
        item[i].children != null &&
        item[i].children instanceof Array
      ) {
        obj.children = [] //有childs不断扩充新的children对象
        newarr.push(obj)
        jsonRecursion(item[i].children, obj.children, showKr, false, index)
      } else {
        newarr.push(obj)
      }
    }
    return newarr
  }

  //查询子任务
  const addChilds = (node: any) => {
    const url = 'task/work/plan/relation/getRelationViewList'
    const param = {
      planId: node.data.nodeId,
      type: node.direction == -1 ? '0' : '1', //类型：0对齐zuo 1关联you -1 对齐+关联（默认）
    }
    inquireAlignApi(param, url).then((resDatas: any) => {
      if (resDatas.returnCode == 0) {
        const resData = resDatas.dataList || []
        const children = jsonRecursion(resData, '', node.data.nodeItem.showKr)
        jmCompany.add_nodes({ parent_node: node.id, nodeList: children })
      }
    })
  }

  //公共脑图数据节点
  const getItemsFun = ({
    keyId,
    hasChild,
    item,
    isExpanded,
    showKr,
    isRoot,
  }: {
    keyId: string
    hasChild: any
    item: any
    isExpanded: boolean
    showKr?: boolean
    isRoot?: boolean
  }) => {
    const getItem = { ...item, showKr }
    const obj: any = {
      id: keyId,
      nodeId: item.planId,
      typeId: item.typeId,
      topic: getItemTsx(getItem),
      names: item.name, //任务名称
      expanded: isExpanded || false, //是否展开
      expandedLeft: isRoot, //根节点左侧按钮是否展开
      hasChild, //是否有子任务
      direction: item.showType == 0 ? 'left' : 'right', //左右
      process: item.process, //进度
      username: item.username, //责任人
      ascriptionType: item.ascriptionType,
      ascriptionId: item.ascriptionId,
      nodeItem: getItem, //整个数据对象
      isroot: isRoot,
    }
    return obj
  }

  //跳转到四象限模式
  const getokrdetails = (listData: any) => {
    const dataItem = {
      id: listData.planId,
      typeId: listData.typeId,
      name: listData.name,
      form: 'okrKanban',
      teamId: listData.teamId,
      teamName: listData.teamName,
      ascriptionType: listData.ascriptionType,
      mainId: listData.mainId,
      okrModeActive: '2', //默认选中详情
    }
    toOKRWindow(dataItem)
  }

  //渲染脑图
  const showMindMap = (nodeArray: any, type?: string) => {
    if (type == 'destroy' && doc.getElementById('OKRjsmind')) {
      doc.getElementById('OKRjsmind').innerHTML = ''
    }
    const options = {
      container: 'OKRjsmind',
      theme: 'null',
      mode: 'full',
      editable: false,
      updateable: true, //是否可更新节点
      rootWay: 1, //根节点渲染方式：0默认 1根节点添加展开收起按钮
      // expanderPos: 'bottom', //展开收起按钮位置
      // 多个根节点时打开
      // format: 'node_trees',
      view: {
        engine: 'svg',
        lineStyle: 'polyline_tactful', //线条样式 path默认 polyline-折线,tactful-曲线
        drawStyle: 'path', //画线条使用的方式
        line_color: '#ACCAF7',
        contentType: 'tsx',
      },
      layout: {
        hspace: 50, //节点间距宽度
        vspace: 20, //节点间距高度
        pspace: 13,
      },
      shortcut: {
        mapping: false,
      },
      expand_nodes: ({ node }: any) => {
        const children = node.children || []
        if (children.length == 0 && node.data.hasChild > 0) {
          addChilds(node)
        }
      },
      select_node: (datas: any) => {
        getokrdetails(datas.node.data.nodeItem)
      },
      scale_view: (val: any) => {
        $('.okr_view_mind').attr('data-scale', val)
      },
      dblclick_view: () => {
        jmCompany.view.setZoom(1, jQuery('.scale-zoom i'))
      },
      // 获取内容宽高
      getTextRect,
    }
    const mind = {
      meta: {
        name: 'OKR_jsMind',
        author: 'hizzgdev@163.com',
        version: '0.4.3',
      },
      // 多个根节点时换成 node_trees，data是数组，单个根节点时node_tree，data是对象
      // format: 'node_trees',
      // data: nodeArray,
      format: 'node_tree',
      data: nodeArray[0],
    }
    jmCompany = new OKR_jsMind(options)
    jmCompany.show(mind)
    initEvent()
  }

  //初始事件
  const initEvent = () => {
    const scales = Number($('.okr_view_mind').attr('data-scale'))
    jmCompany.view.setZoom(scales, jQuery('.scale-zoom i'), 1)
    window.addEventListener(
      'mousewheel',
      function(event: any) {
        event.stopPropagation()
        if (event.ctrlKey === true || event.metaKey) {
          if (event.wheelDelta == 120) {
            //放大
            jmCompany.view.zoomIn(jQuery('.scale-zoom i'))
          } else {
            //缩小
            jmCompany.view.zoomOut(jQuery('.scale-zoom i'))
          }
        }
      },
      { passive: false }
    )
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
  }

  //节点内容
  const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')
  const getItemTsx = (item: any) => {
    let belongClass = ''
    let ascriptText = ' ? '
    if (item.ascriptionType == 2) {
      ascriptText = $intl.get('cmyRank')
      belongClass = 'cmy_rank'
    } else if (item.ascriptionType == 3) {
      ascriptText = $intl.get('deptRank')
      belongClass = 'dept_rank'
    } else if (item.ascriptionType == 0) {
      ascriptText = $intl.get('userRank')
      belongClass = 'user_rank'
    }
    // const percent = item.process || 0
    // const { rotateLeft, rotateRig } = getProgressRotate(percent)
    let profile = item.profile || ''
    if (!item.profile && item.username == $intl.get('others')) {
      profile = headDef
    }
    return (
      <div className={`okr_text_content ${belongClass}`} data-planId={item.planId} data-typeId={item.typeId}>
        <div className="okr_types">
          <span className={`bm ${belongClass}`}>{ascriptText}</span>
        </div>
        <div className="okr_else">
          <span className="okr_avatar">
            <Avatar className="oa-avatar" src={profile} size={16}>
              {item.username ? item.username.substr(-2, 2) : '?'}
            </Avatar>
            <span className="okr_part">{item.username == $intl.get('others') ? ' ? ' : item.username}</span>
          </span>
          <span className="okr_schedule">
            <Progress
              className="okr_schedule_progress"
              type="circle"
              width={16}
              strokeWidth={20}
              trailColor={'#E9F2FF'}
              strokeColor={'#4285F4'}
              showInfo={false}
              percent={item.process || 0}
            />
            {/* <div className="percentCircleCon process_color1">
              <div className="percent-circle percent-circle-left">
                <div className="percentCircleIn left-content" style={rotateLeft}></div>
                <div className="percentCircleIn left-content" style={rotateLeft}></div>
              </div>
              <div className="percent-circle percent-circle-right">
                <div className="percentCircleIn right-content" style={rotateRig}></div>
              </div>
            </div> */}
            <span className="blue">{`${item.process || 0}%`}</span>
          </span>
        </div>
        <div className="okr_names">{item.name}</div>
        {/* 关键结果kr */}
        {item.showKr ? (
          <ul className="krResUl">
            {item.krInfoModels?.map((krItem: any) => {
              return (
                <li key={krItem.id} className="flex krResItem">
                  <span className="kr_res_dot"></span>
                  <span className="kr_res_name flex-1">{krItem.name || ''}</span>
                  <span className="kr_res_process">{krItem.process || 0}%</span>
                </li>
              )
            })}
          </ul>
        ) : (
          ''
        )}
      </div>
    )
  }

  /**
   * 刷新对齐视图
   */
  const okrMindRefresh = ({ findId }: any) => {
    const param = { typeIds: findId }
    queryOkrListById(param).then((res: any) => {
      const dataList = res.dataList || []
      const getData = dataList[0] || {}
      // const findItem: any = { findItem: {} }
      // findNowTask({ dataList: jmMindMapData, findIdType: 'typeId', findItem, findId })
      let newItem: any = null
      const itemData = ({ nodeId }: any) => {
        const { selectNode, selectData } = getMindNodeInfo({
          mindIdName: 'OKR_jsMind',
          jsMindG: jmCompany,
          nodeId,
        })
        const queryItem = selectData?.nodeItem
        const concatItem = findDataToMindItem({ queryItem, newData: getData })
        const showKr =
          $('.modeSelectShow')
            .find('.selected_txt')
            .text() == '展示'
            ? true
            : false
        // console.log(showKr)
        newItem = getItemsFun({
          keyId: selectNode.id,
          hasChild: queryItem.hasChild,
          item: concatItem,
          isExpanded: selectNode.expanded,
          showKr,
          isRoot: selectNode.isroot,
        })
      }
      // 更新所有相同id的节点内容
      $('#OKRjsmind')
        .find('.jmNode>.okr_text_content')
        .each((i: number, textNode: any) => {
          if ($(textNode).attr('data-typeId') == findId) {
            const nodeId = $(textNode)
              .parent()
              .attr('nodeid')
            if (!newItem) {
              itemData({ nodeId })
            }
            jmCompany.update_node(nodeId, newItem.topic, newItem) //更新节点
          }
        })
    })
  }
  /**
   * 将查询的新数据组装为脑图接口数据
   */
  const findDataToMindItem = ({ newData, queryItem }: any) => {
    return {
      ...queryItem,
      planId: newData.id,
      userId: newData.liableUser,
      username: newData.liableUsername,
      profile: newData.liableUserProfile,
      name: newData.name,
      process: newData.process,
      ascriptionType: newData.ascriptionType,
      teamId: newData.teamId,
      teamName: newData.teamName,
    }
  }
  return (
    <Spin spinning={loading} tip={$intl.get('loadingWait')}>
      <div className="okr_view_mind" data-scale={0}>
        {/* 切换模式 */}
        <ModeSelect mindInitFn={init} />
        {/* 定位放大缩小 */}
        <div className="postil_scale">
          <div className="scale-location">
            <span></span>
          </div>
          <div className="scale-zoom">
            <span className="scale-zoom-plus"></span>
            <i>100%</i>
            <span className="scale-zoom-minus"></span>
          </div>
        </div>
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
          <div className="OKRjsmind" id="OKRjsmind" style={{ height: '100%' }}></div>
        </Draggable>
      </div>
    </Spin>
  )
})

/**
 * 节点html内容，填充缓存节点，用于计算高度
 */
const getItemHtml = (item: any) => {
  //节点内容
  const headDef: any = $tools.asAssetsPath('/images/workplan/head_def.png')
  let belongClass = ''
  let ascriptText = ' ? '
  if (item.ascriptionType == 2) {
    ascriptText = $intl.get('cmyRank')
    belongClass = 'cmy_rank'
  } else if (item.ascriptionType == 3) {
    ascriptText = $intl.get('deptRank')
    belongClass = 'dept_rank'
  } else if (item.ascriptionType == 0) {
    ascriptText = $intl.get('userRank')
    belongClass = 'user_rank'
  }
  const profile = item.profile ? item.profile : headDef
  let imgIn = `<img src="${headDef}">`
  if (!profile) {
    imgIn = `<span
    class="ant-avatar-string"
    style="line-height: 16px; transform: scale(0.222222) translateX(-50%);">
      ${item.username ? item.username.substr(-2, 2) : '?'}
      </span>`
  }
  // kr关键结果列表
  let krListBox = ''
  let krList = ''
  item.krInfoModels?.forEach((krItem: any) => {
    krList += `<li class="flex krResItem">
      <span class="kr_res_dot"></span>
      <span class="kr_res_name flex-1">${krItem.name || ''}</span>
      <span class="kr_res_process">${krItem.process || 0}%</span>
    </li>`
  })
  if (item.showKr) {
    krListBox = `<ul class="krResUl">${krList}</ul>`
  }
  const html = ` <div class="okr_text_content ${belongClass}">
  <div class="okr_types">
    <span class="bm">${ascriptText}</span>
  </div>
  <div class="okr_else">
    <span class="okr_avatar">
      <span
        class="ant-avatar ant-avatar-circle oa-avatar"
        style="width: 16px; height: 16px; line-height: 16px; font-size: 18px;"
      >
      ${imgIn}
      </span>
      <span class="okr_part">${item.username == $intl.get('others') ? ' ? ' : item.username}</span>
    </span>
    <span class="okr_schedule">
      <span class="progress_place"></span>
      <span class="blue">${`${item.process || 0}%`}</span>
    </span>
  </div>
  <div class="okr_names">${item.name}</div>
  ${krListBox}
  </div>
`
  return html
}
/**
 * 设置节点内容宽高
 * mindTextNameTmp同jmnode，在其中存取节点内容，与jmnode设置相同样式，以达到相同宽高用来计算节点真实高度
 */
const getTextRect = ({ appendElm, node }: any) => {
  const nodeItem = node.data.nodeItem || {}
  let result = {}
  if (nodeItem.planId == 59614) {
    console.log(nodeItem)
  }
  const itemHtml = getItemHtml(node.data.nodeItem || {})
  // 方法1：js
  const ele: any = document.createElement('div')
  // mindTextNameTmp的样式需要跟jmnode样式相同才能达到相同宽高
  ele.className = 'mindTextNameTmp'
  ele.innerHTML = itemHtml
  appendElm.append(ele)
  // 方法2：jq
  // $(appendElm).append(`<div class="mindTextNameTmp"></div>`)
  // const dom = $('#mindTextNameTmp')
  // dom.prop('outerHTML', itemHtml)
  // dom.html(itemHtml)
  // const ele = dom[0]
  // 公用
  result = {
    with: ele.offsetWidth,
    height: ele.offsetHeight,
  }
  appendElm.removeChild(ele)
  // dom.remove()
  return result
}
/**
 * 切换模式的下拉框
 */
export const ModeSelect = ({ mindInitFn }: any) => {
  const [modeState, setModeState] = useState({
    modeTxt: '不展示',
    activeKey: 1,
  })
  const selectChange = ({ key }: any) => {
    const modeTxt = key == 0 ? '展示' : '不展示'
    setModeState({ ...modeState, modeTxt, activeKey: key })
    if (key == 0) {
      mindInitFn({ showKr: true })
    } else {
      mindInitFn({ showKr: false })
    }
  }
  //查看菜单
  const menu = (
    <Menu className="modeSelDropMenu" onClick={selectChange}>
      <Menu.Item key="0" className={`${modeState.activeKey == 0 ? 'active' : ''}`}>
        展示
      </Menu.Item>
      <Menu.Item key="1" className={`${modeState.activeKey == 1 ? 'active' : ''}`}>
        不展示
      </Menu.Item>
    </Menu>
  )

  return (
    <Dropdown overlay={menu} trigger={['click']} placement={'topCenter'} overlayClassName="modeSelDropBox">
      <div className="modeSelectShow flex center-v">
        <span className="">关键结果：</span>
        <span className="selected_txt">{modeState.modeTxt}</span>
        <em className="img_icon tri_down"></em>
      </div>
    </Dropdown>
  )
}
export default OKRmind
