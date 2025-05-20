import React, { useEffect, useState } from 'react';
import * as echarts from 'echarts/core';
import { GraphChart } from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

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

    useEffect(() => {
        // 获取和弦图数据
        fetch('http://127.0.0.1:5000/api/v1/chord')
            .then(response => response.json())
            .then(data => {
                console.log('原始数据:', data);
                if (data.code === 200) {
                    processChordData(data.data);
                }
            })
            .catch(error => console.error('Error fetching chord data:', error));
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
            symbolSize: Math.pow(countryTotalTasks[country] - 400, 1.25) * 0.15,
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
            title: {
                text: '国家航天任务合作关系',
                subtext: '环形布局',
                top: 'bottom',
                left: 'right'
            },
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
                })
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
        <div className='page'>
            <div id="chordChart" style={{ width: '100%', height: '800px' }}></div>
        </div>
    );
}

export default Page4; 