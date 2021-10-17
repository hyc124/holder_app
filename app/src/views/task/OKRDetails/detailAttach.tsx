import React, { useEffect, useState, useContext } from 'react'
import { ArrowPager, FilesList, Followers, getNowPageData } from '../taskDetails/detailAttach'
import { Confidence } from '../taskDetails/confidence'
import { CaretDownOutlined, CheckOutlined } from '@ant-design/icons'
import { queryTaskDetailApi } from '../taskDetails/detailApi'
import '../taskDetails/detailAttach.less'
import './detailAttach.less'
import { Avatar, Dropdown, Input, Menu, message } from 'antd'
import { delTargetTagApi, editTargetTagApi } from './okrDetailApi'
import { DetailContext, taskDetailContext } from '../taskDetails/detailRight'
import { PeriodDate } from './detailHeader'
import { BelongUser } from './BelongUser'
import { MainUser } from './MainUser'
import { setCaretEnd } from '@/src/common/js/common'
import { content } from 'html2canvas/dist/types/css/property-descriptors/content'
import { ipcRenderer } from 'electron'
/**
 * OKR详情右侧
 * @param param0
 */
export const OKRDetailAttach = ({ dataState, from }: { dataState: any; from: any }) => {
  // 详情类型：
  const detailType: any = dataState.workPlanType || ''
  // const [addSelectshow, setaddSelectshow] = useState(false)
  return (
    <div className="detailRightAttach OKRDetailRightAttach">
      {/* 负责人 */}
      {detailType == 2 || detailType == 3 ? <MainUser /> : ''}
      {/* 周期 */}
      {detailType == 2 || detailType == 3 ? <PeriodDateBox from={from} /> : ''}
      {/* 归属 */}
      {detailType == 2 || detailType == 3 ? <BelongUser from={from} /> : ''}

      {/* ====信心指数折线图=== */}
      {detailType == 3 ? <Confidence dataState={dataState} cciList={dataState.cciList || []} /> : ''}
      {/* ====状态指标区=== */}
      {detailType == 2 ? <StateTargets stateTargetList={dataState.targetList || []} /> : ''}
      {/* ====关注人区=== */}
      {detailType == 2 ? <Followers followList={dataState.followList || []} taskId={dataState.id} /> : ''}
      {/* ====附件区=== */}
      {detailType == 2 || detailType == 3 ? (
        <FilesList dataState={dataState} fileList={dataState.fileList || []} />
      ) : (
        ''
      )}
      {/* okrInfo */}
      {detailType == 3 ? <ScoreStandrd></ScoreStandrd> : ''}
    </div>
  )
}
/**
 * 状态指标组件
 */

export const StateTargets = ({ stateTargetList }: { stateTargetList: any }) => {
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const { editAuth } = taskDetailObj
  const [state, setState] = useState<any>({
    stateTargetList: [],
    pageNo: 1,
    pageSize: 3,
    totalPages: 0,
    allDataList: [],
    newAdd: false,
  })

  /**
   
   * 监听外部传入数据改变
   */
  useEffect(() => {
    const totalPages = Math.ceil(stateTargetList.length / state.pageSize)
    const handleList = getNowPageData({
      pageNo: state.pageNo,
      pageSize: state.pageSize,
      handleList: stateTargetList,
    })
    setState({
      ...state,
      stateTargetList: [...handleList],
      totalPages,
      allDataList: [...stateTargetList],
      newAdd: false,
    })
  }, [stateTargetList])
  /**
   * 切换页码
   */
  const pageChange = ({ dataList }: any) => {
    setState({ ...state, stateTargetList: [...dataList] })
  }
  // const [addSelectshow, setaddSelectshow] = useState(false)
  return (
    <div className={`attachCont stateTargetCont ${state.totalPages > 1 ? 'fixedH' : ''}`}>
      <header className="attachSecHeader flex between center-v">
        <div className="headerTit">
          <span className="tit_txt">{$intl.get('stateTarget')}</span>
          <span className="count_txt">({state.allDataList.length})</span>
        </div>
        <div className="actionBtn">
          <span
            className={`img_icon add_cross_icon ${!editAuth ? 'forcedHide' : ''}`}
            onClick={() => {
              setState({ ...state, newAdd: true })
            }}
          ></span>
        </div>
      </header>
      <div
        className={`showListBox ${
          (state.allDataList && state.allDataList.length > 0) || state.newAdd ? '' : 'forcedHide'
        }`}
      >
        <div className="showList stateTargetList flex wrap">
          {state.stateTargetList?.map((item: any, i: number) => {
            return <StateTargetItem key={i} item={item} />
          })}
          {/* 新增指标 */}
          {state.newAdd && (
            <StateTargetItem
              key="new"
              item={{}}
              newAdd={true}
              setNewAdd={() => {
                setState({ ...state, newAdd: false })
              }}
            />
          )}
        </div>
        <div className={`attachPager ${state.totalPages > 1 ? '' : 'forcedHide'}`}>
          <ArrowPager
            pageNo={state.pageNo}
            pageSize={state.pageSize}
            totalPages={state.totalPages}
            allDataList={state.allDataList}
            pageChange={pageChange}
          />
        </div>
      </div>
    </div>
  )
}
/**
 * 状态指标单项展示
 */
const StateTargetItem = ({ item, newAdd, setNewAdd }: { item: any; newAdd?: boolean; setNewAdd?: any }) => {
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const { mainData, editAuth } = taskDetailObj
  const [itemState, setItemState] = useState<any>({
    inpNameShow: newAdd || false,
    tagName: item.content || '',
    tagRgb: item.rgb || '#4285F4',
  })
  // const tagBgInfo = tagItemHtml({ rgb: '#4285F4' })
  // const bgUrl = $tools.asAssetsPath('/images/workplan/' + tagBgInfo.bgnameimg + '.png')

  useEffect(() => {
    setItemState({
      ...itemState,
      inpNameShow: newAdd || false,
      tagName: item.content || '',
      tagRgb: item.rgb || '#4285F4',
    })
  }, [item])
  const addPlanMenu = () => {
    return (
      <Menu
        className="tag_color_list"
        onClick={(props: any) => {
          let rgb = ''
          if (props.key == '1') {
            rgb = '#34A853'
          } else if (props.key == '2') {
            rgb = '#FBBC05'
          } else if (props.key == '3') {
            rgb = '#EA4335'
          } else {
            rgb = '#4285F4'
          }
          setItemState({ ...itemState, tagRgb: rgb })
        }}
      >
        <Menu.Item key="0" data-rgb="#4285F4">
          <p>
            <span className="tag_color_item priorityColor_5 " data-bg="0">
              {/* <CheckOutlined style={{ color: '#fff' }}></CheckOutlined> */}
            </span>
          </p>
        </Menu.Item>
        <Menu.Item key="1" data-rgb="#34A853">
          <p>
            <span className="tag_color_item priorityColor_3 " data-bg="1"></span>
          </p>
        </Menu.Item>
        <Menu.Item key="2" data-rgb="#FBBC05">
          <p>
            <span className="tag_color_item priorityColor_2 " data-bg="2"></span>
          </p>
        </Menu.Item>
        <Menu.Item key="3" data-rgb="#EA4335">
          <p>
            <span className="tag_color_item priorityColor_1 " data-bg="3"></span>
          </p>
        </Menu.Item>
      </Menu>
    )
  }
  /**
   * 编辑或新增状态指标
   * @param param
   */
  const editTargetTag = (param: { id: any; rgb: string; content: string; treeId: any }) => {
    editTargetTagApi({ ...param, optType: param.id ? 'edit' : 'add' }).then((res: any) => {
      if (res) {
        taskDetailObj.refreshFn({ optType: 'editTargetTag' })
      }
    })
  }
  /**
   * 删除状态指标
   * @param param
   */
  const delTargetTag = ({ id }: { id: any; e?: any }) => {
    // 新增节点未保存时直接删除静态节点
    if (newAdd) {
      // $(e.currentTarget)
      //   .parents('.stateTargetItem')
      //   .remove()
      setNewAdd()
    } else {
      delTargetTagApi(id).then((res: any) => {
        if (res) {
          taskDetailObj.refreshFn({ optType: 'delTargetTag' })
        }
      })
    }
  }
  return (
    <div
      className={`stateTargetItem flex between center-v ${newAdd ? 'newAddStateTargetItem editTarget' : ''} ${
        itemState.inpNameShow ? 'editTarget' : ''
      }`}
    >
      {/* <div className="tag_cont_bg flex between center-v"> */}
      {/* ---左侧显示内容--- */}
      <div className="flex center-v flex-1">
        {!newAdd && (
          <Dropdown overlay={() => addPlanMenu()} placement="bottomLeft" trigger={['click']}>
            <div className="tag_color_choose">
              <span className="tag_color_dot" style={{ backgroundColor: itemState.tagRgb || '' }}></span>
              <em className="img_icon tri_down"></em>
            </div>
          </Dropdown>
        )}

        {/* {addPlanMenu()} */}
        <div className="tag_name_box flex center-v flex-1">
          <span
            className={`tag_name text-ellipsis ${itemState.inpNameShow ? 'forcedHide' : ''}`}
            style={{ color: itemState.tagRgb || '' }}
          >
            {itemState.tagName}
          </span>
          {itemState.inpNameShow && (
            <>
              <input
                autoFocus
                type="text"
                value={itemState.tagName}
                placeholder="请输入~"
                className={`tag_name_inp ${newAdd ? 'max_length' : ''}`}
                onChange={e => {
                  setItemState({ ...itemState, tagName: e.target.value })
                }}
                // onBlur={(e: any) => {
                //   if (e.target.value == '' && !newAdd) {
                //     return message.warn($intl.get('stateTargetReq'))
                //   }
                //   // 有变更才保存
                //   if (e.target.value != '' && e.target.value != item.content) {
                //     editTargetTag({
                //       id: newAdd ? 0 : item.id,
                //       rgb: item.rgb,
                //       content: e.target.value,
                //       treeId: mainData.id,
                //     })
                //   }
                //   setItemState({ ...itemState, inpNameShow: false })
                // }}
              />
            </>
          )}
        </div>

        {itemState.inpNameShow && newAdd && addPlanMenu()}
      </div>

      {/* color */}
      {/* ---右侧操作按钮---*/}

      <div className={`flex end ${!editAuth ? 'forcedHide' : ''}`}>
        {/* 编辑删除按钮 */}
        <div className={`tag_edit_btns ${itemState.inpNameShow ? 'forcedHide' : ''}`}>
          <em
            className="img_icon tag_edit_btn"
            onClick={() => {
              setItemState({ ...itemState, inpNameShow: true })
            }}
          ></em>
          <em
            className="img_icon tag_del_btn"
            onClick={() => {
              delTargetTag({ id: item.id })
            }}
          ></em>
        </div>
        {/* 确定取消按钮 */}
        <div className={`tag_sure_btns ${itemState.inpNameShow ? '' : 'forcedHide'}`}>
          <em
            className="img_icon tag_edit_cancel"
            onClick={() => {
              if (newAdd) {
                delTargetTag({ id: item.id })
              } else {
                setItemState({ ...itemState, inpNameShow: false })
              }
            }}
          ></em>
          <em
            className="img_icon tag_edit_sure"
            onClick={() => {
              if (!itemState.tagName && !newAdd) {
                return message.warn($intl.get('stateTargetReq'))
              }
              // 有变更才保存
              if ((itemState.tagName && itemState.tagName != item.content) || itemState.tagRgb != item.rgb) {
                editTargetTag({
                  id: newAdd ? 0 : item.id,
                  rgb: itemState.tagRgb,
                  content: itemState.tagName,
                  treeId: mainData.id,
                })
              }
              setItemState({ ...itemState, inpNameShow: false })
            }}
          ></em>
        </div>
      </div>
      {/* </div> */}
      {/* <span className="tag_color_img">
        <img src={bgUrl} />
      </span> */}
    </div>
  )
}
/**
 * 状态指标背景颜色
 * @param item
 */
export const tagItemHtml = (item: any) => {
  let bgcolor = ''
  let bgnameimg = 'red_tag'
  if (item.bg == 0 || item.rgb == '#4285F4') {
    bgcolor = 'rgba(233,242,255,0.7)'
    bgnameimg = 'blue_tag'
  } else if (item.bg == 1 || item.rgb == '#34A853') {
    bgcolor = 'rgba(205,234,213,0.7)'
    bgnameimg = 'green_tag'
  } else if (item.bg == 2 || item.rgb == '#FBBC05') {
    bgcolor = 'rgba(252,236,197,0.7)'
    bgnameimg = 'yellow_tag'
  } else if (item.bg == 3 || item.rgb == '#EA4335') {
    bgcolor = 'rgba(250,209,206,0.7)'
    bgnameimg = 'red_tag'
  }
  return {
    bgcolor: bgcolor,
    bgnameimg: bgnameimg,
  }
}
/**周期 */
export const PeriodDateBox = ({ from }: { from: string }) => {
  const taskDetailObj: DetailContext = useContext(taskDetailContext)
  const { refreshFn, editOKRSave, detailData, editOKRAffInfo } = taskDetailObj

  return (
    <div className="attachCont periodDate">
      <header className="attachSecHeader flex between center-v">
        <div className="headerTit">
          <span className="tit_txt">周期</span>
        </div>
      </header>
      <div className="flex between center-v periodContent">
        <PeriodDate
          dataState={detailData}
          from={from}
          refreshFn={refreshFn}
          editOKRSave={editOKRSave}
          typeId={detailData.id}
        />
        <CaretDownOutlined />
      </div>
    </div>
  )
}
// 详情
export const ScoreStandrd = () => {
  const taskDetailObj: DetailContext = useContext(taskDetailContext)

  const { id, workPlanId } = taskDetailObj.detailData
  const { cci, process, processStatus } = taskDetailObj.mainData
  const { editOKRSave } = taskDetailObj
  const [nameData, setNameInput] = useState({
    workPlanTreeId: 0, //工作规划id
    difficulty: '', //困难程度较高，几乎不可能实现
    ordinary: '', //希望达成的程度，虽然困难但能实现
    simple: '', //肯定可以达到，只要很少帮助或不需要
    fail: '', //无进展
    // process: 0.0,
  })
  // 查分类型
  const [Scoretype, setscoreType] = useState()
  useEffect(() => {
    queryTaskDetail()
  }, [id])
  const queryTaskDetail = () => {
    const params = {
      id,
    }

    queryTaskDetailApi(params).then((res: any) => {
      if (res.data.SCORE_CRITERION) {
        setNameInput(res.data.SCORE_CRITERION)
      } else {
        setNameInput({
          workPlanTreeId: workPlanId,
          difficulty: '',
          ordinary: '',
          simple: '',
          fail: '',
          // process: 0.0,
        })
      }
      setscoreType(res.data.MAIN.ratingType)
    })
  }
  return (
    <div className="score_boox">
      <div className="score_title">评分标准</div>
      <div className="score_contant">
        <div className="score_contant_header">
          <span className="text">困难度较高几乎不可能实现</span>
          <span className={`score_1`}>{Scoretype == 100 ? '100分' : '1分'}</span>
        </div>
        <DataInput
          name={nameData.difficulty}
          place={'完成市场占有率达90%'}
          changePercent={(_val: any) => {
            nameData.difficulty = _val
            const param = {
              ...nameData,
              difficulty: _val,
              ordinary: null,
              simple: null,
              fail: null,
            }
            editOKRSave(
              { scoreCriterion: param, cci, process, processStatus },
              {
                optType: 'editOkrPercent',
                refreshTree: false,
                callBack: () => {
                  queryTaskDetail()
                },
              }
            )
          }}
        />
        <div className="score_contant_header">
          <span className="text" style={{ height: '34px', lineHeight: '17px' }}>
            {' '}
            希望达成的程度，虽然困难但能实现
          </span>
          <span className={`score_2`}>{Scoretype == 100 ? '60-70分' : '0.6-0.7分'}</span>
        </div>
        <DataInput
          place={'完成市场占有率达70%'}
          name={nameData.ordinary}
          changePercent={(_val: any) => {
            nameData.ordinary = _val
            const param = {
              ...nameData,
              difficulty: null,
              ordinary: _val,
              simple: null,
              fail: null,
            }
            editOKRSave(
              { scoreCriterion: param, cci, process, processStatus },
              {
                optType: 'editOkrPercent',
                refreshTree: false,
                callBack: () => {
                  queryTaskDetail()
                },
              }
            )
          }}
        />
        <div className="score_contant_header">
          <span className="text" style={{ height: '34px', lineHeight: '17px' }}>
            肯定可以达到，只要很少帮助或不需要
          </span>
          <span className={`score_3`}>{Scoretype == 100 ? '30分' : '0.3分'}</span>
        </div>

        <DataInput
          name={nameData.simple}
          place={'完成市场占有率达30%'}
          changePercent={(_val: any) => {
            nameData.simple = _val
            const param = {
              ...nameData,
              difficulty: null,
              ordinary: null,
              simple: _val,
              fail: null,
            }
            editOKRSave(
              { scoreCriterion: param, cci, process, processStatus },
              {
                optType: 'editOkrPercent',
                refreshTree: false,
                callBack: () => {
                  queryTaskDetail()
                },
              }
            )
          }}
        />
      </div>
    </div>
  )
}

export const DataInput = (props: any) => {
  const [nameInput, setNameInput] = useState(false)

  const changePercentData = (_val: any) => {
    setNameInput(false)
    if (props.name == _val) {
      return false
    }
    props.changePercent(_val)
  }
  return (
    <div
      className="score_contant_text"
      onClick={(e: any) => {
        e.stopPropagation()
        setNameInput(true)
      }}
    >
      {!nameInput && <span>-{props.name}</span>}
      {nameInput && (
        <Input
          autoFocus
          className="marketshare_input"
          defaultValue={props.name}
          placeholder={props.place}
          maxLength={100}
          onBlur={(e: any) => {
            changePercentData(e.target.value)
          }}
          onKeyUp={(e: any) => {
            if (e.keyCode == 13) {
              changePercentData(e.target.value)
            }
          }}
        />
      )}
    </div>
  )
}
