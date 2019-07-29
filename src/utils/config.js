export const hostApi = 'http://192.168.99.100:8005';

export const config = {
  map: {
    bingMapKey: 'AuCWGrNDVbNclxqzFEsc7tSncptyHkPjj6U0wqJm8zg3txWqkJrmasnIEWg8guRd',
    srid: 4326,
    center: [139.692101, 35.689634],
    zoom: 13,
    precision: 7,
  },
  layers: [
    {
      name: 'pref_layer',
      url: hostApi + '/api/addr/pref/layer',
    },
    {
      name: 'city_layer',
      url: hostApi + '/api/addr/city/layer',
    },
    {
      name: 'chome_layer',
      url: hostApi + '/api/addr/chome/layer',
    },
  ],
};
