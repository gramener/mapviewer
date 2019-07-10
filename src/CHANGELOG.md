# Change log

- `0.17.1`:
    - [$.template](docs/template.md) exposes variables `$node` (the source node)
      and `$data` (its `data-` attributes)
    - [$.urlchange](docs/urlchange.md) emits a `#?` event when any URL query key
      changes. This is in addition to the `#?<key>` and `#` events.

- `0.17.0`:
    - [$.template](docs/template.md) supports sub-templates

- `0.16.3`:
    - [$.template](docs/template.md) accepts `<template>` tag as well as `<script>`
    - Docs moved into [docs/README.md](docs/README.md) to help with guide deployment

- `0.16.2`:
    - Fixes a bug in [$.formhandler](docs/formhandler.md) timezone handling

- `0.16.1`:
    - Fixes a bug in [$.template](docs/template.md) `.template('dispose')`

- `0.16.0`:
    - [$.formhandler](docs/formhandler.md) supports `{link: false}` to clear
      links in cells, and `{link: '?col=val'}` to allow any cell to define any
      custom filters.
    - [g1.fuzzyseach](docs/fuzzysearch.md) filters the text using fuzzy logic.
      This is useful for search-as-you-type.
    - [$.template](docs/template.md) supports a `.template('dispose')` option
      that clears the last rendered template output.

- `0.15.0`:
    - [$.formhandler](docs/formhandler.md) now supports client-side validation
      and sorting by multiple columns. A bug related to encoding special
      characters is also fixed.

- `0.14.0`:
    - [$.formhandler](docs/formhandler.md) uses a `onhashchange: false` to
      disable changing the URL when elements are selected. This is useful when
      simply viewing tables and not drilling down.
    - [$.formhandler](docs/formhandler.md) bugfixes: allows column names with
      spaces. Clear all removes all filters.
    - [$.urlfilter](docs/urlfilter.md) supports checkboxes, inputs and forms
      (but has a few known bugs)
    - Interactive documentation added for [$.template](docs/template.md) and
      [$.urlfilter](docs/urlfilter.md)
    - [$.urlchange](docs/urlchange.md) documents how to listen to multiple
      changes, and when the hash is reset

- `0.13.1`:
    - Fixes a critical bug. Multiple g1 modules could not be loaded on the same page.

- `0.13.0`:
    - [$.translate](docs/translate.md) translates content using the [Gramex Translate API](https://learn.gramener.com/guide/translate/)
    - [$.dropdown](docs/dropdown.md) supports objects with different names and values, by @pragnya.reddy
    - [g1.types](docs/types.md) now has a `types.min.js` that only includes `g1.types`
    - [$.formhandler](docs/formhandler.md) bugfix: add mode shows dropdowns for when a column has pre-defined options
    - [Releases](README.md#releases) documents mentions of g1 releases in Gramex @bhanu.k

- `0.12.0`:
    - [$.template](docs/template.md) supports virtualdom, which allows animation of templates.
    - [g1.mapviewer](docs/mapviewer.md) lets you add notes, and add/remove layers.
      It also shows mismatches is joins between data and features.
    - [$.search](docs/search.md). Fixes #33 [S Anand]
    - [$.urlchange](docs/urlchange.md) fires `#/` on path changes.
      **Breaking change**: it fires `#` instead of `#?`.
    - formhandler table to not allow add and edit happen at same time, fixes #123 by @sindhura.ch [Tejesh P]
    - split documentation into separate files [S Anand]
    - add browser tests for Firefox, Edge, Chrome. Fixes #130 [S Anand]
- `0.11.0`: 8 Dec 2018
    - [$.urlchange](docs/urlchange.md) acts as an event listener for URL hash changes
      triggered by [$.urlfilter](docs/urlfilter.md) -- making bookmarkable pages easier
    - [$.ajaxchain()](docs/ajaxchain.md) chains AJAX requests, loading multiple pages in sequence
    - [$.template](docs/template.md) can append to existing DOM elements, allowing AJAX
      requests to add to a list rather than replace them
- `0.10.1`: 15 Nov 2018
    - [$.formhandler](docs/formhandler.md) editing supports custom UI elements like datepicker, dropdown, etc
    - [g1.mapviewer](docs/mapviewer.md) supports map legends
- `0.10.0`: 14 Oct 2018
    - [g1.mapviewer](docs/mapviewer.md) supports TopoJSON
    - [g1.mapviewer](docs/mapviewer.md) supports popups (in addition to tooltips).
      **Breaking change**: `tooltip:` & `tooltipOptions:` were inside `attrs:`.
      Now they are 1 level higher, alongside `attrs:`.
- `0.9.1`: 20 Sep 2018
    - [$.formhandler()](docs/formhandler.md) supports notifications. Multiple bugfixes
    - [g1.mapviewer](docs/mapviewer.md) supports tooltips options
- `0.9.0`: 7 Aug 2018
    - [$.dropdown](docs/dropdown.md) simplifies creating dropdowns
    - [g1.mapviewer](docs/mapviewer.md) supports a zoom handler
- `0.8.3`: 3 Jul 2018
    - Bugfix release for [$.urlfilter](docs/urlfilter.md) changes in 0.8.2
- `0.8.2`: 30 Jun 2018
    - [$.urlfilter](docs/urlfilter.md) works on forms, inputs & sliders (not just links)
    - [$.formhandler()](docs/formhandler.md) accepts JavaScript data objects (instead of just a URL) as source
- `0.8.1`: 21 Jun 2018
    - [g1.mapviewer](docs/mapviewer.md) supports drilldown and color schemes via `scheme:`
- `0.8.0`: 31 May 2018
    - [g1.mapviewer](docs/mapviewer.md) creates interactive maps
    - [$.formhandler](docs/formhandler.md) table cell format is more flexible. It can
      be a function that accepts an object with the column name, cell value, row
      data, and full dataset
    - Added MIT License
- `0.7.0`: 19 May 2018
    - [$.formhandler](docs/formhandler.md) supports grids via `table: 'grid'`
    - [$.formhandler](docs/formhandler.md) tables can be edited by the user via `edit: true`
- `0.6.0`: 15 Apr 2018
    - [sanddance](docs/sanddance.md) smoothly animates selections into pre-defined and custom layouts
    - [$.formhandler](docs/formhandler.md) and [g1.datafilter](docs/datafilter.md) support namespaces
- `0.5.0`: 31 Mar 2018
    - [$.formhandler](docs/formhandler.md) has a `link:` option that links clicks to URLs. @tejesh.papineni
    - [$.highlight](docs/highlight.md) adds classes to targets based on any event from any trigger
    - [g1.datafilter](docs/datafilter.md) implements data filtering like FormHandler. @abinesh.lal
    - [g1.types](docs/types.md) detects the type of each JavaScript Dataframe. @abinesh.lal
    - An internal [g1.scale](docs/scale.md) helps convert configurations to d3 scales
- `0.4.0`: 31 Jan 2018
    - [$.formhandler](docs/formhandler.md) allows filters, custom formatting, error handling and more. By @tejesh.papineni
- `0.3.0`: 19 Jan 2018
    - [$.formhandler](docs/formhandler.md) renders Gramex FormHandler results as a table. By @tejesh.papineni
- `0.2.2`: 26 Dec 2017
    - [$.template](docs/template.md) can be applied to a container element like `body`. It supports
      `data-selector=` which defaults to `script[type="text/html"]`
- `0.2.1`: 25 Dec 2017
    - [$.template](docs/template.md) triggers a `template` event with the data and target nodes.
      It also accepts a `src=` attribute that points to a template file.
- `0.2.0`: 23 Dec 2017. Added
    - [$.template](docs/template.md) renders lodash templates
    - [L.TopoJSON](docs/topojson.md) loads TopoJSON files just like GeoJSON
- `0.1.0`: 23 Dec 2017. Initial release with:
    - [$.urlfilter](docs/urlfilter.md) changes URL query parameters when clicked. Used to filter data
    - [g1.url.parse](docs/url.md#g1-url-parse) parses a URL into a structured object
    - [g1.url.join](docs/url.md#g1-url-join) joins two URLs
    - [g1.url.update](docs/url.md#g1-url-update) updates a URL's query parameters
    - [$.dispatch](docs/dispatch.md) is like [trigger](https://api.jquery.com/trigger/) but sends a native event (triggers non-jQuery events too)
