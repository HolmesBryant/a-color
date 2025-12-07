# a-color

A modern, lightweight Web Component that supercharges the native HTML `<input type="color">`.
While the standard browser color input is limited to Hex codes, `<a-color>` adds support for modern color spaces (RGB, HSL, OKLCH, etc.), smart format detection, and event throttling for performance.

Demo: [https://holmesbryant.github.io/a-color/](https://holmesbryant.github.io/a-color/)

** Features

* **Format Aware:** Automatically detects and preserves input formats (e.g., passing rgb(0,0,0) results in an RGB output).

* **Color Space Conversion:** Force output to a specific format (e.g., always emit oklch) regardless of user input.

* **Performance Mode (defer):** Optional attribute to suppress high-frequency events during dragging, firing only when the user commits a choice.

* **Zero Dependencies**

## Change Log

- v1.0.0 : Initial commit

## Installation

Import the component into your JavaScript bundle or HTML file.

```javaScript
// javascript
import './a-color.min.js';
```

```html
<!-- html -->
<script type="module" src="a-color.min.js"></script>
```

## Usage

### Basic Example

Behaves like a standard color input, but accepts any valid CSS color string.

```html
<!-- Initialize with a named color -->
<a-color value="crimson"></a-color>

<!-- Initialize with RGB -->
<a-color value="rgb(255, 0, 0)"></a-color>
```

### Enforcing a Color Space

By default, the component emits values in the same format it was initialized with. You can force a specific output format using the colorspace attribute.

```html
<!-- User sees a color picker, but the output value will always be HSL -->
<a-color colorspace="hsl" value="#ff0000"></a-color>

<script>
  const picker = document.querySelector('a-color');
  picker.addEventListener('input', (e) => {
    console.log(picker.value); // Output: "hsl(0, 100%, 50%)"
  });
</script>
```

### Deferring Events (Performance)

The native color input fires input events continuously while dragging the mouse. If this triggers expensive updates (like WebGL rendering or network requests), add the 'defer' attribute.

```html
<!-- Only updates when the user releases the mouse or closes the picker -->
<a-color defer value="#00ff00"></a-color>
```

## API Reference

### Attributes & Properties

|   Attribute   |   Property    |   Type    |   Default  |  Description |
|   :--------   |   :-------    |   :-----  |   :------  |  :----------
|   value       |   value       |   string  |   undefined|  The current color value. Can be set to any valid CSS color string (hex, rgb, named, etc.)|
|   colorspace  |   colorspace  |   string  |   undefined|  The target output format (e.g., 'hex', 'rgb', 'hsl', 'oklch'). If unset, output matches the format of the initial value.|
|   defer       |   defer       |   boolean |   false    |  If present, the input event is suppressed. Only change events will update the state.

### Events

|   Event Name  |   Description                                                                                 |
|   :---------  |   :------------------------------------------------------------------------------------------ |
|   input       |   Fired continuously as the user drags the color selector. (Suppressed if defer is true).     |
|   change      |   Fired when the user commits a selection (closes the picker or releases the mouse handle).   |


## Browser Support

Works in all modern browsers supporting Web Components (Custom Elements v1) and Shadow DOM.
