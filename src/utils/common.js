import { sprintf, vsprintf } from 'sprintf-js';
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

  /**
   * オブジェクトは空白なのか
   * @param {Object} obj 
   */
  isEmpty: function(obj) {
    if (obj === null || obj === undefined || obj === '') {
      return true;
    } else if (Array.isArray(obj)) {
      return obj.length === 0;
    }
    for(var key in obj) {
      if(obj.hasOwnProperty(key))
        return false;
    }
    return true;
  },

  /**
   * JSON項目のリストから項目を取得
   * @param {Array} json_list 
   * @param {String} value 
   */
  getFromList: function(json_list, key, value) {
    if (!json_list) {
      return {};
    } else if (json_list.length === 0) {
      return {};
    } else if (typeof value === 'undefined') {
      return {};
    } else {
      if (typeof value === 'string') {
        value = value.split('__')[0];
      }
      let cols = json_list.filter(col => col[key] === value);
      return cols.length > 0 ? cols[0] : null;
    }
  },

  /**
   * JSONかどうかを判定する関数
   * @param {Object} arg 
   */
  isJSON: function(arg) {
    return typeof arg === 'object';
  },

  /**
   * JSONデータをＵＲＬ用のパラメーターに変換する
   * @param {Object} data JSONデータ
   */
  jsonToUrlParameters: function(data, nest_name=null) {
    let self = this;
    return Object.keys(data).map(function(k) {
      let name = k;
      if (nest_name) {
        name = `${nest_name}[${name}]`;
      }
      const value = data[k];
      if (self.isJSON(value)) {
        return self.jsonToUrlParameters(value, name)
      } else {
        return encodeURIComponent(name) + '=' + encodeURIComponent(value)
      }
    }).join('&');
  },

  /**
   * ＵＲＬにパラメーターを追加する
   * @param {String} url ＵＲＬ
   * @param {Object} data JSON型のパラメーター
   */
  addUrlParameter: function(url, data) {
    url = this.trim(this.trim(url, '?'), '&');
    const params = this.jsonToUrlParameters(data);
    if (url.indexOf('?') < 0) {
      url += '?';
    }
    return url + '&' + params;
  },

  /**
   * 
   * @param {String} url ＵＲＬ
   * @param {Object} params パラメーター
   */
  fetchGet: function(url, params) {
    return this.fetchCommon(url, 'GET', params);
  },

  /**
   * 
   * @param {String} url ＵＲＬ
   * @param {Object} params パラメーター
   */
  fetchPost: function(url, params) {
    return this.fetchCommon(url, 'POST', params);
  },

  /**
   * 
   * @param {String} url ＵＲＬ
   * @param {Object} params パラメーター
   */
  fetchDelete: function(url, params) {
    return this.fetchCommon(url, 'DELETE', params);
  },

  /**
   * 
   * @param {String} url ＵＲＬ
   * @param {Object} params パラメーター
   */
  fetchPut: function(url, params) {
    return this.fetchCommon(url, 'PUT', params);
  },

  /**
   * 
   * @param {String} url ＵＲＬ
   * @param {Object} params パラメーター
   */
  fetchOptions: function(url) {
    return this.fetchCommon(url, 'OPTIONS');
  },

  /**
   * ＡＰＩを呼び出す
   * @param {String} url ＵＲＬ
   * @param {String} method GET|POST|PUT|DELETE
   * @param {Object} params パラメーター
   */
  fetchCommon: function(url, method, params) {
    const requestOptions = {
      method: method,
    };
    if (params && !this.isEmpty(params)) {
      if (method === 'GET') {
        url = this.addUrlParameter(url, params);
      } else {
        requestOptions['body'] = JSON.stringify(params)
      }
    }

    url = this.addUrlParameter(url, {'format': 'json'});
    return fetch(url, requestOptions)
      .then(this.handleStatus)
      .then(this.handleResponse);
  },

  handleStatus: function(response) {
    if (!response.ok) {
      return common.handleResponse(response).then(data => {
        console.log(data);
        return Promise.reject(data);
      });
    } else {
      return response;
    }
  },

  handleResponse: function(response) {
    return response.text().then(text => {
      let data = text;
      try {
        data = JSON.parse(text);
      } catch (e) { }

      return data;
    });
  },

};
