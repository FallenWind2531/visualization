import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Select, Card, Button, Space } from 'antd';
import NavBar from '../NavBar'; // 导入 NavBar 组件

function Page3() {
    const [countries, setCountries] = useState([]);
    const [selectedCountries, setSelectedCountries] = useState([]);
    const [radarData, setRadarData] = useState([]);
    const [loading, setLoading] = useState(false);
    // 为每个国家分配固定的颜色
    const [countryColors, setCountryColors] = useState({});
    // 预定义的颜色列表
    const colorPalette = [
        '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
        '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#7D3C98',
        '#2471A3', '#138D75', '#D4AC0D', '#BA4A00', '#566573'
    ];

    // 获取所有国家列表
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                // 从全局数据集中提取唯一的国家列表
                const response = await fetch('http://127.0.0.1:5000/api/v1/chord');
                const result = await response.json();
                
                if (result.code === 200) {
                    // 提取所有国家并去重
                    const allCountries = new Set();
                    result.data.forEach(item => {
                        allCountries.add(item[0]); // 添加源国家
                        if (item[1]) allCountries.add(item[1]); // 添加合作国家
                    });
                    
                    // 转换为数组并排序
                    const countryList = Array.from(allCountries).sort();
                    setCountries(countryList);
                    
                    // 为每个国家分配固定的颜色
                    const colors = {};
                    countryList.forEach((country, index) => {
                        colors[country] = colorPalette[index % colorPalette.length];
                    });
                    setCountryColors(colors);
                }
            } catch (error) {
                console.error('获取国家列表失败:', error);
            }
        };
        
        fetchCountries();
    }, []);

    // 获取雷达图数据
    const fetchRadarData = async () => {
        if (selectedCountries.length === 0) return;
        
        setLoading(true);
        try {
            const data = await Promise.all(
                selectedCountries.map(async (country) => {
                    const response = await fetch(`http://127.0.0.1:5000/api/v1/radar?country=${country}`);
                    const result = await response.json();
                    return result.data[0];
                })
            );
            setRadarData(data);
        } catch (error) {
            console.error('获取雷达图数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 当选择的国家变化时获取数据
    useEffect(() => {
        if (selectedCountries.length > 0) {
            fetchRadarData();
        } else {
            setRadarData([]);
        }
    }, [selectedCountries]);

    // 定义固定的数据转换范围
    const fixedRanges = {
        count: { min: 0, max: 500 },       // 航天任务数量
        budget: { min: 0, max: 50 },       // 平均投入(十亿$)
        successRate: { min: 50, max: 100 }, // 成功率
        envImpact: { min: 1, max: 10 },     // 环境影响
        duration: { min: 0, max: 365 }     // 持续时间(天)
    };

    // 生成雷达图配置
    const getOption = () => {
        // 如果没有数据，返回空配置
        if (radarData.length === 0) return {};

        // 使用固定范围处理雷达图数据，应用非线性变换增强差异
        const seriesData = radarData.map((item) => {
            // 对数变换函数，增强小数值的差异
            const logTransform = (value, min, max, baseMin, baseMax) => {
                // 标准化到0-1
                const normalized = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
                // 应用对数变换增强差异
                const logValue = normalized === 0 ? 0 : Math.log10(1 + 9 * normalized) / Math.log10(10);
                // 映射回目标范围
                return baseMin + (baseMax - baseMin) * logValue;
            };
            
            // 幂函数变换，增强大数值的差异
            const powerTransform = (value, min, max, baseMin, baseMax, power = 2) => {
                // 标准化到0-1
                const normalized = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
                // 应用幂变换增强差异
                const powerValue = Math.pow(normalized, 1/power);
                // 映射回目标范围
                return baseMin + (baseMax - baseMin) * powerValue;
            };
            
            return {
                name: item[0], // 国家名称
                value: [                // 此处需要根据数据范围进行调整变换函数
                    // 任务数量
                    (item[1] - 200) / 25,
                    
                    // 预算 
                    Math.pow(item[2], 0.5),
                    
                    // 成功率
                    (item[3] * 10 - 920) / 8.5,
                    
                    // 环境影响
                    Math.pow(item[4] - 1.2, 1.5),
                    
                    // 持续时间
                    (item[5] - 173) / 3,
                ],
                areaStyle: {
                    opacity: 0.3
                },
                // 为每个国家使用固定的颜色
                itemStyle: {
                    color: countryColors[item[0]] || '#5470c6'
                },
                lineStyle: {
                    color: countryColors[item[0]] || '#5470c6'
                }
            };
        });

        return {
            title: {
                text: '国家航天能力雷达图对比',
                left: 'center'
            },
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    // 获取原始数据以在提示框中显示
                    const countryName = params.name;
                    const originalData = radarData.find(item => item[0] === countryName);
                    if (!originalData) return '';
                    
                    return `<strong>${countryName}</strong><br/>
                        航天任务数量: ${originalData[1]}<br/>
                        平均投入(十亿$): ${originalData[2].toFixed(2)}<br/>
                        平均成功率(%): ${originalData[3].toFixed(2)}<br/>
                        环境影响: ${originalData[4].toFixed(2)}<br/>
                        平均持续时间(天): ${originalData[5].toFixed(2)}`;
                }
            },
            legend: {
                data: selectedCountries,
                orient: 'vertical',
                right: '10',
                top: '30%'
            },
            radar: {
                indicator: [
                    { name: '航天任务数量', max: 5 },
                    { name: '平均投入(十亿$)', max: 5 },
                    { name: '平均成功率(%)', max: 5 },
                    { name: '环境影响', max: 5 },
                    { name: '平均持续时间(天)', max: 5 }
                ],
                radius: '65%',
                splitArea: {
                    areaStyle: {
                        color: ['rgba(114, 172, 209, 0.1)', 'rgba(114, 172, 209, 0.2)',
                            'rgba(114, 172, 209, 0.3)', 'rgba(114, 172, 209, 0.4)', 'rgba(114, 172, 209, 0.5)']
                    }
                }
            },
            color: colorPalette,
            series: [
                {
                    type: 'radar',
                    data: seriesData,
                    lineStyle: {
                        width: 2
                    },
                    emphasis: {
                        lineStyle: {
                            width: 4
                        }
                    }
                }
            ]
        };
    };

    // 处理国家选择变化
    const handleCountryChange = (values) => {
        setSelectedCountries(values);
    };

    // 清除所选国家
    const handleClear = () => {
        setSelectedCountries([]);
    };

    return (
        <div
            className="page"
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #e0e7ef 0%, #f7f9fb 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '40px 0',
            }}
        >
            <NavBar /> {/* 添加导航栏组件 */}
            {/* 卡片式磨砂玻璃容器 */}
            <div
              style={{
                width: '95vw',
                maxWidth: 1200,
                minHeight: 500,
                maxHeight:650,
                background: 'rgba(255,255,255,0.55)',
                borderRadius: 48,
                boxShadow: '0 16px 48px 0 rgba(31, 38, 135, 0.22)', // 阴影更强
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px 32px',
                marginTop: 80,
              }}
            >
                <Card 
                    title="国家航天能力雷达图分析" 
                    style={{
                        marginBottom: 20,
                        width: '100%', // Make card fill the container
                        background: 'transparent', // Transparent background to show glass effect
                        boxShadow: 'none', // Remove card's default shadow
                        border: 'none', // Remove card's default border
                    }}>
                    <p>
                        通过雷达图展示各国在航天领域的五个关键维度：航天任务数量、平均投入、平均成功率、环境影响和持续时间。
                        您可以选择多个国家进行对比，根据雷达图面积大小可粗略评估国家航天技术水平。
                    </p>
                    
                    <Space style={{ marginBottom: 20 }}>
                        <Select
                            mode="multiple"
                            style={{ width: '400px' }}
                            placeholder="请选择要对比的国家"
                            value={selectedCountries}
                            onChange={handleCountryChange}
                            options={countries.map(country => ({ label: country, value: country }))}
                        />
                        <Button onClick={handleClear}>清除选择</Button>
                    </Space>
                    
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
                            <div id="wifi-loader">
                                <svg class="circle-outer" viewBox="0 0 86 86">
                                    <circle class="back" cx="43" cy="43" r="40"></circle>
                                    <circle class="front" cx="43" cy="43" r="40"></circle>
                                    <circle class="new" cx="43" cy="43" r="40"></circle>
                                </svg>
                                <svg class="circle-middle" viewBox="0 0 60 60">
                                    <circle class="back" cx="30" cy="30" r="27"></circle>
                                    <circle class="front" cx="30" cy="30" r="27"></circle>
                                </svg>
                                <svg class="circle-inner" viewBox="0 0 34 34">
                                    <circle class="back" cx="17" cy="17" r="14"></circle>
                                    <circle class="front" cx="17" cy="17" r="14"></circle>
                                </svg>
                                <div class="text" data-text="Loading..."></div>
                            </div>
                        </div>
                    ) : radarData.length > 0 ? (
                        <ReactECharts 
                            option={getOption()} 
                            style={{ height: '500px' }}
                        />
                    ) : (
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            请选择至少一个国家进行分析
                        </div>
                    )}
                </Card>
            </div>
            <style>{`
            /* New Wifi Loader CSS */
            #wifi-loader {
                --background: #62abff;
                --front-color: #4f29f0;
                --back-color: #c3c8de;
                --text-color: #414856;
                width: 64px;
                height: 64px;
                border-radius: 50px;
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            #wifi-loader svg {
                position: absolute;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            #wifi-loader svg circle {
                position: absolute;
                fill: none;
                stroke-width: 6px;
                stroke-linecap: round;
                stroke-linejoin: round;
                transform: rotate(-100deg);
                transform-origin: center;
            }

            #wifi-loader svg circle.back {
                stroke: var(--back-color);
            }

            #wifi-loader svg circle.front {
                stroke: var(--front-color);
            }

            #wifi-loader svg.circle-outer {
                height: 86px;
                width: 86px;
            }

            #wifi-loader svg.circle-outer circle {
                stroke-dasharray: 62.75 188.25;
            }

            #wifi-loader svg.circle-outer circle.back {
                animation: circle-outer135 1.8s ease infinite 0.3s;
            }

            #wifi-loader svg.circle-outer circle.front {
                animation: circle-outer135 1.8s ease infinite 0.15s;
            }

            #wifi-loader svg.circle-middle {
                height: 60px;
                width: 60px;
            }

            #wifi-loader svg.circle-middle circle {
                stroke-dasharray: 42.5 127.5;
            }

            #wifi-loader svg.circle-middle circle.back {
                animation: circle-middle6123 1.8s ease infinite 0.25s;
            }

            #wifi-loader svg.circle-middle circle.front {
                animation: circle-middle6123 1.8s ease infinite 0.1s;
            }

            #wifi-loader svg.circle-inner {
                height: 34px;
                width: 34px;
            }

            #wifi-loader svg.circle-inner circle {
                stroke-dasharray: 22 66;
            }

            #wifi-loader svg.circle-inner circle.back {
                animation: circle-inner162 1.8s ease infinite 0.2s;
            }

            #wifi-loader svg.circle-inner circle.front {
                animation: circle-inner162 1.8s ease infinite 0.05s;
            }

            #wifi-loader .text {
                position: absolute;
                bottom: -40px;
                display: flex;
                justify-content: center;
                align-items: center;
                text-transform: lowercase;
                font-weight: 500;
                font-size: 14px;
                letter-spacing: 0.2px;
            }

            #wifi-loader .text::before, #wifi-loader .text::after {
                content: attr(data-text);
            }

            #wifi-loader .text::before {
                color: var(--text-color);
            }

            #wifi-loader .text::after {
                color: var(--front-color);
                animation: text-animation76 3.6s ease infinite;
                position: absolute;
                left: 0;
            }

            @keyframes circle-outer135 {
                0% {
                    stroke-dashoffset: 25;
                }

                25% {
                    stroke-dashoffset: 0;
                }

                65% {
                    stroke-dashoffset: 301;
                }

                80% {
                    stroke-dashoffset: 276;
                }

                100% {
                    stroke-dashoffset: 276;
                }
            }

            @keyframes circle-middle6123 {
                0% {
                    stroke-dashoffset: 17;
                }

                25% {
                    stroke-dashoffset: 0;
                }

                65% {
                    stroke-dashoffset: 204;
                }

                80% {
                    stroke-dashoffset: 187;
                }

                100% {
                    stroke-dashoffset: 187;
                }
            }

            @keyframes circle-inner162 {
                0% {
                    stroke-dashoffset: 9;
                }

                25% {
                    stroke-dashoffset: 0;
                }

                65% {
                    stroke-dashoffset: 106;
                }

                80% {
                    stroke-dashoffset: 97;
                }

                100% {
                    stroke-dashoffset: 97;
                }
            }

            @keyframes text-animation76 {
                0% {
                    clip-path: inset(0 100% 0 0);
                }

                50% {
                    clip-path: inset(0);
                }

                100% {
                    clip-path: inset(0 0 0 100%);
                }
            }
          `}</style>
        </div>
    );
}

export default Page3;