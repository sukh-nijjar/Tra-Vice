import os
import urllib.request as req
from flask import Flask, render_template, request, jsonify, json

# lines list is used to generate station names
lines = ["bakerloo","central","circle","district","hammersmith-city","jubilee",
         "metropolitan","northern","piccadilly","victoria","waterloo-city",
         "tfl-rail","london-overground"]

# brand_colours dict is used to pass correct line branding to views
brand_colours = {"bakerloo" : "#B36305", "central" : "#E32017", "circle" : "#FFD300",
                 "district" : "#00782A", "hammersmith-city" : "#F3A9BB", "jubilee" : "#A0A5A9",
                 "metropolitan" : "#9B0056", "london-overground" : "#e86a10", "northern" : "#000000",
                 "piccadilly" : "#003688", "tfl-rail" : "#0019a8", "victoria" : "#0098D4","waterloo-city" : "#95CDBA"}

app = Flask(__name__, instance_relative_config=True)
app.config.from_pyfile('config.py')

@app.route("/")
def index():
    # stations = get_all_stations()
    show_config()
    return render_template("index.html", colours = brand_colours)

@app.route("/arrivals", methods=["GET"])
def get_arrivals_for_station():
    print("/arrivals invoked")
    # print("STATION NAME {}, LINE {}".format(request.args.get("station"), request.args.get("line")))
    station_id = get_station_id(request.args.get("station"))
    print("...", station_id)
    line = request.args.get("line")
    # print("STATION ID {}, LINE {}".format(station_id, line))
    url = "https://api.tfl.gov.uk/Line/" + line + "/Arrivals/" + station_id
    print("url", url)
    try:
        arrivals = call_TFL_API(url)
        print("type(arrivals)")
        station_name = arrivals[0]["stationName"]
        return jsonify({"done" : arrivals,
                        "station" : station_name})
    except:
        message = "Unable to connect to TfL's API at the moment. Route = /arrivals."
        return jsonify({"error_msg" : message})

@app.route("/stations", methods=["GET"])
def get_stations():
    line = request.args.get("line")
    url = "https://api.tfl.gov.uk/Line/" + line + "/StopPoints"
    try:
        line_stations = call_TFL_API(url)
        return jsonify({"done" : line_stations})
    except:
        message = "Unable to connect to TfL's API at the moment. Route = /stations."
        return jsonify({"error_msg" : message})

def get_station_id(station_name):
    stops = station_data()
    for stop in stops:
        if stop["station_name"] == station_name:
            station_id = stop["station_id"]
    return station_id

# def get_stations_for_line(line):
#     stops = station_data()
#     stops_for_line = [stop for stop in stops if stop["line_id"] == line]
#     return stops_for_line

# def get_all_stations():
#     '''gets ALL stations'''
#     tube_stops_list = list()
#     tube_stops = station_data()
#     for stop in tube_stops:
#         #without this check station names get repeated
#         if tube_stops_list.count(stop["station_name"]) == 0:
#             tube_stops_list.append(stop["station_name"])
#     return tube_stops_list
#
def station_data():
    if os.path.isfile("all_stations.json"):
        with open("all_stations.json","r") as stations:
            return json.load(stations)

def call_TFL_API(url_in):
    url = url_in + app.config["TFL_CREDS"]
    conn = req.urlopen(url)
    data = conn.read()
    str_data = data.decode("utf8")
    API_response = json.loads(str_data)
    return API_response

if __name__ == "__main__":
    app.run(debug=True)
