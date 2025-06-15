# 使用官方长期支持版本
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY . .

# 为默认页面创建符号链接
RUN ln -s main.html index.html

# 暴露端口
EXPOSE 3030

# 启动 Python HTTP 服务器，以 main.html 作为默认页面
CMD ["python", "-m", "http.server", "3030", "--bind", "0.0.0.0"]
