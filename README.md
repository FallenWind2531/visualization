# 航天数据可视化项目

## 环境要求

- **Node.js**: v20.15.0 或更高版本
- **npm**: 10.8.2 或更高版本

## 如何启动本项目
   
1. 在项目文件夹内，安装依赖并运行项目：

   ```bash
   # 安装所有依赖库
   npm install
   
   # 启动前端
   npm start
   
   # 启动后端服务 (在另一个终端窗口中)
   cd python
   python main.py
   ```
   
   正常运行后，前端将在 http://localhost:3000 启动，后端API服务将在 http://127.0.0.1:5000 运行。
   
## 本项目已安装的库

   - **react-router-dom** - React路由管理
   - **antd** - 基于React的UI组件库，提供丰富的界面元素
   - **echarts-for-react** - 基于Apache ECharts的React封装，用于数据可视化
   - **papaparse** - 高性能CSV解析库，用于处理CSV文件数据

## 常见问题

- 如果后端服务启动失败，确保已安装必要的Python包：
  ```bash
  pip install flask flask-cors pandas numpy
  ```

