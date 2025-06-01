import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import NavBar from '../NavBar'; // 导入 NavBar 组件

function Page1() {
    const [year, setYear] = useState(2000); // 状态变量：当前选中的年份，默认 2000 (改为起始年份)
    const [country, setCountry] = useState(null); // 状态变量：国家，默认 null (暂时不用，保留备用)
    const [bubbleData, setBubbleData] = useState([]); // 状态变量：当前年份的气泡图数据
    const [allYearBubbleData, setAllYearBubbleData] = useState({}); // 新状态变量：存储所有年份的气泡图数据
    const [error, setError] = useState(null); // 状态变量：错误信息，默认为 null
    const [loading, setLoading] = useState(true); // 状态变量：加载状态 (默认 true，开始加载所有数据)
    const [isPlaying, setIsPlaying] = useState(false); // 状态变量：是否正在播放动画
    const [hiddenCountries, setHiddenCountries] = useState(new Set()); // 新增：记录被隐藏的国家

    const chartRef = useRef(null); // 用于引用图表容器的 div 元素
    const myChart = useRef(null); // 用于存储 ECharts 实例

    // 辅助函数：生成 visualMap 的 selected 对象
    const generateSelectedObjectFromHiddenCountries = (allCountries, hiddenCountries) => {
        const selected = {};
        allCountries.forEach(country => {
            selected[country] = !hiddenCountries.has(country);
        });
        return selected;
    };

    // 首次加载时，获取所有年份的数据
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true); // 开始加载
            setError(null); // 清空错误信息
            const dataByYear = {};
            const startYear = 2000;
            const endYear = 2024; // 更新到2024年

            try {
                for (let y = startYear; y <= endYear; y++) {
                    let url = `http://127.0.0.1:5000/api/v1/bubble?year=${y}`;
                    const response = await fetch(url);
                    const result = await response.json();

                    if (result.code === 200) {
                        dataByYear[y] = result.data;
                    } else {
                        // 如果某个年份获取失败，记录错误但不中断其他年份的获取
                        console.error(`获取 ${y} 年数据失败:`, result.message);
                        // 可以选择记录每个年份的错误，这里简化只记录最后一个错误或合并错误信息
                        setError(`部分年份数据获取失败: ${result.message}`);
                    }
                }
                setAllYearBubbleData(dataByYear); // 存储所有年份的数据
            } catch (err) {
                console.error("获取所有年份气泡图数据失败:", err);
                setError("获取所有年份数据失败，请检查网络或服务器。");
            } finally {
                setLoading(false); // 结束加载
            }
        };

        fetchAllData(); // 调用数据获取函数
    }, []); // 依赖项数组为空，只在组件挂载时执行一次

    // 当年份或所有数据变化时，更新当前年份的气泡数据
    useEffect(() => {
        if (allYearBubbleData && allYearBubbleData[year]) {
            // 适配数据格式：后端实际返回数据 ['Country', 'GDP', 'Budget', 'Duration']
            // ECharts 散点图数据 [GDP, Budget, Duration, Country]
            const currentYearData = allYearBubbleData[year] || [];
            const formattedData = currentYearData.map(item => {
                const countryName = item[0];
                const isHidden = hiddenCountries.has(countryName);

                return {
                    id: countryName, // Country as ID
                    value: [
                        item[1], // GDP
                        item[2], // Budget
                        item[3], // Duration
                        countryName  // Country
                    ],
                    // Dynamically set itemStyle based on hiddenCountries
                    itemStyle: {
                        opacity: isHidden ? 0 : 0.9, // Set opacity to 0 if hidden
                        borderColor: isHidden ? 'transparent' : '#fff', // Set border to transparent if hidden
                        borderWidth: isHidden ? 0 : 1 // Set border width to 0 if hidden
                    }
                };
            });
            setBubbleData(formattedData);
        } else {
             // 如果当前年份没有数据，清空 bubbleData
             setBubbleData([]);
        }
    }, [year, allYearBubbleData, hiddenCountries]); // 依赖项：year 和 allYearBubbleData

    // 播放控制逻辑
    useEffect(() => {
        let intervalId = null;

        if (isPlaying) {
            // 设置定时器，每隔一段时间增加年份
            intervalId = setInterval(() => {
                setYear(prevYear => {
                    const nextYear = prevYear + 1;
                    const maxYear = 2024; // 更新最大年份到2024
                    if (nextYear > maxYear) {
                        setIsPlaying(false); // 停止播放
                        return 2000; // 回到起始年份
                    } else {
                        return nextYear;
                    }
                });
            }, 1500); // 1500 毫秒更新一次年份，与动画时长同步
        }

        // 清理函数：在组件卸载或停止播放时清除定时器
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };

    }, [isPlaying]); // 依赖项数组，当 isPlaying 变化时重新运行 effect (年份变化不再是直接依赖)

    // 定义 ECharts option 的基本结构和通用配置
    const getChartOption = (data, currentYear) => {
         // 参考示例代码定义 sizeFunction
         // sizeFunction 现在根据 Duration (天) 计算气泡大小
         const sizeFunction = function (duration) { // duration 是 Duration (天)
             // 根据 Duration 计算气泡大小，需要根据实际数据范围调整比例
             if (duration == null || duration <= 0) return 5; // 默认一个较小的大小
             // 调整比例因子和基础大小，使气泡大小与 Duration 关联并可视化
             // 假设 Duration 范围在几十到几百天，sqrt 可能是一个好的映射方式
             const scaleFactor = 0.02; // 根据实际 Duration 范围调整
             const baseSize = 10; // 调整最小气泡大小
             const size = Math.sqrt(duration / scaleFactor) + baseSize;
             // console.log(`Duration: ${duration}, Size: ${size}`); // 打印 Duration 和计算出的气泡大小
             return size;
         };

         // 从所有年份数据中提取所有可能的国家用于 visualMap
         const allCountries = Array.from(new Set(Object.values(allYearBubbleData).flat().map(item => item[0])));

        return {
             title: [
                 {
                     text: `气泡图数据`,
                     left: 'center',
                     top: 10,
                     textStyle: {
                         fontSize: 28,
                         fontWeight: 900,
                         color: '#222',
                         fontFamily: 'Source Sans Pro, Arial, sans-serif',
                         letterSpacing: 2,
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
                     }
                 },
                 {
                     text: currentYear.toString(),
                     textAlign: 'center',
                     left: '80%',
                     top: '65%',
                     textStyle: {
                         fontSize: 100,
                         color: 'rgba(0, 0, 0, 0.8)',
                         fontWeight: 900,
                         fontFamily: 'Source Sans Pro, Arial, sans-serif',
                         letterSpacing: -3,
                         textShadow: `
                            0 2px 4px #fff,
                            0 4px 8px #eee,
                            0 8px 16px #bbb,
                            0 12px 24px #888,
                            0 16px 32px #444,
                            0 24px 48px rgba(0,0,0,0.45)
                         `
                     }
                 }
             ],
            tooltip: {
                padding: 5,
                borderWidth: 1,
                formatter: function (obj) {
                    var value = obj.value;
                     // obj.value 格式为 [GDP, Budget, Duration, Country]
                    return '国家：' + value[3] + '<br>'
                         + '年份：' + currentYear + '<br>'
                         + '经济水平 (GDP)：' + value[0] + '<br>' // GDP
                         + '航天任务投入成本：' + value[1] + ' Billion $' + '<br>' // Budget
                         + '航天任务总时间：' + value[2] + ' 天'; // Duration
                }
            },
            grid: {
                top: 80,
                containLabel: true,
                left: 80, // 调整 left 留出 Y 轴标签空间
                right: 80 // 调整 right 留出空间
            },
            xAxis: {
                type: 'log', // GDP 使用对数轴，适配大范围数据
                name: '经济水平 (GDP-PPP 购买力平价)',
                nameGap: 25,
                nameLocation: 'middle',
                nameTextStyle: {
                    fontSize: 14
                },
                splitLine: {
                    show: false
                },
                 axisLabel: {
                      formatter: function (value) {
                           // 根据 GDP 数值大小转换为合适的单位，例如 Trillion $ (T$) 或 Billion $ (B$)
                           if (value >= 1000000000000) {
                                return (value / 1000000000000).toFixed(0) + ' T$';
                           } else if (value >= 1000000000) {
                                return (value / 1000000000).toFixed(0) + ' B$';
                           }
                           return value.toFixed(0); // 对于小于 Billion 的，直接显示
                      }
                 },
                 // 根据实际 GDP 数据范围调整 min/max，对数轴min > 0
                 min: 100000000000, // 调整对数轴最小值，例如 10 Billion $
                 max: 35000000000000, // 调整对数轴最大值
            },
            yAxis: {
                type: 'value',
                name: '航天任务投入成本 (Billion $)',
                 nameTextStyle: {
                     fontSize: 14
                 },
                splitLine: {
                    show: false
                },
                 axisLabel: {
                     formatter: '{value} B$'
                 },
                 // 根据实际 Budget 数据范围调整 min/max
                 min: 0,
                 max: 50, // 假设最大预算 100 Billion $
            },
            visualMap: [{
                show: true,
                dimension: 3,
                categories: allCountries,
                inRange: {
                    color: ['#51689b', '#ce5c5c', '#fbc357', '#8fbf8f', '#659d84', '#fb8e6a', '#c77288', '#786090', '#91c4c5', '#6890ba']
                },
                left: 10,
                bottom: 10,
                orient: 'horizontal',
                calculable: true,
                selected: generateSelectedObjectFromHiddenCountries(allCountries, hiddenCountries)
            }],
            series: [
                {
                    name: `${currentYear}年`,
                    type: 'scatter',
                    data: data,
                    symbolSize: function (val) {
                        if (!val || val.length < 3) return 5;
                        return sizeFunction(val[2]);
                    },
                    label: {
                        show: true,
                        formatter: function (param) {
                            return param.value[3];
                        },
                        position: 'top'
                    },
                    emphasis: {
                        focus: 'series'
                    },
                    animationDurationUpdate: 1500,
                    animationEasingUpdate: 'cubicInOut'
                }
            ],
         };
    };

    // ECharts 初始化逻辑
    useEffect(() => {
        if (error || loading) {
            return;
        }
        if (!allYearBubbleData || Object.keys(allYearBubbleData).length === 0) {
            if (chartRef.current) {
                if (loading) chartRef.current.innerHTML = '<p>正在加载所有年份数据...</p>';
                else if (error) chartRef.current.innerHTML = `<p style="color: red;">Error: ${error}</p>`;
                else chartRef.current.innerHTML = '<p>无数据可用。</p>';
            }
            return;
        }

        if (!myChart.current) {
            myChart.current = echarts.init(chartRef.current);

            // 临时：监听所有 ECharts 事件，用于调试
            myChart.current.on('*', function (type, params) {
                console.log('ECharts event:', type, params);
            });

            // 移除之前的 visualmapselected 或 legendselectchanged 监听器
            myChart.current.off('visualmapselected');
            myChart.current.off('legendselectchanged');

            // 新增：监听 'finished' 事件
            myChart.current.on('finished', function () {
                console.log('Chart "finished" event triggered.'); // <-- 关键日志1
                if (myChart.current) { // 确保实例仍然存在
                    const currentOption = myChart.current.getOption();
                    if (currentOption && currentOption.visualMap && currentOption.visualMap[0] && typeof currentOption.visualMap[0].selected !== 'undefined') { // 检查 selected 是否存在
                        const echartsSelectedMap = currentOption.visualMap[0].selected;
                        console.log('Inside "finished": visualMap.selected from getOption:', echartsSelectedMap); // <-- 关键日志2

                        const newHidden = new Set();
                        for (const countryName in echartsSelectedMap) {
                            if (Object.prototype.hasOwnProperty.call(echartsSelectedMap, countryName)) {
                                if (!echartsSelectedMap[countryName]) { // 如果未选中
                                    newHidden.add(countryName);
                                }
                            }
                        }

                        // 为避免不必要的更新和潜在的循环，只有当 newHidden 确实与当前 hiddenCountries 不同时才更新
                        setHiddenCountries(prevHidden => {
                            // 复制 prevHidden 到一个数组进行比较，避免直接修改 Set
                            const prevHiddenArray = Array.from(prevHidden).sort();
                            const newHiddenArray = Array.from(newHidden).sort();
                            const isEqual = prevHiddenArray.length === newHiddenArray.length &&
                                            prevHiddenArray.every((value, index) => value === newHiddenArray[index]);

                            console.log('Inside "finished": prevHidden:', Array.from(prevHidden), 'newHidden:', Array.from(newHidden)); // <-- 关键日志3

                            if (isEqual) {
                                console.log('Inside "finished": hiddenCountries state is same, skipping update.');
                                return prevHidden; // 状态相同，不更新
                            } else {
                                console.log('Inside "finished": Updating hiddenCountries.'); // <-- 关键日志4
                                return newHidden; // 状态不同，更新
                            }
                        });
                    } else {
                        console.log('Chart "finished": visualMap or visualMap.selected not found in currentOption.'); // <-- 关键日志5
                    }
                }
            });

            const initialYearData = allYearBubbleData[year] || [];
            const initialFormattedData = initialYearData.map(item => ({
                id: item[0],
                value: [
                    item[1],
                    item[2],
                    item[3],
                    item[0]
                ]
            }));
            // 在 initialOption 中，visualMap.selected 仍然使用 generateSelectedObjectFromHiddenCountries
            // (此时 hiddenCountries 应该是初始的空 Set)
            const initialOption = getChartOption(initialFormattedData, year);
            myChart.current.setOption(initialOption);
        }

        // 响应窗口大小变化，调整图表大小
        const handleResize = () => {
            if (myChart.current) {
                myChart.current.resize();
            }
        };
        window.addEventListener('resize', handleResize);

        // 清理函数：组件卸载时销毁图表实例并移除事件监听器
        return () => {
            if (myChart.current) {
                myChart.current.dispose();
                myChart.current = null;
            }
            window.removeEventListener('resize', handleResize);
        };
    }, [error, loading, allYearBubbleData]); // 这个 effect 仍然只在初始化时运行

    // 修改图表更新的 useEffect
    useEffect(() => {
        if (loading || error || !myChart.current || !allYearBubbleData || Object.keys(allYearBubbleData).length === 0) {
            if (chartRef.current) {
                if (loading) chartRef.current.innerHTML = '<p>正在加载所有年份数据...</p>';
                else if (error) chartRef.current.innerHTML = `<p style="color: red;">Error: ${error}</p>`;
                else chartRef.current.innerHTML = '<p>无数据可用。</p>';
            }
            return;
        }

        const currentYearData = allYearBubbleData[year] || [];
        const formattedData = currentYearData.map(item => {
            const countryName = item[0];
            const isHidden = hiddenCountries.has(countryName);

            return {
                id: countryName, // Country as ID
                value: [
                    item[1], // GDP
                    item[2], // Budget
                    item[3], // Duration
                    countryName  // Country
                ],
                // Dynamically set itemStyle based on hiddenCountries
                itemStyle: {
                    opacity: isHidden ? 0 : 0.9, // Set opacity to 0 if hidden
                    borderColor: isHidden ? 'transparent' : '#fff', // Set border to transparent if hidden
                    borderWidth: isHidden ? 0 : 1 // Set border width to 0 if hidden
                }
            };
        });

        // 确保 allCountriesList 是基于当前可用数据的最新列表
        const allCountriesList = Array.from(new Set(Object.values(allYearBubbleData).flat().map(item => item[0])));

        // 获取现有的配置，以避免覆盖其他重要属性
        const currentOption = myChart.current.getOption();
        const baseTitleConfig = currentOption.title && currentOption.title[0] ? currentOption.title[0] : {};
        // 确保能正确获取年份标题的配置，如果它在 title 数组的第二个位置
        const baseYearTitleConfig = currentOption.title && currentOption.title.length > 1 && currentOption.title[1] ? currentOption.title[1] : {
             // 如果无法获取，提供一个默认结构，避免 textStyle 等属性丢失
             textAlign: 'center', left: '75%', top: '65%', textStyle: { fontSize: 100, color: '#888', fontWeight: 900, fontFamily: 'Source Sans Pro, Arial, sans-serif', letterSpacing: -3, textShadow: '0 2px 4px #fff, 0 4px 8px #eee, 0 8px 16px #bbb, 0 12px 24px #888, 0 16px 32px #444, 0 24px 48px rgba(0,0,0,0.45)'}
         };
        const baseSeriesConfig = currentOption.series && currentOption.series[0] ? currentOption.series[0] : {};
        const baseVisualMapConfig = currentOption.visualMap && currentOption.visualMap[0] ? currentOption.visualMap[0] : {};

        // ***** 1. 定义新的 label.formatter，它能够访问当前作用域的 hiddenCountries *****
        const newLabelFormatter = function (param) {
            const countryName = param.value[3]; // 国家名称在 value[3]
            if (hiddenCountries.has(countryName)) {
                return ''; // 如果国家在隐藏集合中，返回空字符串，不显示标签
            }
            return countryName; // 否则显示国家名称
        };

        // ***** 2. 同样为 tooltip.formatter 应用类似逻辑 (如果需要隐藏tooltip) *****
        const newTooltipFormatter = function (obj) {
            const countryNameInTooltip = obj.value[3];
            if (hiddenCountries.has(countryNameInTooltip)) {
                return null; // 或者返回空字符串，使tooltip不显示或显示为空
            }
            // 原有的 tooltip 内容
            var value = obj.value;
            return '国家：' + value[3] + '<br>'
                 + '年份：' + year + '<br>' // 使用当前 useEffect 作用域的 year
                 + '经济水平 (GDP)：' + value[0] + '<br>'
                 + '航天任务投入成本：' + value[1] + ' Billion $' + '<br>'
                 + '航天任务总时间：' + value[2] + ' 天';
        };

        console.log(`Updating chart for year ${year}, hidden:`, Array.from(hiddenCountries)); // 调试日志：查看当前隐藏状态

        const updatedOption = {
            title: [
                baseTitleConfig,
                {
                    ...baseYearTitleConfig,
                    text: year.toString(),
                }
            ],
            series: [{
                ...baseSeriesConfig,
                name: `${year}年`,
                data: formattedData, // 传递当前年份的完整数据
                label: { // ***** 3. 明确设置 label 配置，并使用新的 formatter *****
                    ...(baseSeriesConfig.label || {}), // 保留 show: true, position: 'top' 等其他label设置
                    formatter: newLabelFormatter,
                },
            }],
            tooltip: { // ***** 4. 明确设置 tooltip 配置，并使用新的 formatter *****
                ...(currentOption.tooltip || {}), // 保留 padding, borderWidth 等其他tooltip设置
                formatter: newTooltipFormatter,
            },
            visualMap: [{
                ...baseVisualMapConfig,
                categories: allCountriesList,
                selected: generateSelectedObjectFromHiddenCountries(
                    allCountriesList,
                    hiddenCountries
                )
            }]
        };

        console.log('Setting visualMap.selected to:', updatedOption.visualMap[0].selected); // 调试日志：查看 visualMap 选中状态
        if (updatedOption.series[0].label.formatter) {
          //  console.log('Label formatter function body contains hiddenCountries check:', updatedOption.series[0].label.formatter.toString().includes("hiddenCountries.has"));
        }

        myChart.current.setOption(updatedOption, { notMerge: false });

    }, [year, allYearBubbleData, hiddenCountries, myChart.current, loading, error]);

    return (
        <div className="page">
            <NavBar /> {/* 添加导航栏组件 */}
            {/* 卡片式磨砂玻璃容器 */}
            <div
              style={{
                width: '95vw',
                maxWidth: 1200, // Increased maxWidth slightly
                minHeight: 500,
                maxHeight:650,
                background: 'rgba(255,255,255,0.55)',
                borderRadius: 48,
                boxShadow: '0 16px 48px 0 rgba(31, 38, 135, 0.22)', // 阴影更强
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                padding: '20px 32px', // Adjusted top padding, reduced overall
                marginLeft: 85,
                marginTop: 100, // Added margin-top to push the container down from the top of the page
              }}
            >
              {loading ? (
                  <div
                      style={{
                          width: '90%',
                          height: 600,
                          minWidth: 500,
                          borderRadius: 24,
                          background: 'rgba(255,255,255,0.7)',
                          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(16px)',
                          marginRight: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                      }}
                  >
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
              ) : error ? (
                  <p style={{ color: 'red', fontSize: 20, fontWeight: 500 }}>Error: {error}</p>
              ) : (
                  <React.Fragment>
                      {/* ECharts 图表容器 */}
                      <div
                          ref={chartRef}
                          style={{
                              width: '90%', // Adjusted width to make space for the year slider
                              height: 620,
                              minWidth: 500,
                              borderRadius: 24,
                              background: 'rgba(255,255,255,0.7)',
                              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
                              backdropFilter: 'blur(8px)',
                              WebkitBackdropFilter: 'blur(16px)',
                              marginRight: 32, // Adjusted spacing
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                          }}
                      />
                      {/* 年份选择条 */}
                      <div
                          style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              height: 600, // Occupy full height of parent
                              overflowY: 'auto',
                              background: 'rgba(255,255,255,0.35)',
                              borderRadius: 18,
                              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
                              padding: '16px 12px',
                              marginLeft: 20, // Adjusted margin-left for spacing
                              marginRight: 8,
                              fontFamily: 'SF Pro Display, Helvetica Neue, Arial, sans-serif',
                          }}
                      >
                          <p style={{ margin: '0 0 8px 0', fontWeight: 700, fontSize: 16, color: '#222' }}>年份</p>
                          {[...Array(25).keys()].map(i => 2000 + i).map(y => (
                              <div
                                  key={y}
                                  style={{
                                      cursor: 'pointer',
                                      padding: '4px 0',
                                      fontWeight: y === year ? 700 : 400,
                                      color: y === year ? '#007aff' : '#222',
                                      fontSize: 15,
                                      textAlign: 'right',
                                      borderRadius: 6,
                                      background: y === year ? 'rgba(0,122,255,0.08)' : 'none',
                                      transition: 'all 0.2s',
                                      marginBottom: 1,
                                  }}
                                  onClick={() => setYear(y)}
                              >
                                  {y}
                              </div>
                          ))}
                      </div>
                  </React.Fragment>
              )}
            </div>
            {/* 播放按钮，放在卡片正下方，居中 */}
            <div style={{ marginTop: 30, display: 'flex', justifyContent: 'center', width: '100%' }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: isPlaying ? '#fff' : '#007aff',
                  background: isPlaying
                    ? 'linear-gradient(90deg, #007aff 0%, #00c6fb 100%)'
                    : 'rgba(255,255,255,0.7)',
                  border: 'none',
                  borderRadius: 16,
                  boxShadow: '0 4px 16px #b3d1fa',
                  padding: '12px 48px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  outline: 'none',
                  letterSpacing: 2,
                }}
              >
                {isPlaying ? '暂停' : '播放'}
              </button>
            </div>
            <style>{`
              @import url(https://fonts.googleapis.com/css?family=Roboto);
              * { margin: 0; padding: 0; }
              *, *:after, *:before { box-sizing: border-box; }
              html { line-height: 1.2; }
              body { background-color: #f5f5f5; color: #333; font-family: "Roboto", arial, sans-serif; font-size: 16px; }
              /* Original dropdown styles */
              .selected-item { margin: 20px 0; text-align: center; }
              .selected-item p { font-size: 18px; }
              .selected-item p span { font-weight: bold; }
              .dropdown { margin: 20px auto; width: 300px; position: relative; perspective: 800px; z-index:100}
              .dropdown.active .selLabel:after { content: '\u25B2'; }
              .dropdown.active .dropdown-list li:nth-child(1) { transform: translateY(100%); }
              .dropdown.active .dropdown-list li:nth-child(2) { transform: translateY(200%); }
              .dropdown.active .dropdown-list li:nth-child(3) { transform: translateY(300%); }
              .dropdown.active .dropdown-list li:nth-child(4) { transform: translateY(400%); }
              .dropdown.active .dropdown-list li:nth-child(5) { transform: translateY(500%); } /* 新增 */
              .dropdown.active .dropdown-list li:nth-child(6) { transform: translateY(600%); } /* 新增 */
              .dropdown.active .dropdown-list li:nth-child(7) { transform: translateY(700%); } /* 新增 */
              .dropdown.active .dropdown-list li:nth-child(8) { transform: translateY(800%); } /* 新增 */
              .dropdown > .selLabel { box-shadow: 0 1px 1px rgba(0,0,0,0.1); width: 100%; height: 60px; line-height: 60px; color: #fff; font-size: 18px; letter-spacing: 2px; background: #34495e; display: block; padding: 0 50px 0 30px; position: relative; z-index: 9999; cursor: pointer; transform-style: preserve-3d; transform-origin: 50% 0%; transition: transform 300ms; -webkit-backface-visibility: hidden; -webkit-touch-callout: none; user-select: none; }
              .dropdown > .selLabel:after { content: '\u25BC'; position: absolute; right: 0px; top: 15%; width: 50px; text-align: center; font-size: 12px; padding: 10px; height: 70%; line-height: 24px; border-left: 1px solid #ddd; }
              .dropdown > .selLabel:active { transform: rotateX(45deg); }
              .dropdown-list { position: absolute; top: 0px; width: 100%; }
              .dropdown-list li { display: block; list-style: none; left: 0; opacity: 1; transition: transform 300ms ease; position: absolute; top: 0; width: 100%; }
              .dropdown-list li:nth-child(1) { background-color: #1abc9c; z-index: 8; transform: translateY(0%); }
              .dropdown-list li:nth-child(2) { background-color: #3498db; z-index: 7; transform: translateY(3%); }
              .dropdown-list li:nth-child(3) { background-color: #9b59b6; z-index: 6; transform: translateY(6%); }
              .dropdown-list li:nth-child(4) { background-color: #e67e22; z-index: 5; transform: translateY(9%); }
              .dropdown-list li:nth-child(5) { background-color: #e74c3c; z-index: 4; transform: translateY(12%); } /* 新增 */
              .dropdown-list li:nth-child(6) { background-color: #2ecc71; z-index: 3; transform: translateY(15%); } /* 新增 */
              .dropdown-list li:nth-child(7) { background-color: #f39c12; z-index: 2; transform: translateY(18%); } /* 新增 */
              .dropdown-list li:nth-child(8) { background-color: #7f8c8d; z-index: 1; transform: translateY(21%); } /* 新增, 使用一个不同的颜色 */
              .dropdown-list li span { box-shadow: 0 1px 1px rgba(0,0,0,0.2); -webkit-backface-visibility: hidden; -webkit-touch-callout: none; user-select: none; width: 100%; font-size: 18px; line-height: 60px; padding: 0 30px; display: block; color: #fff; cursor: pointer; letter-spacing: 2px; }

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

export default Page1; 