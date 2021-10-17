import React, {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { Input, message, Modal, Select, Tooltip } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import Draggable from 'react-draggable'
import planJsMind from '@/src/components/my-jsmind/jsmind'
import '@/src/components/my-jsmind/jsmind.less'
import '@/src/views/okr-list/okr-mind.less'
import './workPlanMap.less'
import {
  createMindMapApi,
  delPlanMindApi,
  planMindAddNodeApi,
  planMindEditApi,
  queryPlanMindApi,
} from './workPlanMapApi'
import ScaleZoom from '@/src/components/scaleZoom/scaleZoom'
import { setInpCaret } from '@/src/common/js/common'
import { planContext } from '../myWorkPlan'
import { delPlanNew } from '../NewPlanOpt'
const { TextArea } = Input

const { Option } = Select
let jmCompany: any = null

let isFirstInpTxt: any = ''
// 记录keyup次数
let keyUpNum = 0
let planContextObj: any = {}
// 脑图state
let mindStateTmp: any = {
  positionXY: { x: 0, y: 0 },
  dragDisabled: true, //按下空格键才可拖动
}
/**
 * 工作规划脑图模式
 */
export const WorkPlanMap = forwardRef(
  (
    {
      param,
    }: {
      param: {
        headerRef: any
        mainId: any
        planId?: any
        toNewAddMind?: boolean
        optType?: string
        name?: string
      }
    },
    ref
  ) => {
    const { headerRef, mainId, planId, toNewAddMind, optType, name } = param
    planContextObj = useContext(planContext)
    const doc: any = document
    const [state, setMindState] = useState<any>(mindStateTmp)

    /**
     * 设置脑图state
     * @param param
     */
    const setState = (param: any) => {
      mindStateTmp = { ...param }
      setMindState(param)
    }
    /**
     * 初始化监听
     */
    useEffect(() => {
      // 存在optType则是局部刷新，否则是初始全局加载
      if (optType) {
        refreshMind({ planId, mainId, optType, name })
      } else {
        initFn({ planId, mainId })
      }
    }, [planId, mainId, optType])
    /**
     * 初始化节点加载完成
     */
    useLayoutEffect(() => {
      document.addEventListener('keyup', shortcutEventHandle, false)
      document.addEventListener('keydown', keydownHandle, false)
      // 监听浏览器最小化、切换tab、电脑锁屏时
      if (document.hidden !== undefined) {
        document.addEventListener('visibilitychange', visibilityChange, false)
      }

      return () => {
        document.removeEventListener('keyup', shortcutEventHandle, false)
        document.removeEventListener('keydown', keydownHandle, false)
        document.removeEventListener('mousewheel', mousewheelHandle, false)
        document.removeEventListener('visibilitychange', visibilityChange, false)
      }
    }, [])

    /**
     * 暴露给父组件的方法*
     */
    useImperativeHandle(ref, () => ({
      /**
       * 添加节点
       */
      addMindNode,
      /**
       * 刷新方法
       */
      refreshMind,
    }))
    // ====================================事件处理 start================================//
    /**
     * 按键弹起时
     * @param 快捷键
     */
    const shortcutEventHandle = (e: any) => {
      // console.log(e)
      if (e.key == 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        // 新增子节点
        addMindNode({ type: 1 })
      } else if (e.key == 'Delete' || e.key == 'Backspace') {
        // 删除节点
        delMindNode()
      } else if (e.key == 'Alt' || e.code == 'Space' || e.key == 'Control') {
        // 键盘按键Alt、Ctrl弹起时，停止操作，恢复默认(setState方法有延迟，换用jq)
        $('#planJsmind')
          .addClass('disableDrag')
          .css({ cursor: 'default' })
        $('#planMapContainer').css({ cursor: 'default' })
        if (e.key == 'Control') {
          document.removeEventListener('mousewheel', mousewheelHandle, false)
        }
      } else if (e.key == 'ArrowUp') {
        if (!checkFocus()) {
          jmCompany.handle_up()
        }
      } else if (e.key == 'ArrowDown') {
        if (!checkFocus()) {
          jmCompany.handle_down()
        }
      } else if (e.key == 'ArrowLeft') {
        if (!checkFocus()) {
          jmCompany.handle_left()
        }
      } else if (e.key == 'ArrowRight') {
        if (!checkFocus()) {
          jmCompany.handle_right()
        }
      }
    }

    /**
     * 按下快捷键
     */
    const keydownHandle = (e: any) => {
      // 按住Alt拖动脑图画布
      if (e.code == 'Space') {
        if (!checkFocus()) {
          e.preventDefault()
        }
        e.stopPropagation()
        $('#planJsmind')
          .removeClass('disableDrag')
          .css({ cursor: 'move' })
      } else if (e.key == 'Control') {
        // 按住Ctrl放大缩小脑图画布
        $('#planMapContainer,#planJsmind').css({ cursor: 'n-resize' })
        document.addEventListener('mousewheel', mousewheelHandle, false)
      } else if (e.key == 'Enter') {
        // 新增同级节点
        addMindNode({ type: 2 })
      } else if (
        (e.keyCode >= 96 && e.keyCode <= 105) ||
        (e.keyCode >= 48 && e.keyCode <= 57) ||
        (e.keyCode >= 65 && e.keyCode <= 90)
      ) {
        // 小键盘数字键、功能区的数字键、字母键
        const { selectNode } = getMindNodeInfo()
        if (
          selectNode &&
          $(selectNode._data.view.element).find('.name_inp_show') &&
          $(selectNode._data.view.element)
            .find('.name_inp_show')
            .hasClass('forcedHide')
        ) {
          isFirstInpTxt = e.key
          keyUpNum = 0
          const inpNode = $(selectNode._data.view.element).find('.name_inp_show')
          inpNode
            .removeClass('forcedHide')
            .val('')
            .focus()
          $(selectNode._data.view.element)
            .find('.okr_text_show')
            .addClass('forcedHide')
          $(selectNode._data.view.element).css({ height: 'auto' })
        }
      }
    }

    /**
     * 鼠标滚动事件
     * @param paramObj
     */
    const mousewheelHandle = (e: any) => {
      const wheel = e.wheelDelta
      // 上滚 放大脑图
      if (wheel > 0) {
        scaleZoom(1)
      } else {
        scaleZoom(2)
      }
    }
    /**
     * 监听浏览器最小化、切换tab、电脑锁屏时
     */
    const visibilityChange = () => {
      console.log(document.hidden)
      if (document.hidden) {
        $('#planJsmind')
          .addClass('disableDrag')
          .css({ cursor: 'default' })
        $('#planMapContainer').css({ cursor: 'default' })
        document.removeEventListener('mousewheel', mousewheelHandle, false)
      }
    }
    /**
     * 脑图操作事件监听
     */
    const handleMind = (
      _: number, //操作类型
      {
        node,
        evt,
      }: { evt: string; data: any[]; node: any; type: any; expanded: any; children: any; topic: any }
    ) => {
      // const boxDom = $('.mindNodeHandleBox')
      switch (String(evt)) {
        case 'select_node': //选中节点
          if (node.isroot) {
            headerRef.current && headerRef.current.setBtnsAuth({ addBrother: false, addChild: true })
          } else {
            headerRef.current && headerRef.current.setBtnsAuth({ addBrother: true, addChild: true })
          }
          break
        case 'un_select_node': //取消选中所有节点后
          headerRef.current && headerRef.current.setBtnsAuth({ addBrother: false, addChild: false })
          break
      }
    }
    // ====================================事件处理 end================================//
    /**
     * 封装脑图数据
     */
    const packMapData = (paramObj: {
      dataList: any
      level: number
      isRoot?: boolean
      parentPosition?: string
      planId: any
      mainId: any
    }) => {
      const { dataList, isRoot, parentPosition, planId, mainId } = paramObj
      const newLevel = paramObj.level || 0
      return dataList.map((item: any, i: number) => {
        const newItem: any = getItemsFun({
          item,
          planId,
          isExpanded: false,
          isRoot,
          thisI: i,
          parentPosition,
          mainId,
          addMindNode,
          headerRef,
          setMindState: setState,
          level: newLevel,
        })
        const thisPos = newItem.position
        if ((item.children && item.children.length > 0) || item.hasChild) {
          return {
            ...newItem,
            children: packMapData({
              dataList: item.children || [],
              isRoot: false,
              parentPosition: thisPos,
              planId,
              mainId,
              level: newLevel + 1,
            }),
          }
        } else {
          return {
            ...newItem,
          }
        }
      })
    }
    /**
     * 初始加载方法 { planId, typeId }
     */
    const initFn = ({ mainId }: any) => {
      // 新接口
      const param: any = {
        planningId: mainId,
      }
      queryPlanMindApi(param).then((res: any) => {
        const resData = res.data
        // 更新头部信息
        const nodeArray = packMapData({ dataList: [resData], isRoot: true, planId, mainId, level: 0 })
        showMindMap(nodeArray[0], 'destroy')
        headerRef && headerRef.current && headerRef.current.setPlanData(resData || {})
      })
    }

    /**
     * 渲染脑图
     * @param nodeArray 节点数据(obj对象)
     * @param type
     */
    const showMindMap = (nodeArray: any, type?: string) => {
      if (type == 'destroy') {
        doc.getElementById('planJsmind').innerHTML = ''
      }
      const options = {
        container: 'planJsmind',
        theme: 'null',
        mode: 'side', //单侧展示，默认右侧
        editable: true,
        rootWay: 0, //根节点渲染方式：0默认 1根节点添加展开收起按钮
        expanderPos: 'bottom', //展开收起按钮位置
        elementOffset: { left: 2, top: 1 }, //元素有边框时，设置元素向左向下偏移量，防止连接线有边宽的空隙，以及上下对不齐
        // dblclickDisable: true, //禁用双击
        /* eslint-disable @typescript-eslint/camelcase */
        view: {
          engine: 'svg',
          lineStyle: 'tactful', //线条样式 path默认 polyline折线
          line_color: '#E7E7E9',
          contentType: 'tsx',
        },
        layout: {
          hspace: 50, //节点间距宽度
          vspace: 20, //节点间距高度
          pspace: 13,
        },
        /* eslint-disable @typescript-eslint/camelcase */
        default_event_handle: {
          enable_click_handle: true,
          enable_dblclick_handle: false,
        },
        shortcut: {
          mapping: {
            addchild: false, // Insert
            addbrother: false, // Enter
            editnode: false, // F2
            delnode: false, // Delete
            toggle: false, // Space
            left: false, // Left
            up: false, // Up
            right: false, // Right
            down: false, // Down
            // left: 37, // Left
            // up: 38, // Up
            // right: 39, // Right
            // down: 40, // Down
          },
        },
        expand_nodes: ({ node }: any) => {
          const children = node.children || []
          if (children.length == 0 && node.data.hasChild > 0) {
            expandChilds({ node })
          }
        },
        // 获取内容宽高
        getTextRect,
      }
      const mind = {
        meta: {
          name: 'planJsMind',
          author: 'hizzgdev@163.com',
          version: '0.4.3',
        },
        format: 'node_tree',
        data: nodeArray,
      }
      // console.log(nodeArray)
      jmCompany = new planJsMind(options)
      jmCompany.show(mind)
      jmCompany.add_event_listener(handleMind)
      // 新增脑图时默认选中
      if (toNewAddMind) {
        jmCompany.select_node(nodeArray.id)
      }
    }

    /**
     * 设置节点内容宽高
     */
    const getTextRect = ({ content, appendElm, node }: any) => {
      const fontSize = node.isroot ? 16 : 14
      let result = {}
      const ele: any = document.createElement('div')
      // mindTextNameTmp的样式需要跟jmnode样式相同才能达到相同宽高
      ele.className = 'mindTextNameTmp'
      ele.style.fontSize = fontSize + 'px'
      ele.style.lineHeight = fontSize + 2 + 'px'
      ele.innerText = content
      appendElm.append(ele)
      result = {
        with: ele.offsetWidth,
        height: ele.offsetHeight,
        // with: ele.clientWidth,
        // height: ele.clientHeight,
      }
      appendElm.removeChild(ele)
      return result
    }
    // ===============================操作方法===========================//
    /**
     * 展开子节点
     */
    const expandChilds = ({ node }: any) => {
      const { mainId, nodeItem } = node.data
      const param: any = {
        id: nodeItem.id,
        planningId: mainId,
      }
      queryPlanMindApi(param).then((res: any) => {
        const resData = res.data?.children || []
        const nodeArray = packMapData({ dataList: resData, planId: nodeItem.id, mainId, level: node.level + 1 })
        addChilds({ children: nodeArray, findNodeId: node.id })
      })
    }
    /**
     * 添加子节点
     */
    const addChilds = ({ children, findNodeId }: any) => {
      jmCompany.add_nodes({ parent_node: findNodeId, nodeList: children })
    }
    /**
     * 添加节点
     * type:添加方向 1右 2下 3左 4上
     */
    const addMindNode = ({ type }: any) => {
      if (!jmCompany.get_selected_node()) {
        return message.warn('您还未选中任何节点', 0.5)
      }
      const { selectData, selectNode, parentData, parentNode } = getMindNodeInfo({
        mindIdName: 'planJsmind',
      })
      if (type == 2 && selectNode.isroot) {
        return
      }
      const isFocus = checkFocus({ element: selectNode._data.view.element })
      if (isFocus) {
        return
      }
      const selInfo = selectData.nodeItem

      // 新接口参数
      const param = {
        id: selInfo.id, //当前节点id
        name: '', //新增节点名字
        planningId: selectData.mainId, //mainId
        position: type, //添加方向 1右 2下 3左 4上
      }
      planMindAddNodeApi(param).then((res: any) => {
        const addItem = res.data || {}
        if (res) {
          addNodeRefresh({ selectNode, selectData, parentData, parentNode, addItem, item: selInfo, type })
        }
      })
    }
    /**
     * 添加后刷新
     */
    const addNodeRefresh = ({ selectNode, selectData, parentNode, addItem, type }: any) => {
      const { hasChild, thisIndex, position } = selectData
      let parentId = '',
        addIndex = 0,
        nodeId = '',
        parentPosition = 0
      const childLen = hasChild ? hasChild + 1 : 0
      // 有多个子节点并未展开时，查询所有子节点后添加进去
      if (type == 1 && hasChild >= 1 && selectNode.children.length == 0) {
        expandChilds({ node: selectNode })
        return
      }
      let newPos = '0'
      let newItem: any = {}
      // let newCont: any = ''
      // 添加方向type： 1右 2下 3左 4上
      if (type == 3) {
        const parentPos = selectNode.isroot ? 'root' : parentNode.data.position
        // 向左添加父级
        nodeId = `${addItem.id}-pos${parentPos}pos`
        // 给根节点向左添加节点时，则新增节点将成为根节点
        const newItem: any = getItemsFun({
          item: addItem,
          planId: selectData.planId,
          isExpanded: false,
          thisI: thisIndex,
          parentPosition: parentPos,
          mainId: selectData.mainId,
          addMindNode,
          isRoot: selectNode.isroot,
          headerRef,
          level: selectNode.level,
        })
        jmCompany.insert_node_parent(selectNode, nodeId, newItem.topic, newItem)
        headerRef && headerRef.current && headerRef.current.setState({ name: '' })
      } else {
        let level = selectNode.level || 0
        if (type == 1) {
          //向右添加子节点
          parentId = selectNode.id
          addIndex = childLen
          parentPosition = position
          level = selectNode.level + 1
        } else if (type == 2) {
          //向下添加兄弟节点
          parentId = parentNode.id
          addIndex = thisIndex + 1
          parentPosition = parentNode.position
        } else if (type == 4) {
          //向上添加兄弟节点
          parentId = parentNode.id
          addIndex = thisIndex <= 0 ? 0 : thisIndex
          parentPosition = parentNode.position
        }
        newPos = `${position}-${addIndex}`
        nodeId = `${addItem.id}-pos${newPos}pos`
        newItem = getItemsFun({
          item: addItem,
          planId: selectData.planId,
          isExpanded: false,
          thisI: addIndex,
          parentPosition,
          mainId: selectData.mainId,
          addMindNode,
          headerRef,
          level,
        })
        if (type == 2) {
          jmCompany.insert_node_after(selectNode, nodeId, newItem.topic, newItem, 1)
        } else if (type == 4) {
          jmCompany.insert_node_before(selectNode, nodeId, newItem.topic, newItem, 1)
        } else {
          jmCompany.add_node(parentId, nodeId, newItem.topic, newItem, addIndex, 1)
        }
      }
    }

    /**
     * 删除节点
     */
    const delMindNode = () => {
      const { selectData, selectNode } = getMindNodeInfo()
      const selInfo = selectData.nodeItem
      const isFocus = checkFocus({ element: selectNode._data.view.element })
      if (isFocus) {
        return
      }
      Modal.confirm({
        title: $intl.get('operateTip'),
        icon: <ExclamationCircleOutlined />,
        content: $intl.get('deleteSureRemind'),
        okText: $intl.get('sure'),
        cancelText: $intl.get('cancel'),
        onOk() {
          // 根节点删除
          if (selectNode.isroot) {
            delPlanNew({ id: selectData.mainId }).then((res: any) => {
              if (res) {
                jmCompany.handle_delnode()
                // 刷新左侧组织架构
                if (selectNode.isroot) {
                  planContextObj.planLeftRef.current.refreshTree({
                    optType: 'del',
                    taskIds: [selectData.mainId],
                    isMind: true,
                  })
                }
              }
            })
          } else {
            // 新接口参数
            const param = {
              id: selInfo.id, //当前节点
              hasChild: 1,
              planningId: selectData.mainId, //根节点id
            }
            delPlanMindApi(param).then((res: any) => {
              if (res) {
                jmCompany.handle_delnode()
              }
            })
          }
        },
      })
    }

    /**
     * 脑图放大缩小
     * type:0还原 1放大 2缩小 3缩略图显示
     */
    const scaleZoom = (type: number) => {
      let zoomFlag = true
      const orgContainer = $('.planMapContainer')
      const percent = orgContainer
        .find('.scale-zoom .zoom_percent')
        .text()
        .replace('%', '')
      let newNum = 0
      if (type == 2) {
        // 缩小
        zoomFlag = jmCompany.view.zoomOut()
        newNum = Number(percent) - 10
      } else if (type == 1) {
        //放大
        zoomFlag = jmCompany.view.zoomIn()
        newNum = Number(percent) + 10
      } else {
        // 还原
        newNum = 100
        zoomFlag = true
        jmCompany.view.setZoom(1)
        // 自动选中根节点
        const { rootNode } = getMindNodeInfo()
        jmCompany.select_node(rootNode.id)
        setState({ ...state, positionXY: { x: 0, y: 0 } })
      }
      if (!zoomFlag) {
        return
      }
      orgContainer.find('.scale-zoom .zoom_percent').html(newNum + '%')
    }

    /**
     * 脑图局部刷新方法
     * optType-操作类型
     */
    const refreshMind = ({ optType, name }: any) => {
      switch (optType) {
        case 'reName': //重命名
          const { rootNode, rootData } = getMindNodeInfo()
          rootData.nodeItem.name = name
          const newItem = getItemsFun({
            item: rootData.nodeItem,
            planId: rootData.planId,
            isExpanded: rootNode.expanded,
            thisI: rootData.position,
            parentPosition: '',
            mainId: rootData.mainId,
            addMindNode,
            isRoot: rootNode.isroot,
            headerRef,
            level: rootNode.level,
          })
          jmCompany.update_node(rootNode.id, newItem.topic, newItem) //更新节点
          headerRef && headerRef.current && headerRef.current.setState({ name })
          break
      }
    }
    return (
      <div className="planMapContainer okr_view_mind oaJsMind flex-1" id="planMapContainer">
        {/* 右下角放大缩小 */}
        <ScaleZoom
          className="radius"
          maxZoom={2}
          scaleZoom={scaleZoom}
          outHandle={true}
          thumbBtn={true}
          thumbSourceId="#planJsmind jmnodes"
        />
        <Draggable
          cancel=".jmNode.child,.disableDrag"
          position={state.positionXY}
          defaultPosition={{ x: 0, y: 0 }}
          onStop={(_: any, data: any) => {
            setState({ ...state, positionXY: { x: data.x, y: data.y } })
          }}
        >
          <div className="planJsmind oaJsMind disableDrag" id="planJsmind"></div>
        </Draggable>
      </div>
    )
  }
)
/**
 * 节点内容
 * @param item
 * @returns
 */
const ItemContent = ({
  item,
  mainId,
  isRoot,
  addMindNode,
  headerRef,
}: {
  item: any
  mainId: any
  addMindNode: any
  headerRef: any
  isRoot?: boolean
  setMindState?: any //第一层组件的setState方法
}) => {
  const [state, setState] = useState({
    editorShow: false,
    name: item.name,
    item,
  })
  useEffect(() => {
    setState({ ...state, item })
  }, [item])
  let addBtns: any = ''
  const stateItem = state.item
  let typeClass = ''
  let nameFlag = ''
  let nameFlagClass = 'flag_no'
  // //1任务、2O 、3KR、4/41协同、5待办计划
  if (stateItem.type == 2) {
    typeClass = 'type_o'
    nameFlagClass = 'flag_o'
  } else if (stateItem.type == 3) {
    typeClass = 'type_kr'
    nameFlag = 'KR'
    nameFlagClass = 'flag_kr'
  } else if (stateItem.type == 1) {
    nameFlag = 'Task'
    nameFlagClass = 'flag_task'
  }
  /**
   * 编辑节点保存
   */
  const editOkrSave = (row: any, param: any) => {
    // 新接口参数
    const newParam: any = {
      id: row.id || '', //当前节点
      planningId: mainId, //根节点id
      ...param,
    }
    return new Promise(resolve => {
      planMindEditApi(newParam).then((res: any) => {
        resolve(res)
      })
    })
  }
  /**
   * 编辑节点名字保存
   */
  const editOkrName = ({
    row,
    newName,
    nodeId,
    noChange,
    thisElm,
  }: {
    row?: any
    newName?: string
    nodeId?: string
    noChange?: boolean
    thisElm?: any
  }) => {
    $(thisElm)
      .parents('.jmNode')
      .removeClass('authHeight')
    $(thisElm).addClass('forcedHide')
    $(thisElm)
      .siblings('.okr_text_show')
      .removeClass('forcedHide')
    // 数据未改变，不调用接口
    if (noChange) {
      setState({ ...state, editorShow: false })
      return
    }
    const { selectData, selectNode, parentNode } = getMindNodeInfo({ nodeId })
    editOkrSave(row, { name: newName }).then((res: any) => {
      if (res) {
        row.name = newName
        const newItem = getItemsFun({
          item: row,
          planId: selectData.planId,
          isExpanded: selectData.isExpanded,
          thisI: selectData.position,
          parentPosition: selectNode.isroot ? '' : parentNode?.data.position,
          mainId: selectData.mainId,
          addMindNode,
          isRoot: selectNode.isroot,
          headerRef,
          level: selectNode.level,
        })
        setState({ ...state, item: row, name: newName, editorShow: false })
        jmCompany.update_node(selectNode.id, newItem.topic, newItem) //更新节点
        // 刷新左侧组织架构
        if (selectNode.isroot) {
          planContextObj.planLeftRef.current.refreshTree({
            optType: 'reName',
            type: 0,
            taskIds: [selectData.mainId],
            // newChild: { id: row.id, name: row.name, type: 0 },
            isMind: true,
          })
        }
      } else {
        setState({ ...state, name: row.name })
      }
      // 更新头部根节点名字
      if (selectNode.isroot && $(selectNode._data.view.element).hasClass('root')) {
        headerRef && headerRef.current && headerRef.current.setState({ name: row.name })
      }
    })
  }

  /**
   * 单个新增节点按钮
   */
  const addNodeBtn = (btnTypes: Array<number>) => {
    const btns: any = []
    btnTypes.forEach((type: any) => {
      let btnChlass = ''
      if (type == 1) {
        btnChlass = 'add_node_right'
      } else if (type == 2) {
        btnChlass = 'add_node_bottom'
      } else if (type == 3) {
        btnChlass = 'add_node_left'
      } else if (type == 4) {
        btnChlass = 'add_node_top'
      }
      btns.push(
        <em
          className={`img_icon ${btnChlass}`}
          onClick={() => {
            addMindNode({ type, item })
          }}
        ></em>
      )
    })
    return btns
  }

  if (isRoot) {
    addBtns = addNodeBtn([1, 3])
  } else {
    addBtns = addNodeBtn([1, 2, 3, 4])
  }
  /**
   * O类型节点名字输入框
   */
  const TextNameInput = ({
    name,
    editorShow,
    id,
  }: {
    name: string
    editorShow: boolean
    id: any
    setInptShow?: any
  }) => {
    const [inpState, setInpState] = useState<any>({
      name,
    })
    useLayoutEffect(() => {
      if (editorShow) {
        const elm: any = document.querySelector(`#name_inp_show_${id}`)
        setInpCaret({ node: elm })
      }
    }, [editorShow])
    return (
      // 使用文本域
      <>
        <TextArea
          autoSize={true}
          id={`name_inp_show_${id}`}
          maxLength={100}
          // contentEditable={true}
          // dangerouslySetInnerHTML={{ __html: inpState.name }}
          placeholder="请输入规划主题"
          className={`name_inp_show ${typeClass} ${editorShow ? '' : 'forcedHide'}`}
          value={inpState.name}
          onChange={(e: any) => {
            const param: any = { ...inpState, name: e.target.value }
            if (isFirstInpTxt) {
              if (/.*[\u4e00-\u9fa5]+.*$/.test(e.target.value) && /[a-z]+/gi.test(e.target.value[0])) {
                param.name =
                  e.target.value.length >= isFirstInpTxt.length
                    ? e.target.value.substr(isFirstInpTxt.length)
                    : e.target.value
                isFirstInpTxt = ''
              }
            }
            setInpState(param)
            if (
              isRoot &&
              $(e.currentTarget)
                .parents('.jmNode')
                .hasClass('root')
            ) {
              headerRef && headerRef.current && headerRef.current.setState({ name: e.target.value })
            }
          }}
          onBlur={(e: any) => {
            if (isFirstInpTxt) {
              isFirstInpTxt = ''
              keyUpNum = 0
            }
            if (stateItem.name != e.target.value) {
              editOkrName({
                row: stateItem,
                newName: e.target.value,
                thisElm: e.currentTarget,
                nodeId: $(e.currentTarget)
                  .parents('.jmNode')
                  .attr('nodeid'),
              })
            } else {
              editOkrName({
                noChange: true,
                thisElm: e.currentTarget,
              })
            }
          }}
          onKeyUp={(e: any) => {
            keyUpNum++
            // 记录第一次输入框的值，输入过快时，有可能是多个字符，不是一个字符，故记录以做删除
            if (isFirstInpTxt && keyUpNum == 1) {
              isFirstInpTxt = e.target.value
              console.log('keyup:', e.key, e.target.value)
              // console.log('新的isFirstInpTxt：', isFirstInpTxt)
            }
            if (e.keyCode == 13) {
              e.stopPropagation()
              const thisElm = e.currentTarget
              // 隐藏输入框后自主失去焦点，进而调用接口
              $(thisElm)
                .parents('.jmNode')
                .removeClass('authHeight')
              $(thisElm).addClass('forcedHide')
              $(thisElm)
                .siblings('.okr_text_show')
                .removeClass('forcedHide')
            } else if (e.key == 'Shift') {
              //Shift切换中英文
              isFirstInpTxt = ''
            }
          }}
          // 阻止冒泡，防止无法选中文本
          onMouseDown={(e: any) => {
            e.stopPropagation()
          }}
        />
      </>
    )
  }

  return (
    <div
      className="okrTextContent flex center-h column"
      onDoubleClick={(e: any) => {
        // 双击时，设置为自动高度
        $(e.currentTarget)
          .parents('.jmNode')
          .addClass('authHeight')
        setState({ ...state, editorShow: true })
      }}
      onMouseDown={() => {
        // 拖动根节点
        if (isRoot) {
          $('#planJsmind')
            .removeClass('disableDrag')
            .css({ cursor: 'move' })
        }
      }}
      onMouseUp={() => {
        // 拖动根节点
        if (isRoot) {
          $('#planJsmind')
            .addClass('disableDrag')
            .css({ cursor: 'default' })
        }
      }}
    >
      <div className={`okr_text_show ${state.editorShow ? 'forcedHide' : ''}`}>
        {/* 简略模式展示 */}
        <div className="briefModeShow flex center-v">
          <em className={`img_icon name_flag ${nameFlagClass}`}>{nameFlag}</em>
          {/* 根节点使用输入框展示名字，其他使用div展示 */}
          <div className={`text_name_show ${typeClass} ${stateItem.name ? '' : 'no_name'}`}>
            {stateItem.name || '请输入规划主题'}
          </div>
        </div>
      </div>
      {/* 编辑输入框 */}
      <TextNameInput
        name={stateItem.name}
        editorShow={state.editorShow}
        id={stateItem.id}
        setInptShow={(visible: boolean) => {
          setState({ ...state, editorShow: visible })
        }}
      />
      {state.editorShow ? '' : <div className="addNodeBox">{addBtns}</div>}
    </div>
  )
}
/**
 * 获取节点信息
 */
export const getMindNodeInfo = (paramObj?: any) => {
  const infoObj = paramObj ? paramObj : {}
  const { mindIdName, jsMindG, nodeId } = infoObj
  const jmGlobal = jsMindG ? jsMindG : jmCompany
  const mindNodeIdName = mindIdName || 'planJsmind'
  // 根节点信息
  let rootData: any = {}
  let rootNode: any = {}
  // 选中节点信息
  let selectData: any = {}
  let selectNode: any = {}
  // 选中节点信息
  let parentData: any = {}
  let parentNode: any = {}
  //   父级信息
  let parentId = '',
    parentTypeId = ''
  if (jmGlobal) {
    const parents = document.getElementById(mindNodeIdName)
    const roots = parents?.querySelector('.root')
    const mainIdInfo = roots?.getAttribute('nodeid')
    if (mindNodeIdName && mainIdInfo) {
      rootNode = jmGlobal.get_node(mainIdInfo)
      rootData = jmGlobal.get_node(mainIdInfo)?.data
    }
    const selNode = nodeId ? jmGlobal.get_node(nodeId) : jmGlobal.get_selected_node()
    selectNode = selNode || {}
    selectData = selectNode?.data
    if (selectNode.parent) {
      parentNode = selectNode.parent
      parentData = parentNode.data
      parentId = parentData.itemId
      parentTypeId = parentData.typeId
    }
  }

  return {
    rootNode,
    selectNode,
    rootData,
    selectData,
    parentNode,
    parentData,
    parentId,
    parentTypeId,
  }
}

/**
 * 脑图头部
 */
export const WorkPlanMapHeader = forwardRef(({ mindRef }: any, ref) => {
  const [state, setState] = useState({
    name: '',
    createUser: '',
    mode: '1',
    planData: {},
    btnsAuth: {
      //按钮权限
      addBrother: false,
      addChild: false,
    },
  })
  /**
   * 暴露给父组件的方法*
   */
  useImperativeHandle(ref, () => ({
    /**
     * 设置state
     */
    setState: (paramObj: any) => {
      setState({ ...state, ...paramObj })
    },
    /**
     * 设置当前规划数据
     */
    setPlanData: (data: any) => {
      setState({ ...state, name: data.name, createUser: data.createUser || '', planData: data.planData })
    },
    /**
     * 按钮权限设置
     */
    setBtnsAuth: (paramObj: any) => {
      setState({ ...state, btnsAuth: { ...state.btnsAuth, ...paramObj } })
    },
  }))
  return (
    <header className="workPlanMapHeader flex column center-h">
      <div className="headerNameRow flex between">
        <div className={`left_con flex-2 plan_name text-ellipsis ${state.name ? '' : 'no_name'}`}>
          {state.name || '未命名'}
        </div>
        <div className="right_con create_user">由{state.createUser}创建</div>
      </div>
      <div className="headerOptRow flex between">
        <div className="left_con flex">
          <Select
            defaultValue="1"
            className="customtype"
            value={state.mode}
            style={{ width: 96 }}
            onChange={(value: any) => {
              setState({ ...state, mode: value })
            }}
          >
            <Option value="1">简略模式</Option>
            <Option value="2">详细信息</Option>
          </Select>
          <div className="mindNodeHandleBox">
            <Tooltip title="添加同级节点">
              <span
                className={`img_icon add_brother ${state.btnsAuth.addBrother ? '' : 'disabledGray'}`}
                onClick={() => {
                  // 向下添加兄弟
                  mindRef.current && mindRef.current.addMindNode({ type: 2 })
                }}
              ></span>
            </Tooltip>
            <Tooltip title="添加子节点">
              <span
                className={`img_icon add_child ${state.btnsAuth.addChild ? '' : 'disabledGray'}`}
                onClick={() => {
                  // 添加子节点
                  mindRef.current && mindRef.current.addMindNode({ type: 1 })
                }}
              ></span>
            </Tooltip>
          </div>
        </div>
        <div className="right_con"></div>
      </div>
    </header>
  )
})
/**
 * 规划脑图区域
 */
const WorkPlanMapArea = forwardRef(
  ({ param }: { param: { mainId: any; planId?: any; toNewAddMind?: boolean; optType?: string } }, ref) => {
    const headerRef = useRef<any>()
    const mindRef = useRef<any>()
    useImperativeHandle(ref, () => ({
      /**
       * 刷新方法
       */
      refreshMind: (param: any) => {
        mindRef.current.refreshMind(param)
      },
    }))
    return (
      <section className="workPlanMapArea flex column h100">
        <WorkPlanMapHeader ref={headerRef} mindRef={mindRef} />
        <WorkPlanMap ref={mindRef} param={{ ...param, headerRef }} />
      </section>
    )
  }
)

/**
 * 公共脑图数据节点
 * @param nodeId
 * @param item
 * @param isExpanded
 * @returns
 */
const getItemsFun = ({
  item,
  isExpanded,
  planId,
  isRoot,
  parentPosition,
  mainId,
  thisI,
  addMindNode,
  headerRef,
  setMindState,
  level,
}: {
  item: any
  isExpanded?: boolean
  planId: any
  isRoot?: boolean
  parentPosition?: any
  mainId: any
  thisI: number
  addMindNode: any
  headerRef: any
  setMindState?: any
  level: number
}) => {
  const parentPos = parentPosition ? parentPosition : 'root'
  const thisPos = `${parentPos}-${thisI}`
  const nodeId = `${item && item.id ? item.id + '-' : ''}pos${thisPos}pos`
  const newItem: any = {
    id: nodeId,
    planId,
    topic: (
      <ItemContent
        item={item}
        isRoot={isRoot}
        addMindNode={addMindNode}
        mainId={mainId}
        headerRef={headerRef}
        setMindState={setMindState}
      />
    ),
    expanded: isExpanded || false, //是否展开
    // direction: 'right', //左右
    hasChild: item.hasChild,
    nodeItem: item, //整个数据对象
    level,
  }

  // 节点内容
  newItem.itemId = item.id
  newItem.isRoot = isRoot
  // 包含父级排序的信息
  newItem.position = thisPos
  // 当前层级中的排序位置
  newItem.thisIndex = thisI
  newItem.planId = planId
  newItem.mainId = mainId
  return newItem
}

/**
 * 新建脑图
 */
export const createMindMap = ({ folderId, name }: { folderId: any; name: string }) => {
  return new Promise(resolve => {
    createMindMapApi({ folderId, name }).then((res: any) => {
      resolve(res.data)
    })
  })
}
/**
 * 检查节点是否选中
 */
const checkFocus = (paramObj?: any) => {
  const infoObj = paramObj ? paramObj : {}
  const { element } = infoObj
  const { selectNode } = getMindNodeInfo()
  let optElm = null
  if (element) {
    optElm = element
  } else if (selectNode && selectNode._data) {
    optElm = selectNode._data.view.element
  }

  if (
    optElm &&
    $(optElm)
      .find('.name_inp_show')
      .is(':focus')
  ) {
    return true
  } else {
    return false
  }
}
export default WorkPlanMapArea
