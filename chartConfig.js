let config = {
    "backgroundColor":'#FBFCFE',
    "type": "radar",
    "plot": {
        "aspect": "area",
        "background-color": '#FBFCFE',
        "active-area": true
    },
    "plotarea":{
        "margin":'dynamic'
    },
    "scale-v": {
        "values": "0:10000:25",
        "labels": ["", "", "", "", ""],
        "ref-line": {
            "line-color": "none"
        },
        "guide": {
            "line-style": "solid",
            "line-color":'#D7D8D9'
        }
    },
    "scale-k": {
        "values": "0:330:30",
        "format": "%v°",
        "aspect": "circle", //To set the chart shape to circular.
        "guide": {
            "line-style": "solid",
            "line-color" : "#1E5D9E",
        },
        "item": {
            "padding": 5,
            "font-color" : "#1E5D9E",
            "font-family": 'Montserrat'
        },
    },
    "series": []
};

export default config;
