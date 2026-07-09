import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const STATES_SOURCE = 'nigeria-states'
const FILL_LAYER = 'nigeria-states-fill'
const LINE_LAYER = 'nigeria-states-line'

function fillColorExpr(selectedId, highlightedIds) {
  return [
    'case',
    ['==', ['get', 'state_id'], selectedId ?? ''],
    '#f97316',
    ['in', ['get', 'state_id'], ['literal', highlightedIds ?? []]],
    '#16a34a',
    '#2563eb',
  ]
}

function fillOpacityExpr(selectedId, highlightedIds, hovering) {
  return [
    'case',
    ['==', ['get', 'state_id'], selectedId ?? ''],
    0.55,
    ['in', ['get', 'state_id'], ['literal', highlightedIds ?? []]],
    0.5,
    hovering ? 0.35 : 0.25,
  ]
}

export default function MapView({ selectedStateId, onSelectState, highlightedStateIds }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const selectedRef = useRef(selectedStateId)
  const highlightedRef = useRef(highlightedStateIds ?? [])

  useEffect(() => {
    selectedRef.current = selectedStateId
    highlightedRef.current = highlightedStateIds ?? []
    const map = mapRef.current
    if (map && map.getLayer(FILL_LAYER)) {
      map.setPaintProperty(FILL_LAYER, 'fill-color', fillColorExpr(selectedStateId, highlightedStateIds))
      map.setPaintProperty(FILL_LAYER, 'fill-opacity', fillOpacityExpr(selectedStateId, highlightedStateIds, false))
    }
  }, [selectedStateId, highlightedStateIds])

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [8.0, 9.1],
      zoom: 5.4,
      minZoom: 4,
      maxZoom: 10,
    })
    mapRef.current = map

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('load', () => {
      map.addSource(STATES_SOURCE, {
        type: 'geojson',
        data: '/data/nigeria-states.geojson',
      })

      map.addLayer({
        id: FILL_LAYER,
        type: 'fill',
        source: STATES_SOURCE,
        paint: {
          'fill-color': fillColorExpr(selectedRef.current, highlightedRef.current),
          'fill-opacity': fillOpacityExpr(selectedRef.current, highlightedRef.current, false),
        },
      })

      map.addLayer({
        id: LINE_LAYER,
        type: 'line',
        source: STATES_SOURCE,
        paint: {
          'line-color': '#1e3a8a',
          'line-width': 1,
        },
      })

      map.fitBounds(
        [
          [2.6, 4.2],
          [14.7, 13.9],
        ],
        { padding: 24, duration: 0 },
      )

      map.on('click', FILL_LAYER, (e) => {
        const feature = e.features?.[0]
        if (feature) {
          onSelectState(feature.properties.state_id, feature.properties.name)
        }
      })

      map.on('mouseenter', FILL_LAYER, () => {
        map.getCanvas().style.cursor = 'pointer'
        map.setPaintProperty(
          FILL_LAYER,
          'fill-opacity',
          fillOpacityExpr(selectedRef.current, highlightedRef.current, true),
        )
      })

      map.on('mouseleave', FILL_LAYER, () => {
        map.getCanvas().style.cursor = ''
        map.setPaintProperty(
          FILL_LAYER,
          'fill-opacity',
          fillOpacityExpr(selectedRef.current, highlightedRef.current, false),
        )
      })
    })

    return () => map.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className="h-full w-full" />
}
