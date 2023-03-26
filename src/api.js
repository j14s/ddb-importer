// for exports
import DDBMonster from "./parser/DDBMonster.js";
import DDBMonsterFactory from "./parser/DDBMonsterFactory.js";
import { parseSpells } from "./muncher/spells.js";
import { parseItems } from "./muncher/items.js";
import { parseTransports } from "./muncher/vehicles.js";
import { updateWorldMonsters, resetCompendiumActorImages, parseCritters } from "./muncher/tools.js";
import { migrateExistingCompendium, createCompendiumFolderStructure } from "./muncher/compendiumFolders.js";
import DDBEncounterMunch from "./apps/DDBEncounterMunch.js";
import DDBEncounters from "./parser/DDBEncounters.js";
import { generateAdventureConfig } from "./muncher/adventure.js";
import { updateDDBCharacter } from "./updater/character.js";
import DDBCharacterManager, { importCharacter, importCharacterById } from "./apps/DDBCharacterManager.js";
import { checkCobalt } from "./lib/Secrets.js";
import { base64Check } from "./lib/base64Check.js";
import { getFeats } from "./muncher/feats/feats.js";
import { loadMacroFile, generateItemMacroFlag, createMacro, executeDDBMacro, MACROS } from "./effects/macros.js";
import { iconPath } from "./icons/index.js";
import { loadSRDRules, importCacheLoad } from "./lib/DDBTemplateStrings.js";
import { getNPCImage } from "./muncher/importMonster.js";
import PatreonHelper from "./lib/PatreonHelper.js";
import CompendiumHelper from "./lib/CompendiumHelper.js";
import FileHelper from "./lib/FileHelper.js";
import { DirectoryPicker } from "./lib/DirectoryPicker.js";
import MuncherSettings from "./lib/MuncherSettings.js";
import { generateIcon } from "./lib/icons.js";
import DDBProxy from "./lib/DDBProxy.js";
import DDBCompanion from "./parser/companions/DDBCompanion.js";
import DDBCompanionFactory from "./parser/companions/DDBCompanionFactory.js";
import {
  checkTargetInRange,
  configureCustomAAForCondition,
  addSaveAdvantageToTarget,
  findContainedTokensInTemplate,
  addDDBIEffectToDocument,
  addDDBIEffectsToActorDocuments,
} from "./effects/helpers.js";
import {
  applyChrisPremadeEffect,
  applyChrisPremadeEffects,
  addChrisEffectsToActorDocuments,
} from "./effects/chrisPremades.js";
import SETTINGS from "./settings.js";
import DICTIONARY from "./dictionary.js";

function resetSecrets() {
  game.settings.set("ddb-importer", "cobalt-cookie-local", false);
  game.settings.set("ddb-importer", "cobalt-cookie", "");
  game.settings.set("ddb-importer", "campaign-id", "");
}

// eslint-disable-next-line no-unused-vars
function migrateAllCompendiums(value, key, map) {
  if (!value.locked) game.dnd5e.migrations.migrateCompendium(value);
}

function migrateCompendiums() {
  const compendiumNames = CompendiumHelper.getCompendiumNames();
  game.packs.filter((pack) => compendiumNames.includes(pack.collection)).forEach(migrateAllCompendiums);
}

function debugStart() {
  CONFIG.debug.ddbimporter.record = true;
}

function debugStop() {
  CONFIG.debug.ddbimporter.download();
}

export function registerApi() {
  const API = {
    base64Check: base64Check,
    checkCobalt,
    checkPatreon: PatreonHelper.checkPatreon,
    createCompendiumFolderStructure,
    createMacro,
    executeDDBMacro,
    generateAdventureConfig,
    generateItemMacroFlag,
    getPatreonTier: PatreonHelper.getPatreonTier,
    getPatreonTiers: PatreonHelper.getPatreonTiers,
    importCharacter,
    importCharacterById,
    loadMacroFile,
    migrateCompendiums,
    migrateExistingCompendiumToCompendiumFolders: migrateExistingCompendium,
    parseCritters,
    parseTransports,
    parseFeats: getFeats,
    parseItems,
    DDBMonster,
    DDBMonsterFactory,
    parseSpells,
    DDBCharacterManager,
    DDBProxy,
    DDBEncounters,
    DDBEncounterMunch,
    MuncherSettings,
    resetProxy: DDBProxy.resetProxy,
    resetSecrets,
    setPatreonTier: PatreonHelper.setPatreonTier,
    updateDDBCharacter,
    updateWorldMonsters,
    getIconPath: iconPath,
    iconPath,
    generateIcon,
    loadSRDRules,
    importCacheLoad,
    macros: MACROS,
    getNPCImage,
    resetCompendiumActorImages,
    CompendiumHelper,
    FileHelper,
    DirectoryPicker,
    getCompendiumLabel: CompendiumHelper.getCompendiumLabel,
    getCompendiumType: CompendiumHelper.getCompendiumType,
    getCompendiumNames: CompendiumHelper.getCompendiumNames,
    deleteDefaultCompendiums: CompendiumHelper.deleteDefaultCompendiums,
    muncherSettings: MuncherSettings.getMuncherSettings,
    characterSettings: MuncherSettings.getCharacterImportSettings,
    DDBCompanion,
    DDBCompanionFactory,
    effects: {
      addSaveAdvantageToTarget,
      configureCustomAAForCondition,
      findContainedTokensInTemplate,
      checkTargetInRange,
      addDDBIEffectToDocument,
      addDDBIEffectsToActorDocuments,
      addChrisEffectsToActorDocuments,
    },
    chris: {
      generateEffect: applyChrisPremadeEffect,
      generateEffects: applyChrisPremadeEffects,
      adjustActor: addChrisEffectsToActorDocuments,
    },
    debug: {
      start: debugStart,
      stop: debugStop,
    },
  };

  window.DDBImporter = API;
  game.modules.get(SETTINGS.MODULE_ID).api = API;
  game.modules.get(SETTINGS.MODULE_ID).DICTIONARY = DICTIONARY;
}