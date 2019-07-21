import React from "react";
import OlMap from "ol/Map";
import OlView from "ol/View";
import OlLayerTile from "ol/layer/Tile";
import OlSourceOSM from "ol/source/OSM";
import {
  defaults as defaultControls,
  ScaleLine,
  MousePosition,
} from 'ol/control';
import {
  defaults as defaultInteraction,
  MouseWheelZoom,
} from 'ol/interaction';

class GisMap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      center: [139.692101, 35.689634],  // （東京都庁）
      zoom: 13,
    };

    this.olmap = new OlMap({
      target: null,
      layers: [
        new OlLayerTile({
          source: new OlSourceOSM()
        })
      ],
      view: new OlView({
        projection: 'EPSG:4326',
        center: this.state.center,
        zoom: this.state.zoom,
        minZoom: 5,
        maxZoom: 19,
      }),
      controls: defaultControls({attribution: false}).extend([
        new ScaleLine(),
        new MousePosition({
          projection: 'EPSG:4326',
          // comment the following two lines to have the mouse position
          // be placed within the map.
          className: 'custom-mouse-position',
          target: 'mouse-position',
          undefinedHTML: '&nbsp;'
        }),
      ]),
      interactions: defaultInteraction({mouseWheelZoom: false}).extend([
        new MouseWheelZoom({
            constrainResolution: true
        })
      ]),
    });
  }

  componentDidMount() {
    this.olmap.setTarget("map");

    // Listen to map changes
    this.olmap.on("moveend", () => {
      let center = this.olmap.getView().getCenter();
      let zoom = this.olmap.getView().getZoom();
      console.log({center, zoom})
      this.setState({ center, zoom });
    });
  }

  render() {
    const { center, zoom } = this.state;

    return (
      <div>
        <div id="map" style={{ width: "800px", height: "500px" }}>
        </div>
        <div id="mouse-position"></div>
        <div id="mapInfo">
          <div>center: {center[0]}, {center[1]}</div>
          <div>zoom: {zoom}</div>
        </div>
      </div>
    );
  }
}

export default GisMap;
