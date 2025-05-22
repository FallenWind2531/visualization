/*
 * @Author: userName userEmail
 * @Date: 2025-05-20 19:47:04
 * @LastEditors: userName userEmail
 * @LastEditTime: 2025-05-22 14:45:36
 * @FilePath: \visualization\visualization\src\components\pages\Page2.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

function Page2() {
    const chartRef = useRef(null);
    const [pieData, setPieData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [country, setCountry] = useState('USA');
    const countryList = ['USA', 'China', 'Russia', 'India', 'Japan', 'France', 'UK', 'Germany']; // 可根据实际数据调整
    const [dropdownActive, setDropdownActive] = useState(false);

    const handleDropdownSelect = (c) => {
        setCountry(c);
        setDropdownActive(false);
    };

    useEffect(() => {
        const fetchPieData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`http://127.0.0.1:5000/api/v1/pie?country=${country}`);
                const result = await res.json();
                if (result.code === 200 && result.data && result.data.length > 0) {
                    // result.data[0] 是任务类型的统计 [['MissionType1', 10], ...]
                    const data = result.data[0].map(item => ({
                        name: item[0],
                        value: item[1]
                    }));
                    setPieData(data);
                } else {
                    setError('数据获取失败');
                }
            } catch (e) {
                setError('网络错误');
            } finally {
                setLoading(false);
            }
        };
        fetchPieData();
    }, [country]);

    useEffect(() => {
        if (!loading && !error && chartRef.current) {
            const myChart = echarts.init(chartRef.current);
            const option = {
                title: {
                    text: `${country} 各任务类型占比`,
                    subtext: '数据来源：后端API',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'item'
                },
                legend: {
                    orient: 'vertical',
                    left: 'left'
                },
                series: [
                    {
                        name: '任务类型',
                        type: 'pie',
                        radius: '50%',
                        data: pieData,
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)'
                            }
                        }
                    }
                ]
            };
            myChart.setOption(option);
            // 响应式
            window.addEventListener('resize', myChart.resize);
            return () => {
                myChart.dispose();
                window.removeEventListener('resize', myChart.resize);
            };
        }
    }, [pieData, loading, error, country]);

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
            paddingTop: 16,
          }}
        >
          <style>{`
            @import url(https://fonts.googleapis.com/css?family=Roboto);
            * { margin: 0; padding: 0; }
            *, *:after, *:before { box-sizing: border-box; }
            html { line-height: 1.2; }
            body { background-color: #f5f5f5; color: #333; font-family: "Roboto", arial, sans-serif; font-size: 16px; }
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
          `}</style>
          <div className="container">
            <div className="selected-item">
              <p>You Selected Country : <span>{country || 'Empty'}</span></p>
            </div>
            <div className={`dropdown${dropdownActive ? ' active' : ''}`}>
              <span className="selLabel" onClick={() => setDropdownActive(!dropdownActive)}>
                {country || 'Select Country'}
              </span>
              <input type="hidden" name="cd-dropdown" />
              <ul className="dropdown-list">
                {countryList.map((c, idx) => (
                  <li key={c} data-value={idx + 1} onClick={() => { setCountry(c); setDropdownActive(false); }}>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
      
          {/* 标题 */}
          <h2
            style={{
              fontSize: 36,
              fontWeight: 800,
              margin: '0 0 24px 0',
              color: '#222',
              letterSpacing: 2,
              textAlign: 'center',
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
            任务类型饼图
          </h2>
      
          {/* 错误/加载提示 */}
          {loading && <p style={{ fontSize: 20, color: '#888', fontWeight: 500 }}>加载中...</p>}
          {error && <p style={{ color: 'red', fontSize: 20, fontWeight: 500 }}>{error}</p>}
      
          {/* 图表卡片 */}
          <div
            style={{
              width: 640,
              height: 440,
              background: 'rgba(255,255,255,0.55)',
              borderRadius: 28,
              boxShadow: '0 16px 48px 0 rgba(31, 38, 135, 0.22)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 10,
              border: '1px solid rgba(255,255,255,0.25)',
            }}
          >
            <div ref={chartRef} style={{ width: 540, height: 360 }} />
          </div>
        </div>
      );
}
export default Page2; 