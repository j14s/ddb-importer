import { baseSpellEffect, generateMacroChange, generateMacroFlags } from "../specialSpells.js";

export function invisibilityEffect(document) {
  let effectInvisibilityInvisibility = baseSpellEffect(document, document.name);
  const itemMacroText = `
//DAE Item Macro, no arguments passed
if (!game.modules.get("advanced-macros")?.active) {ui.notifications.error("Please enable the Advanced Macros module") ;return;}

const lastArg = args[args.length - 1];
const target = canvas.tokens.get(lastArg.tokenId)


if (args[0] === "on") {
    ChatMessage.create({ content: \`\${target.name} turns invisible\`, whisper: [game.user] });
    target.update({ "hidden": true });
}
if (args[0] === "off") {
    ChatMessage.create({ content: \`\${target.name} re-appears\`, whisper: [game.user] });
    target.update({ "hidden": false });
}
`;
  document.flags["itemacro"] = generateMacroFlags(document, itemMacroText);
  effectInvisibilityInvisibility.changes.push(generateMacroChange("@target", 0));
  document.effects.push(effectInvisibilityInvisibility);

  return document;
}