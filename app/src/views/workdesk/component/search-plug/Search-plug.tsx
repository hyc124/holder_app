import React, { useState, useEffect } from 'react'
import { SyncOutlined } from '@ant-design/icons'
import { Input, Button, Divider, DatePicker } from 'antd'
import $c from 'classnames'
import './search-plug.less'
const { Search } = Input
const { RangePicker } = DatePicker
import moment from 'moment'
import { queryShowPrivatebtn } from '../../getData'
//日期格式
const dateFormat = 'YYYY/MM/DD'

const menuTag1 = [{ name: '已延迟', value: 3, index: 0 }]
interface SerachProps {
  serachCallback: (params?: any) => void
  listType: number
  isShowTagSerachBtn: boolean //是否展示标签搜索框
  searchPlaceHolder?: string
}
const SearchPlug = ({ serachCallback, listType, isShowTagSerachBtn, searchPlaceHolder }: SerachProps) => {
  const [selectKey1, setSelectKey1] = useState(0)
  const [selectKey2, setSelectKey2] = useState(0)
  //记录筛选的key
  const [nav, setNav] = useState({
    nav1: false,
    nav2: false,
  })
  //记录底部标签状态
  const [btnNav, setBtnNav] = useState({
    nav0: false, //所有
    nav1: false, //已完成
    nav2: false, //未完成
    nav3: false, //未开启
    nav4: false, //进行中
    nav5: false, //私密任务
  })
  //任务筛选参数
  const [serachParam, setSerachParam] = useState({
    status: [-4],
    startTime: '',
    endTime: '',
    keyword: '',
    tagKeyword: '',
    property: 0,
  })
  const [menuTag2, setMenuTag2] = useState([
    { name: '所有', value: -4, index: 0 },
    { name: '已完成', value: 2, index: 1 },
    { name: '未完成', value: 6, index: 2 },
    { name: '未开启', value: 0, index: 3 },
    { name: '进行中', value: 1, index: 4 },
  ])
  useEffect(() => {
    resetSearch(2) //重置搜索
    queryShowPrivatebtn(listType).then((data: any) => {
      const dataInfo = data.data || {}
      if (dataInfo.isPropertyExist == 1) {
        setMenuTag2([
          { name: '所有', value: -4, index: 0 },
          { name: '已完成', value: 2, index: 1 },
          { name: '未完成', value: 6, index: 2 },
          { name: '未开启', value: 0, index: 3 },
          { name: '进行中', value: 1, index: 4 },
          { name: '私密任务', value: 10, index: 5 },
        ])
      } else {
        setMenuTag2([
          { name: '所有', value: -4, index: 0 },
          { name: '已完成', value: 2, index: 1 },
          { name: '未完成', value: 6, index: 2 },
          { name: '未开启', value: 0, index: 3 },
          { name: '进行中', value: 1, index: 4 },
        ])
      }
    })
  }, [listType])
  //审核中 已延迟
  const tagEvent1 = (item: any) => {
    nav.nav1 = false
    nav.nav2 = !nav.nav2
    setNav({ ...nav })
    setSelectKey1(item.index)
    getSatus(1, item)
    // if (item.index == 0) {
    //   setNav({
    //     nav1: !nav.nav1,
    //     nav2: false,
    //   })
    // } else {
    // setNav({
    //   nav1: false,
    //   nav2: !nav.nav2,
    // })
    // }
  }

  //其他标签事件
  const tagEvent2 = (item: any) => {
    setSelectKey2(item.index)
    if (item.value !== 10) {
      getSatus(2, item)
    } else {
      setSerachParam({
        ...serachParam,
        property: 1,
        status: [-4],
      })
      serachCallback({
        ...serachParam,
        property: 1,
        status: [-4],
      })
    }
    if (item.index == 0) {
      setBtnNav({
        nav0: !btnNav.nav0,
        nav1: false,
        nav2: false,
        nav3: false,
        nav4: false,
        nav5: false,
      })
    } else if (item.index == 1) {
      setBtnNav({
        nav0: false,
        nav1: !btnNav.nav1,
        nav2: false,
        nav3: false,
        nav4: false,
        nav5: false,
      })
    } else if (item.index == 2) {
      setBtnNav({
        nav0: false,
        nav1: false,
        nav2: !btnNav.nav2,
        nav3: false,
        nav4: false,
        nav5: false,
      })
    } else if (item.index == 3) {
      setBtnNav({
        nav0: false,
        nav1: false,
        nav2: false,
        nav3: !btnNav.nav3,
        nav4: false,
        nav5: false,
      })
    } else if (item.index == 4) {
      setBtnNav({
        nav0: false,
        nav1: false,
        nav2: false,
        nav3: false,
        nav4: !btnNav.nav4,
        nav5: false,
      })
    } else if (item.index == 5) {
      setBtnNav({
        nav0: false,
        nav1: false,
        nav2: false,
        nav3: false,
        nav4: false,
        nav5: !btnNav.nav5,
      })
    }
  }
  //校验底部标签是否存在选中
  const checkSlect = (type: number) => {
    if (type == 0) {
      //校验审核已审核标签是否选中
      // if (!nav.nav1 && !nav.nav2) {
      if (!nav.nav2) {
        return true
      }
    } else {
      // 校验其他标签是否选中
      if (!btnNav.nav0 && !btnNav.nav1 && !btnNav.nav2 && !btnNav.nav3 && !btnNav.nav4 && !btnNav.nav5) {
        return true
      }
    }
    return false
  }
  //获取当前标签选中的情况
  //type 1审核中 已延迟 2其他标签切换
  const getSatus = (type: number, item: any) => {
    const nowStatus = [...serachParam.status]
    if (type == 1) {
      if (nowStatus.length == 1) {
        //底部标签和顶部标签是否存在选中
        if (checkSlect(1) && checkSlect(0)) {
          //情况1:2个标签栏都未选中 默认值
          nowStatus.splice(0, 1, item.value)
        }
        if (!checkSlect(1) && checkSlect(0) && nowStatus.indexOf(item.value) == -1) {
          //情况2:底部标签存在选中
          nowStatus.unshift(item.value)
        }
        if (checkSlect(1) && !checkSlect(0)) {
          nowStatus.splice(0, 1, item.value)
        }
      } else {
        if ((nav.nav1 && item.index === 0) || (nav.nav2 && item.index === 1)) {
          nowStatus.splice(0, 1) //移除选中项
        }
        if ((!nav.nav1 && item.index === 0) || (!nav.nav2 && item.index === 1)) {
          nowStatus.splice(0, 1, item.value) //替换选中项
        }
      }
    } else {
      if (nowStatus.length == 1) {
        if (checkSlect(1) && checkSlect(0)) {
          nowStatus.splice(0, 1, item.value)
        }
        if (!checkSlect(1)) {
          if (
            (btnNav.nav0 && item.index == 0) ||
            (btnNav.nav1 && item.index == 1) ||
            (btnNav.nav2 && item.index == 2) ||
            (btnNav.nav3 && item.index == 3) ||
            (btnNav.nav4 && item.index == 4) ||
            (btnNav.nav5 && item.index == 5)
          ) {
            // nowStatus.splice(0, 1, -4)
            nowStatus.splice(0, 1)
          }
          if (
            (!btnNav.nav0 && item.index == 0) ||
            (!btnNav.nav1 && item.index == 1) ||
            (!btnNav.nav2 && item.index == 2) ||
            (!btnNav.nav3 && item.index == 3) ||
            (!btnNav.nav4 && item.index == 4) ||
            (!btnNav.nav5 && item.index == 5)
          ) {
            nowStatus.splice(0, 1, item.value)
          }
        }
        if (!checkSlect(0) && nowStatus.indexOf(item.value) == -1) {
          nowStatus.push(item.value)
        }
      } else {
        if (
          (btnNav.nav0 && item.index === 0) ||
          (btnNav.nav1 && item.index === 1) ||
          (btnNav.nav2 && item.index === 2) ||
          (btnNav.nav3 && item.index === 3) ||
          (btnNav.nav4 && item.index === 4) ||
          (btnNav.nav5 && item.index === 5)
        ) {
          nowStatus.splice(1, 1) //移除选中项
        }
        if (
          (!btnNav.nav0 && item.index === 0) ||
          (!btnNav.nav1 && item.index === 1) ||
          (!btnNav.nav2 && item.index === 2) ||
          (!btnNav.nav3 && item.index === 3) ||
          (!btnNav.nav4 && item.index === 4) ||
          (!btnNav.nav5 && item.index === 5)
        ) {
          nowStatus.splice(1, 1, item.value) //替换选中项
        }
      }
    }
    let _nowStatus = [...nowStatus]
    // 判断延迟状态是否选择
    if (nav.nav2 && !_nowStatus.includes(3)) {
      _nowStatus.push(3)
    }
    if (!nav.nav2 && nowStatus.includes(3)) {
      _nowStatus = _nowStatus.filter((item: any) => item != '3')
    }

    setSerachParam({
      ...serachParam,
      status: Array.from(new Set([..._nowStatus])),
      property: 0,
    })
    serachCallback({
      ...serachParam,
      status: Array.from(new Set([..._nowStatus])),
      property: 0,
    })
  }
  //重置搜索条件
  const resetSearch = (type: number) => {
    setSerachParam({
      ...serachParam,
      status: [-4],
      startTime: '',
      endTime: '',
      keyword: '',
      tagKeyword: '',
      property: 0,
    })
    if (type == 1) {
      //首次加载页面重置条件不进行刷新
      serachCallback({
        ...serachParam,
        status: [-4],
        startTime: '',
        endTime: '',
        keyword: '',
        tagKeyword: '',
        property: 0,
      })
    }
    setBtnNav({
      nav0: false,
      nav1: false,
      nav2: false,
      nav3: false,
      nav4: false,
      nav5: false,
    })
    setNav({
      nav1: false,
      nav2: false,
    })
  }

  //日期切换
  const changeRangePicker = (_dates: any, dateStrings: string[]) => {
    setSerachParam({
      ...serachParam,
      startTime: dateStrings[0] + ' ' + '00:00',
      endTime: dateStrings[1] + ' ' + '23:59',
    })
    serachCallback({
      ...serachParam,
      startTime: dateStrings[0] + ' ' + '00:00',
      endTime: dateStrings[1] + ' ' + '23:59',
    })
  }
  //搜索任务/责任人
  const searchTaskName = (value: string) => {
    setSerachParam({
      ...serachParam,
      keyword: value,
    })
    serachCallback({
      ...serachParam,
      keyword: value,
    })
  }
  //请输入标签关键字
  const searchTagName = (value: string) => {
    setSerachParam({
      ...serachParam,
      tagKeyword: value,
    })
    serachCallback({
      ...serachParam,
      tagKeyword: value,
    })
  }
  //转换符合日期控件的格式
  const revertTime = (timeStr: string) => {
    return timeStr.split(' ')[0]
  }
  return (
    <div className={$c('search_down_menu', { searchHeight: !isShowTagSerachBtn })}>
      <div className="search_header">
        <Button icon={<SyncOutlined />} onClick={() => resetSearch(1)}>
          重置条件
        </Button>
      </div>
      <Divider />
      <Search
        className="search_input"
        placeholder={searchPlaceHolder || '搜索任务/执行人'}
        onSearch={value => searchTaskName(value)}
      />
      <Divider />
      <div className="s_section search_tag">
        <div className="tit">按状态筛选</div>
        <div className="search_tag_btm">
          <section className="search_section_top">
            {menuTag1.map((item: any, index: number) => (
              <span
                key={index}
                className={$c('tag_span', {
                  // tag_shz_active: selectKey1 === index && index === 0 && nav.nav1,
                  // tag_shz_rm_active: selectKey1 === index && index === 0 && !nav.nav1,
                  tag_yyc_active: selectKey1 === index && index === 0 && nav.nav2,
                  tag_yyc_rm_active: selectKey1 === index && index === 0 && !nav.nav2,
                })}
                onClick={() => tagEvent1(item)}
              >
                {item.name}
              </span>
            ))}
          </section>
          <section className="search_section_btm">
            {menuTag2.map((item: any, index: number) => (
              <span
                key={index}
                className={$c('tag_span', {
                  tagspanActive: selectKey2 === index && index === 0 && btnNav.nav0,
                  tagspanActive1: selectKey2 === index && index === 1 && btnNav.nav1,
                  tagspanActive2: selectKey2 === index && index === 2 && btnNav.nav2,
                  tagspanActive3: selectKey2 === index && index === 3 && btnNav.nav3,
                  tagspanActive4: selectKey2 === index && index === 4 && btnNav.nav4,
                  tagspanActive5: selectKey2 === index && index === 5 && btnNav.nav5,
                  tagrmActive: selectKey2 === index && index === 0 && !btnNav.nav0,
                  tagrmActiv1: selectKey2 === index && index === 1 && !btnNav.nav1,
                  tagrmActiv2: selectKey2 === index && index === 2 && !btnNav.nav2,
                  tagrmActiv3: selectKey2 === index && index === 3 && !btnNav.nav3,
                  tagrmActiv4: selectKey2 === index && index === 4 && !btnNav.nav4,
                  tagrmActiv5: selectKey2 === index && index === 5 && !btnNav.nav5,
                })}
                onClick={() => tagEvent2(item)}
              >
                {item.name}
              </span>
            ))}
          </section>
        </div>
      </div>
      {isShowTagSerachBtn && <Divider />}
      {isShowTagSerachBtn && (
        <div className="s_section search_input">
          <div className="tit">按标签搜索</div>
          <Search
            className="search_input"
            placeholder="请输入标签关键字"
            onSearch={value => searchTagName(value)}
          />
        </div>
      )}
      <Divider />
      <div className="s_section search_input">
        <div className="tit">
          按日期筛选 
          <span className="date-tip" style={{ fontSize: 12, fontWeight: 400, marginLeft: 4 }}>
            (仅针对有起止时间的任务)
          </span>
        </div>
        <RangePicker
          dropdownClassName="select-time-picker"
          format="YYYY/MM/DD"
          onChange={changeRangePicker}
          allowClear={false}
          value={
            serachParam.startTime == ''
              ? null
              : [
                  moment(revertTime(serachParam.startTime), dateFormat),
                  moment(revertTime(serachParam.endTime), dateFormat),
                ]
          }
        />
      </div>
    </div>
  )
}
export default SearchPlug
