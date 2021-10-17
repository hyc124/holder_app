import React, { useState, useEffect, useRef } from 'react'
import { Tabs, Tooltip, Dropdown, Menu, Modal, Checkbox, message } from 'antd'
import SetModuleData from './SetModuleData'
import $c from 'classnames'
import { useSelector } from 'react-redux'
import { DragSourceMonitor, useDrag, useDrop } from 'react-dnd'
import { findImportType, importTaskRequest, moveHomeElement, queryDeskTabs, refreshDeskNums } from './getData'
import { useMergeState } from '../chatwin/ChatWin'
import { refreshCheckTask } from './component/CheckTask'
import { refreshReport } from './component/collectedReport'
import { refreshWaitTask } from './component/WaitTask'
import { refreshReportForm } from './component/ReportFormList'
import OkrPeriodFiltrate from '@/src/views/workdesk/okrKanban/OkrPeriodFiltrate'
import { hasTagSetting } from './component/EditModuleModal'
import { okrUpdateRefDataFn } from './okrKanban/okrKanban'
const { TabPane } = Tabs
const CheckboxGroup = Checkbox.Group
interface ModuleItemProps {
  moduleId: number
  moduleName: string
  modulePosition: number
  elementModels: any[]
  moduleType: number
}
interface ItemProps {
  elementName: string
  elementCode: string
  elementPosition: number
}
interface ModuleNumProps {
  count: number
  code: string
}
interface ModuleProps {
  params: {
    data: ModuleItemProps
    index: any
    isMove: boolean
    moduleNums: any
    serachParam?: any
    isFollow?: boolean
  }
  callback: {
    onRemove: (moduleId: number) => void
    onChangeActiveKey: (key: string) => void
    onOptionScreen: (state: boolean, nowKey: string, position: number) => void
    onDragBegin: () => void
    onDragOver: (source: object, target: object) => void
  }
  detailModalRef?: any
}

//根据模块索引获取code
const getTabCodeByIndexKey = (elementModels: any, key: number) => {
  const selItem = elementModels.filter((_item: any, index: number) => index === key)
  if (selItem.length !== 0) {
    return selItem[0].elementCode
  } else {
    return ''
  }
}
//暴露模块刷新方法
let refreshModelItem: any = null
export const moduleItemRefresh = (code: string) => {
  refreshModelItem && refreshModelItem(code)
}
let refreshModelItems: any = null
export const refreshModelWorkItems = (codeArr: any) => {
  refreshModelItems && refreshModelItems(codeArr)
}

export const ModuleItem = ({ params, callback, detailModalRef }: ModuleProps) => {
  const { data, index, isMove, isFollow, serachParam } = params
  const { onRemove, onOptionScreen, onDragBegin, onDragOver, onChangeActiveKey } = callback
  const refCode = ['okr', 'focus_okr', 'check_task', 'wait_receive', 'report_form']
  const selectRef = useRef<any>(null)
  const headerRef = useRef<any>(null)
  const selectTeamId = useSelector((state: StoreStates) => state.selectTeamId)
  const { nowUserId, followUserInfo } = $store.getState()
  const [screenVsible, setScreenVsible] = useState(false)
  const [refreshCode, setRefreshCode] = useState('')
  const [moduleState, setModuleState] = useMergeState({
    activeKey: '0', //储存当前激活TAB
    activeType: '0', //筛选类型
    showImgIcon: false, //导航图标显示状态
    addTaskModal: false, // 控制增加任务模块显示
    moduleHeight: 336, //模块高度
    checkedList: [], //导入任务模态框 选择类型
  })
  //选中TAB的CODE
  const [tabSelCode] = useState(getTabCodeByIndexKey(data.elementModels, parseInt(moduleState.activeKey)))
  const [elementModels, setElementModels] = useState<Array<any>>([])
  //抛出外部调用方法
  refreshModelItem = (code: string) => {
    $(['data-code=' + code + '']).click()
  }
  refreshModelItems = (codeArr: any) => {
    setRefreshCode(codeArr[0])
    codeArr.splice(0, 1)
  }
  const followSelectTeadId = useSelector((state: StoreStates) => state.followSelectTeadId)
  const { newTeamList } = $store.getState()
  const orgId = selectTeamId == -1 ? '' : selectTeamId
  // 缓存okr筛选插件
  let okrPeriodFiltrateRef: any = useRef(null)
  //监听
  useEffect(() => {
    return () => {
      okrPeriodFiltrateRef = null
    }
  }, [])
  useEffect(() => {
    queryDeskTabs({ teamId: selectTeamId < 0 ? 0 : selectTeamId, isFollow })
    setModuleState({ activeType: '0' })
  }, [selectTeamId])
  //监听
  useEffect(() => {
    setElementModels(data.elementModels)
    setTimeout(() => {
      resizeFn()
    }, 100)
    window.addEventListener('resize', resizeFn)
    return () => {
      window.removeEventListener('resize', resizeFn)
    }
  }, [data])
  //操作模块
  const selectHandleItem = (key: React.ReactText, modalTagItemData?: any) => {
    if (key === '0') {
      //刷新当前模块
      if (refCode.includes(tabSelCode)) {
        refreshModule(tabSelCode)
      } else {
        setRefreshCode(tabSelCode)
      }
    } else if (key === '1') {
      //编辑模块
      $store.dispatch({ type: 'SHOW_EDIT_MODAL', data: { visible: true, modalTagItemData } })
    } else if (key === '2') {
      //删除模块
      onRemove(data.moduleId)
    }
  }

  //打开关闭全屏
  const openFullScreen = (moduleId: number, nowKey: string) => {
    const vState = !screenVsible ? true : false
    setScreenVsible(vState)
    $store.dispatch({
      type: 'WORKDESK_FULL_SCREEN',
      data: {
        visible: vState,
        position: !screenVsible ? moduleId : 0,
      },
    })
    onOptionScreen(vState, nowKey, moduleId)
  }
  const renderItemIcon = (name: string) => {
    return (
      <img
        style={{ marginRight: 6, marginTop: -2 }}
        src={$tools.asAssetsPath('/images/workdesk/' + name + '.svg')}
      />
    )
  }
  //模块操作下拉列表
  const dropMenu = (
    <Menu onClick={props => selectHandleItem(props.key)}>
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
  // 查询导入
  const getUploadSelect = () => {
    findImportType({
      userId: nowUserId,
      homeType: elementModels[moduleState.activeKey].elementId,
    }).then((res: any) => {
      if (res.returnCode == 0) {
        setModuleState({ checkedList: res.data })
      }
    })
  }
  // 导入任务
  const importTask = () => {
    importTaskRequest({
      userId: nowUserId,
      homeType: elementModels[moduleState.activeKey].elementId,
      importType: moduleState.checkedList,
    }).then((res: any) => {
      if (res.returnCode == 0) {
        message.success('导入成功')
        setModuleState({ addTaskModal: false })
        // 刷新界面
        const moduleCode = getTabCodeByIndexKey(elementModels, parseInt(moduleState.activeKey))
        setRefreshCode(moduleCode)
      }
    })
  }
  //模块是否显示任务导入按钮
  const showImportBtn = () => {
    if (elementModels[moduleState.activeKey]) {
      const ActiveKey = elementModels[moduleState.activeKey].elementCode
      const codes = ['function_task', 'working_team_task', 'temporary_work']
      const targetSelect = ActiveKey === 'target_kanban' && moduleState.activeType == '0'
      if ((targetSelect || codes.includes(ActiveKey)) && !followUserInfo.followStatus) {
        return true
      }
      return false
    }
  }
  //标签导航切换
  const moveTab = (event: any, _width: number) => {
    jQuery(event.target)
      .parents('.desk-module-header')
      .find('.ant-tabs-nav-list')
      .css('transform', 'translateX(' + _width + 'px)')
  }
  //动态设置模块高度
  const setMHeight = () => {
    const boxHeight = jQuery('.desk-container').height() || 0
    const mh = (boxHeight - 16) / 2
    setModuleState({ moduleHeight: mh })
  }

  //窗口尺寸变化时候，是否显示导航切换按钮
  const resizeFn = () => {
    setMHeight()
    let nowWidth = 0
    const showWidth = $(selectRef.current).outerWidth() || 0
    const antTabs = [...jQuery(selectRef.current).find('.ant-tabs-tab')]
    antTabs.forEach((element: HTMLElement) => {
      nowWidth += getWidth(element) + 20
    })
    if (nowWidth > showWidth) {
      const w = showImportBtn() ? '94px' : '150px'
      setStyle(true, w)
    } else {
      setStyle(false, 'auto')
    }
  }
  const getWidth = (ele: any) => {
    return jQuery(ele).outerWidth(true) || 0
  }
  const setStyle = (state: boolean, _width: string) => {
    setModuleState({ showImgIcon: state })
    jQuery(selectRef.current)
      .find('.ant-tabs-nav-wrap')
      .css({
        width: _width,
      })
  }

  //标签拖拽
  const [{ opacity }, drag] = useDrag({
    begin: () => onDragBegin(),
    collect: (monitor: DragSourceMonitor) => ({
      opacity: monitor.isDragging() ? 0.4 : 1,
    }),
    item: { type: 'modalItem', itemData: data, index },
  })
  const [{ canDrop, isOver }, drop] = useDrop({
    accept: 'modalItem',
    drop: (dragItem, minoter) => {
      const sourceItem = minoter.getItem().itemData
      const targetItem = JSON.parse(dropRef.current.dataset.itemdata)
      onDragOver(sourceItem, targetItem)
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })
  const isActive = canDrop && isOver
  let border = ''
  let height = ''
  let borderRadius = ''
  if (isActive) {
    border = '1px dashed #4285f4'
    height = '51px'
    borderRadius = '8px'
  } else if (canDrop) {
    border = ''
    height = ''
    borderRadius = ''
  }
  const dropRef = useRef<any>(null)
  // 使用 drag 和 drop 对 ref 进行包裹，则组件既可以进行拖拽也可以接收拖拽组件
  drag(drop(dropRef))
  //标签排序
  const comparePosition = (property: string) => {
    return function(a: { [x: string]: any }, b: { [x: string]: any }) {
      const value1 = a[property]
      const value2 = b[property]
      return value1 - value2
    }
  }
  const handeTagData = (sPosition: any, tPosition: any) => {
    const Models: any = []
    elementModels.forEach((_item: any) => {
      const ele = { ..._item }
      if (_item.elementCode == sPosition.elementCode) {
        ele.elementPosition = parseInt(tPosition.elementPosition)
      }
      if (_item.elementCode == tPosition.elementCode) {
        ele.elementPosition = parseInt(sPosition.elementPosition)
      }
      Models.push(ele)
    })
    const newModels = Models.sort(comparePosition('elementPosition'))
    setElementModels(newModels)
  }
  //标签拖拽功能

  //TAB面板切换
  const changeTabs = (activeKey: string) => {
    setModuleState({ activeKey: activeKey })
    onChangeActiveKey(elementModels[activeKey].elementCode)
    const nowCode = getTabCodeByIndexKey(elementModels, parseInt(activeKey))
    // setRefreshCode(nowCode)
    //切换模块收缩所有展开图标
    const moduleName = nowCode + '_module'
    const thisModule = jQuery(`.${moduleName}`)
    const expandIcon = [...jQuery(thisModule).find('.ant-table-row-expand-icon-expanded')]
    expandIcon.forEach(element => {
      jQuery(element)
        .removeClass('ant-table-row-expand-icon-expanded')
        .addClass('ant-table-row-expand-icon-collapsed')
        .attr('aria-label', '展开行')
    })
    //非TaskList组件模块单独处理刷新
    const activeKeyCode = elementModels[activeKey].elementCode
    if (refCode.includes(activeKeyCode)) {
      refreshModule(activeKeyCode)
    } else {
      setRefreshCode(nowCode)
    }

    //最近一次选择的企业企业信息
    refreshDeskNums({
      userId: !isFollow ? nowUserId : followUserInfo.userId,
      isFollow,
    })
  }

  //刷新指定模块
  const refreshModule = (activeCode: string) => {
    switch (activeCode) {
      // case 'target_kanban':
      //   //目标看板
      //   refreshDetails()
      //   break
      case 'check_task':
        //检查项
        refreshCheckTask()
        break
      case 'wait_receive':
        //待收汇报
        refreshReport()
        break
      case 'waitting_task':
        //待办任务
        refreshWaitTask()
        break
      case 'focus_okr':
        //待办任务
        okrUpdateRefDataFn('', 'focus_okr')
        console.log('刷新okr列表数据-------1111111111111111')
        break
      case 'report_form':
        //台账
        refreshReportForm()
        break
    }
  }

  // const getActiveKey = () => {
  //   if (moduleActiveKey.activeKey && moduleActiveKey.modulePosition == data.modulePosition) {
  //     return moduleActiveKey.activeKey
  //   }
  //   return defaultKey
  // }

  return (
    <>
      <div
        // className={$c('fullScreen', { modelscreen: data.moduleType == 0 })}
        className={$c({ screenPanel: screenVsible })}
        style={isMove ? { opacity, borderRadius, height, border, marginBottom: '10px' } : { opacity: 1 }}
      >
        <Tabs
          // defaultActiveKey={getActiveKey()}
          activeKey={moduleState.activeKey}
          className="module-pane"
          style={{ height: !isMove ? moduleState.moduleHeight : '48px' }}
          onChange={activeKey => changeTabs(activeKey)}
          renderTabBar={(props: any, DefaultTabBar: any) => (
            <div
              ref={!screenVsible ? dropRef : headerRef}
              data-itemdata={JSON.stringify(data)}
              className={$c('desk-module-header flex center-v', {
                'desk-module-header-before': data.moduleType == 0 && !screenVsible && !isMove,
              })}
            >
              <span className="desk-tab-iconL"></span>
              <div
                className="desk-tab-title"
                style={moduleState.showImgIcon ? { marginRight: '6px' } : { marginRight: '22px' }}
              >
                <span className="desk-tab-text">{data.moduleName}</span>
                <span className="desk-tab-iconL"></span>
                {isMove && <i></i>}
              </div>
              <span className="desk-tab-iconR"></span>
              {moduleState.showImgIcon && !isMove && (
                <span onClick={e => moveTab(e, 0)} className="module_select_icon m_left"></span>
              )}
              <DefaultTabBar
                {...props}
                className="desk-tab-nav"
                style={{ margin: 0, border: 0 }}
                ref={selectRef}
              />

              {moduleState.showImgIcon && !isMove && (
                <span onClick={e => moveTab(e, -150)} className="module_select_icon m_right"></span>
              )}
              <div className="module-handle-group">
                {/* {!isMove &&
                  selectTeamId &&
                  elementModels[moduleState.activeKey] &&
                  elementModels[moduleState.activeKey].elementCode === 'target_kanban' && (
                    <Tooltip title="筛选">
                      <Dropdown overlay={selectTaskMenu()} trigger={['click']} overlayClassName="select-level">
                        <span className="select_btn"></span>
                      </Dropdown>
                    </Tooltip>
                  )} */}
                {/* 周期筛选 */}
                {!isMove &&
                  selectTeamId &&
                  elementModels[moduleState.activeKey] &&
                  elementModels[moduleState.activeKey].elementCode === 'okr' &&
                  elementModels[moduleState.activeKey].elementCode != 'focus_okr' && (
                    <>
                      <Tooltip title={screenVsible ? '返回' : '全屏'}>
                        <span
                          className={$c({
                            'screen-enlarge-btn': !screenVsible,
                            'screen-enlarge-larg': screenVsible,
                          })}
                          onClick={e => {
                            e.preventDefault()
                            const moduleHeder = $(e.target).parents('.desk-module-header')
                            const element = $(moduleHeder).find('.ant-tabs-tab-active')
                            const module = $(element).find('.moduleElement')
                            const dataCode = $(module).attr('data-code') || ''
                            openFullScreen(data.moduleId, dataCode)
                          }}
                        ></span>
                      </Tooltip>
                      <OkrPeriodFiltrate
                        from={'okr_workbench'}
                        isFollow={isFollow}
                        ref={okrPeriodFiltrateRef}
                      />
                    </>
                  )}
                {elementModels[moduleState.activeKey] && showImportBtn() && !isMove && (
                  <Tooltip title="导入任务">
                    <span
                      className="import_btn"
                      onClick={e => {
                        e.stopPropagation()
                        setModuleState({ addTaskModal: true })
                        getUploadSelect()
                      }}
                    ></span>
                  </Tooltip>
                )}
                {!isMove && (
                  <Tooltip title={screenVsible ? '返回' : '全屏'}>
                    <span
                      className={$c({
                        'screen-enlarge-btn': !screenVsible,
                        'screen-enlarge-larg': screenVsible,
                      })}
                      style={
                        selectTeamId &&
                        elementModels[moduleState.activeKey] &&
                        elementModels[moduleState.activeKey].elementCode === 'okr'
                          ? { display: 'none' }
                          : {}
                      }
                      onClick={e => {
                        e.preventDefault()
                        const moduleHeder = $(e.target).parents('.desk-module-header')
                        const element = $(moduleHeder).find('.ant-tabs-tab-active')
                        const module = $(element).find('.moduleElement')
                        const dataCode = $(module).attr('data-code') || ''
                        openFullScreen(data.moduleId, dataCode)
                      }}
                    ></span>
                  </Tooltip>
                )}
                {!followUserInfo.followStatus && !isMove && (
                  <Tooltip title="操作">
                    <Dropdown overlay={dropMenu} trigger={['click']}>
                      <span className="screen_option_btn"></span>
                    </Dropdown>
                  </Tooltip>
                )}
              </div>
            </div>
          )}
          draggable={'false'}
        >
          {elementModels.map((item: ItemProps, index: number) => (
            <TabPane
              key={index}
              tab={
                <TabDropTitle
                  params={{
                    item: item,
                    moduleId: data.moduleId,
                    isFollow,
                    handeTagData,
                    selectHandleItem,
                  }}
                />
              }
              className={$c({
                'module-none-padding': item.elementCode === 'okr',
              })}
            >
              {!isMove && (
                <SetModuleData
                  modulePosition={data.modulePosition}
                  elementPosition={item.elementPosition}
                  code={item.elementCode}
                  refreshCode={refreshCode}
                  setrefreshCod={(code: string) => {
                    setRefreshCode(code)
                  }}
                  screenVsible={screenVsible}
                  moduleType={data.moduleType}
                  serachParams={serachParam}
                  isFollow={isFollow}
                  detailModalRef={detailModalRef}
                  okrPeriodFiltrateRef={okrPeriodFiltrateRef}
                />
              )}
            </TabPane>
          ))}
        </Tabs>
        <Modal
          title="导入任务"
          className="addTaskModel"
          visible={moduleState.addTaskModal}
          mask={false}
          onOk={() => importTask()}
          onCancel={() => setModuleState({ addTaskModal: false })}
        >
          <CheckboxGroup
            options={[
              { label: '关注的任务', value: -1 },
              { label: '指派的任务', value: 1 },
              { label: '协同的任务', value: 2 },
              { label: '督办的任务', value: 6 },
            ]}
            value={moduleState.checkedList}
            onChange={(checkedList: any) => setModuleState({ checkedList: checkedList })}
          />
        </Modal>
      </div>
    </>
  )
}

const TabDropTitle = ({ params }: any) => {
  const { item, moduleId, isFollow, handeTagData, selectHandleItem } = params
  const { elementCode, elementTypeName } = item
  const deskTabsCount = useSelector((state: StoreStates) => state.deskTabsCount)
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
      const targetItem = JSON.parse(dropRef.current.dataset.itemdata)
      //拖拽元素的elementId
      const nowElementId = sourceItem.elementId
      if (nowElementId === targetItem.elementId) {
        return
      }
      //目标元素的index
      const newIndex = targetItem.elementPosition
      handeTagData(sourceItem, targetItem)
      moveHomeElement({
        elementId: nowElementId,
        position: newIndex,
        moduleId: moduleId,
      }).then(
        () => message.success('修改标签位置成功'),
        () => message.error('修改标签位置失败')
      )
    },
  })
  const dropRef = useRef<any>(null)
  // 使用 drag 和 drop 对 ref 进行包裹，则组件既可以进行拖拽也可以接收拖拽组件
  drag(drop(dropRef))

  return (
    <div
      className="moduleElement"
      data-code={item.elementCode}
      ref={dropRef}
      data-itemdata={JSON.stringify(item)}
    >
      {[1].map((val: any, index: any) => {
        const moduleNum = getModuleNum(item.elementCode, deskTabsCount)
        return (
          <span key={index}>
            {item.elementName}
            <span className={`${item.elementCode}_num tab_num ${moduleNum == 0 ? 'forcedHide' : ''}`}>
              ({moduleNum})
            </span>
            {!isFollow && hasTagSetting(elementTypeName, elementCode) && (
              <em
                className="set-tag-icon"
                onClick={(e: any) => {
                  e.stopPropagation()
                  selectHandleItem('1', item)
                }}
              ></em>
            )}
          </span>
        )
      })}
    </div>
  )
}
//获取当前模块对应的数量
const getModuleNum = (elementCode: string, deskTabsCount: any[]) => {
  const tabsList = deskTabsCount || []
  const modalNum = tabsList.filter((item: ModuleNumProps) => item.code === elementCode)
  if (modalNum.length == 0) {
    return ''
  } else {
    return exceedNum(modalNum[0])
  }
}
const exceedNum = (num: any) => {
  if (num.count > 99) {
    return '99+'
  }
  return num.count
}
