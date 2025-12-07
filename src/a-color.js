/**
 * @file A custom color picker component that extends the native input type="color".
 * @module AColor
 * Supports various color spaces (RGB, HSL, OKLCH, etc.) and event throttling.
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 * @version 1.0.0
 */

import { toHex, hexTo } from './color-conversion.js';

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
   * Tracks the format of the initial value to maintain consistency if colorspace is not set.
   * @private
   * @type {string}
   * @default 'hex'
   */
  #originalFormat = 'hex';

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
    const targetFormat = this.#colorspace || this.#detectFormat(this.#value) || 'hex';
    const convertedValue = hexTo(newHex, targetFormat);
    this.value = convertedValue;
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
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
