#!/bin/bash

#准备一张1024x1024的png,放在assets中,用于生成各个版本的png,打包成icns格式,cd 到 assets
PICNAME="1024"
#必须是xx.iconset
FILENAME="mac.iconset"
ICONPATH="assets"

mkdir $ICONPATH/$FILENAME

sips -z 16 16     $ICONPATH/$PICNAME.png --out $ICONPATH/$FILENAME/icon_16x16.png
sips -z 32 32     $ICONPATH/$PICNAME.png --out $ICONPATH/$FILENAME/icon_16x16@2x.png
sips -z 32 32     $ICONPATH/$PICNAME.png --out $ICONPATH/$FILENAME/icon_32x32.png
sips -z 64 64     $ICONPATH/$PICNAME.png --out $ICONPATH/$FILENAME/icon_32x32@2x.png
sips -z 128 128   $ICONPATH/$PICNAME.png --out $ICONPATH/$FILENAME/icon_128x128.png
sips -z 256 256   $ICONPATH/$PICNAME.png --out $ICONPATH/$FILENAME/icon_128x128@2x.png
sips -z 256 256   $ICONPATH/$PICNAME.png --out $ICONPATH/$FILENAME/icon_256x256.png
sips -z 512 512   $ICONPATH/$PICNAME.png --out $ICONPATH/$FILENAME/icon_256x256@2x.png
sips -z 512 512   $ICONPATH/$PICNAME.png --out $ICONPATH/$FILENAME/icon_512x512.png
sips -z 1024 1024 $ICONPATH/$PICNAME.png --out $ICONPATH/$FILENAME/icon_512x512@2x.png

iconutil -c icns $ICONPATH/$FILENAME -o $ICONPATH/Icon.icns