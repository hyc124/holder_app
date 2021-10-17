import React, { useState, useEffect, useImperativeHandle, useRef } from 'react'
import { Dropdown, Input, DatePicker, Checkbox } from 'antd'
import { MenuOutlined } from '@ant-design/icons'
import moment from 'moment'
import { requestApi } from '../../common/js/ajax'
import { dateFormats } from '../../common/js/common'
import { queryCompanyTags } from '../../views/task/taskComApi'
import { TagArea } from '../../views/task/tagsManage/tagComon'
import './filter.less'

const { RangePicker } = DatePicker
interface FilterItem {
  code: number
  name: string
  active: boolean
  deptIds?: any
}
interface PropsParam {
  afterFilter?: (obj: any) => void
  param?: any
  gettoptip?: (params: any) => void
  type?: number
  showSearch?: any
  terrObj?: any
}
const PlanFilterModule = (props: PropsParam) => {
  const [menuShow, setMenuShow] = useState(false)
  // 存储筛选数据
  const filterObjInit: any = {
    searchVal: '',
    typeList: [0, 3, 2, 1],
    statusList: [4, 3, 1, 2],
  }
  // 类型筛选 [0,1,2,3,4]//0目标、1临时、2职能、3项目
  const typeListInit = [
    {
      code: 0,
      name: '目标规划',
      active: true,
    },
    {
      code: 5,
      name: '项目规划',
      active: true,
    },
    // {
    //   code: 2,
    //   name: '职能规划',
    //   active: true,
    // },
    // {
    //   code: 1,
    //   name: '临时规划',
    //   active: true,
    // },
  ]
  // 状态筛选
  const statusListInit = [
    {
      code: 4,
      name: '已派发',
      active: true,
    },
    {
      code: 3,
      name: '部分派发',
      active: true,
    },
    {
      code: 1,
      name: '草稿',
      active: true,
    },
    // {
    //   code: 2,
    //   name: '审核中',
    //   active: true,
    // },
    {
      code: 5,
      name: '已完成',
      active: false,
    },
  ]

  // 筛选操作后设置筛选数据
  const setFilterData = () => {
    filterObj.typeList = []
    filterObj.statusList = []
    typeList.map((dataItem: FilterItem) => {
      if (dataItem.active) {
        filterObj.typeList.push(dataItem.code)
      }
    })
    statusList.map((dataItem: FilterItem) => {
      if (dataItem.active) {
        filterObj.statusList.push(dataItem.code)
      }
    })
    setFilterObj({ ...filterObj })
    // 回调函数返回数据给控件afterFilter方法
    if (props.afterFilter) {
      props.afterFilter({ ...filterObj })
    }
  }
  // 筛选重置
  const resetFilter = () => {
    setTypeList(typeListInit)
    setStatusList(statusListInit)
    setFilterObj(filterObjInit)
    // 回调函数返回数据给控件afterFilter方法
    if (props.afterFilter) {
      props.afterFilter(filterObjInit)
    }
  }
  const [typeList, setTypeList] = useState<any>(typeListInit)
  const [statusList, setStatusList] = useState<any>(statusListInit)
  const [filterObj, setFilterObj] = useState<any>(filterObjInit)
  const searchIptRef: any = useRef(null)
  const FilterMenu = () => {
    const [iptVal, setIptVal] = useState(
      searchIptRef && searchIptRef.current ? searchIptRef.current.state.value : ''
    )
    return (
      <div className="filtersTermBox workPlanFiltersTermBox">
        <div className="filtersCon">
          <div className={`filterSearchBox ${props.showSearch == false ? 'hide' : ''}`}>
            {/* <input type="text" placeholder="搜索规划名称" name="" className="searchVal filterSearchVal" /> */}
            <Input
              ref={searchIptRef}
              placeholder={props.type ? '搜索OKR名称' : '搜索规划名称'}
              className="filterSearchVal baseInput radius16 border0 bg_gray w100"
              suffix={
                <em
                  className="search-icon-t-btn"
                  onClick={() => {
                    filterObj.searchVal = iptVal
                    setFilterData()
                  }}
                ></em>
              }
              style={{ backgroundColor: '#F5F7FB' }}
              value={iptVal}
              onChange={(e: any) => {
                setIptVal(e.target.value)
              }}
              onPressEnter={() => {
                filterObj.searchVal = iptVal
                setFilterData()
              }}
            />
            {/* <label>
              <i className="searchIcon"></i>
            </label> */}
          </div>
          <section className="filtersItem">
            {!props.type && (
              <div className="filters-item-tit">
                <span className="tit_name">按类型筛选:</span>
                <span className="filter-trig-icon up f-right"></span>
              </div>
            )}
            {!props.type && (
              <div className="filters-item-con">
                <div className="filters-item-in">
                  <div className="filter-status">
                    <ul className="filter-status-type">
                      {typeList.map((item: any, i: number) => {
                        return (
                          <li
                            className={`filter-status-type-item subel_item ${item.active ? 'active' : ''}`}
                            key={i}
                            data-code={item.code}
                            onClick={() => {
                              typeList[i].active ? (typeList[i].active = false) : (typeList[i].active = true)
                              setTypeList([...typeList])
                              setFilterData()
                            }}
                          >
                            {item.name}
                          </li>
                        )
                      })}
                    </ul>
                    <div className="clearfix"></div>
                  </div>
                </div>
              </div>
            )}
            <div className="filters-item-tit">
              <span className="tit_name">按状态筛选:</span>
              <span className="filter-trig-icon up f-right"></span>
            </div>
            <div className="filters-item-con">
              <div className="filters-item-in">
                <div className="filter-status">
                  <ul className="filter-status-small">
                    {statusList.map((item: any, i: number) => {
                      return (
                        <li
                          className={`filter-status-type-item subel_item ${item.active ? 'active' : ''}`}
                          key={i}
                          style={item.code == 2 && props.type ? { display: 'none' } : {}}
                          data-code={item.code}
                          onClick={() => {
                            statusList[i].active
                              ? (statusList[i].active = false)
                              : (statusList[i].active = true)
                            setStatusList([...statusList])
                            setFilterData()
                          }}
                        >
                          {item.name}
                        </li>
                      )
                    })}
                  </ul>
                  <div className="clearfix"></div>
                </div>
              </div>
            </div>
          </section>
        </div>
        <header className="filtersHeader flex between center-v">
          <div
            className={`filter-reset-box header_btn style2 ${
              filterObj.typeList.length == 0 && filterObj.statusList.length == 0 && filterObj.searchVal == ''
                ? 'disable'
                : ''
            }`}
            onClick={() => {
              resetFilter()
              searchIptRef.current.state.value = ''
            }}
          >
            <span className="filter-reset-icon"></span>
            <span>重置</span>
          </div>
        </header>
      </div>
    )
  }
  // 菜单显示隐藏
  const menuVisibleChange = (flag: boolean) => {
    setMenuShow(flag)
  }
  return (
    <Dropdown
      visible={menuShow}
      overlay={() => <FilterMenu />}
      getPopupContainer={(): any => document.getElementById('workPlanFilterBtn')}
      overlayClassName="planFilter"
      trigger={['click']}
      placement="bottomRight"
      onVisibleChange={menuVisibleChange}
    >
      <span className="plan_subbt" id="workPlanFilterBtn">
        <em className="img_icon filter_icon"></em>
        筛选
      </span>
    </Dropdown>
  )
}

// 筛选操作后设置筛选数据
const setFilterData = ({
  filterType,
  stateName,
  stateVal,
  index,
  optItem,
  state,
  setState: setState,
  filterRes,
  afterFilter,
  chooseType,
}: {
  event: any
  filterType: string
  stateName: string
  state: any
  setState: any
  filterRes: any
  afterFilter: any
  optItem: any //当前操作项数据
  stateVal?: any
  index?: number
  chooseType?: string //单选或多选，单选：radio 多选checkbox
}) => {
  let stateOpt: any = state[stateName]
  // 当前操作标签对象
  let tagObjActive: any = {}
  if (stateName == 'tagList') {
    const tagActive = state[stateName].filter((newItem: any) => newItem.active === true)
    stateOpt = tagActive[0]?.tagList
  }
  // 单选多选数组类
  if (filterType == 'checkbox' && Array.isArray(stateOpt)) {
    if (stateName != 'tagList') {
      filterRes[stateName] = []
    }
    let active = true
    if (index != undefined) {
      // 当前所点击筛选项的选中状态，上次选中则本次设为取消，否则反之
      active = stateOpt[index].active ? false : true
    }
    // 重新检查存取筛选结果
    // 改变当前所操作项选中效果active和筛选结果
    stateOpt.map((dataItem: FilterItem, thisI: number) => {
      let thisCode: any = []
      if (stateName == 'deptList') {
        thisCode = dataItem.deptIds
      } else {
        thisCode = [dataItem.code]
      }
      if (chooseType == 'radio') {
        if (thisI == index) {
          // 记录当前操作标签
          tagObjActive = stateOpt[thisI]
          // 设置选中效果
          stateOpt[thisI].active = active
          // 设置返回给用户的的筛选数据
          // 选中添加筛选结果
          if (active) {
            filterRes[stateName] = thisCode
          }
          // 取消选中移除筛选结果
          else {
            filterRes[stateName] = []
          }
        } else {
          stateOpt[thisI].active = false
        }
      } else {
        // 前面已清空，此处重新存取其他选中筛选数据（除自定义标签特殊处理，未先清空）
        if (stateName != 'tagList' && thisI != index && dataItem.active) {
          filterRes[stateName].push(...thisCode)
        }
        // 当前操作项
        if (thisI == index) {
          // 记录当前操作标签
          tagObjActive = stateOpt[thisI]
          stateOpt[thisI].active = active
          // 选中添加筛选结果
          if (active) {
            filterRes[stateName].push(...thisCode)
          }
          // 取消选中移除筛选结果
          else {
            for (const t in filterRes[stateName]) {
              if (filterRes[stateName][t] == optItem.code) {
                filterRes[stateName].splice(t, 1)
                break
              }
            }
          }
        }
      }
    })
    // 自定义标签当前选中导航中存取标签列表更新，以记录每个导航下选中的标签
    if (stateName == 'tagList') {
      const tagList = state[stateName]
      for (const t in tagList) {
        // 当前选中的导航
        if (tagList[t].active) {
          state[stateName][t].tagList = stateOpt
        } else {
          // 其他未选中导航下同一个id的标签也需要设置选中active
          const tagObjList = state[stateName][t].tagList
          const findIndex: number = tagObjList.findIndex((v: any) => {
            return v.id == tagObjActive.id
          })
          if (findIndex > -1) {
            state[stateName][t].tagList[findIndex].active = active
          }
        }
      }
    }
  } else if (filterType == 'rangeTime') {
    let stateTime = ''
    let endTime = ''
    if (stateVal[0]) {
      stateTime = dateFormats('yyyy/MM/dd 00:00', stateVal[0])
      endTime = dateFormats('yyyy/MM/dd 23:59', stateVal[1])
    }
    state.startTime = stateTime
    state.endTime = endTime
    filterRes.startTime = stateTime
    filterRes.endTime = endTime
  } else {
    state[stateName] = stateVal
    filterRes[stateName] = stateVal
  }
  setState({ ...state })
  // 回调函数返回数据给控件afterFilter方法
  if (afterFilter) {
    afterFilter({ ...filterRes })
  }
}

/**
 * 任务管理高级筛选
 */
/**
 * 初始化数据设置
 */
// 层级筛选初始化
const rankListInit = [
  {
    code: 2,
    name: '企业级',
    active: false,
  },
  {
    code: 3,
    name: '部门级',
    active: false,
  },
  {
    code: 0,
    name: '岗位级',
    active: false,
  },
]
// 部门筛选初始化
const deptListInit = [
  {
    code: 0,
    name: '一级部门',
    active: false,
  },
  {
    code: 1,
    name: '二级部门',
    active: false,
  },
  {
    code: 2,
    name: '三级部门',
    active: false,
  },
]

// 状态筛选
const statusListInit = [
  {
    code: 3,
    name: '已延迟',
    active: false,
  },
  {
    code: -4,
    name: '所有',
    active: false,
  },
  {
    code: 2,
    name: '已完成',
    active: false,
  },
  {
    code: 6,
    name: '未完成',
    active: false,
  },
  {
    code: 0,
    name: '未开启',
    active: false,
  },
  {
    code: 1,
    name: '进行中',
    active: false,
  },
  // {
  //   code: -2,
  //   name: '已归档',
  //   active: false,
  // },
]
// 星级筛选
let starListInit: any = []
for (let i = 1; i <= 6; i++) {
  const obj = {
    code: i,
    active: false,
    setType: 0,
  }
  starListInit.push(obj)
}
starListInit = starListInit.reverse()
// 数字优先级筛选
const numListInit: any = []
for (let i = 1; i <= 10; i++) {
  const obj = {
    code: i,
    active: false,
    setType: 1,
  }
  numListInit.push(obj)
}

// 自定义标签导航菜单
const tagNavListInit = [
  {
    code: 0,
    name: 'ALL',
    active: true,
    tagList: [],
  },
  {
    code: 1,
    name: 'A-G',
    active: false,
    tagList: [],
  },
  {
    code: 2,
    name: 'H-N',
    active: false,
    tagList: [],
  },
  {
    code: 3,
    name: 'O-T',
    active: false,
    tagList: [],
  },
  {
    code: 4,
    name: 'U-Z',
    active: false,
    tagList: [],
  },
]

// 初始状态
let stateInit: any = {
  rankList: rankListInit, //级别
  deptList: deptListInit, //部门
  statusList: [...statusListInit],
  starList: starListInit,
  numList: numListInit,
  tagSearchVal: '',
  priorityList: [], //优先级
  startTime: '',
  endTime: '',
  levelList: [], //层级
  noReport: 0, //无汇报任务
  toFile: 0, //已归档任务
  tagList: [...tagNavListInit],
}
// 存储筛选结果
let filterRes: any = {
  rankList: [], //级别
  deptList: [], //部门
  statusList: [],
  priorityList: [],
  tagSearchVal: '',
  startTime: '',
  endTime: '',
  levelList: [],
  noReport: 0, //无汇报内容
  toFile: 0, //已归档任务
  tagList: [],
}
// 储存初始时间
const initTime = { startTime: '', endTime: '' }
/**
 * 筛选重置为初始状态
 */
const resetFilter = ({
  stateInit,
  setState,
  filterObjInit,
  afterFilter,
}: {
  stateInit: any
  setState: any
  filterObjInit: any
  afterFilter: any
}) => {
  setState(stateInit)
  // 回调函数返回数据给控件afterFilter方法
  if (afterFilter) {
    afterFilter(filterObjInit)
  }
}

const TaskManageFilter = React.forwardRef((props: PropsParam, ref) => {
  const { param } = props
  // 调用自定义dom显示出发按钮
  const { renderTextDom } = param
  const [menuShow, setMenuShow] = useState(false)
  const taskOrgInfo: any = $store.getState().taskManageTreeInfo
  /**
   * 初始菜单显示时
   */
  useEffect(() => {
    // 获取当前列表是否初始化查询，初始化查询需要重置筛选，否则不重置
    const listInit = param.getListInit()
    if (listInit) {
      filterRes = { ...filterObjInit }
    }
    if (menuShow && listInit) {
      findFilterInfo()
      if (!taskOrgInfo.isMy) {
        findTags()
      }
    }
  }, [menuShow])

  // 存储筛选数据
  const filterObjInit: any = {
    rankList: [], //级别
    deptList: [], //部门
    statusList: [],
    priorityList: [],
    tagSearchVal: '',
    startTime: '',
    endTime: '',
    levelList: [],
    noReport: 0, //无汇报内容
    toFile: 0, //已归档任务
    tagList: [],
  }

  // ***********************暴露给父组件的方法 start**************************//
  // 此处注意useImperativeHandle方法的的第一个参数是目标元素的ref引用
  useImperativeHandle(ref, () => ({
    //查询列表
    getFilterObj: () => {
      return filterRes
    },
    //初始日期选择
    initRangeTime: () => {
      setRangeTime(initTime)
    },
    // 关闭插件
    closeFilterPlug: () => {
      setMenuShow(false)
    },
  }))
  // ***********************暴露给父组件的方法 end**************************//
  const taskInfo = $store.getState().taskManageTreeInfo
  let orgInfo = taskInfo.orgInfo
  /**
   * state状态
   */
  const [state, setState] = useState<any>(Object.assign({}, stateInit))
  // const [filterObj, setFilterObj] = useState<any>(filterObjInit)
  // 时间范围筛选
  const [rangeTime, setRangeTime] = useState(initTime)
  // 今天
  const [today, setToday] = useState(false)

  /**
   * 查询筛选数据
   */
  const findFilterInfo = () => {
    let getInfo = taskOrgInfo.orgInfo
    if (props.terrObj) {
      getInfo = props.terrObj
    }
    if (props.param.fromtype == 'support') {
      if (props.terrObj) {
        taskOrgInfo.isMy = false
      } else {
        taskOrgInfo.isMy = true
      }
    }
    let selectType = getInfo.curType
    let selectTypeId = getInfo.curId
    let enterpriseId = getInfo.cmyId
    let userId = ''
    // 我的任务模式下
    if (taskOrgInfo.isMy) {
      selectTypeId = 0
      enterpriseId = 0
      selectType = 0
    } else if (getInfo.curType == 0) {
      //选人的时候才传userId
      selectType = 3
      userId = getInfo.curId
      selectTypeId = getInfo.parentId
    }
    const param: any = {
      id: selectTypeId,
      ascriptionType: selectType,
      enterpriseId: enterpriseId,
      listType: 6, //任务管理任务列表
      account: $store.getState().nowAccount,
      loginUserId: $store.getState().nowUserId,
      userId: userId,
    }
    requestApi({
      url: '/task/findListCondition',
      param: param,
      json: true,
    }).then((res: any) => {
      if (res.success) {
        const data = res.data.data || {}
        // 筛选展示层级列表
        const levelList: any = []
        // 筛选展示级别列表
        const rankList: any = []
        // 筛选展示部门列表
        const deptList: any = []
        // 后台返回部门
        const departLevel = data.departLevel || []
        // 后台返回级别
        const rankLevel = data.ascriptionLevel || []
        // 后台返回优先级
        const priorityList = data.setType == 1 ? numListInit.concat() : starListInit.concat()
        // 层级
        data.levelList?.map((level: number) => {
          const obj = {
            code: level,
            active: false,
          }
          levelList.push(obj)
        })
        // 级别
        rankLevel.map((item: any) => {
          let name = ''
          switch (item) {
            case 2:
              name = '企业级'
              break
            case 3:
              name = '部门级'
              break
            case 0:
            default:
              name = '岗位级'
              break
          }
          const obj = {
            code: item,
            name: name,
            active: false,
          }
          rankList.push(obj)
        })
        // 部门
        departLevel.map((item: any) => {
          let name = ''
          switch (item.level) {
            case 1:
              name = '一级部门'
              break
            case 2:
              name = '二级部门'
              break
            case 3:
              name = '三级部门'
              break
            default:
              name = item.level + '级部门'
              break
          }
          const obj = {
            code: item.level,
            name: name,
            active: false,
            deptIds: item.deptIds || [],
          }
          deptList.push(obj)
        })
        // 浅拷贝数组对象
        const levelListChange = levelList.concat()
        const priorityListChange = priorityList.concat()
        stateInit = {
          ...stateInit,
          levelList: levelListChange,
          priorityList: priorityListChange,
          deptList: deptList.concat(),
          rankList: rankList.concat(),
        }
        setState({
          ...stateInit,
        })
      }
    })
  }

  /**
   * 查询自定义标签
   * @param paramObj
   */
  const findTags = () => {
    if (props.param.fromtype == 'support') {
      if (props.terrObj) {
        taskInfo.isMy = false
      } else {
        taskInfo.isMy = true
      }
    }
    if (props.terrObj) {
      orgInfo = props.terrObj
    }
    const ascriptionType = taskInfo.isMy ? 0 : 2
    const ascriptionId = taskInfo.isMy ? $store.getState().nowUserId : orgInfo.cmyId
    const param = {
      typeId: orgInfo.cmyId,
      ascriptionType,
      ascriptionId,
    }
    queryCompanyTags(param).then((res: any) => {
      let allData = res.data.dataList || []
      allData = allData.filter((newItem: any) => newItem.isSelect === 0)
      allData.map((item: any) => {
        item.code = item.id
        item.name = item.content
        item.active = false
      })
      const sortTag = TagArea(allData)
      tagNavListInit.map((item: any, i: number) => {
        if (i == 0) {
          item.tagList = allData
        } else {
          item.tagList = sortTag[i - 1]
        }
      })
      setState({
        ...stateInit,
        tagList: tagNavListInit.concat(),
      })
      stateInit.tagList = tagNavListInit.concat()
    })
  }
  /**
   * 更新筛选数据
   * @param paramObj
   */
  const setFilterDataFn = (paramObj: any, propss?: any) => {
    setFilterData({
      ...paramObj,
      state: JSON.parse(JSON.stringify(state)),
      setState: setState,
      filterRes: filterRes,
      afterFilter: props.afterFilter,
    })
    let flag = false
    Object.keys(filterRes).forEach(function(key) {
      if (key == 'startTime' || key == 'endTime') {
        if (filterRes[key]) {
          flag = true
        }
      } else if (key == 'noReport' || key == 'toFile') {
        if (filterRes[key] == 1) {
          flag = true
        }
      } else if (key == 'rankList' || key == 'statusList' || key == 'levelList') {
        filterRes[key].forEach((item: any) => {
          if (item.length != 0) {
            flag = true
          }
        })
      }
    })
    if (propss) {
      updateTipIcon(flag)
    }
  }
  // 更新父组件tip 图标提示
  const updateTipIcon = (flag: boolean) => {
    props.gettoptip && props.gettoptip(flag)
  }
  /**
   *判断是否是初始化状态
   */
  const isInit = (filterRes: any) => {
    let flag = true
    if (
      filterRes.statusList.length == 0 &&
      filterRes.priorityList.length == 0 &&
      filterRes.levelList.length == 0 &&
      filterRes.tagSearchVal == '' &&
      filterRes.startTime == '' &&
      filterRes.endTime == '' &&
      filterRes.noReport == 0 &&
      filterRes.toFile == 0 &&
      filterRes.rankList.length == 0 &&
      filterRes.deptList.length == 0 &&
      filterRes.tagList.length == 0
    ) {
      flag = true
    } else {
      flag = false
    }
    return flag
  }
  /**
   * 自定义标签导航切换
   */
  const tagNavChange = (index: number) => {
    state.tagList.map((item: any, i: number) => {
      if (i == index) {
        item.active = true
      } else {
        item.active = false
      }
    })
    setState({
      ...state,
      tagList: state.tagList.concat(),
    })
  }

  /**
   * 筛选菜单内容
   */
  const FilterMenu = (props: any) => {
    return (
      <div className="filtersTermBox taskFiltersTerm">
        <div className="filtersCon">
          <section className="filtersItem">
            {/* 级别 */}
            <div className="filters-item-tit">
              <span className="tit_name">级别(多选)</span>
            </div>
            <div className={`filters-item-con  ${state.deptList.length > 0 ? 'border0' : ''}`}>
              <ul className="filter_cont_list flex wrap filter_rank_list">
                {state.rankList?.map((item: any, i: number) => {
                  return (
                    <li
                      className={`filter_multi_item notick ${item.active ? 'active' : ''}`}
                      key={i}
                      onClick={(e: any) => {
                        setFilterDataFn(
                          {
                            event: e,
                            filterType: 'checkbox',
                            stateName: 'rankList',
                            optItem: item,
                            index: i,
                          },
                          props
                        )
                        // prop.gettoptip(true)
                      }}
                    >
                      {item.name}
                    </li>
                  )
                })}
              </ul>
            </div>
            {/* 部门 */}
            <div className={`filters-item-tit ${state.deptList.length > 0 ? '' : 'forcedHide'}`}>
              <span className="tit_name">部门(多选)</span>
              {/* <span className="tit_multi">（多选）</span> */}
            </div>
            <div className={`filters-item-con ${state.deptList.length > 0 ? '' : 'forcedHide'}`}>
              {[1].map(() => {
                return (
                  <ul key={1} className="filter_cont_list flex wrap">
                    {state.deptList?.map((item: any, i: number) => {
                      return (
                        <li
                          className={`filter_multi_item notick ${item.active ? 'active' : ''}`}
                          key={i}
                          onClick={(e: any) => {
                            setFilterDataFn(
                              {
                                event: e,
                                filterType: 'checkbox',
                                stateName: 'deptList',
                                optItem: item,
                                index: i,
                              },
                              props
                            )
                          }}
                        >
                          {item.name}
                        </li>
                      )
                    })}
                  </ul>
                )
              })}
            </div>
            <div className="filters-item-tit">
              <span className="tit_name">任务状态(多选)</span>
            </div>
            <div className="filters-item-con">
              <div className="filters-item-in">
                <div className="filter-status">
                  <ul className="filter-status-type filter-status-type ">
                    {state.statusList?.map((item: any, i: number) => {
                      return (
                        <li
                          className={`filter_multi_item notick ${item.active ? 'active' : ''}`}
                          key={i}
                          data-code={item.code}
                          onClick={(e: any) => {
                            setFilterDataFn(
                              {
                                event: e,
                                filterType: 'checkbox',
                                stateName: 'statusList',
                                stateVal: '',
                                optItem: item,
                                index: i,
                              },
                              props
                            )
                          }}
                        >
                          {item.name}
                        </li>
                      )
                    })}
                  </ul>
                  <div className="clearfix"></div>
                </div>
              </div>
            </div>

            <div className={`filters-item-tit ${taskInfo.isMy ? 'forcedHide' : ''}`}>
              <span className="tit_name">优先级(多选)</span>
            </div>
            <div className={`filters-item-con ${taskInfo.isMy ? 'forcedHide' : ''}`}>
              <ul className="filter_cont_list flex wrap filter_star_list">
                {!taskInfo.isMy &&
                  state.priorityList?.map((item: any, i: number) => {
                    return (
                      <li
                        className={`filter_multi_item notick ${item.setType == 1 ? 'num' : 'star'} num_${
                          item.code
                        } ${item.active ? 'active' : ''}`}
                        key={i}
                        onClick={(e: any) => {
                          setFilterDataFn(
                            {
                              event: e,
                              filterType: 'checkbox',
                              stateName: 'priorityList',
                              optItem: item,
                              index: i,
                            },
                            props
                          )
                        }}
                      >
                        {item.setType == 1 ? <em>{item.code}</em> : item.code + '星任务'}
                      </li>
                    )
                  })}
              </ul>
            </div>

            <div className="filters-item-tit forcedHide">
              <span className="tit_name">按标签筛选</span>
              <span className="filter-trig-icon up f-right"></span>
            </div>
            <div className="filters-item-con forcedHide">
              <Input.Search
                placeholder="搜索标签关键字"
                onFocus={(e: any) => {
                  e.stopPropagation()
                }}
                onSearch={(value: string) => {
                  setFilterDataFn({
                    event: event,
                    filterType: 'string',
                    stateName: 'tagSearchVal',
                    stateVal: value,
                  })
                }}
                className="baseSearch w100 searchVal filterSearchVal"
              />
            </div>

            <div className="filters-item-tit">
              <span className="tit_name">按日期筛选</span>
              <span className="filter-trig-icon up f-right"></span>
            </div>
            <div className="filters-item-con filter_date_item flex between center-v">
              <RangePicker
                placeholder={['开始时间', '结束时间']}
                allowClear
                value={
                  rangeTime.startTime
                    ? [moment(rangeTime.startTime, 'YYYY-MM-DD'), moment(rangeTime.endTime, 'YYYY-MM-DD')]
                    : null
                }
                onChange={(date: any, dateString: any) => {
                  setToday(false)
                  setRangeTime({ startTime: dateString[0], endTime: dateString[1] })
                  setFilterDataFn(
                    {
                      event: event,
                      filterType: 'rangeTime',
                      stateName: 'filterTime',
                      stateVal: dateString,
                    },
                    props
                  )
                }}
              />
              <span
                className={`search_today_btn mtleft ${today ? 'active' : ''}`}
                onClick={() => {
                  setRangeTime(initTime)
                  setRangeTime({ startTime: '', endTime: '' })
                  setToday(today ? false : true)
                  let stateTime = ''
                  let endTime = ''
                  if (!today) {
                    //选中（取消选中设置时间为空）
                    stateTime = dateFormats('yyyy/MM/dd 00:00')
                    endTime = dateFormats('yyyy/MM/dd 23:59')
                  }
                  setFilterDataFn(
                    {
                      event: event,
                      filterType: 'rangeTime',
                      stateName: 'filterTime',
                      stateVal: [stateTime, endTime],
                    },
                    props
                  )
                }}
              >
                今天
              </span>
            </div>

            <div className="filters-item-tit">
              <span className="tit_name">层级(单选)</span>
              <span className="tit_multi" style={{ marginLeft: '10px' }}>
                层
              </span>
            </div>
            <div className="filters-item-con flex border0">
              {/* <div className="filter-level-tit">第</div> */}
              <ul className="filter-level-list flex wrap flex-1">
                {state.levelList?.map((item: any, i: number) => {
                  return (
                    <li
                      className={`filter-level-item ${item.active ? 'active' : ''}`}
                      key={i}
                      data-code={item.code}
                      onClick={(e: any) => {
                        setFilterDataFn(
                          {
                            event: e,
                            filterType: 'checkbox',
                            stateName: 'levelList',
                            optItem: item,
                            index: i,
                            chooseType: 'radio', //单选
                          },
                          props
                        )
                      }}
                    >
                      {item.code}
                    </li>
                  )
                })}
              </ul>
              {/* <div className="filter-level-tit">层</div> */}
            </div>
            {/* 自定义标签 */}
            <div className={`filters-item-tit ${taskInfo.isMy ? 'forcedHide' : ''}`}>
              <span className="tit_name">标签(多选)</span>
              {/* <span className="tit_multi">（多选）</span> */}
            </div>
            {!taskInfo.isMy &&
              [1].map(() => {
                const tagNavList = state.tagList
                const tagActive = tagNavList.filter((newItem: any) => newItem.active === true)
                return (
                  <div key={1} className="filters-item-con">
                    <ul className="filter_tag_nav">
                      {tagNavList?.map((item: any, i: number) => {
                        return (
                          <li
                            className={`tag_nav_item ${item.active ? 'active' : ''}`}
                            key={i}
                            onClick={() => {
                              tagNavChange(i)
                            }}
                          >
                            {item.name}
                          </li>
                        )
                      })}
                    </ul>
                    <ul className="filter_cont_list flex wrap">
                      {tagActive[0].tagList?.map((item: any, i: number) => {
                        return (
                          <li
                            className={`filter_multi_item notick ${item.active ? 'active' : ''}`}
                            key={i}
                            onClick={(e: any) => {
                              setFilterDataFn(
                                {
                                  event: e,
                                  filterType: 'checkbox',
                                  stateName: 'tagList',
                                  optItem: item,
                                  index: i,
                                },
                                props
                              )
                            }}
                          >
                            {item.name}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
          </section>
        </div>

        <header className="filtersFooter flex between center-v">
          <div className="filter_noreport_btn">
            {/* <span className="img_icon filter_noreport_icon"></span> */}
            <Checkbox
              checked={state.noReport ? true : false}
              onChange={e => {
                setFilterDataFn(
                  {
                    event: e,
                    filterType: 'noReport',
                    stateName: 'noReport',
                    stateVal: state.noReport ? 0 : 1,
                  },
                  props
                )
              }}
            >
              无汇报任务
            </Checkbox>
            <Checkbox
              checked={state.toFile ? true : false}
              onChange={e => {
                setFilterDataFn(
                  {
                    event: e,
                    filterType: 'toFile',
                    stateName: 'toFile',
                    stateVal: state.toFile ? 0 : 1,
                  },
                  props
                )
              }}
            >
              已归档任务
            </Checkbox>
          </div>
          <div
            className={`filter-reset-box header_btn ${isInit(filterRes) ? 'forcedHide' : ''}`}
            onClick={() => {
              const resetInit = { ...stateInit }
              filterRes = filterObjInit
              resetFilter({
                stateInit: resetInit,
                setState: setState,
                filterObjInit: filterRes,
                afterFilter: props.afterFilter,
              })
              updateTipIcon(false)
              setRangeTime(initTime)
            }}
          >
            <span className="img_icon filter-reset-icon"></span>
            <span>重置</span>
          </div>
        </header>
      </div>
    )
  }
  // 菜单显示隐藏
  const menuVisibleChange = (flag: boolean) => {
    setMenuShow(flag)
  }
  return (
    <Dropdown
      visible={menuShow}
      overlay={() => FilterMenu(props)}
      // getPopupContainer={(): any => document.getElementById('workPlanFilterBtn')}
      overlayClassName="taskManageFilter"
      trigger={['click']}
      placement="bottomRight"
      onVisibleChange={menuVisibleChange}
    >
      {renderTextDom ? renderTextDom : <MenuOutlined />}
    </Dropdown>
  )
})
export { PlanFilterModule, TaskManageFilter }
