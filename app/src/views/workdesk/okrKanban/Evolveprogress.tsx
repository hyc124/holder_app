import { Button, Dropdown, Input, Slider, Tooltip, Rate } from 'antd'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { HeartFilled } from '@ant-design/icons'
import { getTaskTeamId } from '../../myWorkDesk/myWorkDesk'
let savePercents: any = ''
const Evolveprogress = (popos: any) => {
  const [percents, setPercents] = useState<any>()
  const [visibles, setvisibles] = useState(false)
  //状态
  const [evolvestart, setEvolvestart] = useState<any>({
    type: 0,
    text: '正常',
    classname: 'zc',
    heart: 0,
  })
  useEffect(() => {
    setPercents(popos.percent)
    savePercents = popos.percent
    evolvestart.heart = Number(popos.cci) / 2
    setEvolvestartFn(popos.processStatus)
  }, [popos.id])

  const setEvolvestartFn = (type: any, returnType?: string) => {
    let _classname = ''
    let _text = ''
    let _progresClass = ''
    if (type == 0) {
      _classname = 'zc'
      _progresClass = 'evolve_zc'
      _text = '正常'
    } else if (type == 1) {
      _classname = 'fx'
      _progresClass = 'evolve_fx'
      _text = '有风险'
    } else if (type == 2) {
      _classname = 'cq'
      _progresClass = 'evolve_cq'
      _text = '超前'
    } else if (type == 3) {
      _classname = 'yc'
      _progresClass = 'evolve_yc'
      _text = '延迟'
    }
    if (returnType == 'text') {
      // if (popos.percent == 0 && type == 0) {
      //   _text = ''
      // }
      return _text
    } else if (returnType == 'class') {
      return _progresClass
    } else {
      evolvestart.type = type
      evolvestart.text = _text
      evolvestart.classname = _classname
      setEvolvestart({ ...evolvestart })
    }
  }
  const setPercentsFn = () => {
    setPercents(savePercents)
  }

  const InputHtml = (inputProps: any) => {
    const [getpercents, setgetpercents] = useState(0)
    useEffect(() => {
      setgetpercents(inputProps.data)
    }, [inputProps])
    // 进度输入值控制整数
    const changeInputVal = (e: any) => {
      let textboxvalue = e.target.value
      if (textboxvalue.length == 1) {
        textboxvalue = e.target.value.replace(/[^0-9]/g, '')
      } else {
        textboxvalue = e.target.value.replace(/^\D*(\d*(?:\.\d{0,2})?).*$/g, '$1')
      }
      if (textboxvalue > 100) {
        textboxvalue = 100
      }
      setPercentFn(textboxvalue)
    }
    const setPercentFn = (value: any) => {
      setgetpercents(value)
      savePercents = value
    }
    return (
      <div className="evolve_detail_progress_box">
        <Slider
          className={''}
          value={getpercents}
          onAfterChange={(value: any) => {
            setPercents(savePercents)
          }}
          onChange={(value: any) => {
            setPercentFn(value)
          }}
        ></Slider>
        <span>
          <Input
            min={0}
            max={100}
            value={getpercents}
            onPressEnter={(e: any) => {
              if (e.keyCode == 13) {
                setPercentFn(e.target.value || 0)
              }
            }}
            onBlur={(e: any) => {
              setPercentFn(e.target.value || 0)
              setPercents(savePercents)
            }}
            onChange={(e: any) => {
              changeInputVal(e)
            }}
          />
          %
        </span>
      </div>
    )
  }
  const Evolvedetail = () => {
    return (
      <div className="evolve_detail">
        <div className="evolve_detail_content">
          <div className="evolve_detail_progress">
            <p className="evolve_detail_title">进度</p>
            <InputHtml data={percents} />
          </div>
          <div className="evolve_detail_start">
            <p className="evolve_detail_title">当前状态</p>
            <div>
              <Dropdown
                trigger={['click']}
                disabled={popos?.isFollowWorkDesk}
                overlay={
                  <ul className="ed-trigger_ul">
                    <li
                      className={`${evolvestart.type == 0 ? 'active' : ''}`}
                      onClick={() => {
                        setEvolvestartFn(0)
                        setPercentsFn()
                      }}
                    >
                      <i className="zc ed_trigger_label"></i>正常<span></span>
                    </li>
                    <li
                      className={`${evolvestart.type == 1 ? 'active' : ''}`}
                      onClick={() => {
                        setEvolvestartFn(1)
                        setPercentsFn()
                      }}
                    >
                      <i className="fx ed_trigger_label"></i>有风险<span></span>
                    </li>
                    <li
                      className={`${evolvestart.type == 2 ? 'active' : ''}`}
                      onClick={() => {
                        setEvolvestartFn(2)
                        setPercentsFn()
                      }}
                    >
                      <i className="cq ed_trigger_label"></i>超前<span></span>
                    </li>
                    <li
                      className={`${evolvestart.type == 3 ? 'active' : ''}`}
                      onClick={() => {
                        setEvolvestartFn(3)
                        setPercentsFn()
                      }}
                    >
                      <i className="yc ed_trigger_label"></i>延迟<span></span>
                    </li>
                  </ul>
                }
              >
                <p className="ed-trigger_title">
                  <i className={`ed_trigger_label ${evolvestart.classname}`}></i>
                  {evolvestart.text}
                </p>
              </Dropdown>
            </div>
          </div>
          {popos.type && popos.type == 3 && (
            <div className="evolve_detail_heart">
              <p className="evolve_detail_title">信心指数</p>
              <Rate
                allowHalf
                value={evolvestart.heart}
                className="okr_color_heart"
                character={
                  <HeartFilled
                    style={{
                      fontSize: '14px',
                    }}
                  />
                }
                onHoverChange={(val: any) => {
                  if (val) {
                    $('.evolve_detail_heart .okr_heart_num').text(val * 2)
                  } else {
                    $('.evolve_detail_heart .okr_heart_num').text(evolvestart.heart * 2)
                  }
                }}
                onChange={(val: number) => {
                  if (val || (val == 0 && evolvestart.heart == 0.5)) {
                    evolvestart.heart = val
                    setEvolvestart({ ...evolvestart })
                  }
                }}
              />
              <span className="okr_heart_num">{evolvestart.heart * 2}</span>
            </div>
          )}
          <div
            className="evolve_detail_report"
            onClick={() => {
              $store.dispatch({
                type: 'TASK_LIST_ROW',
                data: {
                  handleBtn: {
                    ascriptionId: getTaskTeamId(popos),
                    id: popos.typeId,
                    status: popos.percent == 100 ? 2 : 0,
                    executorUsername: '',
                    reportId: '',
                    type: 0,
                    time: Math.floor(Math.random() * Math.floor(1000)),
                    types: 'okr',
                    okrprogress: {
                      percents: percents,
                      evolvestart: evolvestart.type,
                      cci: popos.type == 3 ? evolvestart.heart : 0,
                    },
                    source: 'okr_list',
                  },
                  type: 0,
                },
              })
              $tools.createWindow('DailySummary')
              setvisibles(false)
            }}
          >
            <p className="evolve_detail_title" style={{ cursor: 'pointer', marginBottom: '11px' }}>
              添加进展汇报<i className="hb_icon"></i>
            </p>
          </div>
        </div>
        <div className="evolve_detail_footer">
          <Button
            onClick={() => {
              setvisibles(false)
            }}
          >
            取消
          </Button>
          <Button
            type="primary"
            onMouseDown={() => {
              popos.setcallbackFn(parseFloat(savePercents), evolvestart.type, evolvestart.heart * 2)
              setvisibles(false)
            }}
          >
            确定
          </Button>
        </div>
      </div>
    )
  }
  return (
    <>
      <Dropdown
        trigger={['click']}
        overlay={<Evolvedetail />}
        disabled={popos?.isFollowWorkDesk}
        visible={visibles}
        onVisibleChange={(flag: any) => {
          setvisibles(flag)
          if (flag) {
            setPercents(popos.percent)
            savePercents = popos.percent
            evolvestart.heart = Number(popos.cci) / 2
            setEvolvestartFn(popos.processStatus)
          }
        }}
      >
        <div className={`evolve_progress_box ${setEvolvestartFn(popos.processStatus, 'class')}`}>
          <Tooltip title={`${setEvolvestartFn(popos.processStatus, 'text')}`}>
            <span
              className={`evolve_progress_text ${
                popos.percent < 5 || popos.nowType == 'okrKanban'
                  ? setEvolvestartFn(popos.processStatus, 'class')
                  : ''
              }`}
              style={popos.nowType == 'okrKanban' ? { position: 'inherit', left: '0px', margin: '0 10px' } : {}}
            >
              {setEvolvestartFn(popos.processStatus, 'text')}
            </span>
          </Tooltip>
          <Slider
            className={popos.nowType == 'okrKanban' ? 'small_slider_okr' : ''}
            value={popos.percent}
            onAfterChange={() => {}}
          ></Slider>
          {/* {popos.nowType == 'okrKanban' ? <span style={{ marginLeft: '10px' }}>{popos.percent}% </span> : ''} */}
        </div>
      </Dropdown>
    </>
  )
}

export default Evolveprogress
