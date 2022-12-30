import utils from "../../../lib/utils.js";
import logger from "../../../logger.js";
import DDBFeature from "./DDBFeature.js";

export class DDBFeatureFactory {

  // some monsters now have [rollable] tags - if these exist we need to parse them out
  // in the future we may be able to use them, but not consistent yet
  static replaceRollable(text) {
    const rollableRegex = new RegExp(/(\[rollable\])([^;]*);(.*)(\[\/rollable\])/g);
    return text.replaceAll(rollableRegex, "$2");
  }

  constructor({ ddbMonster } = {}) {
    this.ddbMonster = ddbMonster;

    this.hideDescription = game.settings.get("ddb-importer", "munching-policy-hide-description");
    this.updateExisting = game.settings.get("ddb-importer", "munching-policy-update-existing");

    this.features = {
      action: [],
      reaction: [],
      bonus: [],
      mythic: [],
      lair: [],
      legendary: [],
      special: [],
    };

    this.characterDescription = {
      action: "",
      reaction: "",
      bonus: "",
      mythic: "",
      lair: "",
      legendary: "",
      special: "",
      unexpected: null,
    };

    this.html = {
      action: "",
      reaction: "",
      bonus: "",
      mythic: "",
      lair: "",
      legendary: "",
      special: "",
    };

    this.resources = {
      legendary: null,
      lair: {
        value: false,
        initiative: null
      },
    };

    this.resistance = {};
  }

  getFeatures(type) {
    return this.features[type].map((feature) => deepClone(feature.feature));
  }

  get actions() {
    return this.getFeatures("action");
  }

  get reactions() {
    return this.getFeatures("reaction");
  }

  get bonus() {
    return this.getFeatures("bonus");
  }

  get mythic() {
    return this.getFeatures("mythic");
  }

  get lair() {
    return this.getFeatures("lair");
  }

  get legendary() {
    return this.getFeatures("legendary");
  }

  get special() {
    return this.getFeatures("special");
  }

  #buildDom(type) {
    let dom = new DocumentFragment();
    $.parseHTML(this.html[type]).forEach((element) => {
      dom.appendChild(element);
    });
    dom.childNodes.forEach((node) => {
      if (node.textContent == "\n" || node.textContent == "\r\n") {
        dom.removeChild(node);
      }
    });
    return dom;
  }

  #generateActionActions(type) {
    this.html[type] = DDBFeatureFactory.replaceRollable(this.html[type]);

    let splitActions = this.html[type].split("<h3>Roleplaying Information</h3>");
    if (splitActions.length > 1) {
      this.characterDescription[type] = `<h3>Roleplaying Information</h3>${splitActions[1]}`;
    }
    this.html[type] = splitActions[0]
      .replace(/<\/strong> <strong>/g, "")
      .replace(/<\/strong><strong>/g, "")
      .replace(/&shy;/g, "");

    let dom = this.#buildDom(type);

    // build out skeleton actions
    dom.querySelectorAll("p").forEach((node) => {

      let pDom = new DocumentFragment();
      $.parseHTML(node.outerHTML).forEach((element) => {
        pDom.appendChild(element);
      });
      const query = pDom.querySelector("strong");
      if (!query) return;
      let name = query.textContent.trim().replace(/\./g, '');
      if (!name.includes("Spell;") && !name.includes("Mythic Trait;")) {
        name = name.split(";").pop().trim();
      }
      const action = new DDBFeature(name, { ddbMonster: this.ddbMonster, type });
      action.feature.flags.monsterMunch = {
        titleHTML: query.outerHTML,
        fullName: query.textContent,
      };
      this.features[type].push(action);
    });

    // there is inconsistent formatting
    if (this.features[type].length == 0) {
      dom.querySelectorAll("p").forEach((node) => {

        let pDom = new DocumentFragment();
        $.parseHTML(node.outerHTML).forEach((element) => {
          pDom.appendChild(element);
        });
        const query = pDom.querySelector("b");
        if (!query) return;
        let name = query.textContent.trim().replace(/\./g, '');
        if (!name.includes("Spell;") && !name.includes("Mythic Trait;")) {
          name = name.split(";").pop().trim();
        }
        const action = new DDBFeature(name, { ddbMonster: this.ddbMonster, type });
        action.feature.flags.monsterMunch = {
          titleHTML: query.outerHTML,
          fullName: query.textContent,
        };
        this.features[type].push(action);
      });
    }


    // there is inconsistent formatting
    if (this.features[type].length == 0) {
      dom.querySelectorAll("p").forEach((node) => {

        let pDom = new DocumentFragment();
        $.parseHTML(node.outerHTML).forEach((element) => {
          pDom.appendChild(element);
        });
        const title = pDom.textContent.split('.')[0];
        const name = title.trim();
        if (name && name.length > 0) {
          const action = new DDBFeature(name, { ddbMonster: this.ddbMonster, type });
          if (pDom.outerHTML) {
            action.feature.flags.monsterMunch = {
              titleHTML: pDom.outerHTML.split('.')[0],
            };
          }
          this.features[type].push(action);
        }
      });
    }

    // homebrew fun
    if (this.features[type].length == 0) {
      dom.querySelectorAll("div").forEach((node) => {

        let pDom = new DocumentFragment();
        $.parseHTML(node.outerHTML).forEach((element) => {
          pDom.appendChild(element);
        });
        const title = pDom.textContent.split('.')[0];
        const name = title.trim();
        if (name && name.length > 0) {
          const action = new DDBFeature(name, { ddbMonster: this.ddbMonster, type });
          if (pDom.outerHTML) {
            action.feature.flags.monsterMunch = {
              titleHTML: pDom.outerHTML.split('.')[0],
            };
          }
          this.features[type].push(action);
        }
      });
    }

    // console.error(dynamicActions);

    let action = this.features[type][0];

    dom.childNodes.forEach((node) => {
      const nodeContextSplit = node.textContent.split('.');
      const nodeName = nodeContextSplit[0].trim();
      const longNodeName = (nodeContextSplit.length > 2 && nodeContextSplit[1].trim().startsWith('('))
        ? `${nodeName} ${nodeContextSplit[1].trim()}`
        : nodeName;
      let switchAction = this.features[type].find((act) => nodeName === act.name || longNodeName === act.name);

      if (!switchAction) {
        switchAction = this.features[type].find((act) =>
          act.flags?.monsterMunch?.fullName
          && node.textContent.startsWith(act.flags.monsterMunch.fullName)
        );
      }
      let startFlag = false;
      if (switchAction) {
        action = switchAction;
        if (action.html === "") {
          startFlag = true;
        }
      }

      if (!action) return;

      if (node.outerHTML) {
        let outerHTML = `${node.outerHTML}`;
        if (switchAction && startFlag) {
          const replaceName = getProperty(action.feature, "flags.monsterMunch.fullName") ?? nodeName;
          outerHTML = outerHTML.replace(replaceName, "");

          const titleDom = new DocumentFragment();
          $.parseHTML(outerHTML).forEach((element) => {
            titleDom.appendChild(element);
          });
          if (titleDom.textContent.startsWith(".")) outerHTML = outerHTML.replace(".", "");
        }
        action.html += outerHTML;
      }
    });

    this.features[type].forEach((feature) => {
      feature.parse();
    });

    // console.warn(this.features[type]);
    // console.log(JSON.stringify(this.features[type], null, 4));

  }

  #generateLairActions(type = "lair") {
    this.html[type] = DDBFeatureFactory.replaceRollable(this.html[type]);

    let dom = this.#buildDom(type);

    const defaultAction = new DDBFeature("Lair Actions", { ddbMonster: this.ddbMonster, type });
    this.features[type].push(defaultAction);

    dom.querySelectorAll("h4").forEach((node) => {
      const name = node.textContent.trim();
      if (name !== "") {
        let action = new DDBFeature(name, { ddbMonster: this.ddbMonster, type });
        if (node.textContent == "Lair Actions" || node.textContent == "") {
          return;
        }
        this.features[type].push(action);
      }
    });

    dom.querySelectorAll("h3").forEach((node) => {
      const name = node.textContent.trim();
      if (name !== "") {
        let action = new DDBFeature(name, { ddbMonster: this.ddbMonster, type });
        if (node.textContent == "Lair Actions" || action.name == "") {
          return;
        }
        this.features[type].push(action);
      }
    });

    let actionType = "Lair Actions";
    let action = this.features[type].find((act) => act.name == actionType);

    if (!action) {
      action = this.features[type][0];
    }

    dom.childNodes.forEach((node) => {
      // const switchAction = dynamicActions.find((act) => act.name == node.textContent);
      const nodeName = node.textContent.split('.')[0].trim();
      const switchAction = this.features[type].find((act) => nodeName === act.name);
      let startFlag = false;
      if (switchAction) {
        actionType = node.textContent;
        action = switchAction;
        if (action.html === "") startFlag = true;
      }
      if (node.outerHTML) {
        let outerHTML = node.outerHTML;
        if (switchAction && startFlag) {
          outerHTML = outerHTML.replace(`${nodeName}.`, "");
        }
        action.html += outerHTML;
      }

      const initiativeMatch = node.textContent.match(/initiative count (\d+)/);
      if (initiativeMatch) {
        this.resources.lair = {
          value: true,
          initiative: parseInt(initiativeMatch[1]),
        };
      }
    });

    this.features[type].forEach((feature) => {
      feature.parse();
    });

  }

  #generateLegendaryActions(type) {

  }

  #generateSpecialActions(type) {

  }

  // possible types:
  // action, reaction, bonus, mythic
  // this.ddbMonster.source.actionsDescription
  // this.ddbMonster.source.reactionsDescription
  // this.ddbMonster.source.bonusActionsDescription
  // this.ddbMonster.source.mythicActionsDescription

  generateActions(html, type = "action") {
    if (!html || html.trim() == "") return;

    this.html[type] = utils.replaceHtmlSpaces(`${html}`);

    switch (type) {
      case "action":
      case "bonus":
      case "mythic":
      case "reaction":
        this.#generateActionActions(type);
        break;
      case "lair":
        this.#generateLairActions(type);
        break;
      case "legendary":
        this.#generateLegendaryActions(type);
        break;
      case "special":
        this.#generateSpecialActions(type);
        break;
      default:
        logger.error(`Unknown action parsing type ${this.type}`, { DDBFeatureFactory: this });
        throw new Error(`Unknown action parsing type ${this.type}`);
    }
  }

}