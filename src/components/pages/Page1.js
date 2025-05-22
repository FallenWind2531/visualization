import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';

function Page1() {
    const [year, setYear] = useState(2000); // 状态变量：当前选中的年份，默认 2000 (改为起始年份)
    const [country, setCountry] = useState(null); // 状态变量：国家，默认 null (暂时不用，保留备用)
    const [bubbleData, setBubbleData] = useState([]); // 状态变量：当前年份的气泡图数据
    const [allYearBubbleData, setAllYearBubbleData] = useState({}); // 新状态变量：存储所有年份的气泡图数据
    const [error, setError] = useState(null); // 状态变量：错误信息，默认为 null
    const [loading, setLoading] = useState(true); // 状态变量：加载状态 (默认 true，开始加载所有数据)
    const [isPlaying, setIsPlaying] = useState(false); // 状态变量：是否正在播放动画

    const chartRef = useRef(null); // 用于引用图表容器的 div 元素
    const myChart = useRef(null); // 用于存储 ECharts 实例

    // 首次加载时，获取所有年份的数据
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true); // 开始加载
            setError(null); // 清空错误信息
            const dataByYear = {};
            const startYear = 2000;
            const endYear = 2023;

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
            const formattedData = currentYearData.map(item => ({
                id: item[0], // Country as ID
                value: [
                    item[1], // GDP
                    item[2], // Budget
                    item[3], // Duration
                    item[0]  // Country
                ]
            }));
            setBubbleData(formattedData);
        } else {
             // 如果当前年份没有数据，清空 bubbleData
             setBubbleData([]);
        }
    }, [year, allYearBubbleData]); // 依赖项：year 和 allYearBubbleData

    // 播放控制逻辑
    useEffect(() => {
        let intervalId = null;

        if (isPlaying) {
            // 设置定时器，每隔一段时间增加年份
            intervalId = setInterval(() => {
                setYear(prevYear => {
                    const nextYear = prevYear + 1;
                    const maxYear = 2023; // 最大年份
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
                     left: '70%',
                     top: '60%',
                     textStyle: {
                         fontSize: 100,
                         color: '#888',
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
                name: '经济水平 (GDP)',
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
                 min: 10000000000, // 调整对数轴最小值，例如 10 Billion $
                 max: 30000000000000, // 调整对数轴最大值
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
                    // 根据国家进行颜色映射，位置调整到左下角
                    show: true, // 显示 visualMap
                    dimension: 3, // 对应 formattedData 中的 Country 索引
                    categories: allCountries, // 从所有数据中提取所有国家
                    inRange: {
                        color: (
                             ['#51689b', '#ce5c5c', '#fbc357', '#8fbf8f', '#659d84', '#fb8e6a', '#c77288', '#786090', '#91c4c5', '#6890ba']
                        )
                    },
                    left: 10,
                    bottom: 10,
                    orient: 'horizontal', // 水平排列
                    // text: ['国家', ''], // 移除这里的文本，让 ECharts 自动显示 category 文本
                    calculable: true,
                    // 添加 itemWidth 和 itemHeight 以控制图例项的大小
                    itemWidth: 15,
                    itemHeight: 10
                }
            ],
            series: [
                {
                    name: `${currentYear}年`, // 系列名称显示年份
                    type: 'scatter',
                    data: data, // 使用传入的数据
                    itemStyle: {
                        opacity: 0.8
                    },
                    symbolSize: function (val) {
                        // 确保 val 数组有足够的元素
                         if (!val || val.length < 3) return 5; // 数据格式不正确时返回默认大小
                        return sizeFunction(val[2]); // 使用 formattedData 中的 Duration (索引 2)
                    },
                     label: { // 添加标签显示国家名称
                         show: true,
                         formatter: function (param) {
                             return param.value[3]; // 显示国家名称 (索引 3)
                         },
                         position: 'top' // 标签位置
                     },
                     emphasis: { // 高亮样式
                         focus: 'series'
                     },
                    // 在 series 中再次明确动画更新配置
                    animationDurationUpdate: 1500, // 继承 option 顶层的设置
                    animationEasingUpdate: 'cubicInOut' // 继承 option 顶层的设置
                 }
             ],
         };
    };

    // ECharts 初始化逻辑
    useEffect(() => {
        // 如果存在错误或正在加载，不初始化图表
        if (error || loading) {
             return;
        }
        // 如果所有数据没有加载完成，不初始化图表
        if (!allYearBubbleData || Object.keys(allYearBubbleData).length === 0) {
             // 在加载或出错时，显示相应的提示信息
              if (chartRef.current) {
                  if (loading) chartRef.current.innerHTML = '<p>正在加载所有年份数据...</p>';
                  else if (error) chartRef.current.innerHTML = `<p style="color: red;">Error: ${error}</p>`;
                  else chartRef.current.innerHTML = '<p>无数据可用。</p>';
              }
             return;
        }

        if (!myChart.current) {
            myChart.current = echarts.init(chartRef.current);

            // 初始化时设置图表的基本配置，使用第一年的数据或空数据
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
    }, [error, loading, allYearBubbleData]); // 依赖项：错误、加载状态和所有年份数据

    // 当年份变化时，更新图表数据和年份大字
    useEffect(() => {
        // 等待所有数据加载完成且图表实例已创建
        if (loading || error || !myChart.current) {
             // 在加载或出错时，显示相应的提示信息
              if (chartRef.current) {
                  if (loading) chartRef.current.innerHTML = '<p>正在加载所有年份数据...</p>';
                  else if (error) chartRef.current.innerHTML = `<p style="color: red;">Error: ${error}</p>`;
                  else if (!allYearBubbleData || Object.keys(allYearBubbleData).length === 0) chartRef.current.innerHTML = '<p>无数据可用。</p>';
              }
            return;
        }

        // 获取当前年份的数据
        const currentYearData = allYearBubbleData[year] || [];

        // 适配数据格式：后端实际返回数据 ['Country', 'GDP', 'Budget', 'Duration']
        // ECharts 散点图数据 [GDP, Budget, Duration, Country]
        const formattedData = currentYearData.map(item => ({
            id: item[0], // Country as ID
            value: [
                item[1], // GDP
                item[2], // Budget
                item[3], // Duration
                item[0]  // Country
            ]
        }));

        // 更新图表数据和年份大字
        // 注意：这里不需要 getOption()，直接构造需要更新的部分
        const updatedOption = {
             title: [
                 // 保留第一个标题（主要标题）
                 myChart.current.getOption().title[0],
                 { // 更新年份大字标题
                     text: year.toString(), // 显示当前年份
                     textAlign: 'center', // 文本居中对齐
                     // 使用 left 和 top 属性定位到图表绘制区域的中心偏右下
                     left: '75%', // 调整水平位置，根据需要调整
                     top: '65%', // 调整垂直位置，根据需要调整
                     textStyle: {
                         fontSize: 100,
                         color: '#888',
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
            series: [
                {
                    // 仅更新 data 属性
                    data: formattedData,
                    name: `${year}年`, // 更新系列名称
                }
            ]
        };

        // 使用 setOption 更新图表，ECharts 会根据数据项的 ID 尝试进行动画过渡
        // 使用 { notMerge: false } 确保合并更新
        myChart.current.setOption(updatedOption, { notMerge: false });

    }, [year, allYearBubbleData, myChart.current, loading, error]); // 依赖项：年份、所有数据、图表实例、加载和错误状态

    return (
        <div
          className="page"
          style={{
            minHeight: '100vh',
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
              maxWidth: 1200,
              minHeight: 650,
              background: 'rgba(255,255,255,0.55)',
              borderRadius: 32,
              boxShadow: '0 16px 48px 0 rgba(31, 38, 135, 0.22)', // 阴影更强
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              padding: '40px 32px',
              marginBottom: 0,
            }}
          >
            {/* ECharts 图表容器 */}
            <div
              ref={chartRef}
              style={{
                width: '70%',
                height: 520,
                minWidth: 500,
                borderRadius: 24,
                background: 'rgba(255,255,255,0.7)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                marginRight: 64, // 间距更大
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
                maxHeight: 520,
                overflowY: 'auto',
                background: 'rgba(255,255,255,0.35)',
                borderRadius: 18,
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)', // 阴影更强
                padding: '16px 12px',
                marginLeft: 0,
                marginRight: 8,
                fontFamily: 'SF Pro Display, Helvetica Neue, Arial, sans-serif',
              }}
            >
              <p style={{ margin: '0 0 8px 0', fontWeight: 700, fontSize: 16, color: '#222' }}>年份</p>
              {[...Array(24).keys()].map(i => 2000 + i).map(y => (
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
          </div>
          {/* 播放按钮，放在卡片正下方，居中 */}
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', width: '100%' }}>
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
        </div>
    );
}

export default Page1; 