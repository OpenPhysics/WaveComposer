/**
 * VoiceModel.ts
 *
 * Screen-specific model for the Voice & Vowels screen. It owns an independent
 * audio/DSP pipeline configured for voice and phonetics presets.
 */

import { VOICE_PRESET_CATALOG } from "../../common/model/audio/presetCatalog.js";
import { BaseAnalysisModel } from "../../common/model/BaseAnalysisModel.js";
import type { AnalysisPreferencesModel } from "../../preferences/AnalysisPreferencesModel.js";

export class VoiceModel extends BaseAnalysisModel {
  public constructor(analysisPreferences: AnalysisPreferencesModel) {
    super(VOICE_PRESET_CATALOG, analysisPreferences);
  }
}
