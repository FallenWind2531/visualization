
// 本文件是界面UI的根目录

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import ControlPanel from './ControlPanel';
import Page1 from './pages/Page1';
import Page2 from './pages/Page2';
import Page3 from './pages/Page3';
import Page4 from './pages/Page4';
import Page5 from './pages/Page5';
import '../css/App.css'

// App组件
function App() {
    return (
        <Router>
            <div className='root'>
                <div className='controlPanel'>
                    <ControlPanel/>
                </div>
                <div className='mainPanel'>
                    <div className='navigation'>
                        <Link to="/page1">气泡图</Link>
                        <Link to="/page2">数据可视化</Link>
                        <Link to="/page3">分析报告</Link>
                        <Link to="/page4">和弦图</Link>
                        <Link to="/page5">时间序列堆叠面积图</Link>
                    </div>
                    <div className='content'>
                        <Routes>
                            <Route path="/page1" element={<Page1 />} />
                            <Route path="/page2" element={<Page2 />} />
                            <Route path="/page3" element={<Page3 />} />
                            <Route path="/page4" element={<Page4 />} />
                            <Route path="/page5" element={<Page5 />} />
                            <Route path="/" element={<Page1 />} />
                        </Routes>
                    </div>
                </div>
            </div>
        </Router>
    );
}

export default App;
