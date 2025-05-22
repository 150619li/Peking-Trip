import shapefile
import json
import os

def shp_to_geojson(shp_file_path, geojson_file_path):
    # Read the shapefile
    reader = shapefile.Reader(shp_file_path)
    fields = [field[0] for field in reader.fields[1:]]  # Skip the DeletionFlag field
    features = []

    for sr in reader.shapeRecords():
        attributes = dict(zip(fields, sr.record))
        geometry = sr.shape.__geo_interface__
        features.append({"type": "Feature", "geometry": geometry, "properties": attributes})

    # Create GeoJSON structure
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    # Write to GeoJSON file
    with open(geojson_file_path, 'w', encoding='utf-8') as geojson_file:
        json.dump(geojson, geojson_file, ensure_ascii=False, indent=4)

# Example usage
shp_folder = "./shapefile/"
geojson_folder = "./geojson/"

if not os.path.exists(geojson_folder):
    os.makedirs(geojson_folder)

for file_name in os.listdir(shp_folder):
    if file_name.endswith(".shp"):
        shp_file_path = os.path.join(shp_folder, file_name)
        geojson_file_path = os.path.join(geojson_folder, file_name.replace(".shp", ".geojson"))
        shp_to_geojson(shp_file_path, geojson_file_path)
