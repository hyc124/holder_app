import React, { useContext, useEffect, useRef, useState } from 'react'
import { Dropdown, Menu, message, Tabs, Tooltip } from 'antd'
import { DragSourceMonitor, useDrag, useDrop } from 'react-dnd'
import { compareSort } from '@/src/common/js/common'
import {
  followTabCountList,
  getModuleSize,
  getTabCount,
  myTabCountList,
  workDeskContext,
} from './workDeskModules'
import { deskTabElementMoveApi, saveDeskUserTemplateApi } from './workDeskApi'
import SetModuleCom from './setModuleCom'
import OkrPeriodFiltrate from '../workdesk/okrKanban/OkrPeriodFiltrate'
import { setTodoWeekPlugShowFn } from '../workdesk/TaskListData'
import './deskList.less'
import { refreshOkrKanban } from '../workdesk/okrKanban/okrKanban'
const { TabPane } = Tabs

/**
 * 工作台单个模块组件
 */
export const DeskModuleItem = ({ moduleData }: { moduleData: any }) => {
  // 工作台上下文数据
  const deskContextObj: any = useContext(workDeskContext)
  const { isFollow, moduleRows, moduleCols } = deskContextObj
  const [state, setState] = useState<any>({
    moduleData,
    activeKey: '0',
    activeCode: '',
    refresh: 0, //用于列表刷新监听
    isFullScreen: false, //用户全屏显示
  })
  useEffect(() => {
    const elementModels = moduleData.elements || []
    const activeElement = elementModels[0] || {}
    setState({
      ...state,
      activeCode: activeElement.elementCode || activeElement.code,
      moduleData,
    })
  }, [moduleData.id || moduleData.moduleId])

  // 周期选择组件
  const okrPeriodFiltrateRef = useRef<any>({})

  /**
   * tab切换
   */
  const tabsClick = ({ activeKey, activeCode }: { activeKey: string; activeCode: string; evt?: any }) => {
    setState({ ...state, activeKey, activeCode, refresh: state.refresh + 1 })
  }
  /**
   * 更改标签排序
   * @param sourceItem 源被拖节点
   * @param targetItem 目标节点
   */
  const handeTagSort = (sourceItem: any, targetItem: any) => {
    const Models: any = []
    const elementModels = moduleData.elements || []
    elementModels.forEach((_item: any) => {
      const ele = { ..._item }
      if (_item.elementCode == sourceItem.elementCode) {
        ele.elementPosition = parseInt(targetItem.elementPosition)
      }
      if (_item.elementCode == targetItem.elementCode) {
        ele.elementPosition = parseInt(sourceItem.elementPosition)
      }
      Models.push(ele)
    })
    const newModels = Models.sort(compareSort({ property: 'elementPosition', type: 0 }))
    // 更改顺序并且刷新列表数据为当前拖动源标签
    setState({
      ...state,
      moduleData: {
        ...state.moduleData,
        elements: newModels,
      },
      activeKey: sourceItem.elementCode,
      activeCode: sourceItem.elementCode,
      refresh: state.refresh + 1,
    })
  }

  // ==================数据渲染处理====================//
  const elementModels = moduleData?.elementModels || moduleData.elements
  const isOkrModel = elementModels.some(
    (item: any) => item.elementCode == 'okr' || item.elementCode == 'focus_okr'
  )
  // 计算模块宽高
  const moduleSize = getModuleSize({
    startPoint: moduleData.startPoint,
    endPoint: moduleData.endPoint,
    row: moduleRows,
    column: moduleCols,
  })

  const activeElement = elementModels?.find((item: any) => item.elementCode == state.activeCode)
  return (
    <div
      className={`workDeskModuleItem ${activeElement?.elementCode + '_module_item'} ${
        state.isFullScreen ? 'full_screen' : ''
      } ${moduleData.moduleType == 0 && !isOkrModel ? 'half_screen' : ''}`}
      style={{ width: moduleSize.widthPercent, height: moduleSize.heightPx }}
      data-startpoint={JSON.stringify(moduleData.startPoint)}
      data-endpoint={JSON.stringify(moduleData.endPoint)}
    >
      <Tabs
        className="workDeskModuleTabs"
        activeKey={state.activeCode || '0'}
        // onTabClick={tabsClick}
        renderTabBar={(props: any, DefaultTabBar: any) => {
          return RenderTabBar({
            props,
            DefaultTabBar,
            moduleData: state.moduleData,
            activeKey: state.activeKey,
            activeCode: state.activeCode,
            isFollow,
            okrPeriodFiltrateRef,
            tabsClick,
            isFullScreen: state.isFullScreen,
            ptSetState: (paramObj: any) => {
              setState({ ...state, ...paramObj })
            },
          })
        }}
      >
        {state.moduleData.elements?.map((item: any, index: number) => {
          return (
            <TabPane
              key={item.elementCode}
              className="module_tabpane_item"
              tab={
                <DeskTabTitle
                  item={{
                    ...item,
                    elementCode: item.elementCode || item.code,
                    // 兼容新旧版数据格式处理
                    elementTypeName: moduleData.name || item.elementTypeName,
                  }}
                  index={index}
                  moduleId={moduleData.moduleId}
                  handeTagSort={handeTagSort}
                  tabsClick={tabsClick}
                />
              }
            >
              {/* 任务列表组件嵌入 moduleType：0-二分屏 1一分屏 */}
              <SetModuleCom
                elementModels={{
                  ...item,
                  moduleType: moduleData.moduleType || 0,
                }}
                refresh={state.refresh}
                refreshCode={state.activeCode}
                initCode={item.elementCode || item.code}
                isFullScreen={state.isFullScreen}
                workDeskContext={workDeskContext}
                okrPeriodFiltrateRef={okrPeriodFiltrateRef}
              />
            </TabPane>
          )
        })}
      </Tabs>
    </div>
  )
}
/**
 * 模块头部组件
 */
const RenderTabBar = ({
  props,
  DefaultTabBar,
  moduleData,
  activeKey,
  activeCode,
  tabsClick,
  isFullScreen,
  ptSetState,
  isFollow,
  okrPeriodFiltrateRef,
}: {
  props: any
  DefaultTabBar: any
  moduleData: any
  activeKey: string
  activeCode: string
  tabsClick: any
  isFullScreen: boolean
  ptSetState: any
  isFollow: boolean
  okrPeriodFiltrateRef: any
}) => {
  // 工作台上下文数据
  const deskContextObj: any = useContext(workDeskContext)
  const { removeModuleSave, editModuleModalRef, getDeskModule } = deskContextObj
  const { followUserInfo, selectTeamId, nowUserId } = $store.getState()
  const elementModels = moduleData.elements || []
  const activeElement = elementModels?.find((item: any) => item.elementCode == activeCode)
  /**
   * 操作按钮图标
   */
  const renderItemIcon = (name: string) => {
    return (
      <img
        style={{ marginRight: 6, marginTop: -2 }}
        src={$tools.asAssetsPath('/images/workdesk/' + name + '.svg')}
      />
    )
  }
  /**
   * 模块操作下拉列表
   */
  const dropMenu = (
    <Menu
      onClick={props => {
        selectHandleItem({
          key: props.key,
          activeKey,
          activeCode,
          moduleData,
          editModuleModalRef,
          editModuleSure,
          removeModuleSave,
          tabsClick,
          evt: props.domEvent,
        })
      }}
    >
      <Menu.Item key="0" icon={renderItemIcon('flesh_m')}>
        刷新模块
      </Menu.Item>
      <Menu.Item key="1" icon={renderItemIcon('edit_m')}>
        编辑标签
      </Menu.Item>
      <Menu.Item key="2" icon={renderItemIcon('del_m')}>
        删除模块
      </Menu.Item>
    </Menu>
  )

  //操作模块
  const selectHandleItem = ({
    key,
    activeKey,
    activeCode,
    modalTagItemData,
    moduleData,
    editModuleModalRef,
    editModuleSure,
    removeModuleSave,
    tabsClick,
  }: {
    key: React.ReactText
    activeKey: string
    activeCode: string
    moduleData: any
    editModuleModalRef: any
    editModuleSure: any
    removeModuleSave: any
    tabsClick: any
    evt?: any
    modalTagItemData?: any
  }) => {
    if (key === '0') {
      //刷新当前模块
      tabsClick({ activeKey, activeCode })
      // 显示代办标签时间控件
      activeCode == 'to_do' && setTodoWeekPlugShowFn && setTodoWeekPlugShowFn(true)
    } else if (key === '1') {
      //模块编辑器弹框显示
      editModuleModalRef.current &&
        editModuleModalRef.current.setState({
          visible: true,
          modalTagItemData,
          onSure: (backData: any) => {
            editModuleSure({ backData, userId: isFollow ? followUserInfo.userId : nowUserId, getDeskModule })
          },
        })
    } else if (key === '2') {
      //删除模块
      removeModuleSave({ moduleId: moduleData.moduleId || moduleData.id })
    }
  }
  // const context = useContext(contextValue)
  // const
  //模块是否显示任务导入按钮
  // const showImportBtn = () => {
  //   if (elementModels[activeKey]) {
  //     const ActiveKey = elementModels[activeKey].code || elementModels[activeKey].elementCode
  //     const codes = ['function_task', 'working_team_task', 'temporary_work']
  //     const targetSelect = ActiveKey === 'target_kanban'
  //     if ((targetSelect || codes.includes(ActiveKey)) && !followUserInfo.followStatus) {
  //       return true
  //     }
  //     return false
  //   }
  // }
  /**
   * 导入任务处理
   */
  // const importTaskHandle = () => {
  //   findImportTypeApi({
  //     homeType: elementModels[activeKey].id || elementModels[activeKey].elementId,
  //   }).then((res: any) => {
  //     if (res) {
  //       importTaskModalRef.current &&
  //         importTaskModalRef.current.setState({
  //           visible: true,
  //           checkedList: res.data || [],
  //           onSure: importTaskSure,
  //         })
  //     }
  //   })
  // }
  /**
   * 导入任务确认
   */
  // const importTaskSure = ({ checkedList }: any) => {
  //   importTaskSaveApi({
  //     homeType: elementModels[activeKey].id || elementModels[activeKey].elementId,
  //     importType: checkedList,
  //   }).then((res: any) => {
  //     if (res) {
  //       // 刷新界面
  //       const activeCode = getTabCodeByIndexKey(elementModels, parseInt(activeKey))
  //       tabsClick({ activeKey, activeCode })
  //     }
  //   })
  // }

  return (
    <div className="desk_module_header flex center-v between">
      {/* ----左侧---- */}
      <div className="module_header_left">
        {/* 标题 (设计上暂时隐去)*/}
        <div className="desk_module_title flex center-v forcedHide">
          <span className="img_icon module_title_iconL"></span>
          <span className="module_title_text">{moduleData.name || moduleData.moduleName}</span>
          <span className="img_icon module_title_iconR"></span>
        </div>
        {/* 标签列表 */}
        <DefaultTabBar
          {...props}
          className="module_tab_list"
          style={{ margin: 0, border: 0, display: 'none' }}
        />
      </div>
      {/* ----右侧------ */}
      <div className="module_header_right">
        {/* 操作按钮 */}
        <div className="module_handle_group flex center-v">
          <Tooltip title={isFullScreen ? '返回' : '全屏'}>
            <span
              className={`img_icon module_change_btn ${
                isFullScreen ? 'module_lessen_btn' : 'module_enlarge_btn'
              }`}
              onClick={e => {
                e.stopPropagation()
                $store.dispatch({
                  //okr界面的全屏参数
                  type: 'WORKDESK_FULL_SCREEN',
                  data: {
                    visible: !isFullScreen,
                  },
                })
                ptSetState({ isFullScreen: !isFullScreen })
                // 当前点击后是全屏操作
                if (!isFullScreen) {
                  $('.workDeskModuleContent')
                    .animate({ scrollTop: 0 })
                    .css({ overflow: 'hidden' })
                } else {
                  $('.workDeskModuleContent').css({ overflow: 'auto' })
                }
                refreshOkrKanban && refreshOkrKanban({ optType: 'all', taskIds: [] })
              }}
            ></span>
          </Tooltip>
          {/* {showImportBtn() && (
            <Tooltip title="导入任务">
              <span
                className="import_btn"
                onClick={e => {
                  e.stopPropagation()
                  importTaskHandle()
                }}
              ></span>
            </Tooltip>
          )} */}
          {/* okr 周期筛选 */}
          {selectTeamId && elementModels?.findIndex((item: any) => item?.elementCode === 'okr') != -1 && (
            <div className={`${activeElement?.elementCode != 'okr' ? 'forcedHide' : ''}`}>
              <OkrPeriodFiltrate from={'okr_workbench'} isFollow={isFollow} ref={okrPeriodFiltrateRef} />
            </div>
          )}
          {/* 代办事项 事件筛选 */}
          {activeElement?.elementCode === 'to_do' && (
            <Tooltip title="时间">
              <span
                className="week_date_btn"
                onClick={() => {
                  setTodoWeekPlugShowFn && setTodoWeekPlugShowFn()
                }}
              ></span>
            </Tooltip>
          )}
          {!followUserInfo.followStatus && (
            <Tooltip title="操作">
              <Dropdown
                overlay={dropMenu}
                trigger={['click']}
                placement="bottomRight"
                getPopupContainer={() => {
                  const dom: any = document.getElementById('workDeskModuleContent')
                  return dom
                }}
              >
                <span className="module_option_btn"></span>
              </Dropdown>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}
/**
 * 单个标签组件
 */
const DeskTabTitle = (props: {
  item: any
  index: number
  moduleId: any
  handeTagSort: any
  tabsClick: any
}) => {
  const { item, index, moduleId, handeTagSort, tabsClick } = props

  const { elementCode } = item
  // 工作台上下文数据
  const deskContextObj: any = useContext(workDeskContext)
  const { editModuleModalRef, getDeskModule, isFollow } = deskContextObj
  const { nowUserId, followUserInfo, okrPeriodFilter } = $store.getState()
  const tabCountList = isFollow ? followTabCountList : myTabCountList
  const [, drag] = useDrag({
    collect: (monitor: DragSourceMonitor) => ({
      opacity: monitor.isDragging() ? 0.8 : 1,
    }),
    item: { type: 'dropItem', itemData: item },
  })
  const [, drop] = useDrop({
    accept: 'dropItem',
    drop: (_, minoter) => {
      const sourceItem = minoter.getItem().itemData
      const targetItem = item
      //拖拽元素的elementId
      const nowElementId = sourceItem.elementId
      if (nowElementId === targetItem.elementId) {
        return
      }
      //目标元素的index
      const newIndex = targetItem.elementPosition
      deskTabElementMoveApi({
        elementId: nowElementId,
        position: newIndex,
        moduleId,
      }).then((res: any) => {
        if (res) {
          message.success('修改标签位置成功')
          handeTagSort(sourceItem, targetItem)
        }
      })
    },
  })
  const dropRef = useRef<any>(null)
  // 使用 drag 和 drop 对 ref 进行包裹，则组件既可以进行拖拽也可以接收拖拽组件
  drag(drop(dropRef))

  /**
   * 编辑模块弹框显示
   */
  const editModuleShow = ({ modalTagItemData }: any) => {
    editModuleModalRef.current &&
      editModuleModalRef.current.setState({
        visible: true,
        modalTagItemData,
        onSure: (backData: any) => {
          editModuleSure({ backData, userId: isFollow ? followUserInfo.userId : nowUserId, getDeskModule })
        },
      })
  }

  /**
   * 标签统计
   */
  const TabNumCom = ({ moduleNum }: { moduleNum: any }) => {
    const [numState, setNumState] = useState({
      num: moduleNum,
    })
    useEffect(() => {
      setNumState({ ...numState, num: moduleNum })
    }, [moduleNum])

    //TODO 刷新没有123的问题
    return (
      <span className={`${item.elementCode || item.code}_num tab_num ${numState.num < 1 ? 'forcedHide' : ''}`}>
        ({numState.num})
      </span>
    )
  }

  const moduleNum = getTabCount({ code: item.elementCode || item.code, tabCountList })

  const isSet = !isFollow && hasTagSetting({ elementCode })
  return (
    <div
      className="module_tab_item"
      data-code={item.elementCode || item.code}
      ref={dropRef}
      onClick={(evt: any) => {
        evt.stopPropagation()
        tabsClick({ activeKey: index + '', evt, activeCode: item.elementCode || item.code })
      }}
    >
      <>
        <span>{item.name || item.elementName}</span>
        <TabNumCom moduleNum={moduleNum} />
        {isSet && (
          <em
            className="set-tag-icon"
            onClick={(e: any) => {
              e.stopPropagation()
              editModuleShow({ modalTagItemData: item })
            }}
          ></em>
        )}
      </>
    </div>
  )
}

export const funset = ''

/**
 * 编辑模块完成确认
 */
export const editModuleSure = ({
  backData,
  userId,
  getDeskModule,
}: {
  backData: any
  userId: any
  getDeskModule: any
}) => {
  // const url = '/public/homeModule/saveUserTemplate'
  const url = '/public/workbench/module/setTemplateByUser'
  const queryParams: any = {
    userId,
  }
  //数据处理
  const newData = [...backData]
  newData.map((item: any) => {
    let homeModuleModelList = []
    // 旧版接口
    if (url.includes('saveUserTemplate')) {
      homeModuleModelList = [...item.homeModuleModelList]
    } else {
      homeModuleModelList = [...item.modules]
    }
    homeModuleModelList.forEach(element => {
      let elementModels = []
      if (url.includes('saveUserTemplate')) {
        elementModels = [...element.elementModels]
      } else {
        elementModels = [...element.elements]
      }
      const newElementModels: any = []
      elementModels.forEach(_item => {
        if (_item.elementCode !== '') {
          newElementModels.push(_item)
        }
      })
      newElementModels.map((eItem: any, eIndex: any) => {
        eItem.elementPosition = eIndex
      })
      // 旧版接口
      if (url.includes('saveUserTemplate')) {
        element.elementModels = newElementModels
      } else {
        element.elements = newElementModels
      }
    })
  })
  // 旧版接口
  if (url.includes('saveUserTemplate')) {
    queryParams.homeTemplateModelList = newData
  } else {
    queryParams.templates = newData
  }

  //保存模块编辑设置
  saveDeskUserTemplateApi(queryParams, url).then((res: any) => {
    if (res) {
      getDeskModule && getDeskModule() //刷新工作台
    }
  })
}
// 是否选项标签设置按钮
export const hasTagSetting = ({ elementCode }: { elementCode: string }) => {
  if (elementCode.includes('task') && elementCode != 'archive_task' && elementCode != 'working_team_task')
    return true
  return false
}
//根据模块索引获取code
export const getTabCodeByIndexKey = (elementModels: any, key: number) => {
  const selItem = elementModels.filter((_item: any, index: number) => index === key)
  if (selItem.length !== 0) {
    return selItem[0].code || selItem[0].elementCode
  } else {
    return ''
  }
}
