import React from "react";
import OlMap from "ol/Map";
import OlView from "ol/View";
import OlLayerTile from "ol/layer/Tile";
import OlSourceOSM from "ol/source/OSM";
import OlBingMaps from 'ol/source/BingMaps';
import {
  defaults as defaultControls,
  ScaleLine,
  MousePosition,
} from 'ol/control';
import {
  defaults as defaultInteraction,
  MouseWheelZoom,
} from 'ol/interaction';
import withStyles from "@material-ui/core/styles/withStyles";
import {
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@material-ui/core';
import {config} from './utils';

const styles = () => ({
  map: {
    width: '100%',
    height: 500,
  }
})

class GisMap extends React.Component {
  layers = [];
  baseMaps = ['Road', 'AerialWithLabels', 'OSM'];

  constructor(props) {
    super(props);

    this.state = {
      center: [139.692101, 35.689634],  // （東京都庁）
      zoom: 13,
      baseMap: 'Road',
    };

    this.baseMaps.map(layer => {
      if (layer === 'OSM') {
        this.layers.push(new OlLayerTile({
          visible: false,
          preload: Infinity,
          source: new OlSourceOSM()
        }));
      } else {
        this.layers.push(new OlLayerTile({
          source: new OlBingMaps({
            visible: false,
            preload: Infinity,
            key: config.bingMapKey,
            imagerySet: layer,
            culture: 'ja-jp',
          })
        }));
      }
      return true;
    })
    
    this.olmap = new OlMap({
      target: null,
      layers: this.layers,
      loadTilesWhileInteracting: true,
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
    this.layers.map((layer, idx) => (
      layer.setVisible(idx === 0)
    ));

    // Listen to map changes
    this.olmap.on("moveend", () => {
      let center = this.olmap.getView().getCenter();
      let zoom = this.olmap.getView().getZoom();
      this.setState({
        center: [
          Math.round(center[0] * 1000000) / 1000000,
          Math.round(center[1] * 1000000) / 1000000,
        ],
        zoom,
      });
    });
  }

  changeBaseMap = (event) => {
    const baseMap = event.target.value;
    this.setState({baseMap});
    this.baseMaps.map((layer, idx) => (
      this.layers[idx].setVisible(layer === baseMap)
    ));
  };

  render() {
    const { classes } = this.props;
    const { center, zoom, baseMap } = this.state;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={12} md={8}>
          <Grid container>
            <div id="map" className={classes.map}>
            </div>
          </Grid>
          <Grid container>
            <Grid>
              <div id="mapInfo">
                <div>center: {center[0]}, {center[1]}</div>
                <div>zoom: {zoom}</div>
              </div>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
          <RadioGroup name='layer' value={baseMap} row={true} onChange={this.changeBaseMap}>
            <FormControlLabel control={<Radio />} label='RoadMap' value='Road' />
            <FormControlLabel control={<Radio />} label='航空写真' value='AerialWithLabels' />
            <FormControlLabel control={<Radio />} label='OSM' value='OSM' />
          </RadioGroup>
        </Grid>
        <div id="mouse-position"></div>
      </Grid>
    );
  }
}

export default withStyles(styles)(GisMap);
