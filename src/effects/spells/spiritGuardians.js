import { baseSpellEffect, spellEffectModules } from "../specialSpells.js";
import { loadMacroFile, generateMacroChange, generateMacroFlags } from "../macros.js";

export async function spiritGuardiansEffect(document) {
  // we require active auras for this effect
  if (!spellEffectModules().activeAurasInstalled) return document;

  let effect = baseSpellEffect(document, document.name);
  effect.changes.push(
    {
      key: "data.attributes.movement.all",
      mode: 0,
      value: "/2",
      priority: "20",
    },
    {
      key: "flags.midi-qol.OverTime",
      mode: 5,
      value:
        "turn=start,label=Spirit Guardians,damageRoll=(@spellLevel)d8,damageType=radiant,saveRemove=false,saveDC=@attributes.spelldc,saveAbility=wis,saveDamage=halfdamage,killAnim=true",
      priority: "20",
    }
  );
  // MACRO START
  const itemMacroText = await loadMacroFile("spell", "spiritGuardians.js");
  // MACRO STOP
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effect.flags["ActiveAuras"] = {
    isAura: true,
    aura: "Enemy",
    radius: 15,
    alignment: "",
    type: "",
    ignoreSelf: true,
    height: false,
    hidden: false,
    hostile: false,
    onlyOnce: false,
  };
  effect.changes.push(generateMacroChange("@token @spellLevel @attributes.spelldc"));

  document.effects.push(effect);

  document.data.damage = { parts: [], versatile: "", value: "" };
  document.data['target']['type'] = "self";
  document.data.range = { value: null, units: "self", long: null };
  document.data.actionType = "";
  document.data.save.ability = "";

  return document;
}