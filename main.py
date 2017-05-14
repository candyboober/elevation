import urllib2
import json
import math
import time

from flask import Flask, send_from_directory, request, jsonify


class Point(object):
    lat = None
    lng = None

    def __init__(self, lat, lng):
        self.lat = lat
        self.lng = lng
    
    def to_dict(self):
        return {'lat': self.lat, 'lng': self.lng}


app = Flask(
    __name__,
    static_url_path='',
    static_path='',
    static_folder='')


@app.route('/')
def main():
    return send_from_directory('./', 'index.html')

@app.route('/elevation')
def elevation():
    samples = int(request.args.get('samples'))
    radius = float(request.args.get('radius'))
    lat = float(request.args.get('lat'))
    lng = float(request.args.get('lng'))
    start_point = Point(lat, lng)

    coordinates = []
    for angle in range(0, 360, 30):
        end_point = find_point(start_point, angle, radius)
        url = 'https://maps.googleapis.com/maps/api/elevation/json?'
        url += 'path=' + str(lat) + ',' + str(lng) + '|' + str(end_point.lat) + ',' + str(end_point.lng) + '&'
        url += 'samples=' + str(samples) + '&'
        data = point_set_request(url)
        coordinates.append(data['results'])
    return jsonify(coordinates=coordinates)

def point_set_request(url):
    data = urllib2.urlopen(url).read()
    data = json.loads(data)
    if data['status'] == 'OVER_QUERY_LIMIT':
        time.sleep(10)
        return point_set_request(url)
    return data

def find_point(point, angle, radius):
    radius = radius / 6371
    angle = math.radians(angle)

    lat1 = math.radians(point.lat)
    lon1 = math.radians(point.lng)

    lat2 = math.asin(math.sin(lat1) * math.cos(radius) + math.cos(lat1) * math.sin(radius) * math.cos(angle))
    lon2 = lon1 + math.atan((math.sin(angle) * math.sin(radius) * math.cos(lat1)) / (math.cos(radius) - math.sin(lat1) * math.sin(lat2)))

    if not lat2 or not lon2:
        return
    return Point(math.degrees(lat2), math.degrees(lon2))


if __name__ == "__main__":
    app.run(port=8000)



"""
{
   "results" : [
      {
         "elevation" : 1608.637939453125,
         "location" : {
            "lat" : 39.7391536,
            "lng" : -104.9847034
         },
         "resolution" : 4.771975994110107
      },
      {
         "elevation" : 3251.718994140625,
         "location" : {
            "lat" : 39.03257170491495,
            "lng" : -108.0542368731527
         },
         "resolution" : 19.08790397644043
      },
      {
         "elevation" : 1457.90478515625,
         "location" : {
            "lat" : 38.24719882023104,
            "lng" : -111.0596726840248
         },
         "resolution" : 19.08790397644043
      },
      {
         "elevation" : 1281.93505859375,
         "location" : {
            "lat" : 37.38687439682973,
            "lng" : -113.9978494204667
         },
         "resolution" : 9.543951988220215
      },
      {
         "elevation" : -50.78903961181641,
         "location" : {
            "lat" : 36.455556,
            "lng" : -116.866667
         },
         "resolution" : 19.08790397644043
      }
   ],
   "status" : "OK"
}
"""