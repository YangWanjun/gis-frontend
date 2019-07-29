import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from 'ol/source';
import { getDistance, getArea, getLength } from 'ol/sphere';
import { GeoJSON } from 'ol/format';
import {
  Style,
  Stroke,
  Fill,
  Circle,
} from 'ol/style';
import { config } from "./config";
import { common } from "./common";

export const geo_common = {
  getDefaultStyle: function() {
    const style = new Style({
      image: new Circle({
        radius: 6,
        fill: new Fill({color: 'white'}),
        stroke: new Stroke({
          color: [0, 0 , 255], width: 2
        })
      }),
      stroke: new Stroke({ color: '#0000FF' }),
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.3)',
      })
    });
    return style;
  },

  getLayerOption: function(name) {
    return common.getFromList(config.layers, 'name', name);
  },

  addLayer: function(name, map, source=null) {
    if (!source) {
      source = new VectorSource({
        projection : `EPSG:${config.map.srid}`,
      });
    }
    const layer = new VectorLayer({
      name: name,
      source: source,
      style: this.getDefaultStyle(),
    });
    map.addLayer(layer);
    return layer
  },

  addLayerGeoJson: function(name, map, geoJson, srid=null) {
    if (!srid) {
      srid = config.map.srid;
    }
    // レイヤーを取得
    let layer = this.getLayerByName(name, map);
    if (!layer) {
      layer = this.addLayer(name, map);
    }
    // 既存のフィーチャーを消す
    layer.getSource().clear();
    // GeoJSONを追加
    let format = new GeoJSON();
    var feature = format.readFeatures(geoJson, {
      dataProjection: `EPSG:${srid}`,
      featureProjection: `EPSG:${config.map.srid}`,
    });
    layer.getSource().addFeatures(feature);
    return layer;
  },

  clearLayer: function(name, map) {
    const layer = this.getLayerByName(name, map);
    if (layer) {
      // 既存のフィーチャーを消す
      layer.getSource().clear();
    }
    return layer;
  },

  getLayerByName: function(name, map) {
    let layer = null;
    map.getLayers().forEach(function (lyr) {
      if (name === lyr.get('name')) {
          layer = lyr;
      }            
    });
    return layer;
  },

  reloadLayers: function(map, layers, zoom, boundary) {
    const self = this;
    layers.map(layer => {
      const layer_name = layer.get('name');
      const layer_option = self.getLayerOption(layer_name);
      common.fetchGet(layer_option.url, {zoom, boundary}).then(data => {
        self.clearLayer(layer_name, map);
        self.addLayerGeoJson(layer_name, map, data);
      }).catch(data => {
      });
      return true;
    })
  },

  getPointsDistance: function(point1, point2) {
    return getDistance(point1, point2);
  },

  getLength: function(geom) {
    return getLength(geom, {
      projection: `EPSG:${config.map.srid}`,
    });
  },

  getArea: function(geom) {
    if (geom.getType() === 'Circle') {
      const radius = this.getPointsDistance(geom.getFirstCoordinate(), geom.getLastCoordinate());
      return Math.PI * radius * radius;
    } else {
      return getArea(geom, {
        projection: `EPSG:${config.map.srid}`,
      });
    }
  },
};
