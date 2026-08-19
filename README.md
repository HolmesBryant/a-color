# a-color

A modern, lightweight Web Component that supercharges the native HTML `<input type="color">`and adds support for modern color models (rgb, hsl, hwb, lch, oklch), smart format detection, and event throttling for performance.

Demo: [https://holmesbryant.github.io/a-color/](https://holmesbryant.github.io/a-color/)

** Features

* **Format Aware:** Automatically detects and preserves input formats (e.g., passing rgb(0,0,0) results in an RGB output).

* **Color Model Conversion:** Force output to a specific format (e.g., always emit oklch) regardless of user input.

* **Performance Mode (defer):** Optional attribute to suppress high-frequency events during dragging, firing only when the user commits a choice.

* **Seamless Form Integration** Impliments the ElementInternals API for seamless form integration.

* **Zero Dependencies**

## Installation

Import the component into your JavaScript bundle or HTML file.

```html
<!-- html -->
<script type="module" src="a-color.min.js"></script>
```

## Basic Example

  Behaves like a standard color input, but accepts any valid CSS color string.

  ```html
  <!-- Initialize with a named color -->
  <a-color value="lemonchiffon"></a-color>

  <!-- Initialize with RGB -->
  <a-color value="rgb(255, 0, 0)"></a-color>
```

## Enforcing a Color Model

  By default, the component emits values in the same format it was initialized with. You can force a specific output format using the colormodel attribute.

  ```html
  <!-- User sees a color picker, but the output value will always be HSL -->
  <a-color colormodel="hsl" value="#ff0000"></a-color>

  <script>
    const picker = document.querySelector('a-color');
    picker.addEventListener('change', (e) => {
      console.log(picker.value); // Output: "hsl(0, 100%, 50%)"
    });
  </script>
  ```

## Deferring Events

  The native color input fires input events continuously while dragging the mouse. If this triggers expensive updates (like WebGL rendering or network requests), add the 'defer' attribute.

  ```html
  <!-- Only updates when the user releases the mouse or closes the picker -->
  <a-color defer value="#00ff00"></a-color>
```

## Attributes & Properties

  ### alpha (experimental)

    If present (or true), indicates the color's alpha component can be manipulated by the end user and does not have to be fully opaque.

    Note: As of the latest commit, only Safari and WebView on iOS support this attribute.

    - Property name: alpha
    - Type: boolean
    - Default: false

  ### colormodel

    The target output format (e.g., 'hex', 'rgb', 'hsl', 'hwb', 'lch', 'oklch'). If unset, output matches the format of the initial value.

    - Property name: colormodel
    - Type: string
    - Default: undefined

  ### defer

    If present (or true), the input event is suppressed. Only change events will update the state.

    - Property name: defer
    - Type: boolean
    - Default: false

  ### disabled

    If present, disables the color input.

    - Property name: disabled
    - Type: boolean
    - Default: false

  ### form

    The form id of the form in the HTML document with which the input should be associated.

    - Property name: form
    - Type: string
    - Default: null | the id of the form which is a parent of `<a-color?`.

  ### list

    The id of the datalist element with which `<a-color>` is associated.

    In order to associate `<a-color>` with a datalist, you must include the datalist element as a child of `<a-color>`.

    If you dynamically change the datalist options, you must replace the whole datalist (not just the options) or the new options will not be available to the color picker.

    For cross-browser compatibility, the value of each option must be a valid hexadecimal color.

    - Property name: list
    - Type: string
    - Default: undefined

    **NOTE** The result varies widely between browsers. In Chromium-based browsers, a popup appears containing a clickable color chip for each option in the datalist with a button at the bottom labeled "Other...", while in Firefox the "custom colors" area of the color picker will be populated with the colors defined in the datalist.

    ```html
    <a-color list="custom-colors">
      <datalist id="custom-colors">
        <option>#115512</option>
      </datalist>
    </a-color>
    ```

    If you want a cross-browser way to display a browser-specific array of color chips, include a datalist with no options. The color picker in Firefox always displays a set of default color chips, but Chromium based browsers do not.

    ```html
    <a-color list="color-chips">
      <datalist id="color-chips"></datalist>
    </a-color>
    ```

    If you want to dynamically change which list a-color uses, include all datalists as children of a-select and change the value of the `list` attribute.

    If you want to include the option to not use a list at all, set `list="null"`

    ```html
    <a-color list="custom-colors">

      <datalist id="custom-colors">
        <option>#115512</option>
      </datalist>

      <data-list id="default-colors"></data-list>
    </a-color>
    ```

  ### name

    The name of the input. If no name is set, a semi-random name is assigned.

    - Property name: name
    - Type: string
    - Default: 'a-color_' + a random string

  ### value

    The current color value. Can be set to any valid CSS color string (hex, rgb, named, etc.)

    - Property name: value
    - Type: string
    - Default: undefined

## Events

  ### input

  Fired continuously as the user drags the color selector. (Suppressed if defer is true).

  ### change

  Fired when the user commits a selection (closes the picker or releases the mouse handle).

## Browser Support

Works in all modern browsers supporting Web Components (Custom Elements v1) and Shadow DOM.

## Change Log

- v2.0
  - Breaking change: changed "colorspace" attribute to "colormodel".
  - Fully implimented ElementInternals API for seamless form integration.

- v1.5
  - Made integration with a-bind independant of global `update` variable.
  - Changed some dev dependencies

- v1.1
  - Improved error handling.
  - Fix bug where 'defer' wasn't deferring updates.

- v1.0.1 : Implemented requestAnmationFrame() on non-deferred updates to prevent layout thrashing.

- v1.0.0 : WooHoo!
