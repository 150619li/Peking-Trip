//#region 变量 

// 全局变量，存储当前路线polyline
let poiFeatures = [];
let currentRoutePolyline = null;
let currentMarkers = [];
// 聚合标记
let markerCluster = null;
const markerStyles = {
    'toilet': {
        content: `<div style="background-color: #c03; width: 24px; height: 24px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-weight: bold; font-size: 14px;">厕</span>
                    </div>`,
        offset: new AMap.Pixel(-12, -12)
    },
    'door': {
        content: `<div style="background-color: #c03; width: 24px; height: 24px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-weight: bold; font-size: 14px;">门</span>
                    </div>`,
        offset: new AMap.Pixel(-12, -12)
    },
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
const count = 65
// 这个参考官方实例修改的
// 聚合点的渲染方法
const _renderClusterMarker = function (context) {
    let factor = Math.pow(context.count / count, 1 / 18);
    let div = document.createElement('div');
    let Hue = 180 - factor * 180;
    let bgColor = 'hsla(' + Hue + ',100%,100%,1)';
    let fontColor = 'hsla(' + Hue + ',100%,50%,1)';
    let borderColor = 'hsla(' + Hue + ',100%,0%,1)';
    let shadowColor = 'hsla(' + Hue + ',100%,10%,0.3)';
    div.style.backgroundColor = bgColor;
    let size = Math.round(30 + Math.pow(context.count / count, 1 / 5) * 20);
    div.style.width = div.style.height = size + 'px';
    div.style.border = `solid 1px ${borderColor}`;
    div.style.borderRadius = size / 2 + 'px';
    div.style.boxShadow = `2px 2px 5px ${shadowColor}`;
    div.innerHTML = context.count;
    div.style.lineHeight = size + 'px';
    div.style.color = fontColor;
    div.style.fontSize = '18px';
    div.style.fontWeight = 'bold';
    div.style.textAlign = 'center';
    context.marker.setOffset(new AMap.Pixel(-size / 2, -size / 2));
    context.marker.setContent(div)
};

// 未聚合的点的渲染方法
const _renderMarker = function(context) {
    

    const image = `../sites/${context.data[0].name}.jpg`;        // 创建标记，使用对应类别的样式
    context.marker.setLabel(
            {
                offset: new AMap.Pixel(1, -1),
                content: context.data[0].name,
                direction: 'right',
            })
    context.marker.setContent(markerStyles[context.data[0].category].content);

    // 点击标记显示信息窗体
    context.marker.on('click', () => {
        // 获取景点描述
        let description = '';
        try {
            const response = fetch(`../sites/${context.data[0].name}.txt`);
            if (response.ok) {
                description = response.text();
            } else {
                description = '暂无介绍';
            }
        } catch (e) {
            description = '暂无介绍';
        }
        // 创建信息窗体
        infoWindow = new AMap.InfoWindow({
            content: `
                <div style="width:220px; max-height:180px; overflow:auto;">
                    <h3 style="margin-top:5px;">${context.data[0].name}</h3>
                    <img loading="lazy" src="${image}" alt="${context.data[0].name}" style="width:200px; margin:5px 0;"><br>
                    <button id="add-to-selected" style="background:#4CAF50; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px; margin-top:5px;">添加到行程</button>
                    <p style="font-size:14px; line-height:1.5;">${description}</p>
                </div>
            `,
            offset: new AMap.Pixel(0, -30)
        });

        // 鼠标滚轮事件用于上下滚动infoWindow内容
        infoWindow.on('open', () => {
            const infoWindowContent = document.querySelector('.amap-info-content');
            if (infoWindowContent) {
            infoWindowContent.addEventListener('wheel', (event) => {
                event.stopPropagation(); // 阻止地图缩放
            });
            }
        });
        // 关闭之前的信息窗体
        if (window.currentInfoWindow) {
            window.currentInfoWindow.close();
        }
        infoWindow.open(map, context.marker.getPosition());
        window.currentInfoWindow = infoWindow;

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
                        newItem.textContent = context.data[0].name;
                        
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
        
}


//#region 函数

document.addEventListener('DOMContentLoaded', async function() {
    // 加载GeoJSON数据
    try {
        const response = await fetch('../geojsonGCJ/points_of_interest.geojson');
        const geojsonData = await response.json();
        const poifeatures = geojsonData.features;
        
        // 初始化清空按钮
        initClearButton();
        
        // 规划路线按钮事件
        document.getElementById('planRouteBtn').addEventListener('click', planRoute);
        
        // 添加景点到列表
        const scenicList = document.querySelector('.scenic-list ul');
        if (scenicList) {
            scenicList.innerHTML = '';
            poifeatures.forEach(feature => {
                if (!['history', 'nature', 'culture'].includes(feature.properties.category)) {
                    return;
                }
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
            poifeatures.forEach(feature => {
                const li = document.createElement('li');
                li.textContent = feature.properties.name;
                li.setAttribute('data-category', feature.properties.category);
                poilist.appendChild(li);
            });
        }

    } catch (error) {
        console.error('加载景点数据失败:', error);
    }
});

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

// 添加景点标记到地图
function addPoisToMap(category = 'all', poiFeatures = []) {
    // 每次重绘前删除现有的聚合标记
    if (markerCluster) {
        markerCluster.setMap(null); // 解除与地图的关联
        markerCluster.setData(null);
        markerCluster = null; // 释放引用
    }

    // 转换GeoJSON数据为点集
    const points = poiFeatures.map(feature => ({
        name: feature.properties.name,
        lnglat: new AMap.LngLat(feature.geometry.coordinates[0], feature.geometry.coordinates[1]),
        category: feature.properties.category,
        position: feature.geometry.coordinates,
        type: feature.geometry.type,
        weight: 1
    }));
    console.log('转换后的点集:', points);

    // 根据category筛选点
    const filteredPoints = category === 'all' 
        ? points 
        : points.filter(point => point.category === category);

    // 将标记添加到地图
    markerCluster = new AMap.MarkerClusterer(map, filteredPoints, {
        gridSize: 30,
        renderClusterMarker: _renderClusterMarker, // 自定义聚合点样式
        renderMarker: _renderMarker, // 自定义非聚合点样式
    });
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
        
        // 构建中间景点坐标数组
        let middlePoints = [];
        selectedPoints.forEach(point => {
            const feature = poiFeatures.find(f => f.properties.name === point);
            if (feature) {
                const coords = feature.geometry.coordinates;
                middlePoints.push(new AMap.LngLat(coords[0], coords[1]));
            }
        });

        // TSP优化：根据中间点数量选择算法
        function permute(arr) {
            if (arr.length <= 1) return [arr];
            let result = [];
            for (let i = 0; i < arr.length; i++) {
                let rest = arr.slice(0, i).concat(arr.slice(i + 1));
                let restPerm = permute(rest);
                for (let perm of restPerm) {
                    result.push([arr[i]].concat(perm));
                }
            }
            return result;
        }

        function calcRouteLen(pointsArr) {
            let len = 0;
            let prev = startPoint;
            for (let p of pointsArr) {
                len += prev.distance(p);
                prev = p;
            }
            len += prev.distance(endPoint);
            return len;
        }

        // 最近邻启发式算法
        function nearestNeighbor(pointsArr) {
            let unvisited = pointsArr.slice();
            let order = [];
            let current = startPoint;
            while (unvisited.length > 0) {
                let minIdx = 0;
                let minDist = current.distance(unvisited[0]);
                for (let i = 1; i < unvisited.length; i++) {
                    let d = current.distance(unvisited[i]);
                    if (d < minDist) {
                        minDist = d;
                        minIdx = i;
                    }
                }
                order.push(unvisited[minIdx]);
                current = unvisited[minIdx];
                unvisited.splice(minIdx, 1);
            }
            return order;
        }

        let bestOrder = middlePoints;
        let minLen = Infinity;
        if (middlePoints.length > 1 && middlePoints.length <= 5) { // 5以内全排列
            let allOrders = permute(middlePoints);
            for (let order of allOrders) {
                let l = calcRouteLen(order);
                if (l < minLen) {
                    minLen = l;
                    bestOrder = order;
                }
            }
        } else if (middlePoints.length > 5) { // 超过5个用最近邻
            bestOrder = nearestNeighbor(middlePoints);
        }

        // 构建路径点数组：起点-最优中间点顺序-终点
        let routePoints = [startPoint, ...bestOrder, endPoint];
        
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
            lineJoin: 'round',
            showDir: true
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
