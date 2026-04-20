/**
 * @file color-conversion.js
 * A set of functions to convert various css color values to hex and back.
 * @author Holmes Bryant <Holmes Bryant <https://github.com/HolmesBryant>
 * @version 2.0.0
 * @license GPL-3.0
 */

const COLOR_NAMES = {
  aliceblue: "#f0f8ff", antiquewhite: "#faebd7", aqua: "#00ffff", aquamarine: "#7fffd4", azure: "#f0ffff",
  beige: "#f5f5dc", bisque: "#ffe4c4", black: "#000000", blanchedalmond: "#ffebcd", blue: "#0000ff",
  blueviolet: "#8a2be2", brown: "#a52a2a", burlywood: "#deb887", cadetblue: "#5f9ea0", chartreuse: "#7fff00",
  chocolate: "#d2691e", coral: "#ff7f50", cornflowerblue: "#6495ed", cornsilk: "#fff8dc", crimson: "#dc143c",
  cyan: "#00ffff", darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b", darkgray: "#a9a9a9",
  darkgreen: "#006400", darkgrey: "#a9a9a9", darkkhaki: "#bdb76b", darkmagenta: "#8b008b", darkolivegreen: "#556b2f",
  darkorange: "#ff8c00", darkorchid: "#9932cc", darkred: "#8b0000", darksalmon: "#e9967a", darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b", darkslategray: "#2f4f4f", darkslategrey: "#2f4f4f", darkturquoise: "#00ced1",
  darkviolet: "#9400d3", deeppink: "#ff1493", deepskyblue: "#00bfff", dimgray: "#696969", dimgrey: "#696969",
  dodgerblue: "#1e90ff", firebrick: "#b22222", floralwhite: "#fffaf0", forestgreen: "#228b22", fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc", ghostwhite: "#f8f8ff", gold: "#ffd700", goldenrod: "#daa520", gray: "#808080",
  green: "#008000", greenyellow: "#adff2f", grey: "#808080", honeydew: "#f0fff0", hotpink: "#ff69b4",
  indianred: "#cd5c5c", indigo: "#4b0082", ivory: "#fffff0", khaki: "#f0e68c", lavender: "#e6e6fa",
  lavenderblush: "#fff0f5", lawngreen: "#7cfc00", lemonchiffon: "#fffacd", lightblue: "#add8e6", lightcoral: "#f08080",
  lightcyan: "#e0ffff", lightgoldenrodyellow: "#fafad2", lightgray: "#d3d3d3", lightgreen: "#90ee90",
  lightgrey: "#d3d3d3", lightpink: "#ffb6c1", lightsalmon: "#ffa07a", lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa", lightslategray: "#778899", lightslategrey: "#778899", lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0", lime: "#00ff00", limegreen: "#32cd32", linen: "#faf0e6", magenta: "#ff00ff",
  maroon: "#800000", mediumaquamarine: "#66cdaa", mediumblue: "#0000cd", mediumorchid: "#ba55d3",
  mediumpurple: "#9370db", mediumseagreen: "#3cb371", mediumslateblue: "#7b68ee", mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc", mediumvioletred: "#c71585", midnightblue: "#191970", mintcream: "#f5fffa",
  mistyrose: "#ffe4e1", moccasin: "#ffe4b5", navajowhite: "#ffdead", navy: "#000080", oldlace: "#fdf5e6",
  olive: "#808000", olivedrab: "#6b8e23", orange: "#ffa500", orangered: "#ff4500", orchid: "#da70d6",
  palegoldenrod: "#eee8aa", palegreen: "#98fb98", paleturquoise: "#afeeee", palevioletred: "#db7093",
  papayawhip: "#ffefd5", peachpuff: "#ffdab9", peru: "#cd853f", pink: "#ffc0cb", plum: "#dda0dd",
  powderblue: "#b0e0e6", purple: "#800080", rebeccapurple: "#663399", red: "#ff0000", rosybrown: "#bc8f8f", royalblue: "#4169e1",
  saddlebrown: "#8b4513", salmon: "#fa8072", sandybrown: "#f4a460", seagreen: "#2e8b57", seashell: "#fff5ee",
  sienna: "#a0522d", silver: "#c0c0c0", skyblue: "#87ceeb", slateblue: "#6a5acd", slategray: "#708090",
  slategrey: "#708090", snow: "#fffafa", springgreen: "#00ff7f", steelblue: "#4682b4", tan: "#d2b48c",
  teal: "#008080", thistle: "#d8bfd8", tomato: "#ff6347", turquoise: "#40e0d0", violet: "#ee82ee",
  wheat: "#f5deb3", white: "#ffffff", whitesmoke: "#f5f5f5", yellow: "#ffff00", yellowgreen: "#9acd32"
};

// Lazy-load reverse map for named colors
let HEX_TO_NAMES = null;

function getHexToNameMap() {
  if (HEX_TO_NAMES) return HEX_TO_NAMES;
  HEX_TO_NAMES = {};
  for (const [name, hex] of Object.entries(COLOR_NAMES)) {
    // If multiple names point to same hex (gray/grey), the last one overwrites.
    HEX_TO_NAMES[hex] = name;
  }
  return HEX_TO_NAMES;
}

const toDoubleHex = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
const clamp = (v) => Math.min(1, Math.max(0, v));

/**
 * Parses a hex string into normalized [0-1] linear RGB components.
 * @returns {Object} {r, g, b} in 0-1 range (sRGB)
 */
function parseHexToRgb(hex) {
  if (hex.startsWith('#')) hex = hex.slice(1);
  let r, g, b;

  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    const val = parseInt(hex, 16);
    r = (val >> 16) & 255;
    g = (val >> 8) & 255;
    b = val & 255;
  }
  return { r: r / 255, g: g / 255, b: b / 255 };
}

/**
 * Converts sRGB [0-1] to Linear RGB [0-1]
 */
function sRgbToLinear({ r, g, b }) {
  const linearize = c => (c <= 0.04045) ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return { r: linearize(r), g: linearize(g), b: linearize(b) };
}

// ==========================================
// Main Exported Functions
// ==========================================

/**
 * Converts CSS color string to Hex.
 */
function toHex(value) {
  if (!value) return console.error('No color value to convert');
  value = value.trim();
  if (value.startsWith('#')) return value;
  if (value.startsWith('rgb')) return rgbToHex(value);
  if (value.startsWith('hsl')) return hslToHex(value);
  if (value.startsWith('hwb')) return hwbToHex(value);
  if (value.startsWith('lch')) return lchToHex(value);
  if (value.startsWith('oklch')) return oklchToHex(value);
  return namedColorToHex(value);
}

/**
 * Converts Hex string to specific CSS color space.
 * @param {string} hex - The hex color (e.g. #ff0000)
 * @param {string} format - The target format (rgb, hsl, hwb, lch, oklch, name)
 */
function hexTo(hex, format) {
  if (!hex || !format) return hex;
  switch (format.toLowerCase()) {
    case 'rgb': return hexToRgb(hex);
    case 'hsl': return hexToHsl(hex);
    case 'hwb': return hexToHwb(hex);
    case 'lch': return hexToLch(hex);
    case 'oklch': return hexToOklch(hex);
    case 'name': return hexToName(hex);
    default: return hex;
  }
}

// ==========================================
// TO HEX Conversions (CSS -> Hex)
// ==========================================

function rgbToHex(value) {
  const [r, g, b] = value.match(/\d+(\.\d+)?/g).map(Number);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function hslToHex(value) {
  const [h, s, l] = value.match(/\d+(\.\d+)?/g).map(Number);
  const sPct = s / 100, lPct = l / 100;

  const k = n => (n + h / 30) % 12;
  const a = sPct * Math.min(lPct, 1 - lPct);
  const f = n => lPct - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  return `#${toDoubleHex(f(0))}${toDoubleHex(f(8))}${toDoubleHex(f(4))}`;
}

function hwbToHex(value) {
  const [h, w, b] = value.match(/\d+(\.\d+)?/g).map(Number);
  const wPct = w / 100, bPct = b / 100;

  if (wPct + bPct >= 1) {
    const gray = wPct / (wPct + bPct);
    return `#${toDoubleHex(gray)}${toDoubleHex(gray)}${toDoubleHex(gray)}`;
  }

  const rgb = hslToHex(`hsl(${h}, 100%, 50%)`); // Get pure hue
  const rgbVals = parseHexToRgb(rgb); // reuse our helper

  const mix = (c) => c * (1 - wPct - bPct) + wPct;
  return `#${toDoubleHex(mix(rgbVals.r))}${toDoubleHex(mix(rgbVals.g))}${toDoubleHex(mix(rgbVals.b))}`;
}

function lchToHex(value) {
  // Logic preserved from prompt, but cleaned up slightly
  const [l, c, h] = value.match(/\d+(\.\d+)?/g).map(Number);
  const rad = h * (Math.PI / 180);
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);

  let y = (l + 16) / 116;
  let x = a / 500 + y;
  let z = y - b / 200;

  const cube = v => (v * v * v > 0.008856) ? v * v * v : (v - 16 / 116) / 7.787;

  x = 95.047 * cube(x);
  y = 100.000 * cube(y);
  z = 108.883 * cube(z);

  // XYZ to RGB
  let r = x * 0.032406 + y * -0.015372 + z * -0.004986;
  let g = x * -0.009689 + y * 0.018758 + z * 0.000415;
  let bl = x * 0.000557 + y * -0.002040 + z * 0.010570;

  const gamma = v => (v <= 0.0031308) ? 12.92 * v : 1.055 * Math.pow(v, 1/2.4) - 0.055;
  return `#${toDoubleHex(clamp(gamma(r)))}${toDoubleHex(clamp(gamma(g)))}${toDoubleHex(clamp(gamma(bl)))}`;
}

function oklchToHex(value) {
  const [l, c, h] = value.match(/\d+(\.\d+)?/g).map(Number);
  const rad = h * (Math.PI / 180);
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  let r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  const gamma = v => (v <= 0.0031308) ? 12.92 * v : 1.055 * Math.pow(v, 1/2.4) - 0.055;
  return `#${toDoubleHex(clamp(gamma(r)))}${toDoubleHex(clamp(gamma(g)))}${toDoubleHex(clamp(gamma(bl)))}`;
}

function namedColorToHex(value) {
  return COLOR_NAMES[value.toLowerCase()] || null;
}

// ==========================================
// FROM HEX Conversions (Hex -> CSS)
// ==========================================

function hexToName(hex) {
  if (!hex) return 'black';
  hex = hex.toLowerCase();
  if (hex.length === 4) {
    // Expand shorthand #f00 -> #ff0000 for lookup
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  const map = getHexToNameMap();
  return map[hex] || hex;
}

function hexToRgb(hex) {
  const { r, g, b } = parseHexToRgb(hex);
  return `rgb(${Math.round(r*255)}, ${Math.round(g*255)}, ${Math.round(b*255)})`;
}

function hexToHsl(hex) {
  const { r, g, b } = parseHexToRgb(hex);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function hexToHwb(hex) {
  const { r, g, b } = parseHexToRgb(hex);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const w = min;
  const bl = 1 - max;

  let h;
  if (max === min) h = 0;
  else {
    const d = max - min;
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `hwb(${Math.round(h * 360)} ${Math.round(w * 100)}% ${Math.round(bl * 100)}%)`;
}

function hexToLch(hex) {
  // Linearize RGB
  const { r, g, b } = sRgbToLinear(parseHexToRgb(hex));

  // RGB -> XYZ (D65)
  // X = 0.4124564*R + 0.3575761*G + 0.1804375*B
  // Y = 0.2126729*R + 0.7151522*G + 0.0721750*B
  // Z = 0.0193339*R + 0.1191920*G + 0.9503041*B
  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100;

  // XYZ -> LAB
  const refX = 95.047, refY = 100.000, refZ = 108.883;
  x /= refX; y /= refY; z /= refZ;

  const f = (t) => t > 0.008856 ? Math.cbrt(t) : (7.787 * t) + (16 / 116);
  x = f(x); y = f(y); z = f(z);

  const L = (116 * y) - 16;
  const a = 500 * (x - y);
  const bVal = 200 * (y - z);

  // LAB -> LCH
  const C = Math.sqrt(a * a + bVal * bVal);
  let H = Math.atan2(bVal, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  return `lch(${L.toFixed(2)}% ${C.toFixed(3)} ${H.toFixed(2)})`;
}

function hexToOklch(hex) {
  // Linearize RGB
  const { r, g, b } = sRgbToLinear(parseHexToRgb(hex));

  // Linear sRGB -> LMS (Approximate OKLab matrices)
  const l_ = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m_ = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s_ = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_c = Math.cbrt(l_);
  const m_c = Math.cbrt(m_);
  const s_c = Math.cbrt(s_);

  // LMS -> OKLab
  const L = 0.2104542553 * l_c + 0.7936177850 * m_c - 0.0040720468 * s_c;
  const a = 1.9779984951 * l_c - 2.4285922050 * m_c + 0.4505937099 * s_c;
  const bVal = 0.0259040371 * l_c + 0.7827717662 * m_c - 0.8086757660 * s_c;

  // OKLab -> OKLCH
  const C = Math.sqrt(a * a + bVal * bVal);
  let H = Math.atan2(bVal, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(2)})`;
}

/**
 * @file A custom color picker component that extends the native input type="color".
 * @module AColor
 * Supports various color spaces (RGB, HSL, OKLCH, etc.) and event throttling.
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 * @version 1.0.1
 */

/**
 * A custom element that wraps a native `<input type="color">`.
 *
 * Features:
 * - Supports multiple color formats (hex, rgb, hsl, lch, oklch, etc.).
 * - Automatically detects input format to maintain consistency.
 * - 'defer' attribute to suppress high-frequency input events during dragging.
 * - Integration with global `window.abind` for state management (optional).
 *
 * @tagname a-color
 * @extends HTMLElement
 * @fires input - Fired when the color is changed (unless deferred).
 * @fires change - Fired when the user commits a color selection.
 */
class AColor extends HTMLElement {
  // --- Attributes ---

  /**
   * The target color space for output values.
   * @private
   * @type {string|undefined}
   */
  #colorspace;

  /**
   * Internal state for defer behavior.
   * @private
   * @type {boolean}
   */
  #defer = false;

  /**
   * The current color value.
   * @private
   * @type {string|undefined}
   */
  #value;

  // -- Private Properties ---

  /**
   * Controller for managing event listeners and cleanup.
   * @private
   * @type {AbortController|null}
   */
  #abortController;

  /**
   * Reference to the shadow DOM input element.
   * @private
   * @type {HTMLInputElement}
   */
  #input;

  /**
   * reference to latest requestAnimationFrame()
   * @private
   * @type {Number}
   */
  #rafId;

  // --- Static Public Properties ---

  static formAssociated = true;

  /**
   * Attributes to observe for the lifecycle callback.
   * @readonly
   * @type {string[]}
   */
  static observedAttributes = [
    'colorspace',
    'defer',
    'value'
  ];

  /**
   * The HTML template for the shadow DOM.
   * @type {HTMLTemplateElement}
   */
  static template = document.createElement('template');

  /**
   * Static initialization block to populate the template.
   */
  static {
    this.template.innerHTML = `
      <input part="input" type="color" />
    `;
  }

  /**
   * Initializes the web component and attaches the shadow DOM.
   */
  constructor() {
    super();
    this.attachInternals();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
  }

  // --- Lifecycle ---

  /**
   * Called when one of the observed attributes changes.
   * Handles synchronization between attributes, properties, and the internal input.
   *
   * @param {string} attr - The name of the attribute that changed.
   * @param {string|null} oldval - The previous value of the attribute.
   * @param {string|null} newval - The new value of the attribute.
   */
  attributeChangedCallback(attr, oldval, newval) {
    if (oldval === newval) return;

    if (attr === 'colorspace') {
      this.#colorspace = newval;

      // Attempt to convert current value to new colorspace immediatey
      if (this.#value) {
        try {
          const currentHex = toHex(this.#value);
          if (currentHex) {
            const converted = hexTo(currentHex, newval);
            // Prevent recursion: only update if the string representation actually changes
            if (converted !== this.#value) {
              this.value = converted;
            }
          }
        } catch (error) {
          console.warn('Conversion failed during colorspace change', error);
        }
      }
    } else if (attr === 'value') {
      const validHex = toHex(newval);
      if (validHex) {
        this.#value = newval;
        this.#updateInputValue(newval);
      }
    } else if (attr === 'defer') {
      this.#defer = newval !== 'false' && newval !== null;
    }

    window.abind?.update?.(this, attr, newval);
  }

  /**
   * Called when the element is inserted into the DOM.
   * Sets up the Shadow DOM and attaches event listeners.
   */
  connectedCallback() {
    if (this.#abortController) this.#abortController.abort();
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;

    if (!this.shadowRoot.hasChildNodes()) {
      this.shadowRoot.append(AColor.template.content.cloneNode(true));
    }

    this.#input = this.shadowRoot.querySelector('input');
    if (this.hasAttribute('value')) {
      this.#updateInputValue(this.getAttribute('value'));
    }

    this.#input.addEventListener('input', this.#handleInputInput.bind(this), { signal });
    this.#input.addEventListener('change', this.#handleInputChange.bind(this), { signal });
  }

  /**
   * Called when the element is removed from the DOM.
   * Cleans up event listeners via the AbortController.
   */
  disconnectedCallback() {
    if (this.#abortController) {
      this.#abortController.abort();
      this.#abortController = null;
    }
  }

  // --- Private Methods ---

  /**
   * Converts a Hex color string to the target format (defined by colorspace or original format).
   *
   * @private
   * @param {string} hexValue - The value from the internal color input (always hex).
   * @returns {string} The converted color string.
   */
  #convertColor(hexValue) {
    let targetFormat = this.#colorspace;
    return hexTo(hexValue, targetFormat);
  }

  /**
   * Detects the CSS color format of a given string.
   *
   * @private
   * @param {string} value - The color string to analyze.
   * @returns {string} The format name (e.g., 'hex', 'rgb', 'oklch').
   */
  #detectFormat(value) {
    if (!value) return 'hex';
    value = value.toLowerCase().trim();
    if (value.startsWith('#')) return 'hex';
    if (value.startsWith('rgb')) return 'rgb';
    if (value.startsWith('hsl')) return 'hsl';
    if (value.startsWith('hwb')) return 'hwb';
    if (value.startsWith('lch')) return 'lch';
    if (value.startsWith('oklch')) return 'oklch';
    return 'name';
  }

  /**
   * Handles the 'input' event from the internal color picker (dragging).
   * Respects the 'defer' property to potentially suppress events.
   *
   * @private
   * @param {Event} event - The DOM input event.
   */
  #handleInputInput(event) {
    if (this.defer) return;
    const newHex = event.target.value;
    // Cancel any pending frame so only the latest input is processed
    if (this.#rafId) cancelAnimationFrame(this.#rafId);

    this.#rafId = requestAnimationFrame(() => {
      const targetFormat = this.#colorspace || this.#detectFormat(this.#value) || 'hex';
      const convertedValue = hexTo(newHex, targetFormat);
      this.value = convertedValue;
      this.dispatchEvent(
        new Event('input', { bubbles: true, composed: true })
      );

      this.#rafId = null;
    });
  }


  /**
   * Handles the 'change' event from the internal color picker (commit/release).
   * Always updates the value and dispatches a change event.
   *
   * @private
   * @param {Event} event - The DOM change event.
   */
  #handleInputChange(event) {
    const newHex = event.target.value;
    const targetFormat = this.#colorspace || this.#detectFormat(this.#value) || 'hex';
    const convertedValue = hexTo(newHex, targetFormat);
    this.value = convertedValue;
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  /**
   * Updates the internal input element's value.
   * Enforces the `colorspace` if one is set; otherwise adapts to the incoming format.
   *
   * @private
   * @param {string} cssColor - The color string to set.
   */
  #updateInputValue(cssColor) {
    if (!cssColor) return;
    try {
      // Enforce specific colorspace if set
      if (this.colorspace) {
        const detected = this.#detectFormat(cssColor);
        if (detected !== this.colorspace) {
          const hex = toHex(cssColor);
          if (hex) {
            const converted = hexTo(hex, this.colorspace);
            // Strict check to prevent infinite recursion loop
            if (converted !== cssColor) {
              this.value = converted;
              return;
            }
          }
        }
      }

      // Normal processing (Update Internal Input)
      const hex = toHex(cssColor);
      if (this.#input && hex && this.#input.value !== hex) {
        this.#input.value = hex;
      }
    } catch (error) {
      console.warn('Invalid color value. Keeping old value', error);
    }
  }

  // --- Getters / Setters

  /**
   * Gets or sets the specific output color space (e.g., 'rgb', 'hsl').
   * If not set, the component attempts to preserve the format of the input value.
   * @type {string}
   */
  get colorspace() { return this.#colorspace; }
  set colorspace(value) { this.setAttribute('colorspace', value); }

  /**
   * Gets or sets the current color value.
   * Reflects to the 'value' attribute.
   * @type {string}
   */
  get value() { return this.#value; }
  set value(value) { this.setAttribute('value', value); }

  /**
   * Gets or sets the defer mode.
   * If true, 'input' events (dragging) are suppressed, and only 'change' events are fired.
   * @type {boolean}
   */
  get defer() { return this.#defer; }
  set defer(value) {
    value = value !== 'false' && value !== false;
    this.toggleAttribute('defer', value);
  }
}

if (!customElements.get('a-color')) customElements.define('a-color', AColor);
