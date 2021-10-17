import React, { useEffect, useState } from 'react'
import { Input, Dropdown, Tooltip } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import { getTreeParam } from '@/src/common/js/tree-com'

import OkrPeriodFiltrate from '../../workdesk/okrKanban/OkrPeriodFiltrate'
import { FilterForm } from './FilterForm'
// import { NET_SESSION_NAME } from 'electron-updater/out/electronHttpExecutor'
import { NEWAUTH812 } from '@/src/components'

export let setOkrHeaderTotalFn: any = null

export const OkrHearder = (props: any) => {
  const { callback, setOkrPeriodRef } = props
  const { isMyPlan, planTypeMenu } = props.hearderData
  const planTypeMenuList = () => [
    {
      type: 1,
      // name: $intl.get('myLiable'),
      name: '我负责的',
      total: 0,
    },
    {
      type: 3,
      // name: $intl.get('myCreated'),
      name: '我创建的',
      total: 0,
    },
  ]
  const [state, setState] = useState({
    orgShow: true, //左侧组织架构显示 隐藏控制
    isMyPlan: 1, // 是否是为我的规划
    planTypeMenu: planTypeMenu ? planTypeMenu : planTypeMenuList(), //标题选项
    planTypeActive: 1, //当前选中的标题
    periodEnable: false, //okr周期是否开启
    periodList: [], //选择周期
    periodItem: { periodId: '', periodText: '', ratingType: 0 }, //当前选择的选择周期 ---ratingType：0-全部，1-1分制，100-100分制，当选中企业的okr时全部周期ratingType为当前企业分制
    iptVal: '', //头部搜索
    filterSearchStatus: '', //高级筛选搜索状态
    planMode: 0, //规划模式 0卡片 1列表  2宽详情
    filterMoules: {
      sortType: 0, //0：升序，1：filterObj.
      grades: [], //0:个人级，2：公司级，3.部门级
      processStates: [], //进度状态 0:正常，1：有风险，2：超前，3：延迟
      scores: [], //(0.1-0.4)-0;(0.4-0.8)-1;(0.8-1.0)-2
      cci: [], //(1-4)-0 (5-8)-1 (9-10)-2
      statusList: [],
    },
    nowHository: false, //历史周期权限
    isShowFilter: false, //显示筛选下拉框
    okrBasicAuth: false, //okr周期基本设置权限
    addObjectAuth: false, //创建目标O权限
    okrSettingTips: '',
    okrSetting: false, // 设置OKR
  })
  setOkrHeaderTotalFn = ({ CREATE, LIABLE }: any) => {
    setState({
      ...state,
      planTypeMenu: [
        {
          type: 1,
          // name: $intl.get('myLiable'),
          name: '我负责的',
          total: LIABLE,
        },
        {
          type: 3,
          // name: $intl.get('myCreated'),
          name: '我创建的',
          total: CREATE,
        },
      ],
    })
  }
  useEffect(() => {
    return () => {
      setOkrHeaderTotalFn = null
    }
  }, [])
  // 缓存 okr 筛选插件
  let okrPeriodFiltrateRef: any = null
  useEffect(() => {
    setState({
      ...state,
      ...props.hearderData,
    })
    setOkrPeriodRef(okrPeriodFiltrateRef)
    return () => {
      okrPeriodFiltrateRef = null
    }
  }, [props.hearderData, props.filterMoules])
  useEffect(() => {
    setState({
      ...state,
      filterMoules: {
        sortType: 0, //0：升序，1：filterObj.
        grades: [], //0:个人级，2：公司级，3.部门级
        processStates: [], //进度状态 0:正常，1：有风险，2：超前，3：延迟
        scores: [], //(0.1-0.4)-0;(0.4-0.8)-1;(0.8-1.0)-2
        cci: [], //(1-4)-0 (5-8)-1 (9-10)-2
        statusList: [],
      },
      iptVal: '', //头部搜索
      filterSearchStatus: '', //高级筛选搜索状态
    })
  }, [props.teamId])
  // 计划类型导航菜单参数
  //标题
  const getCurNames = () => {
    const orgInfo = getTreeParam($store.getState().workokrTreeId)
    let text = ''
    let brtext = ''
    if (orgInfo.curType == 2) {
      text = orgInfo.cmyName
    } else if (orgInfo.curType == 3) {
      text = orgInfo.curName
      brtext = orgInfo.cmyName
    } else {
      text = `${$intl.get('usersOKR', { name: orgInfo.curName })}`
      brtext = `${orgInfo.cmyName} - ${orgInfo.parentName}`
    }
    return (
      <>
        <span className="title_txt" style={{ fontWeight: 'bold' }}>
          {text}
        </span>
        {brtext && <br />}
        {brtext && <span>{brtext}</span>}
      </>
    )
  }
  return (
    <div className="secondPageHeader workPlanPageHeader_main flex ">
      <div className="headerLeft flex">
        <Tooltip title="展开侧边栏">
          <em
            className={`img_icon org_fold_icon open ${state.orgShow ? 'forcedHide' : ''}`}
            onClick={() => {
              setState({ ...state, orgShow: true })
              callback({ orgShow: true })
            }}
          ></em>
        </Tooltip>
        {/* 列表标题 */}
        <span className={`tit_name main_tit_name ${state.isMyPlan || state.orgShow ? 'forcedHide' : ''}`}>
          {getCurNames()}
        </span>
        {/* <!-- 导航菜单 --> */}
        <ul className={`workPlanListNav ${state.isMyPlan ? '' : 'forcedHide'}`}>
          {state.planTypeMenu.map((item: any, index: number) => {
            return (
              //屏蔽派发给我的
              <li
                className={`flex center ${state.planTypeActive == item.type ? ' active' : ''}`}
                key={item.type}
                data-type={item.type}
                onClick={e => {
                  setState({ ...state, planTypeActive: Number(e.currentTarget.dataset.type) })
                  props.planTypeChange(e)
                }}
              >
                <span className={`red_count ${item.unread ? '' : 'forcedHide'}`}>{item.unread || 0}</span>
                {item.name} <span className="sta_num">({item.total})</span>
              </li>
            )
          })}
        </ul>
        {/* 周期选择 */}
        <div className="flex okrperiod">
          <OkrPeriodFiltrate
            ref={ref => (okrPeriodFiltrateRef = ref)}
            periodEnable={state.periodEnable}
            periodList={state.periodList || []}
            periodItem={state.periodItem}
            periodIChange={(value: any) => {
              if (value) {
                state.periodItem = value
                // state.iptVal = ''
                // state.filterSearchStatus = ''
                // this.state.sortType = 0 //0：降序，1：升序
                // this.state.grades = [] //0:个人级，2：公司级，3.部门级
                // this.state.processStates = [] //进度状态 0:正常，1：有风险，2：超前，3：延迟
                // this.state.scores = [] //(0.1-0.4)-0;(0.4-0.8)-1;(0.8-1.0)-2
                // this.state.cci = [] //(1-4)-0 (5-8)-1 (9-10)-2
                setState({ ...state })
                callback({ periodItem: value })
                props.periodIChange(value)
              }
            }}
            isMyPlan={state.isMyPlan}
            from={'okr_module'}
            filterMoules={{
              sortType: state.filterMoules.sortType,
              statusList: state.filterMoules.statusList,
              searchTexe: state.filterSearchStatus,
              planTypeActive: state.planTypeActive,
              planMode: state.planMode,
              nowHository: state.nowHository,
            }}
            setChange={(data: any) => {
              if (data) {
                props.getNowperiodList('edit')
              }
            }}
          />
        </div>
      </div>
      <div className="headerRight flex">
        <div className="search_add_box flex ">
          <Input
            className="search_input"
            placeholder="请输入关键字"
            prefix={
              <em
                className="search-icon-t-btn"
                onClick={() => {
                  state.filterMoules.sortType = 0 //0：降序，1：升序
                  state.filterMoules.grades = [] //0:个人级，2：公司级，3.部门级
                  state.filterMoules.processStates = [] //进度状态 0:正常，1：有风险，2：超前，3：延迟
                  state.filterMoules.scores = [] //(0.1-0.4)-0;(0.4-0.8)-1;(0.8-1.0)-2
                  state.filterMoules.cci = [] //(1-4)-0 (5-8)-1 (9-10)-2
                  state.filterSearchStatus = state.iptVal
                  setState({
                    ...state,
                  })
                  // callback({ ...state.filterMoules })
                  props.afterFilter({
                    searchVal: state.iptVal,
                    typeList: [],
                    ...state.filterMoules,
                  })
                }}
              ></em>
            }
            style={{ backgroundColor: '#FFFFFF' }}
            value={state.iptVal}
            onChange={(e: any) => {
              setState({
                ...state,
                iptVal: e.target.value,
              })
            }}
            onPressEnter={() => {
              state.filterMoules.sortType = 0 //0：降序，1：升序
              state.filterMoules.grades = [] //0:个人级，2：公司级，3.部门级
              state.filterMoules.processStates = [] //进度状态 0:正常，1：有风险，2：超前，3：延迟
              state.filterMoules.scores = [] //(0.1-0.4)-0;(0.4-0.8)-1;(0.8-1.0)-2
              state.filterMoules.cci = [] //(1-4)-0 (5-8)-1 (9-10)-2
              state.filterSearchStatus = state.iptVal
              setState({
                ...state,
              })
              callback({ ...state.filterMoules })
              props.afterFilter({
                searchVal: state.iptVal,
                typeList: [],
                // statusList: state.filterMoules.statusList,
                ...state.filterMoules,
              })
            }}
          />
        </div>
        {/* 筛选 */}
        <Dropdown
          overlay={
            <FilterForm
              filterData={{
                teamId: isMyPlan ? '' : getTreeParam($store.getState().workokrTreeId).curId,
                planTypeActive: state.planTypeActive,
                search: state.filterSearchStatus,
                periodItem: state.periodItem,
                dataCom: getTreeParam($store.getState().workokrTreeId),
              }}
              isShowFilter={state.isShowFilter}
              afterFilter={props.afterFilter}
            ></FilterForm>
          }
          trigger={['hover']}
          arrow={true}
          placement="bottomRight"
          visible={state.isShowFilter}
          onVisibleChange={e => setState({ ...state, isShowFilter: e })}
        >
          <div className={'filter_box flex center'}>
            <span className="filter_txt">筛选</span>
            <DownOutlined />
          </div>
        </Dropdown>
        {/* 切换列表、卡片、宽详情  planMode:0卡片 1列表  2宽详情*/}
        <ul className={`model_menu flex`}>
          {/* 列表模式 */}
          <Tooltip title={'列表模式'}>
            <li
              onClick={() => {
                props.modeChange(1)
              }}
              className={`${state.planMode == 1 ? 'model_active' : ''}`}
            ></li>
          </Tooltip>
          {/* 卡片模式 */}
          <Tooltip title={'卡片模式'}>
            <li
              onClick={() => {
                props.modeChange(0)
              }}
              className={`${state.planMode == 0 ? 'model_active' : ''}`}
            ></li>
          </Tooltip>
          {/* 宽详情 */}
          <Tooltip title={'宽详情'}>
            <li
              onClick={() => {
                props.modeListChange(2)
                setState({ ...state, orgShow: true })
                $('.OKRDetailContent .quadrant-part').removeClass('maxpage')
              }}
              className={`${state.planMode == 2 ? 'model_active' : ''}`}
            ></li>
          </Tooltip>
        </ul>
        {/* 创建目标 */}
        {(NEWAUTH812 ? state.addObjectAuth : true) && (
          <Tooltip title={$intl.get('createObjective')}>
            <span
              className={`add_btn ${state.periodEnable ? '' : 'forcedHide'}`}
              onClick={e => {
                e.stopPropagation()
                props.CreateAim()
              }}
            ></span>
          </Tooltip>
        )}

        {/* okr设置 */}
        {state.okrBasicAuth && (
          <span
            className="okr-settings"
            onClick={() => {
              setState({ ...state, okrSetting: true })
              callback({ okrSetting: true })
            }}
          >
            <Tooltip
              trigger={['hover']}
              visible={state.okrSettingTips ? true : false}
              title={state.okrSettingTips}
              placement={'bottomRight'}
            >
              <span className="settes"></span>
            </Tooltip>
          </span>
        )}
      </div>
    </div>
  )
}
