import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 假设您使用 react-router-dom

function CoverPage() {
    const navigate = useNavigate();
    const [hoveredButton, setHoveredButton] = useState(null);

    const handleNavigation = (path) => {
        navigate(path);
    };

    const handleMouseEnter = (buttonName) => {
        setHoveredButton(buttonName);
    };

    const handleMouseLeave = () => {
        setHoveredButton(null);
    };

    const getButtonStyle = (buttonName) => {
        const baseStyle = {
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '12px 36px',
            cursor: 'pointer',
            transition: 'all 0.4s ease-in-out', // Smooth transition for all properties
            outline: 'none',
            letterSpacing: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            height: '100px',
            minWidth: '200px',
        };

        let dynamicStyle = {};
        if (hoveredButton === buttonName) {
            dynamicStyle = {
                transform: 'scale(1.1)',
                filter: 'blur(0px)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)', // 更明显的阴影效果
            };
        } else if (hoveredButton !== null) {
            dynamicStyle = {
                transform: 'scale(0.9)',
                filter: 'blur(5px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', // 较弱的阴影效果
            };
        } else {
            dynamicStyle = {
                transform: 'scale(1)',
                filter: 'blur(0px)',
                boxShadow: '0 4px 12px #b3d1fa',
            };
        }

        return { ...baseStyle, ...dynamicStyle };
    };

    // 精简后的项目背景介绍
    const projectBackground = "自古以来，浩瀚的宇宙便以其无尽的神秘吸引着人类探索的目光。在过去25年间，全球航天事业取得了前所未有的发展，而中国航天的崛起尤为引人注目。本网页整合了2000年至2024年全球主要国家航天任务数据与经济指标，通过直观的可视化，帮助用户洞察各国航天事业的发展轨迹，并探索航天成就与国家经济实力之间的深层联系。";

    return (
        <div
            className="page"
            style={{
                minHeight: '100vh',
                width: '100vw',
                background: 'linear-gradient(135deg, #e0e7ef 0%, #f7f9fb 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 0',
            }}
        >
            {/* 卡片式磨砂玻璃容器 */}
            <div
                style={{
                    width: '90vw',
                    maxWidth: 1250,
                    minHeight: 450,
                    background: 'rgba(255,255,255,0.55)',
                    borderRadius: 48,
                    boxShadow: '0 16px 48px 0 rgba(31, 38, 135, 0.22)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px',
                    textAlign: 'center',
                    marginTop: '-100px',
                }}
            >
                <h1
                    style={{
                        fontSize: 48,
                        fontWeight: 900,
                        color: '#222',
                        letterSpacing: 2,
                        marginBottom: 30,
                        fontFamily: 'Source Sans Pro, Arial, sans-serif',
                        textShadow: `0 1px 0 hsl(174,5%,80%),
                                     0 2px 0 hsl(174,5%,75%),
                                     0 3px 0 hsl(174,5%,70%),
                                     0 4px 0 hsl(174,5%,66%),
                                     0 5px 0 hsl(174,5%,64%),
                                     0 6px 0 hsl(174,5%,62%),
                                     0 7px 0 hsl(174,5%,61%),
                                     0 8px 0 hsl(174,5%,60%),
                                     0 0 5px rgba(0,0,0,.05),
                                     0 1px 3px rgba(0,0,0,.2),
                                     0 3px 5px rgba(0,0,0,.2),
                                     0 5px 10px rgba(0,0,0,.2),
                                     0 10px 10px rgba(0,0,0,.2),
                                     0 20px 20px rgba(0,0,0,.3)`
                    }}
                >
                    全球航天发展与经济影响可视化
                </h1>
                <p
                    style={{
                        fontSize: 18,
                        color: '#333',
                        lineHeight: 1.6,
                        marginBottom: 40,
                        maxWidth: 800,
                    }}
                >
                    {projectBackground}
                </p>

                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'nowrap',
                        justifyContent: 'center',
                        gap: '30px',
                        // 添加对整个容器的过渡效果，以便在内部按钮状态变化时进行整体过滤和转换
                        transition: 'filter 0.4s ease-in-out, transform 0.4s ease-in-out',
                    }}
                >
                    <button
                        onClick={() => handleNavigation('/page1')}
                        onMouseEnter={() => handleMouseEnter('page1')}
                        onMouseLeave={handleMouseLeave}
                        style={{ ...getButtonStyle('page1'), background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' }}
                    >
                        <p className="tip">气泡图分析</p>
                        <p className="second-text">(Page 1)</p>
                    </button>
                    <button
                        onClick={() => handleNavigation('/page2')}
                        onMouseEnter={() => handleMouseEnter('page2')}
                        onMouseLeave={handleMouseLeave}
                        style={{ ...getButtonStyle('page2'), background: 'linear-gradient(90deg, #43e97b 0%, #3bbd80 100%)' }}
                    >
                        <p className="tip">饼图分析</p>
                        <p className="second-text">(Page 2)</p>
                    </button>
                    <button
                        onClick={() => handleNavigation('/page3')}
                        onMouseEnter={() => handleMouseEnter('page3')}
                        onMouseLeave={handleMouseLeave}
                        style={{ ...getButtonStyle('page3'), background: 'linear-gradient(90deg, #f7971e 0%, #ffd200 100%)' }}
                    >
                        <p className="tip">雷达图对比</p>
                        <p className="second-text">(Page 3)</p>
                    </button>
                    <button
                        onClick={() => handleNavigation('/page4')}
                        onMouseEnter={() => handleMouseEnter('page4')}
                        onMouseLeave={handleMouseLeave}
                        style={{ ...getButtonStyle('page4'), background: 'linear-gradient(90deg, #e57373 0%, #f06292 100%)' }}
                    >
                        <p className="tip">和弦图关系</p>
                        <p className="second-text">(Page 4)</p>
                    </button>
                     <button
                        onClick={() => handleNavigation('/page5')}
                        onMouseEnter={() => handleMouseEnter('page5')}
                        onMouseLeave={handleMouseLeave}
                        style={{ ...getButtonStyle('page5'), background: 'linear-gradient(90deg, #ba68c8 0%, #e57373 100%)' }}
                    >
                        <p className="tip">堆叠图趋势</p>
                        <p className="second-text">(Page 5)</p>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CoverPage; 