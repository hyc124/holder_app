import React, { useState, useReducer, useRef, forwardRef, useEffect, useImperativeHandle } from 'react'
import { Avatar, Collapse } from 'antd'
import { CaretUpOutlined } from '@ant-design/icons'
interface CurInt {
  curMarkId: number
  curTeamId: number
  curTypeId: number
  dashboardName: string
}
/** 最后一层 仪表数据 */
interface DashboardVos {
  typeId: number
  markId: number
  teamId: number
  dashboardName: string
}

/** 第二层 仪表类型 */
interface FormTypeVos {
  typeName: string
  typeId: number
  teamId: number
  dashboardVos: DashboardVos[]
}

/** 第一层 公司 */
interface FakeList {
  teamId: number
  teamName: string
  teamIcon: string
  formTypeVos: FormTypeVos[]
}

/** 仪表盘DataList */
export interface DataParam {
  controlList: FakeList[]
  showSearch: boolean
  curNode: CurInt
  [dataParams: string]: any
}

/** props */
interface Props {
  rightView: any
  dataParam: DataParam
  setCurMarkId: (curParams: {
    curMarkId: number
    curTeamId: number
    curTypeId: number
    dashboardName: string
  }) => void
}
interface StateInt {
  curNode: CurInt
  // curMarkId: number
  defaultActiveKey: number[]
  activeKey: number[]
  activeKeyType: number[]
  nochildIdCom: number[]
  nochildIdType: number[]
  [stateName: string]: any
}

/** 搜索字典 */
interface Dir<t> {
  [key: string]: t
}
/** 仪表盘tree */
const ControlTree = forwardRef((props: Props, ref) => {
  /** 搜索 点击 展示 */
  /** 做个 各级的 字典  便于用id查找 */
  // const dataDic: {
  //   fake: Dir<FakeList>
  //   formType: Dir<FormTypeVos>
  //   dashboard: Dir<DashboardVos>
  // } = {
  //   fake: {},
  //   formType: {},
  //   dashboard: {},
  // }
  const { rightView } = props
  const { controlList, curNode } = props.dataParam
  const { setCurMarkId } = props
  const [state, setState] = useState<StateInt>({
    curNode: {
      curMarkId: 0,
      dashboardName: '', //当前选中仪表盘名字
      curTeamId: 0,
      curTypeId: 0,
    },
    defaultActiveKey: [], //默认展开公司节点
    activeKey: [], //当前展开公司节点
    activeKeyType: [], //当前展开类型节点
    nochildIdCom: [],
    nochildIdType: [],
  })
  useEffect(() => {
    if (controlList.length > 0) {
      defaultFun()
      getones()
    }
  }, [controlList])
  useEffect(() => {
    //  父组件改变当前选中节点
    state.curNode = curNode
    // const arr = state.activeKeyType.some(val => val == curTypeId)
    //   ? state.activeKeyType
    //   : state.activeKeyType.concat([curTypeId])
    // state.activeKeyType = [...arr]
    // console.log(curTypeId, state.activeKeyType)

    setState({ ...state })
  }, [curNode.curMarkId, curNode.curTeamId, curNode.curTypeId])
  useImperativeHandle(ref, () => ({
    setState: (val: any) => {
      setState({ ...state, isShowList: val })
    },
  }))

  /** 处理 各级 字典 */
  // const setDataDic = () => {
  //   controlList.forEach(item => {
  //     dataDic.fake[item.teamId] = item
  //     if (item.formTypeVos && item.formTypeVos.length > 0) {
  //       item.formTypeVos.forEach(_item => {
  //         dataDic.formType[_item.typeId] = _item
  //         if (_item.dashboardVos && _item.dashboardVos.length > 0) {
  //           _item.dashboardVos.forEach(_itemc => {
  //             dataDic.dashboard[_itemc.markId] = _itemc
  //           })
  //         }
  //       })
  //     }
  //   })
  //   console.log(dataDic)
  // }
  const defaultFun = () => {
    // setDataDic()
    setActiveKey()
    nochildFun()
  }
  // 记录没有子集的 id
  const nochildFun = () => {
    const arrayCom: number[] = []
    const arrayType: number[] = []
    controlList.forEach(item => {
      if (!(item.formTypeVos && item.formTypeVos.length > 0)) {
        arrayCom.push(item.teamId)
      } else {
        item.formTypeVos.forEach(_item => {
          if (!(_item.dashboardVos && _item.dashboardVos.length > 0)) {
            arrayType.push(_item.typeId)
          }
        })
      }
    })
    state.nochildIdCom = arrayCom
    state.nochildIdType = arrayType

    setState({ ...state })
  }
  //默认展开第一个有数据的
  const getones = () => {
    for (let i = 0; i < controlList.length; i++) {
      const item = controlList[i]
      if (item.formTypeVos && item.formTypeVos.length > 0) {
        for (let _i = 0; _i < item.formTypeVos.length; _i++) {
          const _item = item.formTypeVos[_i]
          if (_item && _item.dashboardVos.length > 0) {
            state.activeKeyType = [_item.dashboardVos[0].typeId]
            state.curNode.curMarkId = _item.dashboardVos[0].markId
            state.curNode.curTeamId = _item.dashboardVos[0].teamId
            state.curNode.curTypeId = _item.dashboardVos[0].typeId
            state.curNode.dashboardName = _item.dashboardVos[0].dashboardName
            setState({ ...state })
            setCurMarkId(state.curNode)
            // setTimeout(() => {
            console.log('默认展开第一个')

            rightView.current?.getQueryDashboardUrl(state.curNode)
            // }, 5000)

            return
          } else {
            continue
          }
        }
      } else {
        continue
      }
    }
  }

  // 初始化默认选中和当前选中
  const setActiveKey = () => {
    if (!state.showSearch) {
      const defaultActiveKey = controlList.map(({ teamId }) => {
        return teamId
      })
      state.defaultActiveKey = defaultActiveKey
      state.activeKey = defaultActiveKey
    }
  }
  return (
    <div className="control-box_tree">
      {/* {state.isShowList && ( */}
      <Collapse
        className={`control-tree ${state.isShowList ? '' : 'forcedHide'}`}
        ghost
        defaultActiveKey={state.defaultActiveKey}
        activeKey={state.activeKey}
        onChange={arr => {
          //   state.activeKey = arr
          //   setState({ ...state })
          const newArr = (arr as string[]).map(val => {
            return parseInt(val)
          })
          state.activeKey = newArr
          setState({ ...state })
        }}
        expandIconPosition="right"
        expandIcon={panelProps => {
          const { isActive, panelKey } = panelProps as any
          if (!state.nochildIdCom.includes(parseInt(panelKey))) {
            return <CaretUpOutlined className="tree_company" rotate={isActive ? 0 : 180} />
          }
        }}
      >
        {/* 企业 */}
        {controlList.map(item => {
          return (
            <Collapse.Panel
              className="title"
              collapsible={state.nochildIdCom.includes(item.teamId) ? 'disabled' : undefined}
              header={
                <div className="header title-header flex center-v">
                  <Avatar
                    className="img_icon"
                    src={item.teamIcon}
                    size={24}
                    style={{
                      backgroundColor: '#3949AB',
                    }}
                  >
                    {item.teamName && item.teamName.substr(-2, 2)}
                  </Avatar>
                  <span className="teamName text-ellipsis no-select">{item.teamName}</span>
                </div>
              }
              key={item.teamId}
            >
              {/* 类型列表 */}
              <Collapse
                ghost
                accordion={false}
                activeKey={[...state.activeKeyType]}
                onChange={arr => {
                  const newArr = (arr as string[]).map(val => {
                    return parseInt(val)
                  })
                  state.activeKeyType = newArr
                  setState({ ...state })
                }}
                expandIcon={panelProps => {
                  const { isActive, panelKey } = panelProps as any
                  if (!state.nochildIdType.includes(parseInt(panelKey))) {
                    return <CaretUpOutlined rotate={isActive ? 180 : 90} />
                  }
                }}
              >
                {/* 最底层仪表盘列表 */}
                {item.formTypeVos.map(_item => {
                  return (
                    <Collapse.Panel
                      className="type"
                      header={
                        <div className="header type-header flex center-v">
                          <span className="text no-select">{_item.typeName}</span>
                        </div>
                      }
                      key={_item.typeId}
                    >
                      {_item.dashboardVos.map(_itemc => {
                        return (
                          <div
                            onClick={e => {
                              state.curNode.curMarkId = _itemc.markId
                              state.curNode.curTeamId = _itemc.teamId
                              state.curNode.curTypeId = _itemc.typeId
                              state.curNode.dashboardName = _itemc.dashboardName
                              setState({ ...state })
                              setCurMarkId(state.curNode)
                              rightView.current?.getQueryDashboardUrl({
                                curMarkId: _itemc.markId,
                                curTeamId: _itemc.teamId,
                                curTypeId: _itemc.typeId,
                                dashboardName: _itemc.dashboardName,
                              })
                            }}
                            key={_itemc.markId}
                            className={`header dash-header flex center-v text-header no-select ${
                              state.curNode.curMarkId == _itemc.markId &&
                              state.curNode.curTeamId == _itemc.teamId
                                ? 'active'
                                : ''
                            }`}
                          >
                            {_itemc.dashboardName}
                          </div>
                        )
                      })}
                    </Collapse.Panel>
                  )
                })}
              </Collapse>
            </Collapse.Panel>
          )
        })}
      </Collapse>
      {/* // )} */}
    </div>
  )
})
export default ControlTree
