import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import NavBar from '../NavBar';

// 注册必需的组件
echarts.use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    LineChart,
    CanvasRenderer
]);

function Page5() {
    const [satelliteData, setSatelliteData] = useState(null);
    const [technologyData, setTechnologyData] = useState(null);
    const [loadingSatellite, setLoadingSatellite] = useState(true);
    const [loadingTechnology, setLoadingTechnology] = useState(true);

    useEffect(() => {
        setLoadingSatellite(true);
        // 获取卫星类型数据
        fetch('http://127.0.0.1:5000/api/v1/stacked_area?type=Satellite Type')
            .then(response => response.json())
            .then(data => {
                if (data.code === 200) {
                    processSatelliteData(data.data);
                } else {
                    console.error('Error fetching satellite data:', data.message);
                }
            })
            .catch(error => console.error('Error fetching satellite data:', error))
            .finally(() => setLoadingSatellite(false));

        setLoadingTechnology(true);
        // 获取技术使用数据
        fetch('http://127.0.0.1:5000/api/v1/stacked_area?type=Technology Used')
            .then(response => response.json())
            .then(data => {
                if (data.code === 200) {
                    processTechnologyData(data.data);
                } else {
                    console.error('Error fetching technology data:', data.message);
                }
            })
            .catch(error => console.error('Error fetching technology data:', error))
            .finally(() => setLoadingTechnology(false));
    }, []);

    const processSatelliteData = (rawData) => {
        // 获取所有年份
        const years = [...new Set(rawData.map(item => item[1]))].sort();
        
        // 获取所有卫星类型
        const types = [...new Set(rawData.map(item => item[0]))];
        
        // 为每种类型创建系列数据
        const series = types.map(type => {
            const data = years.map(year => {
                const item = rawData.find(d => d[0] === type && d[1] === year);
                return item ? item[2] : 0;
            });
            return {
                name: type,
                type: 'line',
                stack: 'Total',
                areaStyle: {},
                emphasis: {
                    focus: 'series'
                },
                data: data
            };
        });

        setSatelliteData({
            years: years,
            series: series
        });
    };

    const processTechnologyData = (rawData) => {
        // 获取所有年份
        const years = [...new Set(rawData.map(item => item[1]))].sort();
        
        // 获取所有技术类型
        const types = [...new Set(rawData.map(item => item[0]))];
        
        // 调整types的顺序，确保Traditional Rocket在第一位，Reusable Rocket在第二位
        const traditionalIndex = types.findIndex(type => type === 'Traditional Rocket');
        const reusableIndex = types.findIndex(type => type === 'Reusable Rocket');
        
        if (traditionalIndex !== -1 && reusableIndex !== -1) {
            // 从数组中移除这两项
            const traditional = types.splice(traditionalIndex, 1)[0];
            // 重新计算reusable的索引，因为如果traditional在reusable之前被移除，索引会变化
            const newReusableIndex = types.findIndex(type => type === 'Reusable Rocket');
            const reusable = types.splice(newReusableIndex, 1)[0];
            
            // 将traditional放在第一位，reusable放在第二位
            types.unshift(reusable);
            types.unshift(traditional);
        }
        
        // 为每种类型创建系列数据
        const series = types.map(type => {
            const data = years.map(year => {
                const item = rawData.find(d => d[0] === type && d[1] === year);
                return item ? item[2] : 0;
            });
            return {
                name: type,
                type: 'line',
                stack: 'Total',
                areaStyle: {},
                emphasis: {
                    focus: 'series'
                },
                data: data
            };
        });

        setTechnologyData({
            years: years,
            series: series
        });
    };

    useEffect(() => {
        if (!satelliteData) return;

        const chartDom = document.getElementById('satelliteChart');
        if (!chartDom) return;

        const myChart = echarts.init(chartDom);
        const option = {
            title: {
                text: '卫星类型年度分布',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    label: {
                        backgroundColor: '#6a7985'
                    }
                }
            },
            legend: {
                data: satelliteData.series.map(s => s.name),
                top: 30
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: satelliteData.years
            },
            yAxis: {
                type: 'value',
                name: '任务数量'
            },
            series: satelliteData.series
        };

        myChart.setOption(option);

        window.addEventListener('resize', () => {
            myChart.resize();
        });

        return () => {
            window.removeEventListener('resize', () => {
                myChart.resize();
            });
            myChart.dispose();
        };
    }, [satelliteData]);

    useEffect(() => {
        if (!technologyData) return;

        const chartDom = document.getElementById('technologyChart');
        if (!chartDom) return;

        const myChart = echarts.init(chartDom);
        
        // 定义颜色映射，使用更浅的颜色
        const colorMap = {
            'Traditional Rocket': '#e06666',  // 更亮的红色系
            'Solar Propulsion': '#fbc357',    // 黄色系
            'AI Navigation': '#51689b',       // 蓝色系
            'Reusable Rocket': ' #93c47d'      // 适中亮度的绿色
        };
        
        // 为每个系列设置颜色
        const seriesWithColors = technologyData.series.map(series => {
            return {
                ...series,
                itemStyle: {
                    color: colorMap[series.name] || undefined  // 如果没有定义颜色，则使用默认颜色
                }
            };
        });
        
        const option = {
            title: {
                text: '技术使用年度分布',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    label: {
                        backgroundColor: '#6a7985'
                    }
                }
            },
            legend: {
                data: technologyData.series.map(s => s.name),
                top: 30
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: technologyData.years
            },
            yAxis: {
                type: 'value',
                name: '任务数量'
            },
            series: seriesWithColors
        };

        myChart.setOption(option);

        window.addEventListener('resize', () => {
            myChart.resize();
        });

        return () => {
            window.removeEventListener('resize', () => {
                myChart.resize();
            });
            myChart.dispose();
        };
    }, [technologyData]);

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
            <NavBar />
            {loadingSatellite ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', marginBottom: '20px', marginTop: 80 }}>
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
            ) : (
                <div id="satelliteChart" style={{ width: '100%', height: '400px', marginBottom: '20px', marginTop: 80 }}></div>
            )}

            {loadingTechnology ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', marginTop: 80 }}>
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
            ) : (
                <div id="technologyChart" style={{ width: '100%', height: '400px', marginTop: 80 }}></div>
            )}
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

export default Page5; 