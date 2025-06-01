/*
 * @Author: userName userEmail
 * @Date: 2025-06-01 22:33:44
 * @LastEditors: userName userEmail
 * @LastEditTime: 2025-06-01 22:34:00
 * @FilePath: \visualization\visualization\src\components\NavBar.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../css/NavBar.css';

function NavBar() {
    const location = useLocation();

    return (
        <header className="navbar-header">
            <nav className="navbar-nav">
                <ul>
                    <li>
                        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                            封面页
                        </Link>
                    </li>
                    <li>
                        <Link to="/page1" className={location.pathname === '/page1' ? 'active' : ''}>
                            气泡图分析
                        </Link>
                    </li>
                    <li>
                        <Link to="/page2" className={location.pathname === '/page2' ? 'active' : ''}>
                            饼图分析
                        </Link>
                    </li>
                    <li>
                        <Link to="/page3" className={location.pathname === '/page3' ? 'active' : ''}>
                            雷达图对比
                        </Link>
                    </li>
                     <li>
                        <Link to="/page4" className={location.pathname === '/page4' ? 'active' : ''}>
                            和弦图关系
                        </Link>
                    </li>
                     <li>
                        <Link to="/page5" className={location.pathname === '/page5' ? 'active' : ''}>
                            堆叠图趋势
                        </Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
}

export default NavBar; 