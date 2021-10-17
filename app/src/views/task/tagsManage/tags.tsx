import React, { useState, useEffect } from 'react'
import { Modal, Tabs, message } from 'antd'
import NoneData from '@/src/components/none-data/none-data'
import TagItem from './TagItem'
import CustomTagManger from './customTagManger'
const { TabPane } = Tabs
import './tags.less'
import { useDrop } from 'react-dnd'
import {
  TagArea,
  SortPositon,
  GetCompanyTagsData,
  GetTagsOneData,
  getCompanyAuths,
  UpdateTagsSortData,
  InitTabsTags,
  getTagAuthStatus,
} from './tagComon'

const Tags = ({ callback }: { callback?: (param: any) => void }) => {
  // const refreshTask = $store.getState().taskManage.refreshTaskFn //刷新 父页面 任务标签
  const nowSelectNode = $store.getState().taskManageTreeInfo //获取点击节点信息

  const { nowUserId, loginToken } = $store.getState()

  const [state, setState] = useState({
    visible: false, //属性定义
    isMyMission: false, //true: 我的任务进入 - 显示公司tabs  false :公司进入
    isSortCustomPermission: false, //管理排序自定义标签权限
    isCustomPermission: false, //管理更改自定义标签权限权限
    tagsData: [], //一类 数据
    tagsCustomData: [], //企业 进入 自定义 数据
    conpanyTagsCustomData: [], //我的任务 进入 自定义 数据
    customTagVisible: false, //自定义标签模态框
    companyActiveKey: '0', //当前选择企业 tabs 激活状态
    areaActiveKey: '0', //当前选择 标签分区 激活状态
  })

  //异步操作在这里执行（ajax）
  useEffect(() => {
    if (!state.visible) return
    state.areaActiveKey = '0'
    updateCompanyAuths()
    updateTagsOneData()
  }, [state.visible])

  // 更新自定义标签状态
  const refreshCustomData = () => {
    // 处理自定义item 数据状态
    let _tagsCustomData: any = []
    const {
      isMyMission,
      conpanyTagsCustomData,
      companyActiveKey,
      areaActiveKey,
      tagsCustomData,
      tagsData,
    } = state
    if (isMyMission) {
      _tagsCustomData = conpanyTagsCustomData[companyActiveKey].tagsCustomData[areaActiveKey].data
    } else {
      _tagsCustomData = tagsCustomData[areaActiveKey].data
    }

    if (_tagsCustomData.length != 0) {
      _tagsCustomData.map((item: any) => {
        if (tagsData.filter((val: any) => val.id === item.id).length !== 0) {
          item.isSelect = 1
        } else {
          item.isSelect = 0
        }
      })
    }

    // 促使组件重载
    setState({
      ...state,
    })
  }

  //初始企业tabs
  const initCompanyAll = () => {
    //遍历公司
    const companyAll: any = []
    nowSelectNode.allCompany.map((item: any, index: number) => {
      companyAll.push({
        id: item.id,
        name: item.name,
        key: index,
        tagsCustomData: JSON.parse(JSON.stringify(InitTabsTags)),
      })
    })
    return companyAll
  }
  //更新一类数据、
  const updateTagsOneData = async () => {
    const ascriptionType = state.isMyMission ? 0 : 2 // 0:个人  2:公司
    const ascriptionId = state.isMyMission ? nowUserId : nowSelectNode.orgInfo.cmyId //归属Id 个人/公司
    const param = {
      ascriptionId,
      ascriptionType,
    }
    // 获取一类标签数据
    GetTagsOneData(param, loginToken).then((res: any) => {
      // console.log(res)
      const _resArr = res.sort(SortPositon('position'))
      // _resArr.unshift({
      //   id: -2,
      //   content: '已归档',
      //   rgb: null,
      //   initial: 'S',
      //   isSelect: 1,
      //   type: 1,
      // })

      state.tagsData = _resArr
      state.isMyMission
        ? //我的任务 进入
          updateCompanyTagsData()
        : //企业进入
          updateInCompanyTagsData()
    })
  }
  // 更新企业权限
  const updateCompanyAuths = async () => {
    const { isMyMission, conpanyTagsCustomData, companyActiveKey } = state
    // 获取企业权限，保存企业权限
    const typeId = isMyMission ? conpanyTagsCustomData[companyActiveKey].id : nowSelectNode.orgInfo.cmyId
    await getCompanyAuths({
      // system: 'oa',
      userId: nowUserId,
      // type: 2,
      belongId: typeId, //企业Id
    })
      .then(res => {
        // console.log(res)
        const result: any = res
        state.isCustomPermission = getTagAuthStatus('taskTagUpdate', result.data.dataList)
        state.isSortCustomPermission = state.isMyMission
          ? true
          : getTagAuthStatus('taskTagConfigSave', result.data.dataList)
      })
      .catch(err => {
        console.error(err)
      })
  }
  //更新企业自定义标签
  const updateCompanyTagsData = () => {
    const { isMyMission, conpanyTagsCustomData, companyActiveKey, tagsData } = state
    const ascriptionType = isMyMission ? 0 : 2
    const ascriptionId = isMyMission ? nowUserId : conpanyTagsCustomData[companyActiveKey].id
    const param = {
      typeId: conpanyTagsCustomData[companyActiveKey].id,
      ascriptionType,
      ascriptionId,
    }
    GetCompanyTagsData(param, loginToken).then((res: any) => {
      // console.log(res)
      //更改自定义标签isSelect 属性值
      res.map((item: any) => {
        tagsData.map((Oitem: any) => {
          if (item.id === Oitem.id) item.isSelect = 1
        })
      })
      // console.log(res)
      const customTagsData: any = [...conpanyTagsCustomData]
      customTagsData[companyActiveKey].tagsCustomData[0].data = res
      const newAreaSortTag = TagArea(res)
      customTagsData[companyActiveKey].tagsCustomData[1].data = newAreaSortTag[0]
      customTagsData[companyActiveKey].tagsCustomData[2].data = newAreaSortTag[1]
      customTagsData[companyActiveKey].tagsCustomData[3].data = newAreaSortTag[2]
      customTagsData[companyActiveKey].tagsCustomData[4].data = newAreaSortTag[3]

      state.conpanyTagsCustomData = customTagsData
      refreshCustomData()
    })
  }
  //更新 企业进入 企业自定义标签
  const updateInCompanyTagsData = () => {
    const { isMyMission } = state
    const ascriptionType = isMyMission ? 0 : 2
    const ascriptionId = isMyMission ? nowUserId : nowSelectNode.orgInfo.cmyId
    const param = {
      typeId: nowSelectNode.orgInfo.cmyId,
      ascriptionType,
      ascriptionId,
    }
    GetCompanyTagsData(param, loginToken).then((res: any) => {
      // console.log(res)
      const customTagsData: any = JSON.parse(JSON.stringify(InitTabsTags))
      customTagsData[0].data = res
      const newAreaSortTag = TagArea(res)
      customTagsData[1].data = newAreaSortTag[0]
      customTagsData[2].data = newAreaSortTag[1]
      customTagsData[3].data = newAreaSortTag[2]
      customTagsData[4].data = newAreaSortTag[3]
      state.tagsCustomData = customTagsData
      refreshCustomData()
    })
  }

  // 一类标签 删除标签 并重新排序
  const deleteTag = (tag: any) => {
    const { isMyMission, conpanyTagsCustomData, companyActiveKey, areaActiveKey, tagsCustomData } = state
    const newArr: any = [...state.tagsData]
    newArr.forEach((item: any, index: number) => {
      if (item.id == tag.id) {
        newArr.splice(index, 1)
        const _newArr = newArr.map((item: any, index: number) => {
          item.position = index
          return item
        })
        state.tagsData = _newArr
        setState({
          ...state,
        })
      }
    })
    //更改自定义标签isSelect 属性值
    let _tagsCustomData: any = []
    if (isMyMission) {
      _tagsCustomData = conpanyTagsCustomData[companyActiveKey].tagsCustomData[areaActiveKey].data
    } else {
      _tagsCustomData = tagsCustomData[areaActiveKey].data
    }

    _tagsCustomData.map((item: any) => {
      if (item.id === tag.id) {
        item.isSelect = 0
      }
    })
  }
  // 一类标签 拖动排序
  const dragChangeSort = (sourceItem: any, targetItem: any) => {
    const nowArr: any = [...state.tagsData]
    //拖拽目标的Index
    let dragIndex = 0
    // 放置目标Index
    let TargetIndex = 0

    for (let i = 0; i < nowArr.length; i++) {
      if (sourceItem.id === nowArr[i].id) {
        dragIndex = i
      }
      if (targetItem.id === nowArr[i].id) {
        TargetIndex = i
      }
    }
    const temp: any = nowArr[dragIndex]
    nowArr.splice(dragIndex, 1) //移除拖拽项
    nowArr.splice(TargetIndex, 0, temp) //插入放置项
    setState({
      ...state,
      tagsData: nowArr.map((item: any, index: number) => {
        return {
          ...item,
          position: index,
        }
      }),
    })
  }
  //自定义标签 拖动至一类标签
  const dragToOneTags = (sourceItem: any) => {
    const newArr: any = [...state.tagsData]
    const nowSourceItem = { ...sourceItem.itemData }

    //判断一类中是否已存在 存在则不加入
    const isHas = newArr.filter((item: any) => {
      return item.id == nowSourceItem.id
    })
    if (isHas.length > 0) return message.warning('已存在,请勿重复拖动！')

    nowSourceItem.position = newArr.length
    nowSourceItem.isSelect = 1
    // console.log(nowSourceItem)
    newArr.push(nowSourceItem)
    // setTagsData(newArr)
    state.tagsData = newArr
    refreshCustomData()
  }

  //发送请求 更新标签排列顺序
  const onOk = () => {
    const { isSortCustomPermission, isMyMission, tagsData } = state
    if (!isSortCustomPermission) return message.warning('您没有该权限！')
    const ascriptionType = isMyMission ? 0 : 2
    const ascriptionId = isMyMission ? nowUserId : nowSelectNode.orgInfo.cmyId
    const param = {
      ascriptionId, //归属id 用户Id 或者 公司Id 244
      ascriptionType, //归属类型 0:用户 2:公司
      tagList: tagsData,
    }
    UpdateTagsSortData(param, loginToken)
      .then(res => {
        // console.log(res)
        const result: any = res
        if (result.returnCode === 0) {
          message.success('保存成功！')
          // setVisible(false)
          setState({
            ...state,
            visible: false,
          })
          // 刷新页面数据
          // refreshTask('taskType')
          callback?.({ type: 'initTaskType' })
        } else {
          message.success(result.returnMessage)
        }
      })
      .catch(err => {
        console.error(err)
      })
  }

  // 选择企业变化
  const companyTabChange = async (key: any) => {
    state.areaActiveKey = '0'
    state.companyActiveKey = key

    await updateCompanyAuths()
    updateCompanyTagsData()
  }
  // 选择标签分区变化
  const areaTabChange = (key: any) => {
    state.areaActiveKey = key
    refreshCustomData()
  }
  //==============
  const modalOk = () => {
    state.customTagVisible = false

    // 刷新页面数据
    state.isMyMission ? updateCompanyTagsData() : updateInCompanyTagsData()
  }
  const modalCancel = () => {
    setState({
      ...state,
      customTagVisible: false,
    })
  }

  // 权限判断  自定义权限接口：/task/tag/saveConfig   更改标签权限：/task/tag/addMor
  // 我的任务进入：直接显示 ，1.默认有自定义权限 2.对当前选择公司做 更改标签权限判断
  //公司进入：1.自定义权限判断， 2更改标签权限判断
  const judeAuthority = () => {
    // console.log(nowSelectNode)
    if (nowSelectNode.allCompany.length == 0 && Object.keys(nowSelectNode.orgInfo).length === 0)
      return message.warning('请选择 我的任务 或者 公司 进入')

    if (nowSelectNode.isMy) {
      state.conpanyTagsCustomData = initCompanyAll()

      state.isSortCustomPermission = true
      state.isCustomPermission = false
    }

    setState({
      ...state,
      visible: true,
      isMyMission: nowSelectNode.isMy ? true : false,
    })
  }

  const closeModal = () => {
    setState({
      ...state,
      visible: false,
    })
  }

  const Container = () => {
    const [, drag] = useDrop({
      accept: 'dropItem',
      collect: monitor => ({
        isOver: monitor.isOver(),
      }),
      canDrop: (item: any) => {
        // 已归档任务不可拖动、排序
        let drag = true
        if (item?.itemData.id == -2) {
          drag = false
        }
        return drag
      },
      drop: dragItem => {
        // 自定义标签 拖动至 一类标签
        dragToOneTags(dragItem)
      },
    })
    return (
      <div className="card-content one-content" ref={drag}>
        {state.tagsData.length == 0 && (
          <NoneData
            imgSrc={$tools.asAssetsPath('/images/noData/no_task_org_child.png')}
            showTxt="暂无标签"
            imgStyle={{ width: 80, height: 76 }}
          />
        )}
        {state.tagsData.map((tag: any, index: number) => (
          <TagItem
            dropArea={'oneContainer'}
            key={index}
            tag={tag}
            canDeleteTag={true}
            deleteTag={deleteTag}
            dragChangeSort={dragChangeSort}
          />
        ))}
      </div>
    )
  }
  return (
    <div>
      <span className="manage_tag_btn" onClick={() => judeAuthority()}>
        管理标签
      </span>
      <Modal
        title="管理标签"
        width={850}
        style={{ height: '620px' }}
        className={'manage_tag_Model'}
        centered={true}
        visible={state.visible}
        okType={state.isSortCustomPermission ? 'primary' : 'ghost'}
        onOk={() => onOk()}
        onCancel={() => closeModal()}
      >
        <div>
          <div className="card-title">
            <span className="name">
              一类标签 <span className="tip">（作为主筛选展示）</span>
            </span>
          </div>
          <div className="card-container">
            <div className="secend-box">
              <span className="secend-title">任务类型</span>
              <span className="secend-tip">（可任意拖动排序）</span>
            </div>

            <Container />
          </div>

          <div>
            <div className="card-title">
              <span className="name">
                自定义标签 <span className="tip">（作为辅筛选展示）可拖动自定义标签作为一类标签筛选</span>
              </span>
              {state.isCustomPermission && (
                <span
                  className="tag-manage-do"
                  onClick={
                    () =>
                      setState({
                        ...state,
                        customTagVisible: true,
                      })
                    //  setCustomTagVisible(true)
                  }
                >
                  管理标签
                </span>
              )}
            </div>
            <div className="card-container">
              <div className="secend-box">{/* <span className="secend-title">标签类型</span> */}</div>

              <div className="card-content">
                {state.isMyMission ? (
                  <Tabs
                    defaultActiveKey="0"
                    onChange={(key: any) => {
                      companyTabChange(key)
                    }}
                  >
                    {state.conpanyTagsCustomData.map((item: any) => (
                      <TabPane tab={item.name} key={item.key}>
                        <Tabs
                          className="tabs-custom"
                          defaultActiveKey="0"
                          activeKey={state.areaActiveKey}
                          onChange={(key: any) => {
                            areaTabChange(key)
                          }}
                        >
                          {item.tagsCustomData.map((tab: any, index: number) => (
                            <TabPane tab={tab.title} key={index}>
                              {tab.data.length == 0 && (
                                <NoneData
                                  imgSrc={$tools.asAssetsPath('/images/noData/no_task_org_child.png')}
                                  showTxt="暂无标签"
                                  imgStyle={{ width: 80, height: 76 }}
                                />
                              )}
                              {tab.data.map((data: any, index: number) => (
                                <TagItem key={index} tag={data} dropArea={'CustomContainer'} />
                              ))}
                            </TabPane>
                          ))}
                        </Tabs>
                      </TabPane>
                    ))}
                  </Tabs>
                ) : (
                  <Tabs
                    className="tabs-custom"
                    defaultActiveKey="0"
                    activeKey={state.areaActiveKey}
                    onChange={(key: any) => {
                      areaTabChange(key)
                    }}
                  >
                    {state?.tagsCustomData.map((tab: any, index: number) => (
                      <TabPane tab={tab.title} key={index}>
                        {tab.data.length == 0 && (
                          <NoneData
                            imgSrc={$tools.asAssetsPath('/images/noData/no_task_org_child.png')}
                            showTxt="暂无标签"
                            imgStyle={{ width: 80, height: 76 }}
                          />
                        )}
                        {tab.data.map((data: any, index: number) => (
                          <TagItem key={index} tag={data} dropArea={'CustomContainer'} />
                        ))}
                      </TabPane>
                    ))}
                  </Tabs>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
      {state.customTagVisible && (
        <CustomTagManger
          visible={state.customTagVisible}
          modalOk={modalOk}
          modalCancel={modalCancel}
          tagsData={state.tagsCustomData}
          conpanyId={
            state.isMyMission
              ? state.conpanyTagsCustomData.length > 0
                ? state.conpanyTagsCustomData[state.companyActiveKey].id
                : ''
              : nowSelectNode.orgInfo.cmyId
              ? nowSelectNode.orgInfo.cmyId
              : ''
          }
        />
      )}
    </div>
  )
}

export default Tags
