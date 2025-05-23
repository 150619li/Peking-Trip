// 全局变量，用于存储地图实例和状态
let map;
let isMapInitialized = false;
let currentInfoWindow = null;
// 初始化步行导航插件
let walking;

// 初始化高德地图
function initializeMap() {
    if (isMapInitialized) return;
    
    // 设置canvas性能优化
    const mapOpts = {
        center: [116.310918, 39.992873],
        zoom: 15,
        mapStyle: 'amap://styles/normal',
        resizeEnable: true,
        viewMode: '2D',
        crs: 'EPSG3857',
        webGL: true,
        optimizePanAnimation: true,
        canvasRenderOptions: {
            willReadFrequently: true // 添加这个属性来优化getImageData的性能
        }
    };
    
    map = new AMap.Map('map', mapOpts);

    // 添加地图控件
    map.plugin(['AMap.ToolBar', 'AMap.Scale', 'AMap.HawkEye', 'AMap.MapType','AMap.Walking','AMap.MarkerCluster','AMap.Icon'], function() {
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
        
        // 地图类型切换控件
        map.addControl(new AMap.MapType({
            defaultType: 0 // 默认显示普通地图
        }));        
        
        // 初始化步行导航插件，不直接在地图上显示路线
        walking = new AMap.Walking({
            map: null,  // 不在地图上显示
            autoFitView: false
        });

    });
    
    isMapInitialized = true;
}

// 创建北大校园边界
function createCampusBoundary() {

    // 北大校园边界坐标点
    const pkuBoundary = [
        [116.30566877129714, 39.9862958897499], 
        [116.30534141686996, 39.98829744569817],
         [116.30495199627971, 39.9906549199914],
          [116.30494099514353, 39.990806908711356],
           [116.30305758228388, 39.99068093973495],
            [116.30290954385956, 39.99247278403402],
             [116.30289854263573, 39.992618773030124],
              [116.30204603730027, 39.992562458050394],
               [116.29967700342758, 39.9926339020132],
                [116.29929437128965, 39.9926633410207],
                 [116.29722312720769, 39.9935583980745],
                  [116.2962546087516, 39.99355704212381],
                   [116.2959041207853, 39.99398357522936],
                    [116.2957339353563, 39.99459036634729],
                     [116.29739351783383, 39.99451967911565],
                      [116.29723229868436, 39.99481446330577],
                       [116.297428657728, 39.995191756951336],
                        [116.29755790351753, 39.99550995370148],
                         [116.29848640082962, 39.995512284230465],
                          [116.29955617810481, 39.99564184924531],
                           [116.29981855778874, 39.9951772166464],
                            [116.30033040225783, 39.99504897067712],
                             [116.30039377897509, 39.997205155429796],
                              [116.30188333764575, 39.99723040408803],
                               [116.30323172199556, 39.997317486480824],
                                [116.30442988850213, 39.99740637132927],
                                 [116.30513618606003, 39.99746349713489],
                                  [116.30612302247685, 39.99753908746369],
                                   [116.30704476802731, 39.997654592760576],
                                    [116.30747060902542, 39.997921302900764],
                                     [116.30788144108163, 39.99830699679474],
                                      [116.30824919324766, 39.998680621905336],
                                       [116.30876523271884, 39.999029496029465],
                                        [116.30940752241479, 39.99935458636313],
                                         [116.31016703383158, 39.999522876271044],
                                          [116.31108286469077, 39.99964244174377],
                                           [116.31216605007913, 39.99973830988804],
                                            [116.31500989055839, 39.999818296727305],
                                             [116.31530344256068, 39.99934379796976],
                                              [116.31623022977608, 39.99811139984019],
                                               [116.31701589270594, 39.99814281237257], 
                                               [116.31710707584722, 39.99806197327778],
                                                [116.31883978803394, 39.998151119186176],
                                                 [116.31980681497559, 39.997667867994004],
                                                  [116.3198168106454, 39.99746087763383], 
                                                  [116.32018859148377, 39.99725555198291],
                                                   [116.3204129325123, 39.99608691584463], 
                                                   [116.32071930949697, 39.9937743841401], 
                                                   [116.32184862126735, 39.992501420962704],
                                                    [116.3216707703077, 39.98883394020945],
                                                     [116.31746263457272, 39.9885252194952], 
                                                     [116.31752567889211, 39.987809304208646],
                                                      [116.31605355686472, 39.98773365369561], 
                                                      [116.31614061996208, 39.98677777051356], 
                                                      [116.31598726242223, 39.98649548472043], 
                                                      [116.31549022286036, 39.98650659835796], 
                                                      [116.31465849590964, 39.98653812351414], 
                                                      [116.31388790411427, 39.98653176468868], 
                                                      [116.31108922751393, 39.986471906523455],
                                                       [116.30911633433163, 39.986412560951806],
                                                        [116.30582406117374, 39.9863111405093], 
                                                        [116.30566877129714, 39.9862958897499]
];
    
    // 创建多边形
    const polygon = new AMap.Polygon({
        path: pkuBoundary,
        strokeColor: "#91242c",  // 边框颜色
        strokeWeight: 3,         // 边框宽度
        strokeOpacity: 0.8,      // 边框透明度
        fillColor: '#91242c',    // 填充颜色
        fillOpacity: 0.05        // 填充透明度
    });
    
    // 将多边形添加到地图
    map.add(polygon);
}

// 注册地图事件
function registerMapEvents() {
    
    // 点击事件监听
    map.on('click', function(e) {
        if (currentInfoWindow) {
            currentInfoWindow.close();
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

                        // 将标记添加到地图
                        map.add(locationMarker);

                        // 将地图中心设置为当前位置
                        map.setCenter(gcj02Pos);

                        // 2秒后移除标记
                        setTimeout(function() {
                            map.remove(locationMarker);
                        }, 2000);
                    } else {
                        alert('坐标转换失败');
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
        });
    }
    else {
        alert("浏览器不支持定位");
    }
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
    addPoisToMap('all');
    
});