/**
 * Test suite for <a-color> Custom Element
 * @see a-color.js
 */

import ATestRunner from './ATestRunner.min.js';
import '../src/a-color.js';

const runner = new ATestRunner(import.meta.url);
runner.output = 'a-testrunner';

const {group, test, equal, wait, spyOn, genCombos } = runner;

// Helper to create a fresh element for each test
function createFixture(attributes = {}) {
  const el = document.createElement('a-color');
  for (const [key, val] of Object.entries(attributes)) {
    if (val === true) el.setAttribute(key, '');
    else el.setAttribute(key, val);
  }
  document.body.appendChild(el);
  return el;
}

// Cleanup helper
function cleanup() {
  document.querySelectorAll('a-color').forEach(el => el.remove());
}

group("Initialization & DOM Structure", () => {
  const el = createFixture();

  test("Element is defined in CustomElementsRegistry",
    !!customElements.get('a-color'),
    true
  );

  test("Shadow DOM is attached",
    !!el.shadowRoot,
    true
  );

  test("Contains internal color input",
    !!el.shadowRoot.querySelector('input[type="color"]'),
    true
  );

  cleanup();
});

group("Attribute Reflection & Properties", () => {
    const el = createFixture();

    test("Setting value property reflects to attribute", () => {
        el.value = "#ff0000";
        return el.getAttribute('value');
    }, "#ff0000");

    test("Setting colorspace property reflects to attribute", () => {
        el.colorspace = "hsl";
        return el.getAttribute('colorspace');
    }, "hsl");

    test("Setting defer property reflects to attribute", () => {
        el.defer = true;
        return el.hasAttribute('defer');
    }, true);

    cleanup();
});

group("Color Conversions (Set Value -> Read Value)", () => {
    const el = createFixture();

    // 1. Named Colors
    test("Named color input returns name", () => {
        el.value = "rebeccapurple";
        return el.value;
    }, "rebeccapurple");

    test("Named color updates internal hex input", () => {
        el.value = "red"; // red is #ff0000
        const input = el.shadowRoot.querySelector('input');
        return input.value;
    }, "#ff0000");

    // 2. RGB
    test("RGB input returns RGB string", () => {
        el.colorspace = 'rgb';
        el.value = "rgb(0, 255, 0)";
        return el.value;
    }, "rgb(0, 255, 0)");

    // 3. OKLCH (Modern CSS)
    test("OKLCH input persists", () => {
        el.colorspace = 'oklch';
        // Note: The component normalizes strings, so we check if it starts with oklch
        el.value = "oklch(60% 0.15 180)";
        return el.value.startsWith('oklch');
    }, true);

    cleanup();
});

group("Cross-Colorspace Conversion", () => {
  // Here we test: Set Value as Hex -> Output as Something else
  const el = createFixture();

  test("Convert Hex to RGB",
    () => {
      el.colorspace = "rgb";
      el.value = "#ffffff";
      return el.value;
    },
    "rgb(255, 255, 255)"
  );

  test("Convert Name to HSL",
    () => {
      el.colorspace = "hsl";
      el.value = "red"; // hsl(0, 100%, 50%)
      return el.value;
    },
    "hsl(0, 100%, 50%)"
  );

  cleanup();
});

group("User Interaction & Events", () => {

    test("Dispatches 'input' event on internal interaction", async () => {
        const el = createFixture();
        const input = el.shadowRoot.querySelector('input');

        // Listen for event
        let capturedVal = null;
        el.addEventListener('input', (e) => {
            capturedVal = e.target.value;
        });

        // Simulate user picking a color internally
        input.value = "#00ff00";
        input.dispatchEvent(new Event('input', { bubbles: true }));

        return capturedVal;
    }, "#00ff00");

    test("Updates value attribute on internal input", async () => {
        const el = createFixture();
        const input = el.shadowRoot.querySelector('input');

        input.value = "#000000";
        input.dispatchEvent(new Event('input', { bubbles: true }));

        return el.getAttribute('value');
    }, "#000000");

    test("Dispatches 'change' event on commit", async () => {
        const el = createFixture();
        const input = el.shadowRoot.querySelector('input');

        let fired = false;
        el.addEventListener('change', () => fired = true);

        input.dispatchEvent(new Event('change', { bubbles: true }));

        return fired;
    }, true);

    cleanup();
});

group("Defer Functionality", () => {

    test("When defer is TRUE, 'input' event is suppressed", async () => {
        const el = createFixture({ defer: true });
        const input = el.shadowRoot.querySelector('input');

        let inputFired = false;
        el.addEventListener('input', () => inputFired = true);

        // Simulate drag
        input.value = "#aabbcc";
        input.dispatchEvent(new Event('input', { bubbles: true }));

        return inputFired;
    }, false);

    test("When defer is TRUE, 'change' event still fires", async () => {
        const el = createFixture({ defer: true });
        const input = el.shadowRoot.querySelector('input');

        let changeFired = false;
        el.addEventListener('change', () => changeFired = true);

        input.dispatchEvent(new Event('change', { bubbles: true }));

        return changeFired;
    }, true);

    cleanup();
});

group("Matrix: Color Formats", () => {
    // Use genCombos to verify the component handles setting multiple formats
    // without crashing, even if we don't strictly validate the math here.

    const formats = {
        cs: ['hex', 'rgb', 'hsl', 'hwb', 'lch', 'oklch', 'name']
    };

    for (const combo of genCombos(formats)) {
        test(`Can set colorspace to '${combo.cs}'`, () => {
            const el = createFixture();
            el.colorspace = combo.cs;
            el.value = "red"; // Should convert red to target format
            const result = el.value;
            el.remove();
            // Basic validation: ensure it's a string and not empty
            return typeof result === 'string' && result.length > 0;
        }, true);
    }
});

group("Error Handling", () => {
  const el = createFixture({ value: "#ffffff" });

  test("Invalid color value is ignored (keeps previous)", () => {
    const spy = spyOn(console, 'warn'); // Component warns on console

    el.value = "not-a-color";

    const keptValue = el.value;
    spy.restore();

    return keptValue;
  }, "#ffffff");

  cleanup();
});

runner.run();
