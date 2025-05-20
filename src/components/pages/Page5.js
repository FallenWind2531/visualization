import React, { useEffect, useState } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
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
    LineChart,
    CanvasRenderer
]);

function Page5() {
    const [satelliteData, setSatelliteData] = useState(null);
    const [technologyData, setTechnologyData] = useState(null);

    useEffect(() => {
        // 获取卫星类型数据
        fetch('http://127.0.0.1:5000/api/v1/stacked_area?type=Satellite Type')
            .then(response => response.json())
            .then(data => {
                if (data.code === 200) {
                    processSatelliteData(data.data);
                }
            })
            .catch(error => console.error('Error fetching satellite data:', error));

        // 获取技术使用数据
        fetch('http://127.0.0.1:5000/api/v1/stacked_area?type=Technology Used')
            .then(response => response.json())
            .then(data => {
                if (data.code === 200) {
                    processTechnologyData(data.data);
                }
            })
            .catch(error => console.error('Error fetching technology data:', error));
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
            series: technologyData.series
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
        <div className='page'>
            <div id="satelliteChart" style={{ width: '100%', height: '400px', marginBottom: '20px' }}></div>
            <div id="technologyChart" style={{ width: '100%', height: '400px' }}></div>
        </div>
    );
}

export default Page5; 