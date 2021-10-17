import React, { useEffect, useState } from 'react'
import { getDistribute } from '../list-card-four/okr-addplanfu'
import { Dropdown, message, Tooltip } from 'antd'
import { useSelector } from 'react-redux'
import { removemindOkrFns } from './work-okr-mind'
import { setStausNumberApi } from '../../work-plan-mind/getData'
const WorkPlanMindTitle = (props: any) => {
  //是否入口为我的规划
  const isMyplan = useSelector((store: StoreStates) => store.planOkrMainInfo.isMyPlan)
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
    setMenuShow(false)
    _mindId = props.mindId
    if (planClass.length < 2) {
      setPlanClass([1, 2])
      $store.dispatch({ type: 'PLANOKRSTATEARR', data: [1, 2].toString() })
    }
    $('.distribute_tips').show(300)
  }, [props.mindId])
  // console.log(props.titleArr)
  const addMindMap = () => {
    $store.dispatch({
      type: 'MYPLAN_ORG',
      data: {
        cmyId: $store.getState().mindMapOkrData.teamId,
        curType: -1,
        cmyName: $store.getState().mindMapOkrData.teamName,
        curId: -1,
      },
    })
    if (!isMyplan) {
      $store.dispatch({ type: 'PLANOKRMAININFO', data: { isMyPlan: true } })
    }
    props.changeStatus(true)
    const { fromPlanTotype } = $store.getState()
    $store.dispatch({ type: 'FROM_PLAN_TYPE', data: { ...fromPlanTotype, createType: 0 } })
    $store.dispatch({
      type: 'MINDMAPOKRDATA',
      data: {
        id: 0,
        typeId: 0,
        name: $intl.get('target'),
        teamName: $store.getState().mindMapOkrData.teamName,
        teamId: $store.getState().mindMapOkrData.teamId,
        status: 1,
        mainId: '',
        type: 2,
        ascriptionType: -1,
      },
    })
    //跳转到脑图
    $tools.createWindow('okrFourquadrant')
  }

  // 菜单显示隐藏
  const menuVisibleChange = (flag: boolean) => {
    setMenuShow(flag)
  }
  //状态设置
  const setStausMind = (type: number) => {
    if (type == 0) {
      setPlanClass([1, 2])
      $store.dispatch({ type: 'PLANOKRSTATEARR', data: [1, 2].toString() })
    } else {
      if (planClass.includes(type)) {
        if (planClass.length > 1) {
          planClass.splice(
            planClass.findIndex((item: number) => item === type),
            1
          )
          setPlanClass([...planClass])
          $store.dispatch({ type: 'PLANOKRSTATEARR', data: [...planClass].toString() })
        }
      } else {
        planClass.push(type)
        setPlanClass([...planClass])
        $store.dispatch({ type: 'PLANOKRSTATEARR', data: [...planClass].toString() })
      }
    }
    menuVisibleChange(false)
  }
  //查询状态统计
  const setStausNumber = () => {
    const params = {
      mainId: $store.getState().mindMapOkrData.mainId, //根节点id
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
        <div style={{ display: 'flex', flex: '1', alignItems: 'center', maxWidth: 'calc(100% - 318px)' }}>
          <div className="org_name text-ellipsis">{props.teamName}</div>
          <section className="headerLeft">
            {props.titleArr && props.titleArr.length > 0 && (
              <SolveTitile
                titleArr={props.titleArr}
                data={props.data}
                getshowMap={props.showMap}
                changeStatus={() => {
                  setStausMind(0)
                }}
              />
            )}
            {props.data.id ? <span className="add_mind_map" onClick={addMindMap}></span> : ''}
          </section>
        </div>
        <section className="headerRight">
          <Dropdown
            visible={menuShow}
            onVisibleChange={menuVisibleChange}
            overlay={
              <div className="planAccomplishMuem">
                <p>{$intl.get('filterByStatus')}：</p>
                <ul>
                  <li
                    className={`${planClass.includes(1) ? 'active' : ''}`}
                    onClick={e => {
                      e.preventDefault()
                      setStausMind(1)
                    }}
                  >
                    {$intl.get('notFinish')}({planClassCount.unfinishedCount})
                  </li>
                  <li
                    className={`${planClass.includes(2) ? 'active' : ''}`}
                    onClick={e => {
                      e.preventDefault()
                      setStausMind(2)
                    }}
                  >
                    {$intl.get('finished')}({planClassCount.finishCount})
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
                    <i></i>
                    {$intl.get('reset')}
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
              {$intl.get('filter')}
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
            <span>
              {props.statusChoose && createType != 0
                ? $intl.get('cancelSelect')
                : $intl.get('selectDistribute')}
            </span>
          </div>
          <div
            className={`distribute_plan_mian ${!props.auth || createType == 0 ? 'mind_forbid' : ''}`}
            onClick={() => {
              // 四现象模式
              if (createType == 0 && fromToType == 1 && props.statusChoose) {
                return false
              }
              const params = props.titleArr.filter(
                (item: any, index: number) => $store.getState().mindMapOkrData.id == item.id
              )[0]
              let param: any = {}
              if (props.statusChoose) {
                param = {
                  mainId: params.mainId || props.mindId, //根节点id
                  operateUser: $store.getState().nowUserId, //操作人Id
                  operateAccount: $store.getState().nowAccount, //操作人帐号
                  teamId: $store.getState().mindMapOkrData.teamId,
                  teamName: $store.getState().mindMapOkrData.teamName,
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
                  teamId: $store.getState().mindMapOkrData.teamId,
                  teamName: $store.getState().mindMapOkrData.teamName,
                }
              }
              if (props.statusChoose) {
                if (param.typeIds.length == 0) {
                  message.warning($intl.get('noDistributeTask'))
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
              {props.statusChoose && createType != 0
                ? $intl.get('distributeSelOption')
                : $intl.get('distributeTask')}
            </span>
            <span className={`countDistribute ${!props.auth || createType == 0 ? 'mind_forbid' : ''}`}>
              {props.statusChoose && createType != 0 ? `(${$store.getState().selectDistribute.length})` : '(0)'}
            </span>
          </div>
        </section>
      </header>
      <div className="distribute_tips">
        <i></i>
        {$intl.get('draftDistributedMsg')}
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

export const SolveTitile = (props: any) => {
  const fromToType = useSelector((store: StoreStates) => store.fromPlanTotype.fromToType)
  //创建/详情
  const createType = useSelector((store: StoreStates) => store.fromPlanTotype.createType)
  const [titleArr, setTitleArr] = useState<any>()
  useEffect(() => {
    setTitleArr(props.titleArr)
  }, [props])
  return (
    <>
      {titleArr &&
        titleArr.length > 0 &&
        titleArr.map((item: any, index: number) => {
          let statusTxt = ''
          let statusClass = ''
          if (item.status == 4) {
            statusTxt = $intl.get('distributed')
            statusClass = 'yes_disb'
          } else if (item.status == 3) {
            statusTxt = $intl.get('partDistributed')
            statusClass = 'yes_disb'
          } else if (item.status == 2) {
            statusTxt = $intl.get('approvaling')
            statusClass = 'review'
          } else if (item.status == 5) {
            statusTxt = $intl.get('finished')
            statusClass = 'finish'
          } else {
            statusTxt = $intl.get('draft')
            statusClass = 'no_disb'
          }
          let typeTxt = ''
          let typeClass = ''
          if (item.ascriptionType === 0) {
            typeTxt = `【${$intl.get('userRank')}】`
          } else if (item.ascriptionType == 3) {
            typeTxt = `【${$intl.get('deptRank')}】`
            typeClass = 'yes_disb'
          } else if (item.ascriptionType == 2) {
            typeTxt = `【${$intl.get('cmyRank')}】`
            typeClass = 'part_disb'
          } else {
            typeClass = 'none'
          }
          return (
            <nav
              style={{ maxWidth: 100 / titleArr.length - 1 + '%' }}
              className={`planTabBox ${props.data.id == item.id ? 'active' : ''}`}
              key={index}
              onClick={() => {
                if (createType == 0 && fromToType == 1) {
                  return false
                }
                props.changeStatus()
                props.getshowMap(item)
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
                  {/* 修改：创建目标时也可删除标签 */}
                  {/* {fromToType == 1 || props.statusChoose ? (
                    ''
                  ) : (
                    <i
                      className="img_icon tab_del_icon"
                      onClick={(e: any) => {
                        e.stopPropagation()
                        removemindOkrFns('removemind', item)
                      }}
                    ></i>
                  )} */}
                  <i
                    className="img_icon tab_del_icon"
                    onClick={(e: any) => {
                      e.stopPropagation()
                      removemindOkrFns('removemind', item)
                    }}
                  ></i>
                </li>
              </ul>
            </nav>
          )
        })}
    </>
  )
}
