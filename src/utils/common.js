import { sprintf, vsprintf } from 'sprintf-js';
import {
  Style,
  Stroke,
  Fill,
  Circle,
} from 'ol/style';
import { config } from './index';

export const common = {
  formatStr: function(format) {
    if (!format) {
      return '';
    } else if (arguments && arguments.length === 2 && this.isJSON(arguments[1])) {
      return vsprintf(format, arguments[1]);
    } else {
      return sprintf(format, arguments);
    }
  },

  trim: function(s, chars) {
    if (chars === "]") chars = "\\]";
    if (chars === "\\") chars = "\\\\";
    return s.replace(new RegExp(
      "^[" + chars + "]+|[" + chars + "]+$", "g"
    ), "");
  },

  round: function(num, precision=config.map.precision) {
    if (precision > 0) {
      return Math.round(num * (10 ** precision)) / (10 ** precision);
    } else {
      return Math.round(num);
    }
  },

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
};
