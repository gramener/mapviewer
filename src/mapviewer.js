/* globals d3, L */

import "es6-promise/auto"                 // Promise polyfill to support IE11
import 'events-polyfill'
import fetch from 'unfetch'               // To do Ajax requests with browser native API
import 'regenerator-runtime/runtime'      // To support async polyfill by babel
import {scale} from 'g1'
import deepmerge from 'deepmerge'
import deepclone from 'lodash/cloneDeep'
import isPlainObject from "is-plain-object"

// To add to window
if (!window.Promise) {
  window.Promise = Promise
}

var defaults = {
  map: {
    center: [0, 0],
    zoom: 1
  },
  cache: true
}

/*
  * @class MapViewer
  * @aka g1.MapViewer
  * @inherits Class
  *
  * The central class of the API
  * It is used to create data reactive map layers from multiple kind of datasources
  *
  * @example
  *
  * ```js
  * // initialize the map on the "map" div with a given center and zoom
  * var mapviewer = g1.mapviewer(config)
  * ```
*/
export var MapViewer = class MapViewer {
  constructor(config) {
    var self = this
    self.gData = {}
    self.gLayers = {}
    self._dataLayerMap = {}
    self.options = config
    self.mapDiv = typeof (self.options.id) === 'string' ? document.getElementById(self.options.id) : self.options.id

    // Apply defaults to the configuration
    self.options = deepmerge(defaults, self.options, {
      isMergeableObject: isPlainObject
    })

    self.map = L.map(self.options.id, self.options.map)

    if (self.options.layers) {
      for (let layerName in self.options.layers) {
        // To set the order of gLayers to be same as mentioned in self.options by user
        self.gLayers[layerName] = undefined
      }
      for (let layerName in self.options.layers) {
        self.buildLayer(layerName, self.options.layers[layerName])
      }
      self.drilldown()
      self.current_level = 0
      self.drilldown_stack = []
    }
    if (self.options.legend) {
      self.legend(self.options.legend).addTo(self.map)
    }
  }
}

MapViewer.prototype.addLegend = function (options) {
  var config = {
    position: 'bottomright',
    height: 200,
    width: 200,
    shapeWidth: 20,
    shapePadding: 20,
    labelOffset: 20,
    format: 'd',
    shape: d3.symbolSquare,
    orient: 'vertical',
    size: 150,
    cells: 5
  }
  options = Object.assign(config, options)
  var map_legend = L.control({ position: options.position })
  map_legend.onAdd = function () {

    var div = document.createElement('div')
    var svg = d3.select(div)
      .attr('class', 'map-legend')
      .append('svg')
      .attr('height', options.height)
      .attr('width', options.width)

    var customLegend = d3.legendColor()
      .shapeWidth(options.shapeWidth)
      .shapePadding(options.shapePadding)
      .labelOffset(options.labelOffset)
      .labelFormat(options.format)
      .cells(options.cells)
      .orient(options.orient)
      .scale(options.scale)

    if (options.shape) {
      customLegend.shape("path", d3.symbol().type(options.shape).size(options.size)())
    }

    svg.append("g")
      .attr("class", "legend")
      .attr('transform', 'translate(10,10)')
      .call(customLegend)

    return div
  }

  return map_legend
}
/*
  * @method cacheData(<String> datasetName, 'String' URL || <Object> data): <Object> data
  * GETs data if not already there in this.gData
  *
  * TODO: If dataset itself is given, that is understood as data update.
  * layers rendered based on this data must be reRendered.
  * ?? Do a data diff and then load dependant layers ??
  *
  * @example
  *
  *```js
    mapviewer.cacheData('india_states', 'india-states.geojson')
  *```
*/
MapViewer.prototype.cacheData = function (layerName, url) {
  var self = this
  switch (typeof (url)) {
  // TODO: use enums instead of strings?
  case 'string':
    return async function () {
      if (!(url in self.gData && self.options.cache))
        self.gData[url] = await (await fetch(url)).json()
      // create _dataLayerMap (to update layers when a dataset is updated)
      url in self._dataLayerMap ? self._dataLayerMap[url].push(layerName) : self._dataLayerMap[url] = [layerName]
      return self.gData[url]
    }()
  case 'object':
    this.gData[hashCode(JSON.stringify(url))] = url
    // TODO: Reload all layers that use this data
    // This part will make mapviewer data reactive
    return async function () {
      return url
    }()
  }
}
/*
  * @method _saveLayer(<Layer> layer, <String> layerName ): this
  * Adds a layer to gLayers object, and
  *
  * Private method
*/
MapViewer.prototype._saveLayer = function (layerName, layer) {
  var self = this
  self.gLayers[layerName] = layer
  self.gLayers[layerName].addTo(self.map)

  if ('layers' in self.options) {
    var allLayersLoaded = Object.keys(self.gLayers).filter(function (layerName) { return !self.gLayers[layerName] }).length == 0
    if (allLayersLoaded) self.fire('layersloaded')
    self.renderTooltip(layerName, self.options.layers[layerName])
    self.renderPopup(layerName, self.options.layers[layerName])
  }

}

MapViewer.prototype.addMismatchLabel = function (mismatch_count) {
  var config = {
    style: {
      color: "black",
      padding: "5px",
      border: "2px solid #cccccc",
      'border-radius': "10px",
      'background-color': "#ffffff",
    },
    position: 'bottomleft'
  }
  var div = document.createElement('div')
  div.setAttribute('class', 'mismatch-log')
  div.innerHTML = mismatch_count + " Mismatches found!"
  config.html = div
  var self = this
  self.addNote(config)
}

MapViewer.prototype.addNote = function (options) {
  /*
      Adds a html label on the map.
      where options must include
                - html: html object
                - style: styles to add to that html <optional>
                - position: specifies the position on the map. <optional>
  */
  var self = this
  var div_note = L.control({ position: options.position || "bottomleft" })
  div_note.onAdd = function () {
    if (options.style) add_styles(options.html, options.style)
    return options.html
  }
  div_note.addTo(self.map)
}

MapViewer.prototype.mergeData = function (mapJSON, dataTable, link) {
  var dataTableIndex = {}, self = this
  dataTable.forEach(function (row) {
    var prop = typeof (row[link.dataKey]) == 'string' ? row[link.dataKey].toLowerCase() : row[link.dataKey]
    dataTableIndex[prop] = row
  })

  function _merge_features(feature) {
    var prop = typeof (feature.properties[link.mapKey]) == 'string' ? feature.properties[link.mapKey].toLowerCase() : feature.properties[link.mapKey]
    var row = dataTableIndex[prop]
    var status = {
      isMatched: true,
      feature: feature
    }
    for (let key in row)
      feature.properties[key] = row[key]
    if (row === undefined)
      status.isMatched = false
    return status
  }
  var mergeStatus = '', mismatchedFeatures = ''
  switch (mapJSON.type) {
  case 'Feature':
  case 'FeatureCollection':
    mergeStatus = mapJSON.features.map(_merge_features)
    mismatchedFeatures = mergeStatus.filter(e => !e.isMatched)
    if (mismatchedFeatures && mismatchedFeatures.length > 0)
      if (link.mismatch && (typeof link.mismatch === 'function')) link.mismatch(mismatchedFeatures)
      else if (link && !link.mismatch) self.addMismatchLabel(mismatchedFeatures.length)
    return mapJSON
  case 'Topology':
    mergeStatus = mapJSON.objects[Object.keys(mapJSON.objects)[0]].geometries.map(_merge_features)
    mismatchedFeatures = mergeStatus.filter(e => !e.isMatched)
    if (mismatchedFeatures && mismatchedFeatures.length > 0)
      if (link.mismatch && (typeof link.mismatch === 'function')) link.mismatch(mismatchedFeatures)
      else if (link && !link.mismatch) self.addMismatchLabel(mismatchedFeatures.length)
    return mapJSON
  default:
    mapJSON.map(function (json) {
      var row = dataTableIndex[json[link.mapKey]]
      for (let key in row) {
        json[key] = row[key]
      }
    })
    return mapJSON
  }
}

MapViewer.prototype.fire = function (eventName) {
  this.mapDiv.dispatchEvent(new CustomEvent(eventName))
}

MapViewer.prototype.on = function (type, callback, options) {
  this.mapDiv.addEventListener(type, callback, options)
}

MapViewer.prototype.off = function (eventName, callback, options) {
  this.mapDiv.removeEventListener(eventName, callback, options)
}

MapViewer.prototype.buildLayer = function (layerName, layerConfig) {
  var self = this, gLayer
  if (!(layerName in self.options))
    self.options.layers[layerName] = layerConfig

  // Remove layer on map, if exists
  if (self.map.hasLayer(self.gLayers[layerName])) self.map.removeLayer(self.gLayers[layerName])

  switch (layerConfig.type.toLowerCase()) {
  case 'tile':
    gLayer = L.tileLayer(layerConfig.url, layerConfig.options)
    this._saveLayer(layerName, gLayer)
    self.fire(layerName + 'loaded')
    break
  case 'topojson':
  case 'geojson':
    self.cacheData(layerName, layerConfig[dataOrURL(layerConfig)]).then(function (mapJSON) {
      if ('link' in layerConfig) {
        self.cacheData(layerName, layerConfig.link[dataOrURL(layerConfig.link)]).then(function (tableData) {
          self.mismatch_array = []
          self.mergeData(mapJSON, tableData, layerConfig.link)
          gLayer = new L.TopoJSON(mapJSON, layerConfig.options)
          self._saveLayer(layerName, gLayer)
          if ('attrs' in layerConfig) self._choropleth(layerName, layerConfig)
          self.fitToLayer(layerName)
          self.fire(layerName + 'loaded')
        })
      } else {
        gLayer = new L.TopoJSON(mapJSON, layerConfig.options)
        self._saveLayer(layerName, gLayer)
        if ('attrs' in layerConfig) self._choropleth(layerName, layerConfig)
        self.fitToLayer(layerName)
        self.fire(layerName + 'loaded')
      }
    })
    break
  // TODO: remove duplicate code from marker and circkeMarker
  case 'marker':
    var pointLayers = []
    self.cacheData(layerName, layerConfig[dataOrURL(layerConfig)]).then(function (pointjson) {
      pointjson.forEach(function (d) {
        var mark = L.marker([d[layerConfig.latitude], d[layerConfig.longitude]], layerConfig.options)
        mark.feature = {}
        mark.feature.properties = d
        pointLayers.push(mark)
      })
      self.fitToLayer(L.featureGroup(pointLayers))
      self._saveLayer(layerName, L.featureGroup(pointLayers))
      self.fire(layerName + 'loaded')
    })
    break
  case 'circle':
  case 'circlemarker':
    var markerProxy = layerConfig.type.toLowerCase() === 'circle' ? L.circle : L.circleMarker
    self.cacheData(layerName, layerConfig[dataOrURL(layerConfig)]).then(function (pointjson) {
      var pointLayers = []
      function create_layer() {
        pointjson.forEach(function (d) {
          var mark = markerProxy([d[layerConfig.latitude], d[layerConfig.longitude]], layerConfig.options)
          mark.feature = {}
          mark.feature.properties = d
          pointLayers.push(mark)
        })
        self._saveLayer(layerName, L.featureGroup(pointLayers))
      }
      if ('link' in layerConfig) {
        self.cacheData(layerName, layerConfig.link[dataOrURL(layerConfig.link)]).then(function (tableData) {
          self.mergeData(pointjson, tableData, layerConfig.link)
          create_layer()

          if ('attrs' in layerConfig) self._choropleth(layerName, layerConfig)
          self.fitToLayer(layerName)
        })
      } else {
        create_layer()
        if ('attrs' in layerConfig) self._choropleth(layerName, layerConfig)
        self.fitToLayer(layerName)
      }
    })
    break
  default:
    throw new Error('Invalid layer type')
  }
}

MapViewer.prototype.removeLayer = function (layerName) {
  var self = this
  if (self.map.hasLayer(self.gLayers[layerName]) && self.gLayers[layerName]) {
    let layer = self.gLayers[layerName]
    self.map.removeLayer(layer)
    return layer
  }
  else
    throw new Error('Layer ' + layerName + ' is not available')
}

MapViewer.prototype.addLayer = function (layerName, layerConfig) {
  var self = this
  if (layerName && layerConfig)
    self.buildLayer(layerName, layerConfig)
  else {
    if (self.gLayers[layerName] && !self.map.hasLayer(self.gLayers[layerName]))
      self.map.addLayer(self.gLayers[layerName])
    else
      throw new Error('Layer ' + layerName + ' is already existed or not created')
  }
}

MapViewer.prototype._choropleth = function (layerName, layerConfig, filter) {
  var layer = this.gLayers[layerName], self = this

  layer.eachLayer(function (sublayer) {
    var style = {}, prop, metricFormula, metric, domain

    // set defaults style
    if (layerConfig.options && layerConfig.options.style) sublayer.setStyle(layerConfig.options.style)

    // if filter true, skip attrs so that defaults remain applied
    if (filter && typeof (filter) == 'function' && filter(sublayer.feature.properties) === false) {
      return
    }

    for (prop in layerConfig.attrs) {
      if (prop == 'tooltip' || prop == 'tooltipOptions') continue
      if (typeof (layerConfig.attrs[prop]) != 'object') {
        style[prop] = layerConfig.attrs[prop]
        continue
      }
      metric = layerConfig.attrs[prop].metric
      if (typeof (metric) === 'string')
        metricFormula = (row) => row[metric]
      else
        metricFormula = metric

      if (layerConfig.attrs[prop].domain)
        domain = layerConfig.attrs[prop].domain
      else
        domain = self._calculateMinMax(layer, metricFormula)
      // TODO: ENH: cache _calculateMinMax for each property bcz its same for each sublayer

      // skip scale if sublayer.feature.properties do not have that metric, shows as per settings in `options: {style: ...}`
      if (metricFormula(sublayer.feature.properties) !== undefined)
        style[prop] = scale([], {
          metric: metric,
          domain: domain,
          scheme: layerConfig.attrs[prop].scheme,
          scale: layerConfig.attrs[prop].scale,
          range: layerConfig.attrs[prop].range
        })(sublayer.feature.properties)
    }

    sublayer.setStyle(style)
  })
  if (layerConfig.legend) {
    if (self.mapDiv.querySelector(".map-legend"))
      self.mapDiv.querySelector(".map-legend").remove()
    self.addLegend(layerConfig.legend).addTo(self.map)
  }
}
/*
  * @method _calculateMinMax(layer, <function> metricFormula ): <Array>
  * Analogous to d3.extent but for feature.properties
  * Private/internal method
*/
MapViewer.prototype._calculateMinMax = function (layer, metricFormula) {
  var minVal, maxVal
  layer.eachLayer(function (sublayer) {
    var metricVal = metricFormula(sublayer.feature.properties)
    if (!metricVal) return
    if (!(maxVal && minVal)) maxVal = metricVal, minVal = metricVal
    if (metricVal < minVal) {
      minVal = metricVal
    }
    if (metricVal > maxVal) {
      maxVal = metricVal
    }
  })
  return [minVal, maxVal]
}

MapViewer.prototype.drilldown = function () {
  var self = this
  self.on('layersloaded', function () {
    if (self.options.drilldown) {
      self.drilldown_stack.push(self.options.drilldown.rootLayer)
      self.drilldown_recursive(self.options.drilldown.rootLayer)
    }
  }, {
    once: true
  })
}

MapViewer.prototype.drilldown_recursive = function (currentLayer) {
  var self = this
  const levels = deepclone(self.options.drilldown.levels)
  self.gLayers[currentLayer].eachLayer(function (sublayer) {
    sublayer.
      on('click', function () {
        sublayer.off('click')
        if (levels.length == self.current_level) {
          self.fitToLayer(sublayer)
        } else {
          var nextLayer = deepclone(levels[self.current_level])

          function_resolver(sublayer, nextLayer, ['layerName'])
          function_resolver(sublayer, nextLayer.layerOptions, ['url', 'data'])
          function_resolver(sublayer, nextLayer.layerOptions.link, ['url', 'data'])

          self.options.layers[nextLayer.layerName] = nextLayer.layerOptions
          self.buildLayer(nextLayer.layerName, nextLayer.layerOptions)

          // remove current layer and push nextLayer to the stack
          self.map.removeLayer(self.gLayers[currentLayer])
          self.drilldown_stack.push(nextLayer.layerName)
          self.current_level += 1

          self.on(nextLayer.layerName + 'loaded', function () {
            self.renderTooltip(nextLayer.layerName, nextLayer.layerOptions)
            // attach drilldown events for sublayers
            self.drilldown_recursive(nextLayer.layerName)
          }, { once: true })
        }
      })
  })
}

MapViewer.prototype.drillup = function () {
  var self = this
  if (self.current_level == 0) return
  self.current_level -= 1
  self.map.removeLayer(self.gLayers[self.drilldown_stack.pop()])
  var current_level_layer = self.drilldown_stack[self.drilldown_stack.length - 1]
  self.fitToLayer(self.gLayers[current_level_layer])
  self.gLayers[current_level_layer].addTo(self.map)
  self.drilldown_recursive(current_level_layer)
}

MapViewer.prototype.renderPopup = function (layerName, layerConfig) {
  if (!layerConfig.popup) return
  var self = this
  var options = layerConfig.popupOptions ? layerConfig.popupOptions : {}
  self.gLayers[layerName].eachLayer(function (sublayer) {
    var popupContent = typeof layerConfig.popup == 'function' ?
      layerConfig.popup(sublayer.feature.properties) : layerConfig.popup
    sublayer.bindPopup(popupContent, options)
  })
}

MapViewer.prototype.renderTooltip = function (layerName, layerConfig) {
  if (!layerConfig.tooltip) return

  var self = this
  var options = layerConfig.tooltipOptions ? layerConfig.tooltipOptions : {}
  var centerPoint = self.map.latLngToContainerPoint(self.gLayers[layerName].getBounds().getCenter())
  self.gLayers[layerName].eachLayer(function (sublayer) {
    var tooltipContent = typeof layerConfig.tooltip === 'function' ?
      layerConfig.tooltip(sublayer.feature.properties) : layerConfig.tooltip

    var optionsClone = Object.assign({}, options)
    if (typeof (options['direction']) == 'function') {
      var center = layerConfig.type.toLowerCase() == 'marker' ? [sublayer.getLatLng()['lat'], sublayer.getLatLng()['lng']] : sublayer.getBounds().getCenter()
      var tooltipPoint = self.map.latLngToContainerPoint(center)
      optionsClone['direction'] = options['direction']({
        centerPoint: centerPoint, tooltipPoint: tooltipPoint, properties: sublayer.feature.properties
      })
    }
    sublayer.bindTooltip(tooltipContent, optionsClone)
  })
}

MapViewer.prototype.zoomHandler = function (layerName, minZoom, maxZoom) {
  var self = this
  self.map.on('zoom', function () {
    maxZoom = maxZoom || self.map.getMaxZoom()
    if (self.map.getZoom() < minZoom || self.map.getZoom() > maxZoom) {
      if (self.map.hasLayer(self.gLayers[layerName])) {
        self.map.removeLayer(self.gLayers[layerName])
      }
    }
    else {
      if (!self.map.hasLayer(self.gLayers[layerName])) {
        self.map.addLayer(self.gLayers[layerName])
      }
    }
  })
}
/*
  * @method fitToLayer(<String> layerName, <Object> options ): this
  * options are same options as fitBounds options
  * Zooms map view to fit the layer
  *
  * @example
  *
  *```js
  mapviewer.fitToLayer('indiaGeojson')
  *```
*/
MapViewer.prototype.fitToLayer = function (layerName, options = this.options.fitbounds) {
  var layer = typeof (layerName) == 'string' ? this.gLayers[layerName] : layerName
  this.map.fitBounds(layer.getBounds(), options)
}

function dataOrURL(conf) {
  if (conf.hasOwnProperty('data'))
    return 'data'
  else if (conf.hasOwnProperty('url'))
    return 'url'
  throw new Error('layer MUST have a data as an (array of objects) or a url (string).')
}

function hashCode(str) {
  var hash = 5381, i = str.length
  while (i)
    hash = (hash * 33) ^ str.charCodeAt(--i)
  return hash >>> 0
}

function function_resolver(sublayer, obj, props) {
  // This function adds the properties from sublayer to obj.
  // Used in `drilldown_recursive` function.
  if (!obj) return
  props.forEach(function (prop) {
    if (typeof obj[prop] == 'function') {
      obj[prop] = obj[prop](sublayer.feature.properties)
    }
  })
}

function add_styles(style_obj, prop_list) {
  for (let attr in prop_list)
    style_obj.style[attr] = prop_list[attr]
}

L.TopoJSON = L.GeoJSON.extend({
  addData: function (jsonData) {
    var key, geojson
    if (jsonData.type === 'Topology')
      for (key in jsonData.objects) {
        geojson = topojson.feature(jsonData, jsonData.objects[key])
        L.GeoJSON.prototype.addData.call(this, geojson)
      }
    else
      L.GeoJSON.prototype.addData.call(this, jsonData)
    return this
  }
})

export function createMapViewer(config) {
  return new MapViewer(config)
}
