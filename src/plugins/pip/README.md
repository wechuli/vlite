# Plugin: Picture-in-Picture

Supports for Picture-in-Picture mode.

## Overview

| <!-- -->          | <!-- -->                      |
| ----------------- | ----------------------------- |
| Name              | `pip`                         |
| Global name&sup1; | `window.VlitejsPip`           |
| Path              | `vlitejs/plugins/pip`         |
| Entry point       | `vlitejs/plugins/pip/pip.js`  |
| Stylesheet        | `vlitejs/plugins/pip/pip.css` |
| Provider&sup2;    | `'html5'`                     |
| Media type&sup3;  | `'video'`                     |

> **Note** _&sup1; Useful only if `vLitejs` is included with a `<script>` tag (see [CDN](../../../README.md#CDN) section)._
>
> **Warning** Above paths uses package `exports`, with CDN use, add `dist/` after `vlitejs/`

## Usage

### HTML

```html
<video id="player" src="<path_to_video_mp4>"></video>
```

### JavaScript

```js
import 'vlitejs/vlite.css';
import Vlitejs from 'vlitejs';
import VlitejsPip from 'vlitejs/plugins/pip';

Vlitejs.registerPlugin('pip', VlitejsPip);

new Vlitejs('#player', {
  plugins: ['pip']
});
```

## Events

The plugin exposes the following native `Event` on the `.v-vlite` element.

| Event Type | Description                                             |
| ---------- | ------------------------------------------------------- |
| `enterpip` | Sent when the video switches to picture-in-picture mode |
| `leavepip` | Sent when the video exits picture-in-picture mode       |

## Demo

See the [Picture-in-Picture plugin](https://jsfiddle.net/yoriiis/fdyjt8pg) demo.
