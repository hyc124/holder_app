import React, { forwardRef, useEffect, useState, useImperativeHandle, useContext } from 'react'
import { Spin } from 'antd'
import { RightOutlined } from '@ant-design/icons'
// import { DndProvider } from 'react-dnd'
// import { HTML5Backend } from 'react-dnd-html5-backend'
import { queryPlanList } from './newPlanApi'
import NoneData from '@/src/components/none-data/none-data'
import './myWorkPlan.less'
import { CardModeList } from './cardWorkPlan'
import { createMindMap } from './workPlanMap/workPlanMap'
import { planContext } from './myWorkPlan'
/**
 * 工作规划新版3.26
 */
let isLoad = false
const MyNewPlanList = forwardRef((props: any, ref) => {
  const planContextObj: any = useContext(planContext)
  const { planRightShow, param } = props
  const [nowMyPlan, senowMyPlan] = useState({
    sortType: false, //排序
    cardDirList: [], //数据内容
    newAddFolder: false, //新增文件夹
    folderPosList: [{ name: '我的脑图', id: 0, parentFolderId: '' }], //文件夹位置数据缓存
    memberOrgShow: false,
    statusList: [], //状态筛选
    nowKey: '',
  })

  // ***********************暴露给父组件的方法**************************//
  useImperativeHandle(ref, () => ({
    /**
     * 获取内部数据
     */
    getNowMyPlanData: () => {
      return nowMyPlan
    },
  }))

  useEffect(() => {
    isLoad = false
    if (param.id && param.id != 0) {
      inFolder(param, JSON.parse(param.parentFolderId))
    } else {
      nowMyPlan.folderPosList = [{ name: '我的脑图', id: 0, parentFolderId: '' }]
      nowMyPlan.nowKey = '1_0'
      senowMyPlan({ ...nowMyPlan })
      if (!isLoad) {
        findPlanList()
      }
    }
  }, [param])

  // ====进入文件夹====//
  const inFolder = (item: any, list?: any) => {
    if (list) {
      nowMyPlan.folderPosList = list
    }
    nowMyPlan.folderPosList.push({
      id: item.id,
      name: item.name,
      parentFolderId: item.parentFolderId,
    })

    // if (Object.keys(list).length == 0) {
    //   nowMyPlan.folderPosList = [{ name: '我的脑图', id: 0, parentFolderId: '' }]
    // } else {
    // nowMyPlan.folderPosList.push({
    //   id: item.id,
    //   name: item.name,
    //   parentFolderId: item.parentFolderId,
    // })
    // }
    nowMyPlan.nowKey = `1_${item.id}`
    senowMyPlan({ ...nowMyPlan, folderPosList: nowMyPlan.folderPosList })

    findPlanList()
    // 右侧操作--- 联动展开选中左侧树
    !list &&
      planContextObj.planLeftRef &&
      planContextObj.planLeftRef.current.expandTreeNode({
        nodeInfo: {
          id: item.id,
          type: item.type,
        },
      })
  }
  // ====跳转文件夹====//
  const jumpFileDoc = (toIndex: number) => {
    const newPos: any = []
    // 存取所跳转文件夹及之前位置的信息
    nowMyPlan.folderPosList.forEach((item: any, i: number) => {
      if (i <= toIndex) {
        newPos.push(item)
      }
    })
    nowMyPlan.folderPosList = newPos
    senowMyPlan({ ...nowMyPlan })
    findPlanList()
    // 右侧操作--- 联动展开选中左侧树
    const selectedItem: any = nowMyPlan.folderPosList[toIndex]
    planContextObj.planLeftRef &&
      planContextObj.planLeftRef.current.expandTreeNode({
        nodeInfo: {
          id: selectedItem.id,
          type: selectedItem.type,
        },
      })
  }
  /**
   * 查询规划参数封装
   */
  const planListParam = (paramObj?: any) => {
    const param: any = {
      userId: $store.getState().nowUserId,
      sortType: Number(nowMyPlan.sortType), //创建时间正序
    }

    // 当前位置
    const nowPos = nowMyPlan.folderPosList[nowMyPlan.folderPosList.length - 1]
    //folderId 文件夹id
    // 列表模式查询子节点
    if (nowPos.id) {
      param.folderId = nowPos.id
    }

    return param
  }
  /**
   * 查询规划数据
   */
  const findPlanList = async (infoObj?: any) => {
    const paramObj: any = infoObj ? infoObj : {}
    // return new Promise((resolve: any) => {
    const param = planListParam(paramObj)
    findPlanData(param).then((res: any) => {
      // resolve(res)
      isLoad = true
    })
    // })
  }
  const findPlanData = (param: any) => {
    // param.setLoadState = setMainLoad()
    return new Promise((resolve: any) => {
      queryPlanList(param).then(res => {
        if (res.success) {
          if (param.updeta) {
            senowMyPlan({ ...nowMyPlan })
            return
          }
          senowMyPlan({ ...nowMyPlan, cardDirList: res.data.dataList || [] })
          resolve(res.success)
        } else {
          senowMyPlan({ ...nowMyPlan, cardDirList: [] })
        }
      })
    })
  }
  // 当前所在文件夹
  const nowFolder = nowMyPlan.folderPosList[nowMyPlan.folderPosList.length - 1]
  return (
    <>
      {(nowMyPlan.cardDirList.length > 0 || nowMyPlan.folderPosList.length > 1) && (
        <>
          <div className="headercreate">
            {/* <div className="icon_show_hide"></div> */}
            <div
              className="myMenuItem createProMenu"
              onClick={() => {
                console.log('跳转脑图')
                createMindMap({ folderId: nowFolder.id, name: '' }).then((mainId: any) => {
                  planRightShow({ showType: 2, mainId, toNewAddMind: true })
                  // 刷新左侧
                  planContextObj.planLeftRef &&
                    planContextObj.planLeftRef.current.refreshTree({
                      optType: 'addChildPlan',
                      type: 0,
                      taskIds: [nowFolder.id || 0],
                      childId: mainId,
                      parentIdNodeKey: `1_${nowFolder.id || 0}`,
                    })
                })
              }}
            >
              <em className="img_icon add_dir_icon"></em>
              <span>新建脑图</span>
            </div>
            <div
              className="myMenuItem addPlanMenu_plan"
              onClick={() => {
                nowMyPlan.newAddFolder = true
                senowMyPlan({ ...nowMyPlan })
              }}
            >
              <em className="img_icon add_mind_icon"></em>
              <span>新建文件夹</span>
            </div>
            <div className={`creat_time_change ${nowMyPlan.sortType ? 'creat_time_hover' : ''}`}>
              <span
                onClick={e => {
                  e.stopPropagation()
                  const name = Number(nowMyPlan.sortType)
                  nowMyPlan.sortType = name ? false : true
                  senowMyPlan({ ...nowMyPlan })
                  findPlanList()
                }}
              >
                创建时间{nowMyPlan.sortType ? '正' : '降'}序<em className="time_change"></em>
              </span>
            </div>
          </div>
          <div className="secondPageMenuNav workPlanListNav_main">
            <div className="headLeft">
              {/* 进入文件夹后的标题 */}
              <div className="inFileDocTit my_ellipsis">
                <span className="prev_pos_box baseGrayColor">
                  {nowMyPlan.folderPosList.map((item: any, i: number) => {
                    if (i < nowMyPlan.folderPosList.length - 1) {
                      return (
                        <div key={i} className="flex">
                          <span
                            className="prev_pos_txt my_ellipsis"
                            onClick={() => {
                              jumpFileDoc(i)
                            }}
                          >
                            {item.name}
                          </span>
                          <span className="prev_pos_arrow">
                            <RightOutlined />
                          </span>
                        </div>
                      )
                    }
                  })}
                </span>
                <span className="now_pos_box">
                  {nowMyPlan.folderPosList.map((item: any, i: number) => {
                    if (i == nowMyPlan.folderPosList.length - 1) {
                      return (
                        <div key={i} className="flex">
                          <span className="now_pos_txt my_ellipsis">{item.name}</span>
                        </div>
                      )
                    }
                  })}
                </span>
              </div>
              <div className="headerRight"></div>
            </div>
          </div>
          {/* 卡片、列表内容 */}
          <Spin
            spinning={false}
            wrapperClassName={`mainLoading flex-1 ${
              nowMyPlan.cardDirList.length > 0 || nowMyPlan.newAddFolder ? '' : 'forcedHide'
            }`}
          >
            {/* 被拖拽的子元素需要被包裹在<DndProvider backend={
              
            }>中 */}
            <section className="workPlanCon">
              <CardModeList
                param={{
                  cardDirList: nowMyPlan.cardDirList,
                  folderPosList: nowMyPlan.folderPosList,
                  newAddFolder: nowMyPlan.newAddFolder,
                  planRightShow,
                }}
                action={{
                  inFolder: inFolder,
                  findPlanList: findPlanList,
                  setNewAddFolder: (flag: boolean) => {
                    nowMyPlan.newAddFolder = flag
                    senowMyPlan({ ...nowMyPlan })
                  },
                  btnSolveOpt: (type: any, id: any) => {
                    if (type == 'add' || type == 'top' || type == 'bootom' || type == 'move') {
                      findPlanList()
                    } else if (type == 'deleteAll') {
                      senowMyPlan({ ...nowMyPlan, cardDirList: [] })
                    }
                  },
                }}
              />
            </section>
          </Spin>
        </>
      )}
      {nowMyPlan.cardDirList.length == 0 && (
        <div className="planRightNone">
          <NoneData
            className={`no_changjian`}
            containerStyle={{ zIndex: 0 }}
            searchValue={''}
            imgSrc={$tools.asAssetsPath(`/images/noData/new-plan.png`)}
            showTxt={
              <div className="create_okr_tips_1">
                <div className="create_OKR_tips">{'这里空空如也，点击下方按钮开始整理思路吧！'}</div>
                {nowMyPlan.folderPosList.length == 1 && (
                  <div className="create-btn" style={{ marginTop: '24px', display: 'flex' }}>
                    <div
                      className="myMenuItem createProMenu"
                      onClick={() => {
                        createMindMap({ folderId: nowFolder.id, name: '' }).then((mainId: any) => {
                          planRightShow({ showType: 2, mainId, toNewAddMind: true })
                          // 刷新左侧
                          planContextObj.planLeftRef &&
                            planContextObj.planLeftRef.current.refreshTree({
                              optType: 'addChildPlan',
                              type: 0,
                              taskIds: [nowFolder.id || 0],
                              childId: mainId,
                              parentIdNodeKey: `1_${nowFolder.id || 0}`,
                            })
                        })
                      }}
                    >
                      <em className="img_icon add_dir_icon"></em>
                      <span>新建脑图</span>
                    </div>
                    <div
                      className="myMenuItem addPlanMenu_plan"
                      onClick={() => {
                        const arr: any = [
                          {
                            id: '',
                            name: '新建文件夹0',
                            type: 1,
                          },
                        ]
                        senowMyPlan({ ...nowMyPlan, newAddFolder: true, cardDirList: arr })
                      }}
                    >
                      <em className="img_icon add_mind_icon"></em>
                      <span>新建文件夹</span>
                    </div>
                  </div>
                )}
              </div>
            }
          />
        </div>
      )}
    </>
  )
})
export default MyNewPlanList
