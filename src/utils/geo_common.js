import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from 'ol/source';
import {
  Style,
  Stroke,
  Fill,
  Circle,
} from 'ol/style';
import { config } from "./config";

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

  addLayer: function(name) {
    return new VectorLayer({
      name: name,
      source: new VectorSource({
         projection : `EPSG:${config.map.srid}`,
      }),
      style: this.getDefaultStyle(),
    });
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
};
