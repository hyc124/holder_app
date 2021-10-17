import React from 'react'
import '../login.less'
import { Button, Form } from 'antd'
interface Props extends PageProps {
    showWeChatLogin: (value: boolean) => void
    showRegisterForm: (value: boolean, istype: string) => void
    isStatus?: boolean
    isWeChatLogin: boolean
}
const WeChatLogins: React.FC<Props> = (props: any) => {

    const [form] = Form.useForm()

    const weChatLogin = () => {
        props.showWeChatLogin(true)

    }

    return (
        <Form form={form} name="normal_login" className="login-form">
            <div className="wechat-cont">
                <div className="tips_txt">您的微信还未绑定账号</div>
                <div>请选择绑定已有账户</div>
            </div>
            <Form.Item shouldUpdate={true} className="wechat-btnBox">
                {() => (
                    <Button
                        className="login-form-button"
                        type="primary"
                        htmlType="submit"
                        onClick={() => { weChatLogin() }}
                    >
                        登录并绑定
                    </Button>
                )}
            </Form.Item>
            {/* <Form.Item shouldUpdate={true}>
                {() => (
                    <Button
                        className="login-form-button"
                        htmlType="submit"
                        onClick={() => props.showRegisterForm(true, 'weChatLogin')}
                    >
                        注册新账号
                    </Button>
                )}
            </Form.Item> */}
        </Form>
    )
}

export default WeChatLogins
