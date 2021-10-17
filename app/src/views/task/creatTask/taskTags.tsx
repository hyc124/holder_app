import React, { useState, useRef, useLayoutEffect, useImperativeHandle, forwardRef, useEffect } from 'react'
import { Button, Input } from 'antd'
import { getlabelList, getAddtag, delTagApi } from './getData'
import { findAuthList, getAuthStatus } from '@/src/common/js/api-com'
// let ishide = false
const TaskTags = forwardRef((props: any, ref?: any) => {
  // defShow:默认显示
  const { defShow, visible, param } = props
  useImperativeHandle(ref, () => ({
    // changeVal 就是暴露给父组件的方法
    changeVal: () => {
      initFn()
    },
  }))
  //状态显示面板
  // const [status, setStatus] = useState(false)
  const refComplete = useRef(null)
  //图标
  const [iconGather, setIconGather] = useState([
    { name: 'face', number: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], text: '表情', val: 0 },
    {
      name: 'direction',
      number: [1, 2, 3, 4, 5, 6, 7, 8],
      text: '箭头',
      val: 0,
    },
    {
      name: 'flag',
      number: [1, 2, 3, 4, 5, 6, 7, 8],
      text: '旗帜',
      val: 0,
    },
    {
      name: 'label',
      number: [1, 2, 3, 4],
      text: '其他',
      val: 0,
    },
  ])
  //企业标签数据
  const [labels, setLabels] = useState<any>([])
  //颜色列表
  const [colorlist, setColorlist] = useState([
    '#DF4F4F',
    '#FFEBCA',
    '#F7FABD',
    '#DBF9CF',
    '#CEFBFD',
    '#D5DFFF',
    '#FBD9F4',
  ])
  //选中行
  const [activeId, setActiveId] = useState<any>([])
  //保存数据
  const [icon, setIcon] = useState('')
  const [state, setState] = useState({
    status: false,
    editTagAuth: true,
  })
  useLayoutEffect(() => {
    //点击空白处
    jQuery('.secondPageContainer,.ant-modal-wrap')
      .off()
      .click(function(e: any) {
        const _con = jQuery('.label-content:visible') // 设置目标区域
        if (!_con.is(e.target) && _con.has(e.target).length === 0) {
          setState({ ...state, status: false })
        }
      })
  }, [refComplete.current])
  /**
   * 监听外部传入的显示状态
   */
  useEffect(() => {
    if (visible) {
      initFn()
    }
  }, [visible])
  /**
   * 初始化方法
   */
  const initFn = () => {
    // 是否有新增、编辑、删除标签权限
    findEditTagAuth({ teamId: param.teamId }).then(({ editTagAuth }: any) => {
      setState({ ...state, status: true, editTagAuth })
      getlabels()
    })
  }
  /**
   * 查询标签新增、编辑权限
   */
  const findEditTagAuth = ({ teamId }: any) => {
    let editTagAuth = true
    return new Promise((resolve: any) => {
      // 默认有权限，防止接口报错无法编辑
      if (!teamId) {
        resolve({ editTagAuth })
      }
      findAuthList({
        typeId: teamId,
      }).then((res: any) => {
        if (res) {
          editTagAuth = getAuthStatus('taskTagUpdate', res)
        }
        resolve({ editTagAuth })
      })
    })
  }
  //获取企业标签数据
  const getlabels = () => {
    console.log('获取企业标签')
    setLabels([])
    const companyId = props.param.teamId
    const keyword = ''
    console.log(props.datas)
    getlabelList(companyId, keyword).then((resData: any) => {
      console.log('获取到的企业标签', resData)
      const dataList: {
        id: any
        content: any
        rgb: any
        isshow: boolean
        editShow: boolean
        showColor: boolean
        active: boolean
      }[] = []
      resData.dataList.map((item: any) => {
        dataList.push({
          id: item.id,
          content: item.content,
          rgb: item.rgb,
          isshow: true,
          editShow: false,
          showColor: false,
          active: false,
        })
      })
      //反选****************************
      if (props.datas.tags.length > 0) {
        const newArr: any[] = []
        props.datas.tags.map((items: any) => {
          newArr.push(items.id)
        })
        setActiveId(newArr)
      } else {
        const newArr: any[] = []
        setActiveId(newArr)
      }
      if (props.datas.icon != '' && props.datas.icon) {
        const newArr = [...iconGather]
        newArr.map((item: any) => {
          if (props.datas.icon.includes(item.name)) {
            item.val = props.datas.icon.split('-')[1]
          }
        })
        setIcon(props.datas.icon)
        setIconGather(newArr)
      } else {
        const newArr = [...iconGather]
        newArr.map((item: any) => {
          item.val = 0
        })
        setIcon('')
        setIconGather(newArr)
      }
      setLabels(dataList)
    })
  }
  //选择图标
  const selTaskSign = (name: any, num: number) => {
    const TaskSignArr = [...iconGather]
    TaskSignArr.map((item: any) => {
      item.val = 0
      if (item.name == name) {
        item.val = num
        return false
      }
    })
    setIconGather(TaskSignArr)
    setIcon(`${name}-${num}`)
  }
  //显示颜色选择器
  const selTagColorShow = (id: any) => {
    const datas = {
      id: id,
      type: 'showcolor',
    }
    setStatuFu(datas)
  }
  //选择颜色
  const selTagColor = (color: any, id: number) => {
    const datas = {
      id: id,
      color: color,
      type: 'setcolor',
    }
    setStatuFu(datas)
  }
  //编辑标签
  const editTag = (id: any) => {
    const datas = {
      id: id,
      type: 'editTag',
    }
    setStatuFu(datas)
  }
  //更改标签文字
  const edittagText = (e: any, id: number) => {
    const datas = {
      id: id,
      content: e.target.value,
      type: 'edittagText',
    }
    setStatuFu(datas)
  }
  //更改标签状态
  const setStatuFu = (datas: any) => {
    const dataList = [...labels]
    setLabels([])
    dataList.map((item: any) => {
      if (datas.type == 'setcolor') {
        item.showColor = false
        if (item.id == datas.id) {
          item.rgb = datas.color
          return false
        }
      } else if (datas.type == 'showcolor') {
        item.showColor = false
        if (item.id == datas.id) {
          item.showColor = true
          return false
        }
      } else if (datas.type == 'editTag') {
        item.isshow = true
        item.editShow = false
        if (item.id == datas.id) {
          item.isshow = false
          item.editShow = true
          return false
        }
      } else if (datas.type == 'edittagText') {
        if (item.id == datas.id) {
          item.content = datas.content
          return false
        }
      } else if (datas.type == 'addTagEdit') {
        item.isshow = true
        item.editShow = false
        if (item.id == datas.id) {
          item.isshow = true
          item.editShow = false
          return false
        }
      }
    })
    if (datas.type == 'addNewTag') {
      dataList.push({
        id: '',
        content: '',
        rgb: '#FDE5E5',
        isshow: false,
        editShow: true,
        showColor: false,
      })
    }
    setLabels(dataList)
  }
  //保存编辑标签
  const addTagEdit = (id: number) => {
    let _rgb = ''
    let _content = ''
    labels.map((item: any) => {
      if (item.id == id) {
        _rgb = item.rgb
        _content = item.content
        return false
      }
    })
    const paramObj = {
      typeId: props.param.teamId,
      id: id, //节点id cc
      rgb: _rgb,
      content: _content,
    }
    getAddtag(paramObj).then(() => {
      // const datas = {
      //   id: id,
      //   type: 'addTagEdit',
      // }
      // setStatuFu(datas)
      getlabels()
    })
  }
  //取消编辑标签
  const delTagEdit = (id: any) => {
    if (id == '') {
      let dataList = [...labels]
      setLabels([])
      dataList = dataList.filter(item => item.id !== id)
      setLabels(dataList)
      return
    }
    const datas = {
      id: id,
      type: 'addTagEdit',
    }
    setStatuFu(datas)
  }
  //删除标签
  const delTag = (id: any) => {
    delTagApi(id).then(() => {
      getlabels()
    })
  }
  //新增标签
  const addNewTag = () => {
    const dataList = [...labels]
    let isAdd = false
    dataList.map((item: any) => {
      if (item.id == '') {
        isAdd = true
        return false
      }
    })
    if (!isAdd) {
      const datas = {
        id: '',
        type: 'addNewTag',
      }
      setStatuFu(datas)
      isAdd = false
    }
    jQuery('.tagBody .newTagContent').animate({
      scrollTop: jQuery('.newTagContent>ul').outerHeight(),
    })
  }
  //选中标签
  const activeNode = (id: any) => {
    setActiveId([...activeId, id])
    let spliceId = false
    const arrs = [...activeId]
    arrs.map((item: any, index: number) => {
      if (item == id) {
        spliceId = true
        arrs.splice(index, 1)
      }
    })
    if (spliceId) {
      setActiveId(arrs)
    }
  }
  //保存
  const saveData = () => {
    const newArr: { id: any; name: any; rgb: any }[] = []
    activeId.map((item: any) => {
      labels.map((items: any) => {
        if (item == items.id) {
          newArr.push({
            id: items.id,
            name: items.content,
            rgb: items.rgb,
          })
        }
      })
    })
    const setData = { icon: icon, tags: newArr }
    props.onOk(setData)
    setState({ ...state, status: false })
    // ishide = true
  }

  return (
    <div className={`selTagBoxOut ${defShow ? 'defShow' : ''}`} ref={refComplete}>
      {/* 默认显示时，不要内部点击按钮 */}
      <span
        className={`sel_tag_icon ${defShow ? 'forcedHide' : ''}`}
        onClick={() => {
          // console.log('图标事件')
          setState({ ...state, status: true })
          getlabels()
        }}
      ></span>
      <section className={`label-content ${!state.status ? 'hide' : ''}`}>
        <div className="tagBody">
          {/* 图标 */}
          <div className="tagLeft">
            <div
              className={`task_sign_icon_no ${icon == '' ? 'active' : ''}`}
              onClick={() => {
                setActiveId([])
                const newArr = [...iconGather]
                newArr.map((item: any) => {
                  item.val = 0
                })
                setIconGather(newArr)
                setIcon('')
              }}
            >
              无
            </div>
            <ul className="taskSignIcons">
              {iconGather.map((item: any, index: number) => {
                return (
                  <li key={index}>
                    <p className="sign_icon_tit">{item.text}</p>
                    {item.number.map((items: any, indexs: number) => {
                      const tagIcon = $tools.asAssetsPath(`/images/task/${item.name}-${items}.png`)

                      return (
                        <i
                          key={indexs}
                          className={`${item.name}-${items} img_icon sign_icon_item ${
                            item.val > 0 && item.val == items ? 'active' : ''
                          }`}
                          onClick={() => {
                            selTaskSign(item.name, items)
                          }}
                          // style={{
                          //   backgroundImage: `url(${tagIcon})`,
                          // }}
                          data-imgname={`${item.name}-${items + 1}`}
                        >
                          <img
                            src={tagIcon}
                            style={{
                              width: '100%',
                            }}
                          />
                        </i>
                      )
                    })}
                  </li>
                )
              })}
            </ul>
          </div>
          {/* 标签 */}
          <div className="tagRight">
            <div className="newTagContent">
              <ul>
                {labels.map((item: any, index: number) => {
                  let activeClass = ''
                  activeId.find((i: any) => {
                    if (i == item.id) {
                      activeClass = 'active'
                    }
                  })
                  return (
                    <li
                      key={index}
                      className={`tag_item ${activeClass}`}
                      onClick={() => {
                        activeNode(item.id)
                      }}
                    >
                      <div className={`show_box ver_center ${item.isshow ? '' : 'hide'}`}>
                        {/* <span
                          className="tag_color_dot"
                          data-rgb={item.rgb}
                          style={{ backgroundColor: item.rgb }}
                        ></span> */}
                        <span className="tag_txt my_ellipsis">{item.content}</span>
                        <div className={`tag_btn_box ${state.editTagAuth ? '' : 'forcedHide'}`}>
                          <em
                            className="img_icon tag_edit_btn"
                            onClick={() => {
                              editTag(item.id)
                            }}
                          ></em>
                          <em
                            className="img_icon tag_del_btn"
                            onClick={() => {
                              delTag(item.id)
                            }}
                          ></em>
                        </div>
                      </div>
                      <div className={`edit_box ver_center ${item.editShow ? '' : 'hide'}`}>
                        {/* <span
                          className="tag_color_dot tag_color_sel"
                          data-rgb={item.rgb}
                          style={{ backgroundColor: item.rgb }}
                          onClick={() => {
                            selTagColorShow(item.id)
                          }}
                        ></span> */}
                        <div className={`tag_color_list ${item.showColor ? '' : 'hide'}`}>
                          {colorlist.map((items: any, index: number) => {
                            return (
                              <span
                                key={index}
                                className={`tag_color_item priorityColor_${index}`}
                                data-rgb={items}
                                onClick={() => {
                                  selTagColor(items, item.id)
                                }}
                              ></span>
                            )
                          })}
                        </div>
                        {item.editShow ? (
                          <Input
                            autoFocus
                            type="text"
                            className="tag_edit_inp"
                            defaultValue={item.content}
                            onChange={e => {
                              edittagText(e, item.id)
                            }}
                          />
                        ) : (
                          ''
                        )}
                        <div className="tag_edit_btn_box">
                          <em
                            className={`img_icon tag_edit_cancel ${item.id == '' ? 'none_id' : ''}`}
                            onClick={() => {
                              delTagEdit(item.id)
                            }}
                          ></em>
                          <em
                            className="img_icon tag_edit_sure"
                            onClick={() => {
                              addTagEdit(item.id)
                            }}
                          ></em>
                        </div>
                      </div>
                    </li>
                  )
                })}
                {/* 新增标签 */}
                <span></span>
              </ul>
            </div>
            {/* 新增标签 */}
            <div className={`newTagTit ${state.editTagAuth ? '' : 'forcedHide'}`}>
              <label
                className="new_tag_btn"
                onClick={e => {
                  e.stopPropagation()
                  addNewTag()
                }}
              >
                <em className="img_icon new_tag_icon"></em>
                <span>新增标签</span>
              </label>
            </div>
          </div>
        </div>
        <footer className="tagFooter">
          <Button
            key="back"
            className="tagbutton"
            onClick={(e: any) => {
              e.stopPropagation()
              setState({ ...state, status: false })
              // ishide = true
            }}
          >
            取消
          </Button>
          <Button key="submit" type="primary" className="tagbutton" onClick={saveData}>
            确定
          </Button>
        </footer>
      </section>
    </div>
  )
})
export default TaskTags
