import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

import { store } from '../store';

function Overview({ bubbleData, error, setSelectedBubbleData, year }) {
    const chartRef = useRef(null); // 用于引用图表容器的 div 元素
    const myChart = useRef(null); // 用于存储 ECharts 实例

    useEffect(() => {
        // 如果存在错误，显示错误信息
        if (error) {
            if (chartRef.current) {
                chartRef.current.innerHTML = `<p style="color: red;">Error: ${error}</p>`;
            }
            // 如果图表实例存在，销毁它
            if (myChart.current) {
                myChart.current.dispose();
                myChart.current = null;
            }
            return; // 停止后续的图表渲染
        }

        // 如果没有数据且没有错误，显示无数据信息
        if (!bubbleData || bubbleData.length === 0) {
             if (chartRef.current) {
                 chartRef.current.innerHTML = '<p>无数据可用。</p>';
             }
             // 如果图表实例存在，销毁它
             if (myChart.current) {
                 myChart.current.dispose();
                 myChart.current = null;
             }
             console.log("Overview received no data or empty data.", bubbleData); // 添加日志
             return; // 停止后续的图表渲染
         }

        // 数据可用，打印接收到的原始数据和转换后的数据
        console.log("Overview received bubbleData:", bubbleData); // 添加日志

        // 数据可用，初始化或获取图表实例
        if (!myChart.current) {
            myChart.current = echarts.init(chartRef.current);
        }

        // 适配数据格式：后端实际返回数据 ['Country', 'Budget', 'Duration']
        // ECharts 散点图数据 [Budget, Duration, BudgetForSize, Country]
        const formattedData = bubbleData.map(item => [
            item[1], // Budget (item[1] from backend data)
            item[2], // Duration (item[2] from backend data)
            item[1], // Budget for size (item[1] from backend data)
            item[0]  // Country (item[0] from backend data)
        ]);

        // 打印所有数据点的预算和持续时间，用于调试
        console.log("Checking data ranges:");
        formattedData.forEach(item => {
            console.log(`Budget: ${item[0]}, Duration: ${item[1]}, Country: ${item[3]}`);
        });

        const sizeFunction = function (x) { // x 是 Budget (Billion $)
            // 根据 Budget (x) 计算气泡大小，这里简单映射，可能需要根据实际数据范围调整比例
            // 防止除以零或负数，添加条件判断
            if (x == null || x <= 0) {
                 console.log(`Budget ${x} is invalid, returning default size 5`); // 添加日志
                 return 5; // 默认一个较小的大小
            }
            // 寻找一个合理的比例因子，可以根据数据中的最大最小值来动态计算
            // 暂时使用一个固定的比例，后续可以优化
            const scaleFactor = 0.5; // 示例比例因子，之前是 1e7，可能需要更小的因子
            const size = Math.sqrt(x / scaleFactor) + 5; // 确保最小大小，避免气泡过小不可见
            console.log(`Budget ${x}, calculated size: ${size}`); // 添加日志
            return size;
        };

        const option = {
             title: {
                 text: `气泡图数据 (${year}年)`, // 使用传递下来的 year prop 显示年份
                 left: 'center',
                 top: 10
             },
            tooltip: {
                padding: 5,
                borderWidth: 1,
                formatter: function (obj) {
                    var value = obj.value;
                     // obj.value 格式为 [Budget, Duration, BudgetForSize, Country]
                    return '国家：' + value[3] + '<br>'
                         + '年份：' + year + '<br>' // 使用传递下来的 year prop
                         + '预算：' + value[0] + ' Billion $' + '<br>'
                         + '持续时间：' + value[1] + ' 天';
                }
            },
            grid: {
                top: 80,
                containLabel: true,
                left: 30,
                right: 80
            },
            xAxis: {
                type: 'log', // 预算可能范围较大，使用对数轴
                name: '预算 (Billion $)',
                nameGap: 25,
                nameLocation: 'middle',
                nameTextStyle: {
                    fontSize: 14
                },
                splitLine: {
                    show: false
                },
                 axisLabel: {
                     // formatter: '{value} $'
                     formatter: function (value) {
                         // 将数值转换为 Billion $ 单位显示，并保留两位小数
                         return value.toFixed(2) + ' Billion $';
                     } 
                 },
                 // 显式设置日志轴范围，根据您的数据范围调整
                 min: 1, // 最小预算，确保大于 0
                 max: 1000, // 最大预算，根据您的数据调整
            },
            yAxis: {
                type: 'value',
                name: '持续时间 (天)',
                 nameTextStyle: {
                     fontSize: 14
                 },
                splitLine: {
                    show: false
                },
                 axisLabel: {
                     formatter: '{value} 天'
                 },
                 // 显式设置 Y 轴范围，根据您的数据范围调整
                 min: 0,
                 max: 400, // 根据您的持续时间数据最大值调整
            },
            visualMap: [
                {
                    // 可以根据国家进行颜色映射
                    show: true, // 显示 visualMap
                    dimension: 3, // 对应 formattedData 中的 Country 索引
                    categories: Array.from(new Set(bubbleData.map(item => item[1]))), // 从数据中提取所有国家作为类别
                    inRange: {
                        color: (
                            // 可以自定义颜色列表
                             ['#51689b', '#ce5c5c', '#fbc357', '#8fbf8f', '#659d84', '#fb8e6a', '#c77288', '#786090', '#91c4c5', '#6890ba']
                        )
                    },
                    right: 10,
                    top: 'center',
                    text: ['', '国家'], // 文本，如['Low', 'High']
                    calculable: true
                }
            ],
            series: [
                {
                    name: `${year}年`, // 系列名称也使用 year prop
                    type: 'scatter',
                    data: formattedData,
                    itemStyle: {
                        opacity: 0.8
                    },
                    symbolSize: function (val) {
                        return sizeFunction(val[2]); // 使用 formattedData 中的 BudgetForSize
                    },
                     label: { // 添加标签显示国家名称
                         show: true,
                         formatter: function (param) {
                             return param.value[3]; // 显示国家名称
                         },
                         position: 'top' // 标签位置
                     },
                     emphasis: { // 高亮样式
                         focus: 'series'
                     }
                }
            ],
             animationDurationUpdate: 1000,
             animationEasingUpdate: 'quinticInOut'
        };

        myChart.current.setOption(option);

        // 添加点击事件监听器
        const handleChartClick = (params) => {
            // 检查是否点击了散点图系列（气泡）
            if (params.componentType === 'series' && params.seriesType === 'scatter') {
                // params.dataIndex 是被点击数据点在 series data 数组中的索引
                // bubbleData 是原始数据数组，其索引与 series data 对应
                const clickedData = bubbleData[params.dataIndex];
                console.log('Clicked bubble data:', clickedData);
                // 调用传递下来的函数，更新 Page1 中的选中数据状态
                setSelectedBubbleData(clickedData);
            }
        };
        myChart.current.on('click', handleChartClick);

        // 响应窗口大小变化，调整图表大小
        const handleResize = () => {
            myChart.current.resize();
        };
        window.addEventListener('resize', handleResize);

        // 清理函数：组件卸载时销毁图表实例并移除事件监听器
        return () => {
            if (myChart.current) {
                myChart.current.dispose();
                myChart.current = null;
            }
            window.removeEventListener('resize', handleResize);
            // 移除点击事件监听器
            if (myChart.current) { // 再次检查实例是否存在，以防清理函数重复执行
                 myChart.current.off('click', handleChartClick);
             }
        };

    }, [bubbleData, error, setSelectedBubbleData, year]); // 添加 year 到依赖项数组

    return (
        // 设置 ref 到 div 元素
        <div ref={chartRef} style={{ width: '100%', height: '400px' }}>
            {/* ECharts 图表将在这个 div 中渲染 */}
            {/* error 和 无数据信息已在 useEffect 中处理 */}
        </div>
    );
}

export default Overview;
