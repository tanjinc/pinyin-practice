rm -rf dist.tar.gz
rm -rf dist

npm run build
echo "构建完成"
tar -zcf dist.tar.gz dist

echo "构建完成，生成的压缩包为 dist.tar.gz"