/**
 * AnalysisPreferenceControls.ts
 *
 * FFT size and analysis-window selectors for Preferences → Visual. These bind to
 * the shared SimModel (they affect the DSP), but live in Preferences alongside the
 * spectrogram colormap rather than cluttering the on-screen control panel.
 */
import type { NumberProperty, Property, TReadOnlyProperty } from "scenerystack/axon";
import { PreferencesControl, PreferencesDialogConstants } from "scenerystack/joist";
import type { Node } from "scenerystack/scenery";
import { Text } from "scenerystack/scenery";
import { ComboBox } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../i18n/StringManager.js";
import { WINDOW_TYPE_VALUES, type WindowType } from "../model/dsp/WindowFunction.js";

const FFT_SIZE_OPTIONS = [1024, 2048, 4096];

function getSimTopLayer(): Node {
  const phetGlobals = globalThis as unknown as { phet: { joist: { sim: { topLayer: Node } } } };
  return phetGlobals.phet.joist.sim.topLayer;
}

export function createFftSizePreferenceControl(fftSizeProperty: NumberProperty): Node {
  const controls = StringManager.getInstance().getControlStrings();

  const comboBoxItems = FFT_SIZE_OPTIONS.map((size) => ({
    value: size,
    createNode: () => new Text(`${size}`, PreferencesDialogConstants.PANEL_SECTION_CONTENT_OPTIONS),
  }));

  const comboBox = new ComboBox(fftSizeProperty, comboBoxItems, getSimTopLayer(), {
    tandem: Tandem.OPT_OUT,
  });

  return new PreferencesControl({
    labelNode: new Text(controls.fftSizeStringProperty, PreferencesDialogConstants.CONTROL_LABEL_OPTIONS),
    controlNode: comboBox,
  });
}

export function createWindowPreferenceControl(windowTypeProperty: Property<WindowType>): Node {
  const controls = StringManager.getInstance().getControlStrings();
  const windowStrings = StringManager.getInstance().getWindowStrings();

  const windowLabels: Record<WindowType, TReadOnlyProperty<string>> = {
    hann: windowStrings.hannStringProperty,
    hamming: windowStrings.hammingStringProperty,
    blackman: windowStrings.blackmanStringProperty,
  };

  const comboBoxItems = WINDOW_TYPE_VALUES.map((type) => ({
    value: type,
    createNode: () => new Text(windowLabels[type], PreferencesDialogConstants.PANEL_SECTION_CONTENT_OPTIONS),
  }));

  const comboBox = new ComboBox(windowTypeProperty, comboBoxItems, getSimTopLayer(), {
    tandem: Tandem.OPT_OUT,
  });

  return new PreferencesControl({
    labelNode: new Text(controls.windowStringProperty, PreferencesDialogConstants.CONTROL_LABEL_OPTIONS),
    controlNode: comboBox,
  });
}
