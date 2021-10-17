import React, { useEffect, useState } from 'react'
import { saveTargetTag, deleteTargetTag, editTargetTag } from './getfourData'
import { Menu, Dropdown, Button } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { ipcRenderer } from 'electron'
import { uncodeUtf16 } from './TableList'
import { color } from 'html2canvas/dist/types/css/types/color'
interface TagItemProps {
  content: string
  id: number
  rgb: string
  show: boolean
}
interface TagItem {
  content: string
  id: number
  rgb: string
}
// 新增菜单
let editAddShow = 0
const GetNextStatus = (props: any) => {
  const [listData, setTableData] = useState<TagItemProps[]>([]) //用来存储编辑后的数据
  const [initStates, setStates] = useState('')
  //loading
  useEffect(() => {
    if (props.statusData) {
      const contentData: TagItemProps[] = props.statusData
      const newTableData: Array<TagItemProps> = []
      contentData.map((item: TagItem) => {
        newTableData.push({
          content: item.content,
          id: item.id,
          rgb: item.rgb,
          show: editAddShow == item.id ? true : false,
        })
        if (editAddShow == item.id) {
          setStates(item.content)
        }
      })
      setTableData(newTableData)
      editAddShow = 0
    }
  }, [props.statusData.length])

  useEffect(() => {
    if (props.getstatus) {
      let num = false
      let index = 0
      listData.forEach((value: TagItemProps, key: number) => {
        if (value.show) {
          num = true
          index = key
        }
      })
      if (num) {
        if (listData[index].id) {
          listData[index].show = false
        } else {
          listData.splice(index, 1)
        }
        setTableData([...listData])
      }
    }
  }, [props.getstatus])
  const addPlanMenu = (index: number) => {
    return (
      <Menu
        className="tag_color_list"
        onClick={(props: any) => {
          if (props.key == '0') {
            listData[index].rgb = '#4285F4'
          } else if (props.key == '1') {
            listData[index].rgb = '#34A853'
          } else if (props.key == '2') {
            listData[index].rgb = '#FBBC05'
          } else if (props.key == '3') {
            listData[index].rgb = '#EA4335'
          }
          setTableData([...listData])
        }}
      >
        <Menu.Item key="0" data-rgb="#4285F4">
          <p>
            <span className="tag_color_item priorityColor_5 " data-bg="0">
              <CheckOutlined style={{ width: '10px', height: '10px', color: '#fff' }}></CheckOutlined>
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
  const createNowHtml = () => {
    if (props.getstatus) {
      return false
    }
    let addData = true
    listData.forEach((value: TagItemProps) => {
      if (!value.id) {
        addData = false
      }
    })
    if (addData) {
      listData.push({
        content: '',
        id: 0,
        rgb: '#4285F4',
        show: true,
      })
    }
    setStates('')
    setTableData([...listData])
  }
  const tagItemHtml = (item: any) => {
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
  //取消状态指标编辑
  const addTagCancel = (index: number) => {
    if (listData[index].id) {
      listData[index].show = false
      props.statusData.forEach((element: any) => {
        if (element.id == listData[index].id) {
          listData[index].rgb = element.rgb
          listData[index].content = element.content
        }
      })
    } else {
      listData.splice(index, 1)
      props.getChildrenMsg(listData)
    }
    setTableData([...listData])
  }
  //保存状态指标
  const addTagSure = (index: number) => {
    listData[index].content = initStates
    if (listData[index].id) {
      editTargetTag(props.typeId, listData[index]).then((resData: any) => {
        listData[index].show = false
        setTableData([...listData])
        if (jQuery('.okrQuadrantModal  .fourQuadrant').length > 0) {
          ipcRenderer.send('solve_okrList_detail', { workPlanTargetResultList: listData, typeId: props.typeId })
        }
        props.getChildrenMsg(listData)
      })
    } else {
      saveTargetTag(props.typeId, listData[index]).then((resData: any) => {
        listData[index].show = false
        listData[index].id = resData.data
        setTableData([...listData])
        if (jQuery('.okrQuadrantModal  .fourQuadrant').length > 0) {
          ipcRenderer.send('solve_okrList_detail', { workPlanTargetResultList: listData, typeId: props.typeId })
        }
        props.getChildrenMsg(listData)
      })
    }
  }
  const handelChange = (e: any) => {
    setStates(e.target.value)
  }
  //删除状态指标
  const delTag = (index: number) => {
    deleteTargetTag(listData[index].id).then((resData: any) => {
      if (resData) {
        listData.splice(index, 1)
        setTableData([...listData])
        if (jQuery('.okrQuadrantModal  .fourQuadrant').length > 0) {
          ipcRenderer.send('solve_okrList_detail', { workPlanTargetResultList: listData, typeId: props.typeId })
        }
        props.getChildrenMsg(listData)
      }
    })
  }
  //编辑状态指标
  const editTag = (index: number) => {
    editAddShow = 0
    let num = false
    listData.forEach((value: TagItemProps) => {
      if (value.show) {
        if (value.id) {
          value.show = false
        } else {
          num = true
        }
      }
    })
    listData[index].show = true
    setStates(listData[index].content)
    if (num) {
      editAddShow = listData[index].id
      listData.splice(0, 1)
      props.getChildrenMsg(listData)
    }
    setTableData([...listData])
  }

  return (
    <div className="task-list">
      <ul className="newTagContent" style={{ display: listData.length === 0 ? 'none' : 'block' }}>
        {listData.length > 0 &&
          listData.map((item: TagItemProps, index: number) => {
            const imgUrl = tagItemHtml(item).bgnameimg
            const bgUrl = $tools.asAssetsPath('/images/workplan/' + imgUrl + '.png')
            return (
              <li
                className="tag_item"
                data-id={item.id}
                data-content={item.content}
                data-rgb={item.rgb}
                key={index}
              >
                <div className="show_box">
                  <span
                    className="tag_color_circle"
                    style={{ backgroundColor: tagItemHtml(item).bgcolor }}
                  ></span>
                  <div className="tag_color_tage" style={{ backgroundColor: tagItemHtml(item).bgcolor }}>
                    <span className="tag_txt my_ellipsis" style={{ color: item.rgb }}>
                      <span
                        className="tag_color_dot"
                        data-rgb="#34A853"
                        style={{ backgroundColor: item.rgb }}
                        data-bg="1"
                      ></span>
                      {uncodeUtf16(item.content)}
                    </span>
                    <div className="tag_btn_box">
                      <em
                        className="img_icon tag_edit_btn"
                        style={props.getstatus ? { display: 'none' } : {}}
                        onClick={() => editTag(index)}
                      ></em>
                      <em
                        className="img_icon tag_del_btn"
                        style={props.getstatus ? { display: 'none' } : {}}
                        onClick={() => delTag(index)}
                      ></em>
                    </div>
                  </div>
                  <span
                    className="tag_color_img"
                    // style={{
                    //   backgroundImage: `url(${bgUrl})`,
                    // }}
                  >
                    <img src={bgUrl} />
                  </span>
                </div>
                {item.show && (
                  <div className="edit_box flex ver_center relative flex">
                    <Dropdown overlay={() => addPlanMenu(index)} placement="bottomLeft" trigger={['click']}>
                      <div className="tag_color_choose">
                        <span
                          className="tag_color_dot tag_color_sel"
                          data-rgb={item.rgb}
                          data-bg=""
                          style={{ backgroundColor: item.rgb }}
                        ></span>
                      </div>

                      {/* 颜色选择提出来 */}
                      {/* {addPlanMenu(index)} */}
                    </Dropdown>

                    <input
                      autoFocus={true}
                      type="text"
                      className="tag_edit_inp"
                      value={uncodeUtf16(initStates)}
                      onChange={e => handelChange(e)}
                    />
                    <div className="tag_edit_btn_icon">
                      <em className="img_icon tag_edit_cancel" onClick={() => addTagCancel(index)}></em>
                      <em className="img_icon tag_edit_sure" onClick={() => addTagSure(index)}></em>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
      </ul>
      {listData.length === 0 && (
        <div className="show_none_data_container flex center column" style={{ height: '100%' }}>
          <img src={$tools.asAssetsPath('/images/workplan/none-norm_4.png')} />
          <div className="text_name">{$intl.get('listTargetReason')}</div>
          <div className="none_data_btn">
            {$store.getState().fromPlanTotype.createType === 1 && !props.getstatus ? (
              <Button onClick={() => createNowHtml()}>{$intl.get('statusNorm')}</Button>
            ) : (
              <Button disabled>{$intl.get('statusNorm')}</Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
export default GetNextStatus
