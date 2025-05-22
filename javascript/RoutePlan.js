
// 景点名称到坐标的映射
const poiCoords = {
    '东门': [116.315817,39.992129],
    '南门': [116.311537, 39.986601],
    '西门': [116.304572, 39.994556],
    '未名湖': [116.310501, 39.994628],
    '办公楼': [116.306451,39.994587],
    '博雅塔': [116.311843, 39.993964],
    '蔡元培铜像': [116.307364,39.994333],
    '慈济寺山门': [116.310389,39.994075],
    '丹陛石': [116.306008,39.994628],
    '档案馆': [116.306478,39.993874],
    '德才均备斋': [116.308648,39.995454],
    '第二体育馆': [116.308099,39.990734],
    '第一体育馆': [116.31153,39.995298],
    '断桥残雪石牌坊构件': [116.309703,39.99731],
    '俄文楼': [116.308706,39.99285],
    '翻尾石鱼': [116.308318,39.994316],
    '方池': [116.306328,39.996284],
    '革命烈士纪念碑': [116.30819,39.992155],
    '葛利普墓': [116.305331,39.993749],
    '国立西南联合大学纪念碑': [116.305269,39.993722],
    '海晏堂引水槽': [116.304767,39.993987],
    '杭爱碑': [116.308596,39.992112],
    '花神庙碑': [116.30998,39.994086],
    '华表': [116.305475,39.994521],
    '静园': [116.308047,39.991695],
    '镜春园': [116.309296,39.996504],
    '赖朴吾、夏仁德墓': [116.3092,39.993777],
    '朗润园': [116.30988,39.99803],
    '李大钊像': [116.308169,39.992897],
    '临湖轩': [116.309,39.993596],
    '鲁斯亭': [116.309901,39.994751],
    '梅石碑': [116.308403,39.993373],
    '民主楼': [116.30642,39.995309],
    '鸣鹤园': [116.305315,39.9953],
    '南北阁': [116.307501,39.992893],
    '旗杆座（1934）': [116.310344,39.994057],
    '旗杆座（1952）': [116.305359,39.993995],
    '乾隆御制诗碑': [116.30799,39.994296],
    '日晷': [116.30591,39.995295],
    '塞万提斯像': [116.305994,39.992799],
    '三一八遇难烈士纪念碑': [116.306489,39.993373],
    '石雕五供及石供桌': [116.308907,39.993841],
    '石舫': [116.309901,39.994751],
    '石盆': [116.309012,39.99353],
    '石屏风': [116.309999,39.995805],
    '石麒麟': [116.306305,39.994615],
    '守仁国际中心建筑群': [116.310777,39.993554999],
    '斯诺墓': [116.31041,39.993893],
    '体斋 健斋 全斋': [116.309474,39.995811],
    '外文楼': [116.305906,39.99504],
    '西式平桥': [116.309151,39.995045],
    '校景亭': [116.306558,39.996225],
    '校友桥': [116.305062,39.994592],
    '燕南园': [116.308725,39.989572],
    '振兴中华碑': [116.310448,39.992544],
    '治贝子园': [116.314541,39.98905],
    '钟亭': [116.307987,39.994391]
};

document.addEventListener('DOMContentLoaded', function() {
    const scenicList = document.querySelector('.scenic-list ul');
    if (scenicList) {
        scenicList.innerHTML = '';
        Object.keys(poiCoords).forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            li.setAttribute('data-category', getCategoryForPoi(name)); // Add category attribute to list item
            scenicList.appendChild(li);
        });
    }
});



function getCategoryForPoi(poiName) {
    const poiListItems = document.querySelectorAll('.poi-list li');
    for (const item of poiListItems) {
        if (item.textContent.trim() === poiName) { // Use .trim() to remove whitespace
            return item.getAttribute('data-category') || 'all';
        }
    }
    return 'all';
}


// 初始化步行导航插件
let walking;
walking = new AMap.Walking({
    map: map,
});


// 全局变量，存储当前路线polyline
let currentRoutePolyline = null;
let currentMarkers = [];

// 搜索地点经纬度
function searchPoint(target) {
    return new Promise((resolve, reject) => {
        // 先检查是否是已定义的景点
        if (poiCoords[target]) {
            const coords = poiCoords[target];
            resolve(new AMap.LngLat(coords[0], coords[1]));
            return;
        }
        
        
        let geocoder = new AMap.Geocoder({
            city: "北京", // 限定在北京范围内搜索
            radius: 1000 // 搜索半径
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

// 为景点列表添加双击事件
function initScenicListEvents() {
    document.querySelectorAll('.scenic-list ul:first-child li').forEach(function(item) {
        item.addEventListener('dblclick', function() {
            var selectedList = document.getElementById('selected-list');
            
            // 检查是否已经添加过
            let isDuplicate = false;
            selectedList.querySelectorAll('li').forEach(existingItem => {
                if (existingItem.textContent === this.textContent) {
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

// 添加景点标记到地图
async function addPoisToMap(category = 'all') {
    // 清除之前的标记
    if (currentMarkers.length > 0) {
        map.remove(currentMarkers);
        currentMarkers = [];
    }
    
    for (const name in poiCoords) {
        // Check if the POI belongs to the selected category
        const poiCategory = getCategoryForPoi(name);
        if (category !== 'all' && poiCategory !== category) {
            continue; // Skip if not in the selected category
        }


        const coords = poiCoords[name];
        if (!coords || coords.length !== 2) continue;

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

        const image = `../sites/${name}.jpg`;

        // 创建标记
        const marker = new AMap.Marker({
            position: coords,
            map: map,
            title: name
        });
        
        currentMarkers.push(marker);

        // 创建信息窗体
        const infoWindow = new AMap.InfoWindow({
            content: `
                <div style="width:220px; max-height:180px; overflow:auto;">
                    <h3 style="margin-top:5px;">${name}</h3>
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
                        const selectedList = document.getElementById('selected-list');
                        
                        // 检查是否已添加
                        let isDuplicate = false;
                        selectedList.querySelectorAll('li').forEach(item => {
                            if (item.textContent.includes(name)) {
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
    }
}

// Function to remove all POI markers from the map
function removePoisFromMap() {
    if (currentMarkers.length > 0) {
        map.remove(currentMarkers);
        currentMarkers = [];
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

    // 获取已选景点
    const selectedItems = document.querySelectorAll('#selected-list li');
    const selectedPoints = [];
    
    selectedItems.forEach(function(li) {
        // 去除删除按钮的文本
        const name = li.textContent.replace(' ×', '').trim();
        if (poiCoords[name]) {
            selectedPoints.push(name);
        }
    });
    
    // 先获取起点和终点坐标
    Promise.all([
        searchPoint(startText),
        searchPoint(endText)
    ]).then(function(results) {
        const startPoint = results[0];
        const endPoint = results[1];
        
        // 构建路径点数组
        let routePoints = [startPoint];
        
        // 添加中间景点
        selectedPoints.forEach(point => {
            const coords = poiCoords[point];
            if (coords && coords.length === 2) {
                routePoints.push(new AMap.LngLat(coords[0], coords[1]));
            }
        });
        
        // 添加终点
        routePoints.push(endPoint);
        
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
    
    // 清除之前的覆盖物但保留标记
    if (currentRoutePolyline) {
        map.remove(currentRoutePolyline);
    }
    
    let pathSegments = [];
    let promiseArray = [];
    
    // 创建每段路径的Promise
    for (let i = 0; i < points.length - 1; i++) {
        promiseArray.push(new Promise((resolve, reject) => {
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
        alert('路线规划出错: ' + error);
    });
}

// 初始化事件
document.addEventListener('DOMContentLoaded', function() {
    // 初始化景点列表双击事件
    initScenicListEvents();
    
    // 初始化清空按钮
    initClearButton();
    
    // 规划路线按钮事件
    document.getElementById('planRouteBtn').addEventListener('click', planRoute);
    
    
});