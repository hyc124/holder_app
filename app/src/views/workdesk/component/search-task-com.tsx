// 任务筛选小组件
import { Drawer, Dropdown } from 'antd'
import React, { useLayoutEffect, useState } from 'react'
import $c from 'classnames'
import { showSearchIcon } from '../WorkDeskModule'
import SearchPlug from './search-plug/Search-plug'
import DownTaskModal from './taskModule/downTaskModal'
import FileTaskModal from './taskModule/FileTaskModal'
import ForenTaskModal from './taskModule/forenTaskModal'
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

const SearchTaskCom = ({
  code,
  callback,
  screenVsible,
}: {
  code: string //模块类型
  callback?: any
  screenVsible?: boolean //是否全屏
}) => {
  const isFilterShow = screenVsible && showSearchIcon(code) // 高级筛选显示
  const isBoxShow = code == 'execute_task' || isFilterShow //容器组件显示
  //下属任务 冻结任务 归档任务 抽屉
  const [state, setState] = useState({
    windowWidth: 0,
    activeKey: 0,
    drawerVisble: false,
    dropvisible: false,
  })
  const { selectTeamId } = $store.getState() //选择企业id
  // const selectTeamIds = $store.getState().targetKanbanParams
  const orgId = selectTeamId == -1 ? '' : selectTeamId //归属id

  useLayoutEffect(() => {
    setState({
      ...state,
      windowWidth: window.innerWidth,
    })
    window.addEventListener('resize', function() {
      setState({
        ...state,
        windowWidth: this.window.innerWidth,
      })
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
        setState({
          ...state,
          windowWidth: this.window.innerWidth,
        })
      })
    }
  }, [])

  const leaderModuleEvent = (key: number) => {
    setState({
      ...state,
      activeKey: key,
      drawerVisble: true,
    })
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

  //高级筛选组件
  const searchPlug = (
    <SearchPlug
      isShowTagSerachBtn={true}
      listType={moduleTypes[code]}
      serachCallback={(searcgData: any) => {
        console.log(searcgData)
        callback && callback(searcgData)
      }}
      searchPlaceHolder={getSearchPlaceHolder(code)}
    />
  )

  return (
    <>
      {isBoxShow && (
        <div className={$c('search_box')}>
          {/* 领导任务展示冻结任务按钮 */}
          {code == 'execute_task' && (
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
          {/* 全屏展示：任务高级筛选 */}
          {isFilterShow ? (
            <Dropdown
              onVisibleChange={(flag: boolean) => {
                setState({
                  ...state,
                  dropvisible: flag,
                })
              }}
              overlay={searchPlug}
              trigger={['click']}
              visible={state.dropvisible}
            >
              <span
                className="seach_icon"
                onClick={() => {
                  const menuShow = jQuery('.module-full-screen').attr('data-show')
                  if (menuShow === '0') {
                    setState({
                      ...state,
                      dropvisible: true,
                    })
                    jQuery('.module-full-screen').attr('data-show', '1')
                  } else {
                    setState({
                      ...state,
                      dropvisible: false,
                    })
                    jQuery('.module-full-screen').attr('data-show', '0')
                  }
                }}
              >
                <i></i>筛选
              </span>
            </Dropdown>
          ) : (
            ''
          )}
          {state.drawerVisble && (
            <Drawer
              className="drawer_task_module"
              title="xxxxxxx"
              width={state.windowWidth - 64}
              destroyOnClose={true}
              forceRender={true}
              visible={state.drawerVisble}
            >
              {state.activeKey == 0 && (
                <FileTaskModal
                  onClose={() =>
                    setState({
                      ...state,
                      drawerVisble: false,
                    })
                  }
                />
              )}
              {state.activeKey == 1 && (
                <DownTaskModal
                  onClose={() =>
                    setState({
                      ...state,
                      drawerVisble: false,
                    })
                  }
                />
              )}
              {state.activeKey == 2 && (
                <ForenTaskModal
                  onClose={() =>
                    setState({
                      ...state,
                      drawerVisble: false,
                    })
                  }
                />
              )}
            </Drawer>
          )}
        </div>
      )}
    </>
  )
}

export default SearchTaskCom
