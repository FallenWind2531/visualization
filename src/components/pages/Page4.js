import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { GraphChart } from 'echarts/charts';
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
    GraphChart,
    CanvasRenderer
]);

// 定义颜色列表
const colorList = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#48b3bd',
    '#b6a2de', '#2ec7c9', '#d87a80', '#8d98b3', '#e5cf0d',
    '#97b552', '#95706d', '#dc69aa', '#07a2a4', '#9a7fd1'
];

function Page4() {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        // 获取和弦图数据
        fetch('http://127.0.0.1:5000/api/v1/chord')
            .then(response => response.json())
            .then(data => {
                console.log('原始数据:', data);
                if (data.code === 200) {
                    processChordData(data.data);
                } else {
                    console.error('Error fetching chord data:', data.message);
                }
            })
            .catch(error => console.error('Error fetching chord data:', error))
            .finally(() => setLoading(false));
    }, []);

    const processChordData = (rawData) => {
        console.log('处理前的数据:', rawData);
        
        // 获取所有唯一的国家
        const countries = new Set();
        rawData.forEach(item => {
            countries.add(item[0]);
            countries.add(item[1]);
        });
        const countryList = Array.from(countries);
        console.log('国家列表:', countryList);

        // 计算每个国家的总任务数
        const countryTotalTasks = {};
        rawData.forEach(item => {
            const country = item[0];
            countryTotalTasks[country] = (countryTotalTasks[country] || 0) + 1;
        });
        console.log('国家任务数:', countryTotalTasks);

        // 创建国家到颜色的映射
        const countryColors = {};
        countryList.forEach((country, index) => {
            countryColors[country] = colorList[index % colorList.length];
        });

        // 准备节点数据
        const nodes = countryList.map(country => ({
            name: country,
            symbolSize: Math.pow(countryTotalTasks[country] - 200, 1.25) * 0.1,
            value: countryTotalTasks[country],
            category: country,
            itemStyle: {
                color: countryColors[country]
            },
            label: {
                show: true
            }
        }));

        // 准备边数据
        const edges = [];
        const edgeMap = new Map();

        rawData.forEach(item => {
            const key = `${item[0]}-${item[1]}`;
            if (!edgeMap.has(key)) {
                edgeMap.set(key, 1);
            } else {
                edgeMap.set(key, edgeMap.get(key) + 1);
            }
        });

        edgeMap.forEach((value, key) => {
            const [source, target] = key.split('-');
            // 根据任务数决定边的颜色
            const sourceTasks = countryTotalTasks[source] || 0;
            const targetTasks = countryTotalTasks[target] || 0;
            const dominantCountry = sourceTasks >= targetTasks ? source : target;
            
            edges.push({
                source: source,
                target: target,
                value: value,
                lineStyle: {
                    width: Math.pow(value - 50, 2) * 0.03,
                    color: countryColors[dominantCountry],
                    curveness: 0.2
                }
            });
        });

        // 创建categories数据
        const categories = countryList.map(country => ({
            name: country,
            itemStyle: {
                color: countryColors[country]
            }
        }));

        const graphData = {
            nodes: nodes,
            edges: edges,
            categories: categories
        };

        console.log('最终处理的数据:', graphData);
        setChartData(graphData);
    };

    useEffect(() => {
        if (!chartData) return;

        const chartDom = document.getElementById('chordChart');
        if (!chartDom) {
            console.error('找不到图表容器元素');
            return;
        }

        console.log('开始初始化图表');
        const myChart = echarts.init(chartDom);

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    if (params.dataType === 'edge') {
                        return `${params.data.source} → ${params.data.target}<br/>合作次数: ${params.data.value}`;
                    }
                    return `${params.data.name}<br/>总任务数: ${params.data.value}`;
                }
            },
            legend: [{
                data: chartData.categories.map(function(a) {
                    return a.name;
                }),
                top: 10,
            }],
            animationDurationUpdate: 1500,
            animationEasingUpdate: 'quinticInOut',
            series: [{
                name: '国家合作关系',
                type: 'graph',
                layout: 'circular',
                circular: {
                    rotateLabel: true
                },
                data: chartData.nodes,
                links: chartData.edges,
                categories: chartData.categories,
                roam: true,
                label: {
                    show: true,
                    position: 'right',
                    formatter: '{b}'
                },
                lineStyle: {
                    color: 'source',
                    curveness: 0.2
                },
                emphasis: {
                    focus: 'adjacency',
                    lineStyle: {
                        width: 10
                    }
                }
            }]
        };

        console.log('设置图表配置:', option);
        myChart.setOption(option);

        // 响应式调整
        window.addEventListener('resize', () => {
            myChart.resize();
        });

        return () => {
            window.removeEventListener('resize', () => {
                myChart.resize();
            });
            myChart.dispose();
        };
    }, [chartData]);

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
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '800px', marginTop: 80 }}>
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
                <>
                    <h2 style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold', 
                        marginBottom: '20px', 
                        textAlign: 'center',
                        marginTop: '60px'
                    }}>
                        国家航天任务合作关系
                    </h2>
                    <div id="chordChart" style={{ width: '100%', height: '800px' }}></div>
                </>
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

export default Page4; 