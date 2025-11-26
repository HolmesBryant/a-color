import { toHex, hexTo } from './color-conversion.js';

class AColor extends HTMLElement {
  #value;
  #colorspace;
  #input;
  #originalFormat = 'hex';

  #abortController;

  static observedAttributes = [
    'colorspace',
    'value'
  ];

  static template = document.createElement('template');
  static {
    this.template.innerHTML = `
      <style>
        :host {
          display: inline-block;
          width: 50px; height: 30px;
        }
        input {
          border: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
      </style>
      <input type="color" />
    `;
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
  }

  connectedCallback() {
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;

    if (!this.shadowRoot.hasChildNodes()) {
      this.shadowRoot.append(AColor.template.content.cloneNode(true));
    }

    if (!this.id) {
      this.id = `a-color-${Math.random().toString(36).slice(2, 9)}`;
    }

    this.#input = this.shadowRoot.querySelector('input');
    this.#input.addEventListener('input', this.handleInput.bind(this), { signal });

    if (this.hasAttribute('value')) {
      this.updateInputValue(this.getAttribute('value'));
    }
  }

  disconnectedCallback() {
    if (this.#abortController) {
      this.#abortController.abort();
      this.#abortController = null;
    }
  }

  attributeChangedCallback(attr, oldval, newval) {
    if (oldval === newval) return;

    switch (attr) {
      case 'colorspace':
        this.#colorspace = newval;
        if (this.#value) {
          const currentHex = toHex(this.#value);
          const newValue = hexTo(currentHex, newval);
          this.value = newValue;
        }
        break;

      case 'value':
        this.#value = newval;
        this.updateInputValue(newval);
        break;
    }
  }

  updateInputValue(cssColor) {
    if (!cssColor) return;
    this.#originalFormat = this.detectFormat(cssColor);
    const hex = toHex(cssColor);
    if (this.#input && hex) this.#input.value = hex;
  }

  handleInput(event) {
    const newHex = event.target.value;
    let targetFormat = this.#colorspace || this.#originalFormat;
    const convertedValue = hexTo(newHex, targetFormat);
    this.value = convertedValue;
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  detectFormat(value) {
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

  get colorspace() { return this.#colorspace; }
  set colorspace(value) { this.setAttribute('colorspace', value); }

  get value() { return this.#value; }
  set value(value) { this.setAttribute('value', value); }
}

if (!customElements.get('a-color')) customElements.define('a-color', AColor);
