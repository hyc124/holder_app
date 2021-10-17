import React, { useEffect, useState } from 'react'
import { getAddprojectData, getDistribute } from '../workplan/addplanfu'
import { Dropdown, message, Tooltip } from 'antd'
import { getTreeParam } from '../../common/js/tree-com'
import { useSelector } from 'react-redux'
import { removemindFns } from './work-plan-mind'
import { setStausNumberApi } from './getData'
// 解决快速切换导航，导致进入重复请求
let changeNavTimering: any = null
const WorkPlanMindTitle = (props: any) => {
  //获取组织结构
  const getplanTree = getTreeParam(useSelector((store: StoreStates) => store.workplanTreeId))
  //选择我的规划创建规划获取企业信息
  const myplanOrg = useSelector((store: StoreStates) => store.myPlanOrg)
  //是否入口为我的规划
  const isMyplan = useSelector((store: StoreStates) => store.planMainInfo.isMyPlan)
  //四现象/脑图
  const fromToType = useSelector((store: StoreStates) => store.fromPlanTotype.fromToType)
  //创建/详情
  const createType = useSelector((store: StoreStates) => store.fromPlanTotype.createType)
  const [planClass, setPlanClass] = useState([1, 2])
  const [menuShow, setMenuShow] = useState(false)
  let _mindId = ''
  const [planClassCount, setPlanClassCount] = useState({
    finishCount: 0,
    unfinishedCount: 0,
  })
  useEffect(() => {
    return () => {
      changeNavTimering = null
    }
  }, [])
  useEffect(() => {
    setMenuShow(false)
    _mindId = props.mindId
    if (planClass.length < 2) {
      setPlanClass([1, 2])
      $store.dispatch({ type: 'PLANSTATEARR', data: [1, 2].toString() })
    }
    $('.distribute_tips').show(300)
  }, [props.mindId])
  const addMindMap = () => {
    if (fromToType == 0) {
      //调用公共创建规划
      getAddprojectData(getplanTree, myplanOrg, isMyplan, fromToType)
    } else if (fromToType == 1) {
      props.changeStatus(true)
      const { fromPlanTotype } = $store.getState()
      $store.dispatch({ type: 'FROM_PLAN_TYPE', data: { ...fromPlanTotype, createType: 0 } })
      let teamName = ''
      let teamId = ''
      if (isMyplan) {
        //入口为我的规划
        teamId = myplanOrg.cmyId || $store.getState().mindMapData.teamId
        teamName = myplanOrg.cmyName || $store.getState().mindMapData.teamName
      } else {
        //组织架构树
        teamId = getplanTree.cmyId
        teamName = getplanTree.cmyName
      }
      $store.dispatch({
        type: 'MINDMAPDATA',
        data: {
          id: 0,
          typeId: 0,
          name: '目标计划',
          teamName: teamName,
          teamId: teamId,
          status: 1,
          mainId: '',
          type: 2,
        },
      })
      $store.dispatch({ type: 'DIFFERENT_OkR', data: 0 })
      //跳转到脑图
      $tools.createWindow('workplanMind')
    }
  }
  const changeMindMap = (type: number) => {
    const { fromPlanTotype } = $store.getState()
    $store.dispatch({ type: 'FROM_PLAN_TYPE', data: { ...fromPlanTotype, fromToType: type } })
    $tools.createWindow('workplanMind')
    jQuery('.optBtnMoreList,.portrait_okrMain,.eidt_Kr_Process,.mindmap_datepickr').hide()
  }
  // 菜单显示隐藏
  const menuVisibleChange = (flag: boolean) => {
    setMenuShow(flag)
  }
  //状态设置
  const setStausMind = (type: number) => {
    if (type == 0) {
      setPlanClass([1, 2])
      $store.dispatch({ type: 'PLANSTATEARR', data: [1, 2].toString() })
    } else {
      if (planClass.includes(type)) {
        if (planClass.length > 1) {
          planClass.splice(
            planClass.findIndex((item: number) => item === type),
            1
          )
          setPlanClass([...planClass])
          $store.dispatch({ type: 'PLANSTATEARR', data: [...planClass].toString() })
        }
      } else {
        planClass.push(type)
        setPlanClass([...planClass])
        $store.dispatch({ type: 'PLANSTATEARR', data: [...planClass].toString() })
      }
    }
    menuVisibleChange(false)
  }
  //查询状态统计
  const setStausNumber = () => {
    const params = {
      mainId: props.mindId || _mindId, //根节点id
    }
    setStausNumberApi(params).then((resdata: any) => {
      setPlanClassCount({
        finishCount: resdata.data.finishCount || 0,
        unfinishedCount: resdata.data.unfinishedCount || 0,
      })
    })
  }
  return (
    <div className="WorkPlanMindTitle">
      <header>
        <div style={{ display: 'flex', flex: '1', alignItems: 'center', maxWidth: 'calc(100% - 400px)' }}>
          <div className="org_name text-ellipsis">{props.teamName}</div>
          <section className="headerLeft">
            {props.titleArr.map((item: any, index: number) => {
              let statusTxt = ''
              let statusClass = ''
              if (item.status == 4) {
                statusTxt = '已派发'
                statusClass = 'yes_disb'
              } else if (item.status == 3) {
                statusTxt = '部分派发'
                statusClass = 'yes_disb'
              } else if (item.status == 2) {
                statusTxt = '审核中'
                statusClass = 'review'
              } else if (item.status == 5) {
                statusTxt = '已完成'
                statusClass = 'finish'
              } else {
                statusTxt = '草稿'
                statusClass = 'no_disb'
              }
              let typeTxt = ''
              let typeClass = ''
              if (item.ascriptionType === 0) {
                typeTxt = '【个人】'
              } else if (item.ascriptionType == 3) {
                typeTxt = '【部门】'
                typeClass = 'yes_disb'
              } else if (item.ascriptionType == 2) {
                typeTxt = '【企业】'
                typeClass = 'part_disb'
              } else {
                typeClass = 'none'
              }
              return (
                <nav
                  style={{ maxWidth: 100 / props.titleArr.length - 1 + '%' }}
                  className={`planTabBox ${props.data.id == item.id ? 'active' : ''}`}
                  key={index}
                  onClick={() => {
                    if (createType == 0 && fromToType == 1) {
                      return false
                    }
                    if (changeNavTimering) return
                    changeNavTimering = setTimeout(() => {
                      changeNavTimering = false
                    }, 1000)
                    props.showMap(item)
                  }}
                >
                  <ul>
                    <li className="planTabItem">
                      <span
                        className={`plan_tab_sign ${statusClass}`}
                        style={{ marginRight: typeClass == 'none' ? '4px' : '' }}
                      >
                        {statusTxt}
                      </span>
                      <span className={`plan_tab_type ${typeClass}`}>{typeTxt}</span>
                      <Tooltip title={item.name}>
                        <span className="plan_name">{item.name}</span>
                      </Tooltip>

                      {(createType == 0 && fromToType == 1) || props.statusChoose ? (
                        ''
                      ) : (
                        <i
                          className="img_icon tab_del_icon"
                          onClick={(e: any) => {
                            e.stopPropagation()
                            removemindFns('removemind', item)
                          }}
                        ></i>
                      )}
                    </li>
                  </ul>
                </nav>
              )
            })}
            <span className="add_mind_map" onClick={addMindMap}></span>
          </section>
        </div>
        <section className="headerRight">
          <Dropdown
            visible={menuShow}
            onVisibleChange={menuVisibleChange}
            overlay={
              <div className="planAccomplishMuem">
                <p>按状态筛选：</p>
                <ul>
                  <li
                    className={`${planClass.includes(1) ? 'active' : ''}`}
                    onClick={e => {
                      e.preventDefault()
                      setStausMind(1)
                    }}
                  >
                    未完成({planClassCount.unfinishedCount})
                  </li>
                  <li
                    className={`${planClass.includes(2) ? 'active' : ''}`}
                    onClick={e => {
                      e.preventDefault()
                      setStausMind(2)
                    }}
                  >
                    已完成({planClassCount.finishCount})
                  </li>
                  {/* <li
                    className={`${planClass.includes(3) ? 'active' : ''}`}
                    onClick={e => {
                      e.preventDefault()
                      setStausMind(3)
                    }}
                  >
                    归档
                  </li> */}
                </ul>
                <div className="reset">
                  <span
                    onClick={(e: any) => {
                      e.preventDefault()
                      setStausMind(0)
                    }}
                  >
                    <i></i>重置
                  </span>
                </div>
              </div>
            }
            className="planAccomplish"
            trigger={['click']}
            placement="bottomRight"
          >
            <span
              className={`plan_subbt ${planClass.length != 2 ? 'plan_subbt_active' : ''}`}
              onClick={e => {
                e.preventDefault()
                setStausNumber()
              }}
            >
              <span className="subbt_active"></span>
              <em className="img_icon filter_icon"></em>
              筛选
            </span>
          </Dropdown>
          <div
            className={`breaking_distribute ${
              !props.auth || (createType == 0 && fromToType == 1) ? 'mind_forbid' : ''
            }`}
            onClick={() => {
              // 四现象模式
              if (createType == 0 && fromToType == 1 && props.statusChoose) {
                return false
              }
              if (!props.statusChoose && createType != 0) {
                $store.dispatch({ type: 'SELECT_DISTRIBUTE_DATE', data: [] })
              }
              props.changeStatus(!props.statusChoose)
            }}
          >
            <span>{props.statusChoose && createType != 0 ? '取消选择' : '选择派发'}</span>
          </div>
          <div
            className={`distribute_plan_mian ${!props.auth || createType == 0 ? 'mind_forbid' : ''}`}
            onClick={() => {
              // 四现象模式
              if (createType == 0 && fromToType == 1 && props.statusChoose) {
                return false
              }
              const params = props.titleArr.filter(
                (item: any, index: number) => $store.getState().mindMapData.id == item.id
              )[0]
              let param: any = {}
              if (props.statusChoose) {
                param = {
                  mainId: params.mainId || props.mindId, //根节点id
                  operateUser: $store.getState().nowUserId, //操作人Id
                  operateAccount: $store.getState().nowAccount, //操作人帐号
                  teamId: $store.getState().mindMapData.teamId,
                  teamName: $store.getState().mindMapData.teamName,
                  typeIds: $store.getState().selectDistribute, //单点派发集合
                  isWhole: 0, //1象限派发 0选择派发
                }
              } else {
                //派发所有
                param = {
                  mainId: params.mainId || props.mindId, //根节点id
                  id: params.id, //节点Id
                  typeId: params.typeId, //任务id
                  operateUser: $store.getState().nowUserId, //操作人Id
                  operateAccount: $store.getState().nowAccount, //操作人帐号
                  teamId: $store.getState().mindMapData.teamId,
                  teamName: $store.getState().mindMapData.teamName,
                }
              }
              if (props.statusChoose) {
                if (param.typeIds.length == 0) {
                  message.warning('没有可派发的规划')
                  return
                }
              }
              getDistribute(param).then((resData: any) => {
                if (resData.returnCode === 0) {
                  props.changeStatus(false)
                  props.sevaDistr(props.statusChoose, param.typeIds)
                }
              })
            }}
          >
            <span className={`distribute_plan_btn ${!props.auth || createType == 0 ? 'mind_forbid' : ''}`}>
              {props.statusChoose && createType != 0 ? '派发选中项' : '派发任务'}
            </span>
            <span className={`countDistribute ${!props.auth || createType == 0 ? 'mind_forbid' : ''}`}>
              {props.statusChoose && createType != 0 ? `(${$store.getState().selectDistribute.length})` : '(0)'}
            </span>
          </div>
          {$store.getState().mindMapData.type == 2 || createType == 0 ? (
            <div className="pattern_type">
              <span
                className={`pattern_mind ${fromToType == 0 ? 'active' : ''}`}
                onClick={() => changeMindMap(0)}
              ></span>
              <span
                className={`pattern_card ${fromToType == 1 ? 'active' : ''}`}
                onClick={() => changeMindMap(1)}
              ></span>
            </div>
          ) : (
            ''
          )}
        </section>
      </header>
      <div className="distribute_tips">
        <i></i>温馨提示：未派发的计划就只是草稿计划呦^_^
        <span
          className="distribute_tips_del"
          onClick={() => {
            $('.distribute_tips').hide(300)
          }}
        >
          ×
        </span>
      </div>
    </div>
  )
}

export default WorkPlanMindTitle
