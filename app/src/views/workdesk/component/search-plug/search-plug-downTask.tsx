//下属任务定制筛选框
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
interface SerachProps {
  dataUserId: string
  serachCallback: (params?: any) => void
}
const SearchPlug = ({ serachCallback, dataUserId }: SerachProps) => {
  const [filters, setFilters] = useState({
    selectKey: 0,
    btnNav: {
      // nav0: false, //审核中
      nav0: false, //已延迟
      nav1: false, //所有
      nav2: false, //已完成
      nav3: false, //未完成
      nav4: false, //未开启
      nav5: false, //进行中
      nav6: false, //私密任务
    },
  })
  // const [selectKey, setSelectKey] = useState(0)
  //记录筛选的key
  //记录底部标签状态
  // const [btnNav, setBtnNav] = useState({
  //   nav0: false, //审核中
  //   nav1: false, //已延迟
  //   nav2: false, //所有
  //   nav3: false, //已完成
  //   nav4: false, //未完成
  //   nav5: false, //未开启
  //   nav6: false, //进行中
  //   nav7: false, //私密任务
  // })
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
    // { name: '审核中', value: -3, index: 0 },
    { name: '已延迟', value: 3, index: 0 },
    { name: '所有', value: -4, index: 1 },
    { name: '已完成', value: 2, index: 2 },
    { name: '未完成', value: 6, index: 3 },
    { name: '未开启', value: 0, index: 4 },
    { name: '进行中', value: 1, index: 5 },
  ])
  useEffect(() => {
    queryShowPrivatebtn(13, dataUserId).then((data: any) => {
      const dataInfo = data.data || {}
      resetSearch() //重置一下搜索条件
      if (dataInfo.isPropertyExist == 1) {
        setMenuTag2([
          // { name: '审核中', value: -3, index: 0 },
          { name: '已延迟', value: 3, index: 0 },
          { name: '所有', value: -4, index: 1 },
          { name: '已完成', value: 2, index: 2 },
          { name: '未完成', value: 6, index: 3 },
          { name: '未开启', value: 0, index: 4 },
          { name: '进行中', value: 1, index: 5 },
          { name: '私密任务', value: 10, index: 6 },
        ])
      } else {
        setMenuTag2([
          // { name: '审核中', value: -3, index: 0 },
          { name: '已延迟', value: 3, index: 0 },
          { name: '所有', value: -4, index: 1 },
          { name: '已完成', value: 2, index: 2 },
          { name: '未完成', value: 6, index: 3 },
          { name: '未开启', value: 0, index: 4 },
          { name: '进行中', value: 1, index: 5 },
        ])
      }
    })
  }, [dataUserId])
  //标签事件
  const tagEvent = (item: any) => {
    filters.selectKey = item.index
    // setSelectKey(item.index)

    if (item.index == 0) {
      filters.btnNav = {
        nav0: !filters.btnNav.nav0,
        nav1: false,
        nav2: false,
        nav3: false,
        nav4: false,
        nav5: false,
        nav6: false,
        // nav7: false,
      }
      // setBtnNav({
      //   nav0: !btnNav.nav0,
      //   nav1: false,
      //   nav2: false,
      //   nav3: false,
      //   nav4: false,
      //   nav5: false,
      //   nav6: false,
      //   nav7: false,
      // })
    } else if (item.index == 1) {
      filters.btnNav = {
        nav0: false,
        nav1: !filters.btnNav.nav1,
        nav2: false,
        nav3: false,
        nav4: false,
        nav5: false,
        nav6: false,
        // nav7: false,
      }
      // setBtnNav({
      //   nav0: false,
      //   nav1: !btnNav.nav1,
      //   nav2: false,
      //   nav3: false,
      //   nav4: false,
      //   nav5: false,
      //   nav6: false,
      //   nav7: false,
      // })
    } else if (item.index == 2) {
      filters.btnNav = {
        nav0: false,
        nav1: false,
        nav2: !filters.btnNav.nav2,
        nav3: false,
        nav4: false,
        nav5: false,
        nav6: false,
        // nav7: false,
      }
      // setBtnNav({
      //   nav0: false,
      //   nav1: false,
      //   nav2: !btnNav.nav2,
      //   nav3: false,
      //   nav4: false,
      //   nav5: false,
      //   nav6: false,
      //   nav7: false,
      // })
    } else if (item.index == 3) {
      filters.btnNav = {
        nav0: false,
        nav1: false,
        nav2: false,
        nav3: !filters.btnNav.nav3,
        nav4: false,
        nav5: false,
        nav6: false,
        // nav7: false,
      }
      // setBtnNav({
      //   nav0: false,
      //   nav1: false,
      //   nav2: false,
      //   nav3: !btnNav.nav3,
      //   nav4: false,
      //   nav5: false,
      //   nav6: false,
      //   nav7: false,
      // })
    } else if (item.index == 4) {
      filters.btnNav = {
        nav0: false,
        nav1: false,
        nav2: false,
        nav3: false,
        nav4: !filters.btnNav.nav4,
        nav5: false,
        nav6: false,
        // nav7: false,
      }
      // setBtnNav({
      //   nav0: false,
      //   nav1: false,
      //   nav2: false,
      //   nav3: false,
      //   nav4: !btnNav.nav4,
      //   nav5: false,
      //   nav6: false,
      //   nav7: false,
      // })
    } else if (item.index == 5) {
      filters.btnNav = {
        nav0: false,
        nav1: false,
        nav2: false,
        nav3: false,
        nav4: false,
        nav5: !filters.btnNav.nav5,
        nav6: false,
        // nav7: false,
      }
      // setBtnNav({
      //   nav0: false,
      //   nav1: false,
      //   nav2: false,
      //   nav3: false,
      //   nav4: false,
      //   nav5: !btnNav.nav5,
      //   nav6: false,
      //   nav7: false,
      // })
    } else if (item.index == 6) {
      filters.btnNav = {
        nav0: false,
        nav1: false,
        nav2: false,
        nav3: false,
        nav4: false,
        nav5: false,
        nav6: !filters.btnNav.nav6,
        // nav7: false,
      }
      // setBtnNav({
      //   nav0: false,
      //   nav1: false,
      //   nav2: false,
      //   nav3: false,
      //   nav4: false,
      //   nav5: false,
      //   nav6: !btnNav.nav6,
      //   nav7: false,
      // })
    }
    // else if (item.index == 7) {
    //   filters.btnNav = {
    //     nav0: false,
    //     nav1: false,
    //     nav2: false,
    //     nav3: false,
    //     nav4: false,
    //     nav5: false,
    //     nav6: false,
    //     // nav7: !filters.btnNav.nav7,
    //   }
    //   // setBtnNav({
    //   //   nav0: false,
    //   //   nav1: false,
    //   //   nav2: false,
    //   //   nav3: false,
    //   //   nav4: false,
    //   //   nav5: false,
    //   //   nav6: false,
    //   //   nav7: !btnNav.nav7,
    //   // })
    // }
    setFilters({ ...filters })
    if (item.value !== 10) {
      getSatus(item, item.index)
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
  }
  //获取当前标签选中的情况
  //type 1审核中 已延迟 2其他标签切换
  // nav 当前切换标签
  const getSatus = (item: any, nav: number) => {
    let nowStatus: any
    // console.log(filters.btnNav[`nav${nav}`])
    if (!filters.btnNav[`nav${nav}`]) {
      nowStatus = []
    } else {
      nowStatus = [item.value]
    }
    setSerachParam({
      ...serachParam,
      status: nowStatus,
      property: 0,
    })
    serachCallback({
      ...serachParam,
      status: nowStatus,
      property: 0,
    })
  }
  //重置搜索条件
  const resetSearch = () => {
    setSerachParam({
      ...serachParam,
      status: [-4],
      startTime: '',
      endTime: '',
      keyword: '',
      tagKeyword: '',
      property: 0,
    })
    serachCallback({
      ...serachParam,
      status: [-4],
      startTime: '',
      endTime: '',
      keyword: '',
      tagKeyword: '',
      property: 0,
    })
    setFilters({
      selectKey: 0,
      btnNav: {
        nav0: false,
        nav1: false,
        nav2: false,
        nav3: false,
        nav4: false,
        nav5: false,
        nav6: false,
        // nav7: false,
      },
    })
    // setBtnNav({
    //   nav0: false,
    //   nav1: false,
    //   nav2: false,
    //   nav3: false,
    //   nav4: false,
    //   nav5: false,
    //   nav6: false,
    //   nav7: false,
    // })
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
    <div className={$c('search_down_menu searchHeight')}>
      <div className="search_header">
        <Button icon={<SyncOutlined />} onClick={() => resetSearch()}>
          重置条件
        </Button>
      </div>
      <Divider />
      <Search
        className="search_input"
        placeholder="搜索任务/执行人"
        onSearch={value => searchTaskName(value)}
      />
      <Divider />
      <div className="s_section search_tag">
        <div className="tit">按状态筛选</div>
        <div className="search_tag_btm">
          <section className="search_section_btm search_opt">
            {menuTag2.map((item: any, index: number) => (
              <span
                key={index}
                onClick={() => tagEvent(item)}
                className={$c('tag_span', {
                  laragTag: index === 0 || index === 1,
                  smllTag: index !== 0 && index !== 1,

                  T1: index === 0,
                  T2: index === 1,
                  T3: index === 2,
                  T4: index === 3,
                  T5: index === 4,
                  T6: index === 5,
                  T7: index === 6,
                  // T8: index === 7,

                  // tag_shz_active: filters.selectKey === index && index === 0 && filters.btnNav.nav0,
                  tag_yyc_active: filters.selectKey === index && index === 0 && filters.btnNav.nav0,
                  tagspanActive: filters.selectKey === index && index === 1 && filters.btnNav.nav1,
                  tagspanActive1: filters.selectKey === index && index === 2 && filters.btnNav.nav2,
                  tagspanActive2: filters.selectKey === index && index === 3 && filters.btnNav.nav3,
                  tagspanActive3: filters.selectKey === index && index === 4 && filters.btnNav.nav4,
                  tagspanActive4: filters.selectKey === index && index === 5 && filters.btnNav.nav5,
                  tagspanActive5: filters.selectKey === index && index === 6 && filters.btnNav.nav6,

                  // tag_shz_rm_active: filters.selectKey === index && index === 0 && !filters.btnNav.nav0,
                  tag_yyc_rm_active: filters.selectKey === index && index === 0 && !filters.btnNav.nav0,
                  tagrmActive: filters.selectKey === index && index === 1 && !filters.btnNav.nav1,
                  tagrmActiv1: filters.selectKey === index && index === 2 && !filters.btnNav.nav2,
                  tagrmActiv2: filters.selectKey === index && index === 3 && !filters.btnNav.nav3,
                  tagrmActiv3: filters.selectKey === index && index === 4 && !filters.btnNav.nav4,
                  tagrmActiv4: filters.selectKey === index && index === 5 && !filters.btnNav.nav5,
                  tagrmActiv5: filters.selectKey === index && index === 6 && !filters.btnNav.nav6,
                })}
              >
                {item.name}
              </span>
            ))}
          </section>
        </div>
      </div>
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
