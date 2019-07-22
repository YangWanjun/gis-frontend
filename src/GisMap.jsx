import React from "react";
import OlMap from "ol/Map";
import OlView from "ol/View";
import {Tile as OlLayerTile, Vector as VectorLayer} from "ol/layer";
import {
  OSM as OlSourceOSM,
  BingMaps as OlBingMaps,
  Vector as VectorSource,
} from "ol/source";
import {
  defaults as defaultControls,
  ScaleLine,
  MousePosition,
} from 'ol/control';
import {
  defaults as defaultInteraction,
  MouseWheelZoom,
} from 'ol/interaction';
import { WKT } from 'ol/format';
import withStyles from "@material-ui/core/styles/withStyles";
import {
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Tabs,
  Tab,
  Button,
  FormControl,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  Typography,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import TabPanel from './component/TabPanel';
import { config, common } from './utils';

const styles = (theme) => ({
  map: {
    width: '100%',
    height: 500,
  },
  button: {
    marginRight: theme.spacing(1),
  },
  FormControl: {
    width: '100%',
  },
  expansionHeader: {
    borderBottom: '1px dotted rgba(0, 0, 0, 0.1)',
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    flexBasis: '33%',
    flexShrink: 0,
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  },
})

const mapNames = ['Road', 'AerialWithLabels', 'OSM'];
const WKT_TYPE = ['wkt_point', 'wkt_line', 'wkt_polygon'];

function wktTabProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

class GisMap extends React.Component {
  baseLayers = [];
  vectorLayer = null;
  
  constructor(props) {
    super(props);

    this.state = {
      center: [139.692101, 35.689634],  // （東京都庁）
      zoom: 13,
      data: {
        baseMap: 'Road',
        wkt_point: 'POINT(139.747216 35.683765)',
        wkt_line: 'LINESTRING(139.643065 35.69208, 139.645866 35.649539, 139.677008 35.646858)',
        wkt_polygon: 'POLYGON ((139.709936 35.706894, 139.709166 35.693608, 139.742922 35.692582, 139.742221 35.721827, 139.709936 35.706894))',
        wkt_srid: config.defaultSrid,
      },
      wktTabIndex: 0,
      expanded: 'basemap',
    };

    mapNames.map(name => {
      if (name === 'OSM') {
        this.baseLayers.push(new OlLayerTile({
          visible: false,
          preload: Infinity,
          source: new OlSourceOSM()
        }));
      } else {
        this.baseLayers.push(new OlLayerTile({
          source: new OlBingMaps({
            visible: false,
            preload: Infinity,
            key: config.bingMapKey,
            imagerySet: name,
            culture: 'ja-jp',
          })
        }));
      }
      return true;
    })
    
    this.olmap = new OlMap({
      target: null,
      layers: this.baseLayers,
      loadTilesWhileInteracting: true,
      view: new OlView({
        projection: `EPSG:${config.defaultSrid}`,
        center: this.state.center,
        zoom: this.state.zoom,
        minZoom: 5,
        maxZoom: 19,
      }),
      controls: defaultControls({attribution: false}).extend([
        new ScaleLine(),
        new MousePosition({
          projection: `EPSG:${config.defaultSrid}`,
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
    this.baseLayers.map((layer, idx) => (
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
    this.setState(state => {
      let data = state.data;
      data['baseMap'] = baseMap;
      return {data};
    });
    mapNames.map((name, idx) => (
      this.baseLayers[idx].setVisible(name === baseMap)
    ));
  };

  addWktFeature = (id, wkt, srid) => {
    if (!this.vectorLayer) {
      this.vectorLayer = new VectorLayer({
        source: new VectorSource(),
        style: common.getDefaultStyle(),
      });
      this.olmap.addLayer(this.vectorLayer);
    }
    var format = new WKT();

    var feature = format.readFeature(wkt, {
      dataProjection: `EPSG:${srid}`,
      featureProjection: `EPSG:${config.defaultSrid}`,
    });
    feature.setId(id);
    this.vectorLayer.getSource().addFeature(feature);
    return feature;
  };

  removeWktFeature = (id) => {
    if (this.vectorLayer) {
      const vectorSource = this.vectorLayer.getSource();
      const feature = vectorSource.getFeatureById(id);
      if (feature) {
        vectorSource.removeFeature(feature);
      }
    }
  };

  clearWktFeature = () => {
    if (this.vectorLayer) {
      const vectorSource = this.vectorLayer.getSource();
      vectorSource.clear();
    }
  };

  handleWktTabChange = (event, newValue) => {
    this.setState({wktTabIndex: newValue});
  };

  handleChange = event => {
    const { name, value } = event.target;
    this.setState(state => {
      let data = state.data;
      data[name] = value;
      return {data};
    });
  };

  handleExpansionChange = panel => (event, isExpanded) => {
    this.setState({expanded: isExpanded ? panel : false});
  };

  handleAddWkt = (wkt_type) => () => {
    const wkt_srid = this.state.data.wkt_srid;
    const wkt_feature = this.state.data[wkt_type];
    if (wkt_feature && wkt_srid) {
      const feature = this.addWktFeature(wkt_type, wkt_feature, wkt_srid);
      this.olmap.getView().fit(feature.getGeometry(), this.olmap.getSize());
    }
  };

  handleRemoveWkt = (wkt_type) => () => {
    this.removeWktFeature(wkt_type);
  };

  handleClearWkt = () => {
    this.clearWktFeature();
  };

  render() {
    const { classes } = this.props;
    const { center, zoom, data, wktTabIndex, expanded } = this.state;

    return (
      <Grid container spacing={1}>
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
          <ExpansionPanel
            expanded={expanded === 'basemap'}
            onChange={this.handleExpansionChange('basemap')}
            aria-controls="panel1bh-content"
            id="panel1bh-header"
          >
            <ExpansionPanelSummary
              expandIcon={<ExpandMoreIcon />}
              className={classes.expansionHeader}
            >
              <Typography className={classes.heading}>BaseMap</Typography>
              <Typography className={classes.secondaryHeading}>BingマップまたはOSMを表示</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <RadioGroup
                name='layer'
                value={data.baseMap}
                row={true}
                onChange={this.changeBaseMap}
              >
                <FormControlLabel control={<Radio />} label='RoadMap' value='Road' />
                <FormControlLabel control={<Radio />} label='航空写真' value='AerialWithLabels' />
                <FormControlLabel control={<Radio />} label='OSM' value='OSM' />
              </RadioGroup>
            </ExpansionPanelDetails>
          </ExpansionPanel>
          <ExpansionPanel
            expanded={expanded === 'wkt'}
            onChange={this.handleExpansionChange('wkt')}
            aria-controls="panel2bh-content"
            id="panel2bh-header"
          >
            <ExpansionPanelSummary
              expandIcon={<ExpandMoreIcon />}
              className={classes.expansionHeader}
            >
              <Typography className={classes.heading}>WKT追加</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <div>
                <Tabs value={wktTabIndex} onChange={this.handleWktTabChange}>
                  <Tab label='POINT' {...wktTabProps(0)} />
                  <Tab label='LINE' {...wktTabProps(1)} />
                  <Tab label='POLYGON' {...wktTabProps(2)} />
                </Tabs>
                <TabPanel value={wktTabIndex} index={0}>
                  <FormControl className={classes.FormControl}>
                    <TextField
                      name={WKT_TYPE[0]}
                      multiline
                      label='ＷＫＴ'
                      value={data[WKT_TYPE[0]]}
                      onChange={this.handleChange}
                    />
                  </FormControl>
                </TabPanel>
                <TabPanel value={wktTabIndex} index={1}>
                  <FormControl className={classes.FormControl}>
                    <TextField
                      name={WKT_TYPE[1]}
                      multiline
                      label='ＷＫＴ'
                      value={data[WKT_TYPE[1]]}
                      onChange={this.handleChange}
                    />
                  </FormControl>
                </TabPanel>
                <TabPanel value={wktTabIndex} index={2}>
                  <FormControl className={classes.FormControl}>
                    <TextField
                      name={WKT_TYPE[2]}
                      multiline
                      label='ＷＫＴ'
                      value={data[WKT_TYPE[2]]}
                      onChange={this.handleChange}
                    />
                  </FormControl>
                </TabPanel>
                <div>
                  <Button
                    variant="contained"
                    className={classes.button}
                    onClick={this.handleAddWkt(WKT_TYPE[wktTabIndex])}
                  >
                    追加
                  </Button>
                  <Button
                    variant="contained"
                    className={classes.button}
                    onClick={this.handleRemoveWkt(WKT_TYPE[wktTabIndex])}
                  >
                    削除
                  </Button>
                  <Button
                    variant="contained"
                    className={classes.button}
                    onClick={this.handleClearWkt}
                  >
                    すべてクリア
                  </Button>
                </div>
              </div>
            </ExpansionPanelDetails>
          </ExpansionPanel>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(GisMap);
