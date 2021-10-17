import React, { useEffect, useState } from 'react'
import { Spin, Drawer } from 'antd'
import NoneData from '@/src/components/none-data/none-data'
import CommonTaskList from './component/commonTaskList'
import CheckTask from './component/CheckTask'
import ReportFormList from './component/ReportFormList'
import CollectedReport from './component/collectedReport'
import $c from 'classnames'
import { useSelector } from 'react-redux'
import FileTaskModal from './component/taskModule/FileTaskModal'
import DownTaskModal from './component/taskModule/downTaskModal'
import ForenTaskModal from './component/taskModule/forenTaskModal'
import { OkrKanban } from './okrKanban/okrKanban'
interface ModuleDataProps {
  modulePosition: number
  elementPosition: number
  code: string
  refreshCode: string
  setrefreshCod: (code: string) => void
  screenVsible: boolean
  moduleType: number
  serachParams?: any
  isFollow?: boolean
  detailModalRef?: any
  okrPeriodFiltrateRef?: any
}

//暴露模块刷新方法
export let refreshModelFn: any = null

//处理模块数据
const SetModuleData = ({
  code,
  refreshCode,
  setrefreshCod,
  screenVsible,
  moduleType,
  serachParams,
  isFollow,
  detailModalRef,
  okrPeriodFiltrateRef,
}: ModuleDataProps) => {
  const selectTeamId = useSelector((state: StoreStates) => state.selectTeamId)
  // const followSelectTeadId = useSelector((state: StoreStates) => state.followSelectTeadId)
  // const [listLoading, setListLoading] = useState(true)
  const [nowCode, setCode] = useState(code)
  //下属任务 冻结任务 归档任务 抽屉
  const [drawerVisble, setDrawerVisble] = useState(false)
  const [activeKey, setActiveKey] = useState(0)
  const [windowWidth, setWindowWidth] = useState(0)
  const [moduleHeight, setModuleHeight] = useState(269)
  const orgId = selectTeamId == -1 ? '' : selectTeamId

  useEffect(() => {
    setHeightFn()
    window.addEventListener('resize', setHeightFn)
    return () => {
      window.removeEventListener('resize', setHeightFn)
    }
  }, [])
  useEffect(() => {
    // let isUnmounted = false
    if (refreshCode !== '') {
      // setListLoading(true)
      setrefreshCod('')
    }
    // return () => {
    //   isUnmounted = true
    // }
  }, [refreshCode])
  refreshModelFn = ({ code }: any) => {
    if (code !== '') {
      setCode(code)
    }
  }

  const setHeightFn = () => {
    setWindowWidth(window.innerWidth)
    setMHeight()
  }

  //初始化
  // useEffect(() => {
  //   let isUnmounted = false
  //   if (!isUnmounted && nowCode) {
  //   }
  //   return () => {
  //     isUnmounted = true
  //   }
  // }, [nowCode, !isFollow ? selectTeamId : followSelectTeadId])

  //动态设置模块高度
  const setMHeight = () => {
    const boxHeight = jQuery('.desk-container').height() || 0
    const dh = (boxHeight - 16) / 2
    const mh = dh - 50
    setModuleHeight(mh)
  }

  //列表组件
  const RenderTaskList = ({ data }: any) => {
    return (
      <CommonTaskList
        key={nowCode}
        nowStatus={serachParams.status} //筛选组合
        TaskData={data}
        code={nowCode}
        moduleType={moduleType}
        screenVsible={screenVsible}
        isFollow={isFollow}
        detailModalRef={detailModalRef}
      />
    )
  }
  //领导任务按钮渲染
  const renderBtn = () => {
    return (
      <div className="search_box">
        <div className="file_btn">
          {orgId !== '' && (
            <span onClick={() => jumpEvent(1)}>
              <i></i>下属任务
            </span>
          )}
          <span onClick={() => jumpEvent(2)}>
            <i></i>冻结任务
          </span>
        </div>
      </div>
    )
  }
  const jumpEvent = (num: number) => {
    setActiveKey(num)
    setDrawerVisble(true)
  }
  const getNowTablePage = (code: string) => {
    switch (code) {
      case 'check_task':
        return <CheckTask moduleType={moduleType} isFollow={isFollow} />
      case 'wait_receive':
        return <CollectedReport moduleType={moduleType} isFollow={isFollow} />
      case 'report_form':
        return <ReportFormList isFollow={isFollow} />
      case 'okr':
      case 'focus_okr':
        return (
          <OkrKanban
            key={code}
            params={{
              moduleType: moduleType,
              isFollow: isFollow,
              screenVsible,
              fromType: code,
              fromSource: 'workdesk',
            }}
            detailModalRef={detailModalRef}
            okrPeriodFiltrateRef={code == 'okr' ? okrPeriodFiltrateRef : null}
          />
        )
      case 'my_urge':
        return (
          <NoneData
            imgSrc={$tools.asAssetsPath('/images/noData/waitting.png')}
            showTxt="尚未催办任何任务哦~~"
            imgStyle={{ width: 74, height: 71 }}
          />
        )
      case 'execute_task':
        return (
          <div className="modulePanleBox" style={{ height: '100%' }}>
            {!screenVsible && renderBtn()}
            <RenderTaskList key="execute_task" />
          </div>
        )
      default:
        return <RenderTaskList key={code} screenVsible={code == 'focus_task' ? undefined : screenVsible} />
    }
  }
  return (
    <div
      style={{ height: moduleHeight }}
      className={$c(
        `${nowCode + '_module'} module-content`,
        { reportContent: nowCode == 'report_form' },
        { waitReceive: nowCode == 'wait_receive' }
      )}
    >
      <Spin tip="加载中，请稍后..." spinning={false}>
        {getNowTablePage(nowCode)}
      </Spin>
      {drawerVisble && (
        <Drawer
          className="drawer_task_module"
          title="xxxxxxx"
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

export default SetModuleData
