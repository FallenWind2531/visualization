// 本文件是界面UI的根目录

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import AssistView from './AssistView';
import ControlPanel from './ControlPanel';
import Overview from './Overview';
import DetailView from './DetailView';
import '../css/App.css'

// 页面组件
const Page1 = () => <div className='page'><h1>页面 1</h1></div>;
const Page2 = () => <div className='page'><h1>页面 2</h1></div>;
const Page3 = () => <div className='page'><h1>页面 3</h1></div>;
const Page4 = () => <div className='page'><h1>页面 4</h1></div>;
const Page5 = () => <div className='page'><h1>页面 5</h1></div>;

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
                        <Link to="/page1">页面 1</Link>
                        <Link to="/page2">页面 2</Link>
                        <Link to="/page3">页面 3</Link>
                        <Link to="/page4">页面 4</Link>
                        <Link to="/page5">页面 5</Link>
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
