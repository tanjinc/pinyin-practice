# Stage 1: 编译
FROM node:18-alpine AS build-stage

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json (如果有)
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 复制项目文件
COPY . .

# 构建项目
RUN npm run build:prod

# Stage 2: 部署 Nginx
FROM nginx:1.25.5-alpine

# 复制自定义的 Nginx 配置文件
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物到 Nginx 服务器的 HTML 目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
