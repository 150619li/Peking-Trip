import math
import geojson
import os


def transformLat(x, y):
    ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * math.sqrt(abs(x))
    ret += (20.0 * math.sin(6.0 * x * math.pi) + 20.0 * math.sin(2.0 * x * math.pi)) * 2.0 / 3.0
    ret += (20.0 * math.sin(y * math.pi) + 40.0 * math.sin(y / 3.0 * math.pi)) * 2.0 / 3.0
    ret += (160.0 * math.sin(y / 12.0 * math.pi) + 320 * math.sin(y * math.pi / 30.0)) * 2.0 / 3.0
    return ret


def transformLon(x, y):
    ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * math.sqrt(abs(x))
    ret += (20.0 * math.sin(6.0 * x * math.pi) + 20.0 * math.sin(2.0 * x * math.pi)) * 2.0 / 3.0
    ret += (20.0 * math.sin(x * math.pi) + 40.0 * math.sin(x / 3.0 * math.pi)) * 2.0 / 3.0
    ret += (150.0 * math.sin(x / 12.0 * math.pi) + 300.0 * math.sin(x / 30.0 * math.pi)) * 2.0 / 3.0
    return ret


def delta(lat, lon):
    a = 6378245.0  # 地球长半轴
    ee = 0.00669342162296594323  # 扁率
    dLat = transformLat(lon - 105.0, lat - 35.0)
    dLon = transformLon(lon - 105.0, lat - 35.0)
    radLat = lat / 180.0 * math.pi
    magic = math.sin(radLat)
    magic = 1 - ee * magic * magic
    sqrtMagic = math.sqrt(magic)
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * math.pi)
    dLon = (dLon * 180.0) / (a / sqrtMagic * math.cos(radLat) * math.pi)
    
    return dLat, dLon


def wgs84_to_gcj02(lng, lat):
    if out_of_china(lng, lat):
        return lng, lat
    dLat, dLon = delta(lat, lng)
    return lng + dLon, lat + dLat


def out_of_china(lng, lat):
    return not (72.004 <= lng <= 137.8347 and 0.8293 <= lat <= 55.8271)


def convert_coordinates(geometry):
    if geometry.type == 'Point':
        lng, lat = geometry.coordinates
        new_lng, new_lat = wgs84_to_gcj02(lng, lat)
        geometry.coordinates = (new_lng, new_lat)
    elif geometry.type in ['MultiPoint', 'LineString']:
        new_coords = [wgs84_to_gcj02(*coord) for coord in geometry.coordinates]
        geometry.coordinates = new_coords
    elif geometry.type in ['MultiLineString', 'Polygon']:
        new_coords = []
        for sub_coords in geometry.coordinates:
            new_sub_coords = [wgs84_to_gcj02(*coord) for coord in sub_coords]
            new_coords.append(new_sub_coords)
        geometry.coordinates = new_coords
    elif geometry.type == 'MultiPolygon':
        new_coords = []
        for polygon in geometry.coordinates:
            new_polygon = []
            for sub_coords in polygon:
                new_sub_coords = [wgs84_to_gcj02(*coord) for coord in sub_coords]
                new_polygon.append(new_sub_coords)
            new_coords.append(new_polygon)
        geometry.coordinates = new_coords
    return geometry


def convert_geojson(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        geojson_obj = geojson.load(f)

    if geojson_obj.type == 'FeatureCollection':
        for feature in geojson_obj.features:
            feature.geometry = convert_coordinates(feature.geometry)
    elif geojson_obj.type == 'Feature':
        geojson_obj.geometry = convert_coordinates(geojson_obj.geometry)
    elif hasattr(geojson_obj, 'type'):
        geojson_obj = convert_coordinates(geojson_obj)

    with open(output_file, 'w', encoding='utf-8') as f:
        geojson.dump(geojson_obj, f, ensure_ascii=False)


input_dir = './geojson/'
output_dir = './GCJgeojson/'
    
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

for filename in os.listdir(input_dir):
    if filename.endswith('.geojson'):
        input_file = os.path.join(input_dir, filename)
        output_file = os.path.join(output_dir, filename.replace('.geojson', 'GCJ.geojson'))
        convert_geojson(input_file, output_file)
        print(f'Converted {filename} to {output_file}')
        

    