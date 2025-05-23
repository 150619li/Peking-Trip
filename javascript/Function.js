//#region 变量 

// 全局变量，存储所有景点数据
let poiFeatures = null;
// 全局变量，存储当前路线polyline
let currentRoutePolyline = null;
let currentMarkers = [];

//#endregion

//#region 初始化

// 初始化事件
document.addEventListener('DOMContentLoaded', async function() {
    // 加载GeoJSON数据
    try {
        const response = await fetch('../geojsonGCJ/points_of_interest.geojson');
        const geojsonData = await response.json();
        poiFeatures = geojsonData.features;
        
        // 初始化清空按钮
        initClearButton();
        
        // 规划路线按钮事件
        document.getElementById('planRouteBtn').addEventListener('click', planRoute);
        
        // 添加景点到列表
        const scenicList = document.querySelector('.scenic-list ul');
        if (scenicList) {
            scenicList.innerHTML = '';
            poiFeatures.forEach(feature => {
                const li = document.createElement('li');
                li.textContent = feature.properties.name;
                li.setAttribute('data-category', feature.properties.category);
                scenicList.appendChild(li);
            });
            // 初始化景点列表双击事件
            initScenicListEvents();
        }

        // 添加景点到列表
        const poilist = document.querySelector('.poi-list ul');
        if (poilist) {
            poilist.innerHTML = '';
            poiFeatures.forEach(feature => {
                const li = document.createElement('li');
                li.textContent = feature.properties.name;
                li.setAttribute('data-category', feature.properties.category);
                poilist.appendChild(li);
            });
        }

        addPoisToMap('all');

    } catch (error) {
        console.error('加载景点数据失败:', error);
    }
});
//#endregion

//#region 函数
// 为景点列表添加双击事件
function initScenicListEvents() {
    document.querySelectorAll('.scenic-list ul li').forEach(function(item) {
        item.addEventListener('dblclick', function() {
            var selectedList = document.getElementById('selected-list');
            
            // 检查是否已经添加过
            let isDuplicate = false;
            selectedList.querySelectorAll('li').forEach(existingItem => {
                if (existingItem.textContent.replace(' ×', '').trim() === item.textContent.trim()) {
                    isDuplicate = true;
                }
            });
            
            if (!isDuplicate) {
                var newItem = document.createElement('li');
                newItem.textContent = this.textContent;
                
                // 添加删除按钮
                const deleteBtn = document.createElement('span');
                deleteBtn.textContent = ' ×';
                deleteBtn.className = 'delete-btn';
                deleteBtn.style.color = 'red';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.style.marginLeft = '5px';
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    newItem.remove();
                });
                
                newItem.appendChild(deleteBtn);
                selectedList.appendChild(newItem);
            }
        });
    });
}

// 获取景点类别
function getCategoryForPoi(poiName) {
    const poiListItems = document.querySelectorAll('.poi-list li');
    for (const item of poiListItems) {
        if (item.textContent.trim() === poiName) { // Use .trim() to remove whitespace
            return item.getAttribute('data-category') || 'all';
        }
    }
    return 'all';
}

// 搜索地点经纬度
function searchPoint(target) {
    return new Promise((resolve, reject) => {
        // 先检查是否是已定义的景点
        const foundFeature = poiFeatures.find(feature => feature.properties.name === target);
        if (foundFeature) {
            const coords = foundFeature.geometry.coordinates;
            resolve(new AMap.LngLat(coords[0], coords[1]));
            return;
        }
        
        let geocoder = new AMap.Geocoder({
            city: "北京",
            radius: 1000
        });
        
        geocoder.getLocation(target, function (status, result) {
            if (status === 'complete' && result.geocodes.length > 0) {
                let location = result.geocodes[0].location;
                console.log(`${target}经纬度:`, location.lng, location.lat);
                resolve(location);
            } else {
                console.error(`无法获取${target}的经纬度`);
                reject(`无法获取${target}的经纬度，请更换关键词再试`);
            }
        });
    });
}

//清除地图上的标记
function removePoisFromMap(){
    if (currentMarkers.length > 0) {
        map.remove(currentMarkers);
        currentMarkers = [];
    }
}

// 添加景点标记到地图
async function addPoisToMap(category = 'all') {
    // 清除之前的标记
    if (currentMarkers.length > 0) {
        map.remove(currentMarkers);
        currentMarkers = [];
    }

    const markerStyles = {
        'history': {
            content: `<div style="background-color: #c03; width: 24px; height: 24px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                        <span style="color: white; font-weight: bold; font-size: 14px;">史</span>
                     </div>`,
            offset: new AMap.Pixel(-12, -12)
        },
        'nature': {
            content: `<div style="background-color: #090; width: 24px; height: 24px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                        <span style="color: white; font-weight: bold; font-size: 14px;">自</span>
                     </div>`,
            offset: new AMap.Pixel(-12, -12)
        },
        'culture': {
            content: `<div style="background-color: #06c; width: 24px; height: 24px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                        <span style="color: white; font-weight: bold; font-size: 14px;">文</span>
                     </div>`,
            offset: new AMap.Pixel(-12, -12)
        }
    };

    // 筛选符合类别的景点
    const filteredFeatures = poiFeatures.filter(feature => 
        category === 'all' || feature.properties.category === category
    );

    for (const feature of filteredFeatures) {
        const name = feature.properties.name;
        const coords = feature.geometry.coordinates;
        const poiCategory = feature.properties.category;

        // 获取景点描述
        let description = '';
        try {
            const response = await fetch(`../sites/${name}.txt`);
            if (response.ok) {
                description = await response.text();
            } else {
                description = '暂无介绍';
            }
        } catch (e) {
            description = '暂无介绍';
        }

        const image = `../sites/${name}.jpg`;        // 创建标记，使用对应类别的样式
        const marker = new AMap.Marker({
            position: coords,
            title: name,
            content: markerStyles[poiCategory].content,
            offset: markerStyles[poiCategory].offset,
            label: {
                offset: new AMap.Pixel(1, -1),
                content: name,
                direction: 'right',
                
            }
        });

        // 创建信息窗体
        const infoWindow = new AMap.InfoWindow({
            content: `
                <div style="width:220px; max-height:180px; overflow:auto;">
                    <h3 style="margin-top:5px;">${name}</h3>
                    <p style="margin:5px 0; color: ${
                        poiCategory === 'history' ? '#c03' : 
                        poiCategory === 'nature' ? '#090' : 
                        '#06c'
                    }">类别：${
                        poiCategory === 'history' ? '历史建筑' : 
                        poiCategory === 'nature' ? '自然景观' : 
                        '文化设施'
                    }</p>
                    <img src="${image}" alt="${name}" style="width:200px; margin:5px 0;"><br>
                    <button id="add-to-selected" style="background:#4CAF50; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px; margin-top:5px;">添加到行程</button>
                    <p style="font-size:14px; line-height:1.5;">${description}</p>
                </div>
            `,
            offset: new AMap.Pixel(0, -30)
        });

        // 点击标记显示信息窗体
        marker.on('click', () => {
            infoWindow.open(map, marker.getPosition());

            // 给"添加到行程"按钮添加事件
            setTimeout(() => {
                const addBtn = document.getElementById('add-to-selected');
                if (addBtn) {
                    addBtn.onclick = () => {
                        var selectedList = document.getElementById('selected-list');
                        
                        // 检查是否已添加
                        let isDuplicate = false;
                        selectedList.querySelectorAll('li').forEach(existingItem => {
                            if (existingItem.textContent.replace(' ×', '').trim() === name.trim()) {
                                isDuplicate = true;
                            }
                        });
                        
                        if (!isDuplicate) {
                            const newItem = document.createElement('li');
                            newItem.textContent = name;
                            
                            // 添加删除按钮
                            const deleteBtn = document.createElement('span');
                            deleteBtn.textContent = ' ×';
                            deleteBtn.className = 'delete-btn';
                            deleteBtn.style.color = 'red';
                            deleteBtn.style.cursor = 'pointer';
                            deleteBtn.style.marginLeft = '5px';
                            deleteBtn.addEventListener('click', function(e) {
                                e.stopPropagation();
                                newItem.remove();
                            });
                            
                            newItem.appendChild(deleteBtn);
                            selectedList.appendChild(newItem);
                        }
                        
                        infoWindow.close();
                    };
                }
            }, 100);
        });

        currentMarkers.push(marker);
    }

    // 添加标记到地图
    if (currentMarkers.length > 0) {
        map.add(currentMarkers);
        map.setFitView(currentMarkers);
    } else {
        alert('没有找到符合条件的景点');
    }

}

// 初始化清空按钮
function initClearButton() {
    const buttonContainer = document.querySelector('.scenic-list > div:nth-child(2)');
    
    if (!document.getElementById('clear-selected')) {
        const clearButton = document.createElement('button');
        clearButton.id = 'clear-selected';
        clearButton.textContent = '清空列表';
        clearButton.style.marginTop = '10px';
        clearButton.style.padding = '5px 10px';
        clearButton.style.backgroundColor = '#f44336';
        clearButton.style.color = 'white';
        clearButton.style.border = 'none';
        clearButton.style.borderRadius = '4px';
        clearButton.style.cursor = 'pointer';
        
        clearButton.addEventListener('click', function() {
            const selectedList = document.getElementById('selected-list');
            selectedList.innerHTML = '';
        });
        
        buttonContainer.appendChild(clearButton);
    }
}

// 规划路线
function planRoute() {
    const startText = document.getElementById('start').value;
    const endText = document.getElementById('end').value;
    const timeText = document.getElementById('time').value;

    if (!startText || !endText) {
        alert('请填写起点和终点');
        return;
    }

    if (!walking) {
        console.error('步行导航插件未初始化');
        alert('系统未准备就绪，请稍后重试');
        return;
    }

    console.log('开始获取已选景点');
    // 获取已选景点
    const selectedItems = document.querySelectorAll('#selected-list li');
    const selectedPoints = [];
    
    selectedItems.forEach(function(li) {
        // 去除删除按钮的文本
        const name = li.textContent.replace(' ×', '').trim();
        const feature = poiFeatures.find(f => f.properties.name === name);
        if (feature) {
            selectedPoints.push(name);
        }
    });
    

    console.log('选中的景点：', selectedPoints);
    
    // 先获取起点和终点坐标
    Promise.all([
        searchPoint(startText),
        searchPoint(endText)
    ]).then(function(results) {
        const startPoint = results[0];
        const endPoint = results[1];
        
        console.log('起点坐标：', startPoint);
        console.log('终点坐标：', endPoint);

        // 构建路径点数组
        let routePoints = [startPoint];
        
        // 添加中间景点
        selectedPoints.forEach(point => {
            const feature = poiFeatures.find(f => f.properties.name === point);
            if (feature) {
                const coords = feature.geometry.coordinates;
                routePoints.push(new AMap.LngLat(coords[0], coords[1]));
            }
        });
        
        // 添加终点
        routePoints.push(endPoint);
        
        console.log('所有路径点：', routePoints);

        // 清除之前的路线
        if (currentRoutePolyline) {
            map.remove(currentRoutePolyline);
        }
        
        calculateMultiPointRoute(routePoints);
    }).catch(function(error) {
        alert(error);
    });
}

// 计算多点路线
function calculateMultiPointRoute(points) {
    if (points.length < 2) {
        alert('至少需要起点和终点');
        return;
    }
    
    console.log('开始计算多点路线');
    // 清除之前的覆盖物但保留标记
    if (currentRoutePolyline) {
        map.remove(currentRoutePolyline);
    }
    
    let promiseArray = [];
    
    // 创建每段路径的Promise
    for (let i = 0; i < points.length - 1; i++) {
        promiseArray.push(new Promise((resolve, reject) => {
            console.log(`计算第 ${i+1} 段路线`);
            walking.search(points[i], points[i + 1], function(status, result) {
                if (status === 'complete' && result.routes && result.routes[0]) {
                    let segment = [];
                    result.routes[0].steps.forEach(function(step) {
                        segment = segment.concat(step.path);
                    });
                    
                    // 计算该段距离和时间
                    const distance = result.routes[0].distance;
                    const duration = result.routes[0].time;
                    
                    resolve({
                        path: segment,
                        distance: distance,
                        duration: duration
                    });
                } else {
                    console.error('路径规划失败:', status, result);
                    reject('路径规划失败');
                }
            });
        }));
    }
    
    // 等待所有路径规划完成
    Promise.all(promiseArray).then(function(results) {
        let fullPath = [];
        let totalDistance = 0;
        let totalDuration = 0;
        
        // 合并所有路径段
        results.forEach(function(result) {
            fullPath = fullPath.concat(result.path);
            totalDistance += result.distance;
            totalDuration += result.duration;
        });
        
        // 创建路线
        currentRoutePolyline = new AMap.Polyline({
            path: fullPath,
            isOutline: true,
            outlineColor: '#ffeeff',
            borderWeight: 2,
            strokeColor: "#3366FF",
            strokeWeight: 6,
            strokeOpacity: 0.9,
            lineJoin: 'round'
        });
        
        map.add(currentRoutePolyline);
        map.setFitView([currentRoutePolyline]);
        
        // 显示路线信息
        const hours = Math.floor(totalDuration / 3600);
        const minutes = Math.floor((totalDuration % 3600) / 60);
        
        alert(`路线规划完成！\n总距离: ${(totalDistance/1000).toFixed(2)}公里\n预计时间: ${hours}小时${minutes}分钟\n景点数量: ${points.length - 2}个`);
        
        
    }).catch(function(error) {
        console.error(error);
        console.error('路线规划错误：', error);
        alert('路线规划出错: ' + error);
    });
}


//#endregion
