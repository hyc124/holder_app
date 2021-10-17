import React from 'react'
import { Popover, Button, Tabs } from 'antd'
import './chat-emoji.less'
import EmojiMenu from './emoji.json'
import { getChatInfos } from '@/src/views/chatwin/getData/ChatHandle'
import { withStore } from '@/core/store'
const { TabPane } = Tabs
interface State {
  visible: boolean
}

//表情组件
@withStore(['collectList'])
class ChatEmoji extends React.Component<any, State> {
  state: State = {
    visible: false,
  }
  // componentDidMount() {
  //   $('body')
  //     .off()
  //     .on('click', (e: any) => {
  //       const _con = $('.emojiContainer') // 设置目标区域
  //       if (!_con.is(e.target) && _con.has(e.target).length === 0) {
  //         // this.state.visible = false
  //         this.setState({
  //           visible: false,
  //         })
  //         $('body').off('click')
  //       }
  //     })
  // }
  // 点击空白处隐藏表情
  blankClick = () => {
    $('.ant-modal-wrap')
      .off()
      .on('click', (e: any) => {
        const _con = $('.emojiContainer') // 设置目标区域
        if (!_con.is(e.target) && _con.has(e.target).length === 0) {
          // this.state.visible = false
          this.setState({
            visible: false,
          })
          $('.ant-modal-wrap').off('click')
        }
      })
    $('.chat-container')
      .off()
      .on('click', (e: any) => {
        const _con = $('.emojiContainer') // 设置目标区域
        if (!_con.is(e.target) && _con.has(e.target).length === 0) {
          // this.state.visible = false
          this.setState({
            visible: false,
          })
          $('.chat-container').off('click')
        }
      })
  }
  render() {
    return (
      <Popover
        className="emojiContainer"
        content={this.renderEmojiContent}
        placement="topLeft"
        visible={this.state.visible}
        title={null}
        style={{ width: 500 }}
      >
        <Button
          className="msg-handle-btn face_emoji"
          onClick={e => {
            e.preventDefault()
            this.blankClick()
            this.setState({ visible: !this.state.visible })
          }}
        ></Button>
      </Popover>
    )
  }
  //显示表情选择
  renderEmojiContent = () => {
    const { selectEmoji } = this.props
    //获取收藏的图片
    const { collectList } = $store.getState()
    return (
      <Tabs className="emoji-tab-container" animated={{ inkBar: true, tabPane: true }} tabPosition="bottom">
        <TabPane tab="Go表情" key="1">
          <div className="emoji-main-content">
            {EmojiMenu.emojiMain.map(item => (
              <span
                className="emoji-item"
                key={item.title}
                onClick={() => {
                  this.setState({ visible: false })
                  selectEmoji(item.key)
                }}
              >
                <img src={$tools.asAssetsPath(`/emoji/${item.key}.png`)} />
              </span>
            ))}
          </div>
        </TabPane>
        <TabPane tab="收藏" key="2">
          <div className="emoji-main-content">
            {collectList.map(item => {
              const chatInfo = getChatInfos(item.body)
              if (chatInfo.type === 2) {
                return (
                  <span className="emoji-item" key={item.timestamp}>
                    <img src={chatInfo.fileUrl} />
                  </span>
                )
              }
            })}
          </div>
        </TabPane>
      </Tabs>
    )
  }
}

export default ChatEmoji
