/*
 * @Author: userName userEmail
 * @Date: 2025-05-20 19:37:27
 * @LastEditors: userName userEmail
 * @LastEditTime: 2025-06-01 22:03:05
 * @FilePath: \visualization\visualization\src\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 这是React的入口

import React from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
// import App from './components/App'; // App component will be handled by routes if needed
import {StateProvider} from "./store";

import CoverPage from './components/pages/CoverPage';
import Page1 from './components/pages/Page1';
import Page2 from './components/pages/Page2';
import Page3 from './components/pages/Page3';
import Page4 from './components/pages/Page4';
import Page5 from './components/pages/Page5';

/*
root.render(element), 这个函数是在container里渲染element。
大家可以看到，public/index.html文件中，body标签里只有一个id为root的div标签。这里选取它作为container。
然后在这个标签里，我们渲染element，即StateProvider和其子内容App。
StateProvider提供了全局的数据，维护数据处理的逻辑；而App是界面UI内容，使用数据绘制内容。
 */
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <StateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CoverPage />} />
          <Route path="/page1" element={<Page1 />} />
          <Route path="/page2" element={<Page2 />} />
          <Route path="/page3" element={<Page3 />} />
          <Route path="/page4" element={<Page4 />} />
          <Route path="/page5" element={<Page5 />} />
        </Routes>
      </BrowserRouter>
    </StateProvider>
  </React.StrictMode>
);
