import DownLoadFileFooter from '@/src/components/download-footer/download-footer'
import { ipcRenderer } from 'electron'
import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useSelector } from 'react-redux'
import DetailModal from '../task/taskDetails/detailModal'
import EditModuleModal from '../workdesk/component/EditModuleModal'
import { queryUserInfo } from '../workdesk/getData'
import { DeskModeModal, ImportTaskModal } from './deskModeModal'
import { DeskModuleItem } from './deskModuleItem'
import { deskModuleDelApi, queryDeskModulesApi, queryDeskTabsCount } from './workDeskApi'
import { WorkDeskModulesInf } from './workDeskInf'
import './workDeskModules.less'
import './deskList.less'
import '@/src/common/js/jquery.resize'
export const workDeskContext = React.createContext({})
// 工作台统计数据缓存
export let myTabCountList: any = []
// 关注人的工作台统计数据缓存
export let followTabCountList: any = []
/**
 * 工作台所有模块展示组件
 */
export const WorkDeskModules = forwardRef(({ isFollow }: WorkDeskModulesInf, ref) => {
  // 全局store
  const {
    nowUserId,
    nowAccount,
    followUserInfo,
    //  authList 8.12
  } = $store.getState()
  //当前选中的企业ID
  const selectTeamId = useSelector((state: StoreStates) => state.selectTeamId)
  //关注人工作台选中的企业ID
  const followSelectTeadId = useSelector((state: StoreStates) => state.followSelectTeadId)
  const isFOrgId = !isFollow ? selectTeamId : followSelectTeadId
  const [state, setState] = useState<any>({
    modulesData: [], //模块数据
    tabCountList: [], //tab统计数据
  })
  // 选择工作台模板类型弹框
  const deskModeModalRef = useRef<any>({})
  // 编辑标签弹框
  const editModuleModalRef = useRef<any>({})
  // 详情弹框
  const detailModalRef = useRef<any>({})
  // 导入任务弹框
  const importTaskModalRef = useRef<any>({})
  // useEffect(() => {
  //   console.log('权限列表更新变化-----', authList)
  // }, [authList])

  /**
   * 组件初始化监听
   */
  useEffect(() => {
    initFn()
  }, [])

  /**
   * 节点初始加载完成
   */
  useLayoutEffect(() => {
    // 工作台事件绑定
    deskEvents()
  }, [])

  /**
   * 监听企业切换
   */
  useLayoutEffect(() => {
    // 为提升加载速度，标签统计数据异步加载后缓存
    queryModuleNum({ isFollow, updateNum: true }).then((list: any) => {
      if (isFollow) {
        followTabCountList = [...list]
      } else {
        myTabCountList = [...list]
      }
    })
  }, [isFOrgId, state.modulesData])

  /**
   * 暴露给父组件的方法
   */
  useImperativeHandle(ref, () => ({
    getDeskModule,
  }))
  /**
   * 初始化执行方法
   */
  const initFn = () => {
    getDeskModule()
    //查询个人信息
    queryUserInfo({
      account: isFollow ? followUserInfo.account : nowAccount,
      system: 'oa',
    }).then((data: any) => {
      // console.log(' //查询个人信息')

      $store.dispatch({
        type: 'SET_USER_INFO',
        data: data.data,
      })
    })
    ipcRenderer.removeAllListeners('update_module_num').on('update_module_num', () => {
      queryModuleNum({ isFollow, updateNum: true })
    })
  }

  /**
   * 事件绑定
   */
  const deskEvents = () => {
    // 滚动时右键菜单显示隐藏处理
    menuVisibleEvt({ domNode: $('#workDeskModuleContent') })
  }

  //查询工作台模块信息
  const getDeskModule = () => {
    queryDeskModulesApi({
      userId: isFollow ? followUserInfo.userId : nowUserId,
    }).then((res: any) => {
      const moduleList = res?.data?.modules || []
      const resData = res?.data || {}
      const newState: any = { ...state }
      // 设置模块state值
      const asyncQuery = async () => {
        // 阻断进程，加载慢，去掉
        // const tabCountList = await queryModuleNum({ isFollow })
        setState({ ...newState, row: resData.row, column: resData.column })
        // resize事件
        deskResizeEvt({
          domNode: $('#workDeskModuleContent'),
          setState: () => {
            setState({ ...newState })
          },
        })
      }
      // 没有模块
      if (res && moduleList?.length == 0) {
        //如果data为null,需要弹框选择模板，保存基础模块数据
        deskModeModalRef?.current?.setState?.({ visible: true, selectModuleTypeList: res?.dataList || [] })
      } else {
        // 模块数据
        newState.modulesData = [...moduleList]
        asyncQuery()
      }
    })
  }
  /**
   * 删除模块
   * @param moduleId 模块id
   */
  const removeModuleSave = ({ moduleId }: { moduleId: any }) => {
    deskModuleDelApi({ moduleId }).then((res: any) => {
      if (res) {
        $store.dispatch({ type: 'WORKDESK_FULL_SCREEN', data: { visible: false, position: 0 } })
        getDeskModule() //刷新工作台
      }
    })
  }

  // ***********************************上下文数据***********************************//
  const detailContext: any = {
    getDeskModule,
    removeModuleSave,
    queryModuleNum,
    isFollow,
    detailModalRef,
    editModuleModalRef,
    importTaskModalRef,
    tabCountList: isFollow ? followTabCountList : myTabCountList,
    moduleRows: state.row,
    moduleCols: state.column,
  }
  return (
    <workDeskContext.Provider value={detailContext}>
      <DndProvider backend={HTML5Backend}>
        <section className="workDeskModuleContent flex-1 flex wrap between" id="workDeskModuleContent">
          {state.modulesData.map((item: any, index: any) => {
            const moduleType = getModuleType({
              startPoint: item.startPoint,
              endPoint: item.endPoint,
            })
            item.moduleType = moduleType
            return <DeskModuleItem key={index} moduleData={item} />
          })}
        </section>
      </DndProvider>
      <DeskModeModal ref={deskModeModalRef} isFollow={isFollow} getDeskModule={getDeskModule} />
      {/* 编辑标签弹框 */}
      <EditModuleModal ref={editModuleModalRef} />
      <DownLoadFileFooter fromType="mainWin" />
      <DetailModal
        ref={detailModalRef}
        param={{
          from: 'workbench',
        }}
      />
      <ImportTaskModal ref={importTaskModalRef} />
    </workDeskContext.Provider>
  )
})
/**
 * 数字展示处理
 * @param num
 */
const exceedNum = (numItem: any) => {
  if (numItem.count > 99) {
    return '99+'
  }
  return numItem.count
}
/**
 * 获取当前模块标签统计数据
 */
export const getTabCount = ({ tabCountList, code }: { tabCountList: any; code: string }) => {
  let num: any = 0
  const findItem = tabCountList?.find((item: any) => item.code == code)
  if (findItem) {
    num = exceedNum(findItem)
  }

  return num
}
/**
 * 滚动时右键菜单显示隐藏处理
 */
const menuVisibleEvt = ({ domNode }: { domNode: any }) => {
  domNode
    .off('mouseenter')
    .on('mouseenter', (e: any) => {
      const fullScreen = $('.workDeskModuleItem.full_screen')
      if ($('.workDeskDrop').is(':visible')) {
        $(e.currentTarget).css({ overflow: 'hidden' })
      } else if (fullScreen.length == 0) {
        $(e.currentTarget).css({ overflow: 'overlay' })
      }
    })
    .off('mouseleave')
    .on('mouseleave', (e: any) => {
      $(e.currentTarget).css({ overflow: 'hidden' })
    })
    .on('mousemove', (e: any) => {
      const fullScreen = $('.workDeskModuleItem.full_screen')
      if ($('.workDeskDrop').is(':visible')) {
        $(e.currentTarget).css({ overflow: 'hidden' })
      } else if (fullScreen.length == 0) {
        $(e.currentTarget).css({ overflow: 'overlay' })
      }
    })
}

/**
 * 滚动时右键菜单显示隐藏处理
 */
const deskResizeEvt = ({ domNode }: { domNode: any; setState?: any }) => {
  domNode.off('resize').on('resize', () => {
    // console.log('workDeskModuleContent resize')
    $('#workDeskModuleContent')
      .find('.workDeskModuleItem')
      .each((_: number, domItem: any) => {
        const startPoint = JSON.parse($(domItem).attr('data-startpoint') || '{}')
        const endPoint = JSON.parse($(domItem).attr('data-endpoint') || '{}')
        // 计算模块宽高
        const moduleSize = getModuleSize({
          startPoint,
          endPoint,
        })
        $(domItem).css({ width: moduleSize.widthPercent, height: moduleSize.heightPx })
      })
  })
}

/**
 * 根据坐标设置分屏模式
 */
export const getModuleType = ({ startPoint, endPoint }: any) => {
  let screenType = 1
  // 全屏x方向单元格是12，小于11则是二分屏
  if (endPoint.x - startPoint.x < 11) {
    screenType = 0
  }
  return screenType
}

/**
 * 查询模块标签下数量
 * updateNum：是否立即更新统计数据
 */

export const queryModuleNum = (paramObj?: { isFollow?: boolean; updateNum?: boolean }) => {
  const infoObj = paramObj ? paramObj : {}
  const { isFollow, updateNum } = infoObj
  const { nowUserId, followUserInfo } = $store.getState()

  return new Promise((resolve: any) => {
    const exceedNum = (num: any) => {
      if (num.count > 99) {
        return '99+'
      }
      return num.count
    }
    const param: any = {
      userId: !isFollow ? nowUserId : followUserInfo.userId,
    } //最近一次选择的企业企业信息

    queryDeskTabsCount(param, isFollow).then((data: any) => {
      const list = data.dataList || []
      let domList: any = []
      if (isFollow) {
        domList = $('.followWorkDesk .module_tab_item .tab_num')
      } else {
        domList = $('.myWorkDesk .module_tab_item .tab_num')
      }

      resolve(list) // 是否立即更新统计数据
      // 更新全局统计数据
      if (isFollow) {
        followTabCountList = [...list]
      } else {
        myTabCountList = [...list]
      }
      if (updateNum) {
        // 修改bug：单条刷新后避免从此级进入子级导致刷新无效
        domList?.each((_: number, dom: any) => {
          const code = $(dom)
            .parents('.module_tab_item')
            .attr('data-code')
          const findItem = list.find((item: any) => item.code == code)
          if (findItem) {
            // const dom = code == 'my_okr' ? $('.okr_num') : $(`.${code}_num`)
            const num = exceedNum(findItem)
            if (findItem.count > 0) {
              $(dom).removeClass('forcedHide')
            }
            $(dom).text(`(${num})`)
          } else {
            $(dom)
              .addClass('forcedHide')
              .text(`(0)`)
          }
        })
      }
    })
  })
}

//刷新工作台选中状态的模块
export const refreshDeskActiveTab = ({ boxDom }: any) => {
  const deskBox = boxDom ? boxDom : $('#workDeskModuleContent')
  const deskModleActive = deskBox.find('.workDeskModuleItem .ant-tabs-tab-active')
  const refCode = ['report_form', 'my_urge'] //这些模块不触发刷新
  deskModleActive.each((_: number, element: any) => {
    const module = $(element).find('.module_tab_item')
    const dataCode = $(module).attr('data-code') || ''
    if (!refCode.includes(dataCode)) {
      $(element).click()
    }
  })
}
/**
 * 计算单元格宽高
 */
export const getCellSize = (_: { rows: number; cols: number }) => {
  const moduleBoxWidth = Number($('#workDeskModuleContent').width())
  const winWidth = Number($(window).width())
  // 内边距(跟css文件中workDeskModuleContent设置的一致)
  const padH = winWidth <= 1350 ? 32 : 48
  // 头部高度
  const herderH = 56
  const winHeight = Number($(window).height()) - herderH - padH
  // 单元格间距
  const marginX = winWidth <= 1350 ? 8 : 16
  const marginY = marginX
  // 单元格宽高(百分比)
  const cellWidth = (moduleBoxWidth - marginX * (12 - 1)) / 12,
    cellHeight = (winHeight - marginY * (16 - 1)) / 16

  return { cellWidth, cellHeight, marginX, marginY }
}
/**
 * 计算当前模块宽高和位置
 */
export const getModuleSize = ({ startPoint, endPoint }: any) => {
  const rows = 16
  const cols = 12
  const cellXNum = endPoint.x - startPoint.x + 1
  const cellYNum = endPoint.y - startPoint.y + 1
  let widthPercent = '100%'
  const widthPercentNum = (endPoint.x - startPoint.x + 1) / cols
  const heightPercentNum = (endPoint.y - startPoint.y + 1) / rows
  // 单元格宽高
  const { cellWidth, cellHeight, marginX, marginY } = getCellSize({ rows, cols })
  // 宽度高度百分比
  if (endPoint.x - startPoint.x < 11) {
    widthPercent = `calc(${Number(widthPercentNum * 100).toFixed(1)}% - ${marginX * widthPercentNum}px)`
  }
  const heightPercent = Number(heightPercentNum * 100).toFixed(1)
  // 宽度高度px值
  const widthPx = cellXNum * cellWidth + (cellXNum - 1) * marginX + 'px'
  const heightPx = cellYNum * cellHeight + (cellYNum - 1) * marginY + 'px'
  return { widthPercent, heightPercent, widthPx, heightPx }
}
