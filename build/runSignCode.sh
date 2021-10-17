#!/bin/bash

# 应用名称 自定义
APP="holder"
#  版本号
VERSION="1.0.6"
#绝对路径
FULL_PATH="/Users/mac/siyx/release/$APP-$VERSION"
# 授权文件路径。注意路径
CHILD_PLIST="./build/entitlements.mas.inherit.plist"
PARENT_PLIST="./build/entitlements.mas.plist"
#上面是要根据实际路径需要修改的东西


#应用路径
APP_PATH="$FULL_PATH/mas/$APP.app"
# 生成安装包路径
RESULT_PATH="$FULL_PATH/$APP.pkg"
# 开发者应用签名证书
APP_KEY="3rd Party Mac Developer Application: Chengdu holder network technology co. LTD (QJJN468932)"
INSTALLER_KEY="3rd Party Mac Developer Installer: Chengdu holder network technology co. LTD (QJJN468932)"


FRAMEWORKS_PATH="$APP_PATH/Contents/Frameworks"


# codesign -s "$APP_KEY" -f --entitlements "$CHILD_PLIST" "$FRAMEWORKS_PATH/Electron Framework.framework/Versions/A/Resources/crashpad_handler"
# codesign -s "$APP_KEY" -f --entitlements "$CHILD_PLIST" "$FRAMEWORKS_PATH/Squirrel.framework/Versions/A/Resources/ShipIt"
codesign -s "$APP_KEY" -f --entitlements "$CHILD_PLIST" "$FRAMEWORKS_PATH/$APP Helper (GPU).app/Contents/MacOS/$APP Helper (GPU)"
codesign -s "$APP_KEY" -f --entitlements "$CHILD_PLIST" "$FRAMEWORKS_PATH/$APP Helper (GPU).app/Contents/MacOS/$APP Helper (GPU)"
codesign -s "$APP_KEY" -f --entitlements "$CHILD_PLIST" "$FRAMEWORKS_PATH/$APP Helper (Plugin).app/Contents/MacOS/$APP Helper (Plugin)"
codesign -s "$APP_KEY" -f --entitlements "$CHILD_PLIST" "$FRAMEWORKS_PATH/$APP Helper (Renderer).app/Contents/MacOS/$APP Helper (Renderer)"
codesign -s "$APP_KEY" -f --entitlements "$CHILD_PLIST" "$FRAMEWORKS_PATH/$APP Helper.app/Contents/MacOS/$APP Helper"
codesign -s "$APP_KEY" -f --entitlements "$CHILD_PLIST" "$APP_PATH/Contents/Library/LoginItems/$APP Login Helper.app/Contents/MacOS/$APP Login Helper"
codesign -s "$APP_KEY" -f --entitlements "$CHILD_PLIST" "$APP_PATH/Contents/MacOS/$APP"
#签包
codesign -s "$APP_KEY" -f --entitlements "$PARENT_PLIST" "$APP_PATH"
productbuild --component "$APP_PATH" /Applications --sign "$INSTALLER_KEY" "$RESULT_PATH"
