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
import { createStringXY } from 'ol/coordinate';
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
import { config, common, constant } from './utils';
import hljs from 'highlight.js/lib/highlight';
import json from 'highlight.js/lib/languages/json';
hljs.registerLanguage('json', json);

const styles = (theme) => ({
  map: {
    width: '100%',
    height: 500,
  },
  mapInfo: {
    width: '100%',
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
  tabsRoot: {
    flexGrow: 1,
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
})

const mapNames = ['Road', 'AerialWithLabels', 'OSM'];
const WKT_TYPE = ['wkt_point', 'wkt_line', 'wkt_polygon', 'wkt_multipoint', 'wkt_multiline', 'wkt_multipolygon'];

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
      center: config.map.center,  // （東京都庁）
      zoom: config.map.zoom,
      boundary: {},
      data: {
        baseMap: 'Road',
        wkt_point: constant.WKT.POINT,
        wkt_line: constant.WKT.LINE,
        wkt_polygon: constant.WKT.PLOYGON,
        wkt_multipoint: constant.WKT.MULTIPOINT,
        wkt_multiline: constant.WKT.MULTILINE,
        wkt_multipolygon: constant.WKT.MULTIPOLYGON,
        wkt_srid: config.map.srid,
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
            key: config.map.bingMapKey,
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
        projection: `EPSG:${config.map.srid}`,
        center: this.state.center,
        zoom: this.state.zoom,
        minZoom: 5,
        maxZoom: 19,
      }),
      controls: defaultControls({attribution: false}).extend([
        new ScaleLine(),
        new MousePosition({
          projection: `EPSG:${config.map.srid}`,
          coordinateFormat: createStringXY(config.map.precision),
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
      const center = this.olmap.getView().getCenter();
      const zoom = this.olmap.getView().getZoom();
      const boundary = this.olmap.getView().calculateExtent();
      this.setState({
        center: [
          common.round(center[0]),
          common.round(center[1]),
        ],
        zoom,
        boundary: {
          left: common.round(boundary[0]),
          bottom: common.round(boundary[1]),
          right: common.round(boundary[2]),
          top: common.round(boundary[3]),
        }
      });
    });

    this.updateCodeSyntaxHighlighting();
  }

  componentDidUpdate() {
    this.updateCodeSyntaxHighlighting();
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
      featureProjection: `EPSG:${config.map.srid}`,
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

  outputMapInfo = () => {
    const { center, zoom, boundary } = this.state;
    return JSON.stringify({center, zoom, boundary}, null, '    ');
  };

  updateCodeSyntaxHighlighting = () => {
    document.querySelectorAll("pre code").forEach(block => {
      hljs.highlightBlock(block);
    });
  };

  render() {
    const { classes } = this.props;
    const { data, wktTabIndex, expanded } = this.state;

    return (
      <Grid container spacing={1}>
        <Grid item xs={12} sm={12} md={8}>
          <Grid container>
            <div id="map" className={classes.map}>
            </div>
          </Grid>
          <Grid container>
            <div id="mapInfo" className={classes.mapInfo}>
              <pre>
                <code className='json'>
                  {this.outputMapInfo()}
                </code>
              </pre>
            </div>
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
              <div className={classes.tabsRoot}>
                <Tabs
                  value={wktTabIndex}
                  onChange={this.handleWktTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {WKT_TYPE.map((wkt_type, key) => (
                    <Tab key={key} label={common.trim(wkt_type, 'wkt_')} {...wktTabProps(key)} />
                  ))}
                </Tabs>
                {WKT_TYPE.map((wkt_type, key) => (
                  <TabPanel key={key} value={wktTabIndex} index={key}>
                    <FormControl className={classes.FormControl}>
                      <TextField
                        name={wkt_type}
                        multiline
                        label='ＷＫＴ'
                        value={data[wkt_type]}
                        onChange={this.handleChange}
                      />
                    </FormControl>
                  </TabPanel>
                ))}
                <div>
                  <Button
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={this.handleAddWkt(WKT_TYPE[wktTabIndex])}
                  >
                    追加
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
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
