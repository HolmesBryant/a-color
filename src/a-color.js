/**
 * @file A custom color picker component that extends the native input type="color".
 * @module AColor
 * Supports various color spaces (RGB, HSL, OKLCH, etc.) and event throttling.
 * @author Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 * @version 1.5
 */

import { toHex, hexTo } from './color-conversion.js';

const abindUpdate = Symbol.for('abind.update');

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
   * represents the element's alpha attribute, indicating whether the color's alpha component can be manipulated by the user and does not have to be fully opaque.
   * @private
   * @type {boolean}
   */
  #alpha = false;

  /**
   * The target color space for output values ("hex", "rgb", "hsl", "hwb", "lch", "oklch").
   * @private
   * @type {string|undefined}
   */
  #colormodel;

  /**
   * Internal state for defer behavior.
   * @private
   * @type {boolean}
   */
  #defer = false;

  #disabled = false;

  #form;

  #list;

  #name;

  #required = false;

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

  #connected = false;

  /**
   * Reference to the shadow DOM input element.
   * @private
   * @type {HTMLInputElement}
   */
  #input;

  #internals;

  #originalValue;

  /**
   * reference to latest requestAnimationFrame()
   * @private
   * @type {Number}
   */
  #rafId;

  #resetController;

  // --- Static Public Properties ---

  static formAssociated = true;

  /**
   * Attributes to observe for the lifecycle callback.
   * @readonly
   * @type {string[]}
   */
  static observedAttributes = [
    'alpha',
    'colormodel',
    'defer',
    'disabled',
    'form',
    'list',
    'name',
    'required',
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
      <style>
        :host {
          border: 1px solid lime;
          height: auto;
          min-height: 25px;
        }

        input {
          height:100%;
        }

        input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      </style>
      <input part="input" type="color" />

      <slot></slot>
    `;
  }

  /**
   * Initializes the web component and attaches the shadow DOM.
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.shadowRoot.append(AColor.template.content.cloneNode(true));
    this.#input = this.shadowRoot.querySelector('input');
    this.#internals = this.attachInternals();
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

    switch (attr) {
    case 'alpha':
      this.#alpha = this.hasAttribute('alpha');
      this.#input.toggleAttribute('alpha', this.#alpha);
      break;

    case 'colormodel':
      this.#colormodel = newval;

      if (this.#connected) {
        this.#value = this.#updateInputValue(this.#value);
        globalThis[abindUpdate]?.(this, 'value', this.#value);
      }
      break;

    case 'defer':
      this.#defer = this.hasAttribute('defer');
      break;

    case 'disabled':
      this.#disabled = this.hasAttribute('disabled');
      this.#input.disabled = this.#disabled;
      break;

    case 'form':
      this.#form = newval;
      this.#input.setAttribute('form', newval);
      if (this.#connected) {
        const form = document.getElementById(newval);
        if (!form || !(form instanceof HTMLFormElement)) {
          console.warn(`No form having id "${newval}" was found in the document.`);
        }
      }
      break;

    case 'list':
      this.#list = newval;
      this.#input.setAttribute('list', newval);
      break;

    case 'name':
      this.#name = newval;
      this.#input.name = newval;
      break;

    case 'required':
      this.#required = this.hasAttribute('required');
      this.#input.toggleAttribute('required', this.#required);
      break;

    case 'value':
      if (this.#connected) {
        this.#value = this.#updateInputValue(newval);
      } else {
        this.#value = newval;
      }
      break;
    }

    globalThis[abindUpdate]?.(this, attr, this[attr]);
  }

  /**
   * Called when the element is inserted into the DOM.
   * Sets up the Shadow DOM and attaches event listeners.
   */
  connectedCallback() {
    this.#abortController = new AbortController();
    const rando = 'a-color_' + Math.random().toString(36).slice(2, 8);
    if (!this.#name) this.name = rando;

    if (!this.#form) {
      const form = this.#internals.form;
      if (form && !form.id) form.id = rando;
      this.form = form?.id;
    }

    if (this.#value) {
      this.#originalValue = this.#value;
      this.#updateInputValue(this.#value);

      if (this.#internals.form) {
        this.#resetController = new AbortController();
        this.#internals.form.addEventListener('reset', event => {
          console.log(this.#originalValue)
          this.#updateInputValue(this.#originalValue);
          globalThis[abindUpdate]?.(this, 'value', this.#originalValue);
        }, { signal: this.#resetController.signal });
      }
    }


    this.#addListeners();
    this.#connected = true;
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

    if (this.#resetController) {
      this.#resetController.abort();
      this.#resetController = null;
    }
  }

  // --- Private Methods ---

  #addListeners() {
    this.#input.addEventListener('input', event => {
      this.#handleInputEvent(event);
    }, { signal: this.#abortController.signal });

    this.#input.addEventListener('change', event => {
      this.#handleChangeEvent(event)
    }, { signal: this.#abortController.signal });

    this.shadowRoot.querySelector('slot').addEventListener('slotchange', event => {
      const elems = event.target.assignedElements();
      elems.forEach( elem => {
        const datalist = (elem instanceof HTMLDataListElement) ? elem : elem.querySelector('datalist');
        if (datalist instanceof HTMLDataListElement) {
          if (!datalist.id) datalist.id = 'list';
          this.list = datalist.id;
          this.shadowRoot.append(elem);
        }
      });
    }, { signal: this.#abortController.signal });
  }

  /**
   * Converts a Hex color string to the target format (defined by colormodel or original format).
   *
   * @private
   * @param {string} hexValue - The value from the internal color input (always hex).
   * @returns {string} The converted color string.
   */
  #convertColor(hexValue) {
    let targetFormat = this.#colormodel;
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
   * Collects validity state flags (e.g., badInput, valueMissing) from the internal select element.
   * @private
   * @returns {Object<string, boolean>} An object mapping error names to their validity states.
   */
  #getInvalidStates() {
    const results = {};
    const errNames = [
      'badInput',
      'customError',
      'patternMismatch',
      'rangeOverflow',
      'rangeUnderflow',
      'stepMismatch',
      'tooLong',
      'tooShort',
      'typeMismatch',
      'valueMissing'
    ]

    errNames.forEach( name => {
      if (this.#input.validity[name]) results[name] = this.#input.validity[name];
    });

    return results;
  }

  /**
   * Handles the 'input' event from the internal color picker (dragging).
   * Respects the 'defer' property to potentially suppress events.
   *
   * @private
   * @param {Event} event - The DOM input event.
   */
  #handleInputEvent(event) {
    const value = event.target.value;
    if (this.#defer) return;
    // Cancel any pending frame so only the latest input is processed
    if (this.#rafId) cancelAnimationFrame(this.#rafId);

    this.#rafId = requestAnimationFrame(() => {
      this.#updateInputValue(value);
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
  #handleChangeEvent(event) {
    this.#updateInputValue(event.target.value);
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  /**
   * Sets validity state and message for the form-associated element using internals API.
   * @private
   * @param {Object<string, boolean>} flags - Validity state flags (e.g., badInput).
   * @param {string} [message] - Custom validation message.
   * @param {HTMLElement} [validationMessageTarget] - Element to associate the message with.
   */
  #setValidity(flags = {}) {
    this.#internals.setValidity(flags, this.#input.validationMessage, this);
  }

  /**
   * Updates the internal input element's value.
   * Enforces the `colormodel` if one is set; otherwise adapts to the incoming format.
   *
   * @private
   * @param {string} cssColor - The color string to set.
   */
  #updateInputValue(cssColor) {
    if (!cssColor) return;
    if (this.#disabled && this.#connected) return;

    let converted, hex;

    try {
      const format = this.#detectFormat(cssColor);
      hex = (format === 'hex')? cssColor : toHex(cssColor);

      if (this.#colormodel && format !== this.#colormodel) {
        // Enforce specific colormodel if set
        converted = hexTo(hex, this.#colormodel);
      } else {
        converted = cssColor;
      }
    } catch (error) {
      console.error(`Invalid color value (${cssColor}). Keeping old value.`, this);
    }

    this.#input.value = hex;
    this.#value = converted;
    this.#internals.setFormValue(converted);
    this.#setValidity(this.#getInvalidStates());
    return converted;
  }

  // --- Public Methods ---

  /**
   * Checks if the select element is valid according to HTML5 constraints.
   * @returns {boolean} True if valid, false otherwise.
   */
  checkValidity() {
    return this.#input.checkValidity();
  }

  /**
   * Reports whether the form control will participate in form validation.
   * @returns {boolean}
   */
  reportValidity() {
    return this.#input.reportValidity();
  }

  /**
   * Sets a custom validation message for the element.
   * If invalid, displays the message in the browser's UI.
   * @param {string} str - The custom error message to display.
   * @returns {boolean} True if successful, false on error.
   */
  setCustomValidity(str) {
    try {
      this.#input.setCustomValidity(str);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  showPicker() {
    this.#input.showPicker();
  }

  // --- Getters / Setters

  get alpha() { return this.#alpha }
  set alpha(value) { this.toggleAttribute('alpha', value != null && value !== false) }

  /**
   * Gets or sets the specific output color space (e.g., 'rgb', 'hsl').
   * If not set, the component attempts to preserve the format of the input value.
   * @type {string}
   */
  get colormodel() { return this.#colormodel; }
  set colormodel(value) { this.setAttribute('colormodel', value); }

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

  get disabled() { return this.#disabled }
  set disabled(value) { this.toggleAttribute('disabled', value != null && value !== false) }

  get form() { return this.#internals.form }
  set form(value) { this.setAttribute('form', value) }

  get list() { return this.#list }
  set list(value) { this.setAttribute('list', value) }

  get lists() { return [...this.shadowRoot.querySelectorAll('datalist')] }

  get internals() { return this.#internals }

  get name() { return this.#name }
  set name(value) { this.setAttribute('name', value) }

  get properties() {
    const props = [];
    AColor.observedAttributes.forEach( prop => {
      const name = prop;
      props.push(`${prop} : ${this[prop]}`);
    });

    return JSON.stringify(props, null, 2);
  }

  get required() { return this.#required }
  set required(value) { this.toggleAttribute('required', value != null && value !== false ) }

  get valid() { return this.#input.valid }

  get validity() { return this.#input.validity }

  /**
   * Gets or sets the current color value.
   * Reflects to the 'value' attribute.
   * @type {string}
   */
  get value() { return this.#value; }
  set value(value) { this.setAttribute('value', value); }
}

if (!customElements.get('a-color')) customElements.define('a-color', AColor);
