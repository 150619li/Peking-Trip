// 全局变量，用于存储地图实例和状态
let map;
let isMapInitialized = false;

// 初始化步行导航插件
let walking;
let userlocate;
let geocoder;

// 初始化高德地图
function initializeMap() {
    if (isMapInitialized) return;
    
    //设置canvas性能优化   
    const mapOpts = {
        center: [116.310918, 39.992873],
        zoom: 15,
        mapStyle: 'amap://styles/normal',
        viewMode: '3D',
        optimizePanAnimation: true,
        showLabel: false, // 关闭默认标注
    };
    map = new AMap.Map('map', mapOpts);
    
    
    
    // 添加地图控件
    map.plugin(['AMap.ToolBar', 'AMap.Scale', 'AMap.HawkEye', 'AMap.MapType','AMap.Geocoder','AMap.Walking','AMap.DistrictSearch','AMap.MarkerCluster','AMap.Icon','AMap.LngLat'], function() {
        // 工具条控件，默认位于地图右上角
        map.addControl(new AMap.ToolBar({
            position: 'LT',
            offset: new AMap.Pixel(10, 10)
        }));
        
        // 比例尺控件，显示地图在当前层级和纬度下的比例尺
        map.addControl(new AMap.Scale({
            position: 'LB'
        }));
        
        // 鹰眼控件，显示缩略图
        map.addControl(new AMap.HawkEye({
            isOpen: false
        }));       
        
        // 初始化步行导航插件，不直接在地图上显示路线
        walking = new AMap.Walking({
            map: null,  // 不在地图上显示
            autoFitView: false
        });
        
        geocoder = new AMap.Geocoder({
            city: "北京",
            radius: 1000
        });
    });
    
    isMapInitialized = true;

}

// 注册地图事件
function registerMapEvents() {
    
    // 点击事件监听
    map.on('click', function(e) {
        // 点击地图时关闭当前信息窗体
        if (window.currentInfoWindow) {
            window.currentInfoWindow.close();
            window.currentInfoWindow = null;
        }
        // if (e && e.lnglat) {
        //     alert(`${e.lnglat.getLng()},${e.lnglat.getLat()}`);
        // }
    });
    
    // 缩放事件监听
    map.on('zoomend', function() {
        const zoom = map.getZoom();
        
    });
      // 地图加载完成事件
    map.on('complete', function() {
        // 添加一个加载完成的提示
        const loadingTip = document.createElement('div');
        loadingTip.className = 'map-loaded-tip';
        loadingTip.textContent = '地图加载完成';
        loadingTip.style.position = 'absolute';
        loadingTip.style.top = '10px';
        loadingTip.style.left = '50%';
        loadingTip.style.transform = 'translateX(-50%)';
        loadingTip.style.backgroundColor = 'rgba(0,0,0,0.6)';
        loadingTip.style.color = 'white';
        loadingTip.style.padding = '8px 12px';
        loadingTip.style.borderRadius = '4px';
        loadingTip.style.zIndex = '999';
        
        document.body.appendChild(loadingTip);

        // 2秒后移除提示
        setTimeout(function() {
            loadingTip.style.opacity = '0';
            loadingTip.style.transition = 'opacity 0.5s';
            setTimeout(function() {
                document.body.removeChild(loadingTip);
            }, 500);
        }, 2000);
    });
}

// 定位按钮点击事件
function locateUser() {
    // 检测浏览器是否支持定位
    if (navigator.geolocation) {
        // 添加定位按钮
        const locateBtn = document.createElement('button');
        locateBtn.id = 'locate-btn';
        locateBtn.innerHTML = '定位';
        locateBtn.style.position = 'absolute';
        locateBtn.style.bottom = '20px';
        locateBtn.style.right = '20px';
        locateBtn.style.zIndex = '100';
        locateBtn.style.padding = '10px 15px';
        locateBtn.style.backgroundColor = '#91242c';
        locateBtn.style.color = 'white';
        locateBtn.style.border = 'none';
        locateBtn.style.borderRadius = '4px';
        locateBtn.style.cursor = 'pointer';
        
        document.getElementById('map').appendChild(locateBtn);
        
        // 定位按钮点击事件
        locateBtn.addEventListener('click', function() {
            locateUser();
        });
    }
    else {
        alert("浏览器不支持定位");
    }
}

function locateUser() {
    navigator.geolocation.getCurrentPosition(function(position) {
        const currentPos = [position.coords.longitude, position.coords.latitude];
        // 将点转换为GCJ02坐标系
        AMap.convertFrom(currentPos, 'gps', function(status, result) {
            if (status === 'complete' && result.locations && result.locations.length > 0) {
                const gcj02Pos = result.locations[0];
                // 创建当前位置标记
                const locationMarker = new AMap.Marker({
                    position: gcj02Pos,
                    title: '当前位置',
                });

                userlocate = gcj02Pos;
                // 将标记添加到地图
                map.add(locationMarker);

                // 2秒后移除标记
                setTimeout(function() {
                    map.remove(locationMarker);
                }, 2000);
            }
        });
        
    }, function(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                alert("用户拒绝了位置请求");
                break;
            case error.POSITION_UNAVAILABLE:
                alert("位置信息不可用");
                break;
            case error.TIMEOUT:
                alert("请求超时");
                break;
            case error.UNKNOWN_ERROR:
                alert("未知错误");
                break;
        }
    });
}


// 在DOM加载完成后初始化地图
document.addEventListener('DOMContentLoaded', function() {

    // 初始化地图
    initializeMap();
    // 注册地图事件
    registerMapEvents();
    // 添加定位按钮
    
    locateUser();
    // 添加景点标记
    fetch('geojsonGCJ/points_of_interest.geojson')
    .then(response => response.json())
    .then(data => {
        poiFeatures = data.features;
        console.log('景点数据加载成功:', poiFeatures);
        addPoisToMap('all', poiFeatures);
    })
    .catch(error => {
        console.error('加载景点数据失败:', error);
    });

});
// 标签页切换
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        // 移除所有活动状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        // 设置当前活动标签
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab') + '-tab';
        document.getElementById(tabId).classList.add('active');

        addPoisToMap("all", poiFeatures);
    });
});

// 景点分类筛选
document.querySelectorAll('.category-btn').forEach(button => {
    button.addEventListener('click', () => {
        // 移除所有活动状态
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 设置当前活动分类
        button.classList.add('active');
        const category = button.getAttribute('data-category');
        
        // 筛选景点列表
        document.querySelectorAll('.poi-list li').forEach(item => {
            if (category === 'all' || item.getAttribute('data-category') === category) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
        addPoisToMap(category, poiFeatures);
    });
});

// 搜索功能
document.getElementById('search-btn').addEventListener('click', () => {
    const searchText = document.getElementById('poi-search').value.toLowerCase();
    
    document.querySelectorAll('.poi-list li').forEach(item => {
        if (item.textContent.toLowerCase().includes(searchText)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
});

document.getElementById('clear-selected').addEventListener('click', () => {
    const selectedList = document.getElementById('selected-list');
    selectedList.innerHTML = '';
    isfinished= false;
    addPoisToMap("all", poiFeatures);
});

if (navigator.geolocation){
// 每十秒自动定位一次
setInterval(() => {
        locateUser();

        if(isinnavigate){
            navigate();
        }
    }, 1000);
}