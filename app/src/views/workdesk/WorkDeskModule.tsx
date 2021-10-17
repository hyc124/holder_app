import React, { useState, useEffect, useLayoutEffect } from 'react'
import { ModuleItem } from './ModuleItem'
// import { useSelector } from 'react-redux'
import { Dropdown, Drawer } from 'antd'
import SearchPlug from './component/search-plug/Search-plug'
import FileTaskModal from './component/taskModule/FileTaskModal'
import DownTaskModal from './component/taskModule/downTaskModal'
import ForenTaskModal from './component/taskModule/forenTaskModal'
import $c from 'classnames'

interface ModuleProps {
  moduleData: any[]
  isMove: boolean
  onRemove: (moduleId: any) => void
  moduleNums: any
  onDragBegin: () => void
  onDragOver: (source: object, target: object) => void
  changeScreen: (visble: boolean) => void
  isFollow?: boolean
  detailModalRef?: any
}

//全屏是否展示筛选按钮
export const showSearchIcon = (code: string) => {
  const _CODESARR = [
    'all_task',
    'responsible_task',
    'draft_task',
    'task_supervisor',
    'focus_task',
    'execute_task',
    'transfer_tasks',
    'sygergy_task',
    'distribute_task',
    'archive_task',
    'waitting_task',
  ]
  if (_CODESARR.includes(code)) {
    return true
  } else {
    return false
  }
}
// 工作台除4大类属性tab、待办任务、检查项外的所有任务相关tab，包括下属任务 搜索插件引导文案：任务名称
const getSearchPlaceHolder = (code: string) => {
  const _CODESARR = [
    // 'target_kanban',
    // 'working_team_task',
    // 'function_task',
    // 'temporary_work',
    'waitting_task',
    // 'check_task',
  ]
  let placeholder = ''
  if (!_CODESARR.includes(code)) {
    placeholder = '搜索任务名称/执行人'
  }
  return placeholder
}
export const WorkDeskModule = ({
  moduleData,
  isMove,
  onRemove,
  moduleNums,
  onDragBegin,
  onDragOver,
  changeScreen,
  isFollow,
  detailModalRef,
}: ModuleProps) => {
  //全屏展示框
  // const isFullScreen = useSelector((state: any) => state.showFullScreen)
  // const modulePositon = useSelector((state: any) => state.modulePosition)
  // const screenModule = moduleData.filter(item => item.moduleId === modulePositon)
  // const { selectTeamId } = $store.getState()
  // const selectTeamIds = $store.getState().targetKanbanParams
  const windowHeight = window.innerHeight - 80

  // const [dropvisible, setDropvisible] = useState(false)

  const [screenVisible, setScreenVsible] = useState(false)
  const [screenPosition, setScreenPosition] = useState(0)
  //下属任务 冻结任务 归档任务 抽屉
  const [drawerVisble, setDrawerVisble] = useState(false)
  const [activeKey, setActiveKey] = useState(0)
  const [windowWidth, setWindowWidth] = useState(0)
  const [serachParam, setSerachParam] = useState({
    pageNo: 0,
    pageSize: 20,
  })
  //是否是第一次全屏
  // const [isFirstIn, setIsFirstIn] = useState(false)
  //记录切换的moduleCode
  const [moduleCode, setModuleCode] = useState('')
  // const orgId = selectTeamId == -1 ? '' : selectTeamId

  useLayoutEffect(() => {
    setWindowWidth(window.innerWidth)
    window.addEventListener('resize', function() {
      setWindowWidth(this.window.innerWidth)
    })
    // $store.dispatch({
    //   type: 'TARGET_KANBAN_QUERY',
    //   data: {
    //     ...selectTeamIds,
    //     ascriptionType: '0',
    //   },
    // })
    // 刷新
    // refreshDeskNums({ teamId: selectTeamId < 0 ? 0 : selectTeamId })
    return () => {
      jQuery('body').off()
      window.removeEventListener('resize', function() {
        setWindowWidth(this.window.innerWidth)
      })
    }
  }, [])

  //获取模块对应得lisyType
  const moduleTypes = {
    all_task: 17,
    responsible_task: 2,
    draft_task: 16,
    task_supervisor: 5,
    focus_task: 8,
    execute_task: 1,
    transfer_tasks: 3,
    sygergy_task: 11,
    distribute_task: 10,
    target_kanban: 22,
    waitting_task: 21,
  }

  const changeActiveKey = (elementCode: string) => {
    // console.log('xxxxxxxxxxxxxxx', elementCode)
    // if (isFullScreen && isFirstIn) {
    //   const activePanle = jQuery('.desk-module-header').find('.ant-tabs-tab-active')
    //   const newCode = jQuery(jQuery(activePanle).find('.moduleElement')).attr('data-code') || ''
    //   setModuleCode(newCode)
    //   setIsFirstIn(false)
    // } else {

    // }
    setModuleCode(elementCode)
  }
  const searchPlug = (
    <SearchPlug
      isShowTagSerachBtn={true}
      listType={moduleTypes[moduleCode]}
      serachCallback={(searcgData: any) => {
        setSerachParam({
          ...serachParam,
          ...searcgData,
        })
      }}
      searchPlaceHolder={getSearchPlaceHolder(moduleCode)}
    />
  )
  const leaderModuleEvent = (key: number) => {
    setActiveKey(key)
    setDrawerVisble(true)
  }
  const moduleScreen = (state: boolean, nowKey: string, position: number) => {
    const screenWrap = jQuery('.workdesk-containe-right')
    !state ? jQuery(screenWrap).show() : jQuery(screenWrap).hide()
    // setIsFirstIn(state)
    setScreenVsible(state)
    setScreenPosition(position)
    changeScreen(state)
    setModuleCode(nowKey)
    // setTimeout(() => {
    //   $('[data-code=' + nowKey + ']').click()
    // }, 500)
  }

  //全屏视窗

  return (
    <div style={{ position: 'relative' }}>
      <div
        className={`${screenVisible ? 'module-full-screen' : 'module-container-box flex'}`}
        style={{ height: screenVisible ? `${windowHeight}px` : '100%' }}
      >
        {/* {screenVisible && showSearchIcon(moduleCode) && (
          <div className="search_box">
            {moduleCode == 'execute_task' && (
              <div className="file_btn">
                {orgId !== '' && (
                  <span onClick={() => leaderModuleEvent(1)}>
                    <i></i>下属任务
                  </span>
                )}
                <span onClick={() => leaderModuleEvent(2)}>
                  <i></i>冻结任务
                </span>
              </div>
            )}
            <Dropdown
              onVisibleChange={(flag: boolean) => {
                setDropvisible(flag)
              }}
              overlay={searchPlug}
              trigger={['click']}
              visible={dropvisible}
            >
              <span
                className="seach_icon"
                onClick={() => {
                  const menuShow = jQuery('.module-full-screen').attr('data-show')
                  if (menuShow === '0') {
                    setDropvisible(true)
                    jQuery('.module-full-screen').attr('data-show', '1')
                  } else {
                    setDropvisible(false)
                    jQuery('.module-full-screen').attr('data-show', '0')
                  }
                }}
              >
                <i></i>筛选
              </span>
            </Dropdown>
          </div>
        )} */}
        <div className="left-paine">
          {moduleData.map((item: any, index: number) => (
            <div
              className={$c('fullScreen', { modelscreen: item.moduleType == 0 })}
              style={{ display: screenVisible && item.moduleId != screenPosition ? 'none' : 'block' }}
              key={index}
            >
              <ModuleItem
                key={index}
                params={{
                  data: item,
                  index: index,
                  isMove: isMove,
                  moduleNums: moduleNums,
                  isFollow: isFollow,
                  serachParam: serachParam,
                }}
                callback={{
                  onRemove: onRemove,
                  onChangeActiveKey: changeActiveKey,
                  onOptionScreen: moduleScreen,
                  onDragBegin: onDragBegin,
                  onDragOver: onDragOver,
                }}
                detailModalRef={detailModalRef}
              />
            </div>
          ))}
        </div>
      </div>

      {/* {!isFullScreen && (
        <div className="module-container-box flex" >
          <div className="left-paine">
            {moduleData.map((item: any, index: number) => (
              <ModuleItem
                key={index}
                params={{
                  data: item,
                  index: index,
                  isMove: isMove,
                  moduleNums: moduleNums,
                  isFollow: isFollow,
                }}
                callback={{
                  onRemove: onRemove,
                  onChangeActiveKey: changeActiveKey,
                  onOptionScreen: moduleScreen,
                  onDragBegin: onDragBegin,
                  onDragOver: onDragOver,
                }}
              />
            ))}
          </div>
        </div>
      )} */}

      {drawerVisble && (
        <Drawer
          className="drawer_task_module"
          title="xxxxx"
          width={windowWidth - 64}
          destroyOnClose={true}
          forceRender={true}
          visible={drawerVisble}
        >
          {activeKey == 0 && <FileTaskModal onClose={() => setDrawerVisble(false)} />}
          {activeKey == 1 && <DownTaskModal onClose={() => setDrawerVisble(false)} />}
          {activeKey == 2 && <ForenTaskModal onClose={() => setDrawerVisble(false)} />}
        </Drawer>
      )}
    </div>
  )
}
