import React, { useContext } from 'react'
import { Spin } from 'antd'
import NoneData from '@/src/components/none-data/none-data'
import $c from 'classnames'
// import { useSelector } from 'react-redux'
import CheckTask from '../workdesk/component/CheckTask'
import CollectedReport from '../workdesk/component/collectedReport'
import ReportFormList from '../workdesk/component/ReportFormList'
import { OkrKanban } from '../workdesk/okrKanban/okrKanban'
import { TaskListData } from '../workdesk/TaskListData'
import CommonTaskList from '../../views/workdesk/component/commonTaskList'

interface ModuleDataProps {
  elementModels: any
  refresh: string
  refreshCode: string
  initCode: string
  isFullScreen: boolean
  modulePosition?: any
  elementPosition?: any
  code?: any
  setrefreshCod?: any
  screenVsible?: any
  moduleType?: any
  isFollow?: any
  detailModalRef?: any
  okrPeriodFiltrateRef?: any
  workDeskContext: any
}

//暴露模块刷新方法
// export let refreshModelFn: any = null

//处理模块数据
const SetModuleCom = ({
  elementModels,
  refresh,
  initCode,
  refreshCode,
  isFullScreen,
  workDeskContext,
  okrPeriodFiltrateRef,
}: ModuleDataProps) => {
  const { moduleType } = elementModels || {}
  // 工作台上下文数据
  const deskContextObj: any = useContext(workDeskContext)
  const { detailModalRef, isFollow } = deskContextObj

  //列表组件
  const RenderTaskList = (_: any) => {
    return (
      <CommonTaskList
        key={initCode}
        // nowStatus={serachParams.status} //筛选组合
        // TaskData={data}
        code={initCode}
        refreshCode={refreshCode}
        moduleType={moduleType}
        screenVsible={isFullScreen}
        isFollow={isFollow}
        detailModalRef={detailModalRef}
      />
    )
  }

  const getNowTablePage = (code: string) => {
    switch (code) {
      case 'check_task':
        return (
          <CheckTask moduleType={moduleType} isFollow={isFollow} refreshCode={refreshCode} refresh={refresh} />
        )
      case 'wait_receive':
        return <CollectedReport moduleType={moduleType} isFollow={isFollow} />
      case 'report_form':
        return <ReportFormList isFollow={isFollow} />
      case 'okr':
      case 'focus_okr':
        return (
          <OkrKanban
            key={code}
            initCode={code}
            refreshCode={refreshCode}
            refresh={refresh}
            params={{
              moduleType: moduleType,
              isFollow: isFollow,
              isFullScreen,
              fromType: code,
              fromSource: 'workdesk',
            }}
            detailModalRef={detailModalRef}
            okrPeriodFiltrateRef={code == 'okr' ? okrPeriodFiltrateRef : null} //周期设置
          />
        )
      case 'my_urge':
        return (
          <NoneData
            imgSrc={$tools.asAssetsPath('/images/noData/task_empty.svg')}
            showTxt="尚未催办任何任务哦~~"
            imgStyle={{ width: 74, height: 71 }}
          />
        )
      case 'execute_task':
        return (
          <div className="modulePanleBox" style={{ height: '100%' }}>
            <RenderTaskList key="execute_task" isFollow={isFollow} />
          </div>
        )
      case 'to_do':
        return (
          <TaskListData
            key={initCode}
            code={initCode}
            refresh={refresh}
            refreshCode={refreshCode}
            isFollow={isFollow}
            // isFullScreen={isFullScreen}
          />
        )
      default:
        return <RenderTaskList key={code} screenVsible={code == 'focus_task' ? undefined : isFullScreen} />
    }
  }
  return (
    <div
      // style={{ height: moduleHeight }}
      style={{ height: '100%' }}
      className={$c(
        `${initCode + '_module'} module-content`,
        { reportContent: initCode == 'report_form' },
        { waitReceive: initCode == 'wait_receive' }
      )}
    >
      <Spin tip="加载中，请稍后..." spinning={false}>
        {getNowTablePage(initCode)}
      </Spin>
    </div>
  )
}

export default SetModuleCom
