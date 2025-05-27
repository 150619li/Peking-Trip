//#region 变量 

// 全局变量，存储当前路线polyline
let poiFeatures = [];
let currentRoutePolyline = null;
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
    let bgColor = 'hsla(' + Hue + ',100%,100%,0.3)';
    let fontColor = 'hsla(' + Hue + ',100%,50%,0.3)';
    let borderColor = 'hsla(' + Hue + ',100%,0%,0.3)';
    let shadowColor = 'hsla(' + Hue + ',100%,10%,0.3)';
    div.style.backgroundColor = bgColor;
    let size = Math.round(15 + Math.pow(context.count / count, 1 / 5) * 20);
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
    // 点击事件：以该点为中心放大地图
    context.marker.on('click', () => {
        // 获取聚合点位置
        const position = context.marker.getPosition();
        // 获取当前地图级别
        const currentZoom = map.getZoom();
        // 设置新的地图级别（当前级别+1）
        const newZoom = Math.min(currentZoom + 1, 20); // 最大级别限制为18
        
        // 以点击点为中心，设置新的地图级别和中心点
        map.setZoomAndCenter(newZoom, position);
    });
};

// 获取景点描述并返回Promise
function fetchDescription(name) {
  return fetch(`sites/${name}.txt`)
    .then(response => {
      if (response.ok) {
        return response.text();
      } else {
        throw new Error('景点介绍文件不存在');
      }
    })
    .catch(error => {
      return '暂无介绍';
    });
}

// 未聚合的点的渲染方法
const _renderMarker = function(context) {
    
    const image = `sites/${context.data[0].name}.jpg`;        // 创建标记，使用对应类别的样式
    
    context.marker.setLabel(
            {
                offset: new AMap.Pixel(1, -1),
                content: context.data[0].name,
                direction: 'right',
            })
    context.marker.setContent(markerStyles[context.data[0].category].content);

    // 点击标记显示信息窗体
    context.marker.on('click', () => {
        fetchDescription(context.data[0].name)
            .then(description => {
            // 创建信息窗体
            const infoWindow = new AMap.InfoWindow({
                content: `
                <div style="width:220px; max-height:200px; overflow:auto;">
                    <h3 style="margin-top:5px;">${context.data[0].name}</h3>
                    <img loading="lazy" src="${image}" alt="${context.data[0].name}" style="width:200px; margin:5px,0;"><br>
                    <button id="add-to-selected" style="background:#4CAF50; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px; margin-top:5px;">添加到行程</button>
                    <p style="font-size:8px; line-height:1.5;">${description}</p>
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
                    if (existingItem.textContent.replace(' ×', '').trim() === context.data[0].name.trim()) {
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
    });
}


//#region 函数

document.addEventListener('DOMContentLoaded', async function() {
    // 加载GeoJSON数据
    try {
        const response = await fetch('geojsonGCJ/points_of_interest.geojson');
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
                if (!['history', 'nature', 'culture'].includes(feature.properties.category)) {
                    return;
                }
                const li = document.createElement('li');
                li.textContent = feature.properties.name;
                li.setAttribute('data-category', feature.properties.category);
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.alignItems = 'center';

                const addBtn = document.createElement('button');
                addBtn.textContent = '添加到行程';
                addBtn.style = "background:#4CAF50;color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px; margin-left:10px;";
                addBtn.addEventListener('click', function() {
                    var selectedList = document.getElementById('selected-list');
                    
                    // 检查是否已添加
                    let isDuplicate = false;
                    selectedList.querySelectorAll('li').forEach(existingItem => {
                        if (existingItem.textContent.replace(' ×', '').trim() === li.textContent.replace('添加到行程', '').trim()) {
                            isDuplicate = true;
                        }
                    });
                    
                    if (!isDuplicate) {
                        const newItem = document.createElement('li');
                        newItem.textContent = li.textContent.replace('添加到行程', '').trim();
                        
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
                        // 提醒添加完成
                        const notification = document.createElement('div');
                        notification.textContent = '已添加到行程';
                        notification.style.position = 'fixed';
                        notification.style.bottom = '20px';
                        notification.style.right = '20px';
                        notification.style.backgroundColor = '#4CAF50';
                        notification.style.color = 'white';
                        notification.style.padding = '10px 20px';
                        notification.style.borderRadius = '5px';
                        notification.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
                        notification.style.zIndex = '1000';
                        document.body.appendChild(notification);

                        setTimeout(() => {
                            notification.remove();
                        }, 800);
                    } else {
                        const notification = document.createElement('div');
                        notification.textContent = '已在行程中';
                        notification.style.position = 'fixed';
                        notification.style.bottom = '20px';
                        notification.style.right = '20px';
                        notification.style.backgroundColor = '#4CAF50';
                        notification.style.color = 'white';
                        notification.style.padding = '10px 20px';
                        notification.style.borderRadius = '5px';
                        notification.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
                        notification.style.zIndex = '1000';
                        document.body.appendChild(notification);

                        setTimeout(() => {
                            notification.remove();
                        }, 800);
                    }
                });
                li.appendChild(addBtn);
                poilist.appendChild(li);
            });


            initPoiListEvents()
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

// 初始化景点列表事件
function initPoiListEvents() {
    document.querySelectorAll('.poi-list ul li').forEach(function(item) {
        item.addEventListener('mouseover', function() {
            const poiName = item.textContent.replace('添加到行程', '').trim();
            const image = `../sites/${poiName}.jpg`;

            fetchDescription(poiName).then(description => {
                
                const infoBox = document.getElementById('info-box') || document.createElement('div');

                infoBox.id = 'info-box';
                infoBox.style.position = 'absolute';
                infoBox.style.left = `${item.getBoundingClientRect().left - 250}px`; // Adjust left position to place it on the left of the item
                infoBox.style.top = `${item.getBoundingClientRect().top + window.scrollY}px`; // Adjust top position relative to the item
                if(item.getBoundingClientRect().top + window.scrollY+280>document.body.getBoundingClientRect().bottom)
                    infoBox.style.top = `${document.body.getBoundingClientRect().bottom - 280}px`
                infoBox.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                infoBox.style.padding = '10px';
                infoBox.style.border = '1px solid #ccc';
                infoBox.style.borderRadius = '5px';
                infoBox.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
                infoBox.style.zIndex = '1000';
                infoBox.innerHTML = `
                    <div style="width:220px; max-height:200px; overflow:auto;">
                        <h3 style="margin-top:5px;">${poiName}</h3>
                        <img loading="lazy" src="${image}" alt="${poiName}" style="width:200px; margin:5px,0;"><br>
                        <p style="font-size:8px; line-height:1.5;">${description}</p>
                    </div>
                `;
                
                document.body.appendChild(infoBox);

            });
        });

        item.addEventListener('mouseout', function() {
            const infoBox = document.getElementById('info-box');
            if (infoBox) {
                infoBox.remove();
            }
        });

        const addBtn = document.getElementById('add-to-selected');
        if (addBtn) {
            addBtn.onclick = () => {
                var selectedList = document.getElementById('selected-list');
                
                // 检查是否已添加
                let isDuplicate = false;
                selectedList.querySelectorAll('li').forEach(existingItem => {
                if (existingItem.textContent.replace(' ×', '').trim() === context.data[0].name.trim()) {
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

    if (!endText) {
        alert('请填写终点');
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

        // TSP优化：根据中间点数量选择算法，最小化重复路线
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

        function calcRouteOverlap(pointsArr) {
            let overlap = 0;
            let prev = startPoint;
            for (let p of pointsArr) {
            overlap += prev.distance(p);
            prev = p;
            }
            overlap += prev.distance(endPoint);
            return overlap;
        }

        // 最近邻启发式算法，最小化重复路线
        function nearestNeighborMinOverlap(pointsArr) {
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
        let minOverlap = Infinity;
        if (middlePoints.length > 1 && middlePoints.length <= 5) { // 5以内全排列
            let allOrders = permute(middlePoints);
            for (let order of allOrders) {
            let overlap = calcRouteOverlap(order);
            if (overlap < minOverlap) {
                minOverlap = overlap;
                bestOrder = order;
            }
            }
        } else if (middlePoints.length > 5) { // 超过5个用最近邻
            bestOrder = nearestNeighborMinOverlap(middlePoints);
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
    
    // 创建每段路径的Promise并设置时延
    for (let i = 0; i < points.length - 1; i++) {
        promiseArray.push(new Promise((resolve, reject) => {
            setTimeout(() => {
                console.log(`计算第 ${i + 1} 段路线`);
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
            },i * 500); // 每次规划延迟500ms
        }));
    }
    
    // 等待所有路径规划完成
    Promise.all(promiseArray).then(async function(results) {
        let fullPath = [];
        let totalDistance = 0;
        let totalDuration = 0;
        
        // 合并所有路径段
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            fullPath = fullPath.concat(result.path);
            totalDistance += result.distance;
            totalDuration += result.duration;

            // 检查当前段的终点和下一段的起点是否相差过远
            if (i < results.length - 1) {
            const currentEnd = result.path[result.path.length - 1];
            const nextStart = results[i + 1].path[0];
            const distanceBetween = AMap.GeometryUtil.distance(currentEnd, nextStart);

            // 如果距离超过一定阈值（例如500米），再次调用步行规划
            if (distanceBetween > 10) {
                console.log(`段 ${i + 1} 和段 ${i + 2} 之间距离过远，重新规划中间路线`);
                await new Promise((resolve, reject) => {
                    setTimeout(() => {
                        walking.search(currentEnd, nextStart, function(status, result) {
                            if (status === 'complete' && result.routes && result.routes[0]) {
                            let segment = [];
                            result.routes[0].steps.forEach(function(step) {
                                segment = segment.concat(step.path);
                            });

                            // 将中间段加入路径
                            fullPath = fullPath.concat(segment);
                            totalDistance += result.routes[0].distance;
                            totalDuration += result.routes[0].time;
                            resolve();
                            } else {
                            console.error('中间段路径规划失败:', status, result);
                            reject('中间段路径规划失败');
                            }
                        });
                    }, timeout = 500); // 等待500ms
                });
            }
            }
        }
        
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
        // 在地图右上角显示相关信息
        const infoDiv = document.getElementById('route-info') || document.createElement('div');
        infoDiv.id = 'route-info';
        infoDiv.style.position = 'absolute';
        infoDiv.style.top = '10px';
        infoDiv.style.right = '10px';
        infoDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        infoDiv.style.padding = '10px';
        infoDiv.style.border = '1px solid #ccc';
        infoDiv.style.borderRadius = '5px';
        infoDiv.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
        infoDiv.style.zIndex = '1000';
        infoDiv.innerHTML = `
            <strong>路线规划完成！</strong><br>
            总距离: ${(totalDistance / 1000).toFixed(2)} 公里<br>
            预计时间: ${hours} 小时 ${minutes} 分钟<br>
            景点数量: ${points.length - 2} 个
        `;
        document.getElementById('map').appendChild(infoDiv);
        
    }).catch(function(error) {
        console.error(error);
        console.error('路线规划错误：', error);
        alert('路线规划出错: ' + error);
    });
}

//#endregion
