import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Select, Card, Button, Space } from 'antd';

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
        envImpact: { min: 1, max: 5 },     // 环境影响
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
                    (item[2] * 10 - 240) / 5,
                    
                    // 成功率
                    (item[3] * 10 - 730) / 7,
                    
                    // 环境影响
                    (item[4] * 100 - 297) < 0 ? 0.5 : (item[4] * 100 - 297),
                    
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
                right: 0,
                top: 'middle'
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
        <div className='page'>         
            <Card title="国家航天能力雷达图分析" style={{ marginBottom: 20 }}>
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
                
                {radarData.length > 0 ? (
                    <ReactECharts 
                        option={getOption()} 
                        style={{ height: '500px' }}
                        loading={loading}
                    />
                ) : (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        请选择至少一个国家进行分析
                    </div>
                )}
            </Card>
        </div>
    );
}

export default Page3;