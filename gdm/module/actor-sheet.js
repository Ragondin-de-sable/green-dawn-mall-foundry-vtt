import { EntitySheetHelper } from "./helper.js";
import {ATTRIBUTE_TYPES} from "./constants.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class SimpleActorSheet extends ActorSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["worldbuilding", "sheet", "actor"],
      template: "systems/gdm/templates/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}],
      scrollY: [".biography", ".items", ".attributes"],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData(options) {
    const context = await super.getData(options);
    EntitySheetHelper.getAttributeData(context.data);
    context.shorthand = !!game.settings.get("worldbuilding", "macroShorthand");
    context.systemData = context.data.system;
    context.dtypes = ATTRIBUTE_TYPES;
    context.biographyHTML = await TextEditor.enrichHTML(context.systemData.biography, {
      secrets: this.document.isOwner,
      async: true
    });
    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    html.find("#roll-d6").click(this.openActionRollDialog.bind(this.actor));
    // Attribute Management
    // html.find(".attributes").on("click", ".attribute-control", EntitySheetHelper.onClickAttributeControl.bind(this));
    // html.find(".groups").on("click", ".group-control", EntitySheetHelper.onClickAttributeGroupControl.bind(this));
    // html.find(".attributes").on("click", "a.attribute-roll", EntitySheetHelper.onAttributeRoll.bind(this));

    // Item Controls
    // html.find(".item-control").click(this._onItemControl.bind(this));
    // html.find(".items .rollable").on("click", this._onItemRoll.bind(this));

    // Add draggable for Macro creation
    // html.find(".attributes a.attribute-roll").each((i, a) => {
    //   a.setAttribute("draggable", true);
    //   a.addEventListener("dragstart", ev => {
    //     let dragData = ev.currentTarget.dataset;
    //     ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    //   }, false);
    // });
  }

  openActionRollDialog(){
    const dialogContent = `  
      <div>
        <i class="fa-solid fa-bandage"></i> <label>${game.i18n.localize("SIMPLE.ActionDialog.Harms")}</label>
      </div>    
      <hr/>
      <div style="display: flex;justify-content: space-between;">
        <label>${game.i18n.localize("SIMPLE.ActionDialog.Traits")}</label>
        <span>
          <input type="radio" id="use-trait-yes" name="use-trait" value="yes"/>
          <label for="use-trait-yes">${game.i18n.localize("SIMPLE.ActionDialog.Yes")}</label>
          <input type="radio" id="use-trait-no" name="use-trait" value="no" checked/>
          <label for="use-trait-no">${game.i18n.localize("SIMPLE.ActionDialog.No")}</label>
        </span>
      </div>

      <div style="display: flex;justify-content: space-between;">
        <label>${game.i18n.localize("SIMPLE.ActionDialog.Equipments")}</label>
        <span>
          <input type="radio" id="use-object-yes" name="use-object" value="yes"/>
          <label for="use-object-yes">${game.i18n.localize("SIMPLE.ActionDialog.Yes")}</label>
          <input type="radio" id="use-object-no" name="use-object" value="no" checked/>
          <label for="use-object-no">${game.i18n.localize("SIMPLE.ActionDialog.No")}</label>
        </span>
      </div>
      <div style="display: flex;justify-content: space-between;">
        <label>${game.i18n.localize("SIMPLE.ActionDialog.AdvantageousCircumstance")}</label>
        <span>
          <input type="radio" id="advantageous-circumstance-yes" name="advantageous-circumstance" value="yes"/>
          <label for="advantageous-circumstance-yes">${game.i18n.localize("SIMPLE.ActionDialog.Yes")}</label>
          <input type="radio" id="advantageous-circumstance-no" name="advantageous-circumstance" value="no" checked/>
          <label for="advantageous-circumstance-no">${game.i18n.localize("SIMPLE.ActionDialog.No")}</label>
        </span>
      </div>

      <hr />

      <div style="display: flex;justify-content: space-between;">
        <label>${game.i18n.localize("SIMPLE.ActionDialog.OtherPJHelpObject")}</label>
        <span>
          <input type="radio" id="other-pj-help-object-yes" name="other-pj-help-object" value="yes"/>
          <label for="other-pj-help-object-yes">${game.i18n.localize("SIMPLE.ActionDialog.Yes")}</label>
          <input type="radio" id="other-pj-help-object-no" name="other-pj-help-object" value="no" checked/>
          <label for="other-pj-help-object-no">${game.i18n.localize("SIMPLE.ActionDialog.No")}</label>
        </span>
      </div>

      <div style="display: flex;justify-content: space-between;">
        <label>${game.i18n.localize("SIMPLE.ActionDialog.OtherPJHelpTrait")}</label>
        <span>
          <input type="radio" id="other-pj-help-trait-yes" name="other-pj-help-trait" value="yes"/>
          <label for="other-pj-help-trait-yes">${game.i18n.localize("SIMPLE.ActionDialog.Yes")}</label>
          <input type="radio" id="other-pj-help-trait-no" name="other-pj-help-trait" value="no" checked/>
          <label for="other-pj-help-trait-no">${game.i18n.localize("SIMPLE.ActionDialog.No")}</label>
        </span>
      </div>
      
      <hr />`;

    new Dialog({
      title: game.i18n.localize("SIMPLE.ActionDialog.Title"),
      content: dialogContent,
      buttons: {
        confirm: {
          icon: '<i class="fa-solid fa-dice"></i>',
          label: game.i18n.localize("SIMPLE.ActionDialog.Confirm"),
          callback: (html) => confirmCallback(html, this),
        },
        cancel: {
          icon: '<i class="fa-solid fa-ban"></i>',
          label: game.i18n.localize("SIMPLE.ActionDialog.Cancel"),
        }
      }
    }).render(true);

    async function confirmCallback(html, simpleActor) {
      var nbDice = getNbDice(html, simpleActor.system.harms);
  
      let r = new Roll(nbDice+"d6", simpleActor.getRollData());
      const rollResult = await r.evaluate();
      const isSuccess = rollResult.terms[0].results.find(e => e.result >= 5) !== undefined;

      return r.toMessage({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: simpleActor }),
        flavor: isSuccess 
          ? `<div style="background-color:green; color: white; text-align: center; font-weight: bold;font-size: large;">${game.i18n.localize("SIMPLE.ActionDialog.Success")}</div>` 
          : `<div style="background-color:red; color: white;text-align: center; font-weight: bold;font-size: large;">${game.i18n.localize("SIMPLE.ActionDialog.Failure")}</div>`
      });
    }

    function getNbDice(html, harms) {
      var nbDice = 1;

      if(harms.lesser.first.trim() + harms.lesser.second.trim() !== "")
        nbDice--;
      if(harms.moderate.first.trim() + harms.moderate.second.trim() !== "")
        nbDice--;
      if(harms.severe.trim() !== "")
        nbDice--;

      if (html.find("input#use-trait-yes").is(":checked"))
        nbDice++;

      if (html.find("input#use-object-yes").is(":checked"))
        nbDice++;

      if (html.find("input#advantageous-circumstance-yes").is(":checked"))
        nbDice++;

      if (html.find("input#other-pj-help-object-yes").is(":checked"))
        nbDice++;

      if (html.find("input#other-pj-help-trait-yes").is(":checked"))
        nbDice++;
      
      if(nbDice > 4)
        nbDice = 4;

      if(nbDice <= 0)
        nbDice = 1;

      //todo other rules

      return nbDice;
    }
  }
 
 

  /* -------------------------------------------- */

  /**
   * Handle click events for Item control buttons within the Actor Sheet
   * @param event
   * @private
   */
  _onItemControl(event) {
    event.preventDefault();

    // Obtain event data
    const button = event.currentTarget;
    const li = button.closest(".item");
    const item = this.actor.items.get(li?.dataset.itemId);

    // Handle different actions
    switch ( button.dataset.action ) {
      case "create":
        const cls = getDocumentClass("Item");
        return cls.create({name: game.i18n.localize("SIMPLE.ItemNew"), type: "item"}, {parent: this.actor});
      case "edit":
        return item.sheet.render(true);
      case "delete":
        return item.delete();
    }
  }

  /* -------------------------------------------- */

  /**
   * Listen for roll buttons on items.
   * @param {MouseEvent} event    The originating left click event
   */
  _onItemRoll(event) {
    let button = $(event.currentTarget);
    const li = button.parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    let r = new Roll(button.data('roll'), this.actor.getRollData());
    return r.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<h2>${item.name}</h2><h3>${button.text()}</h3>`
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    formData = EntitySheetHelper.updateAttributes(formData, this.object);
    formData = EntitySheetHelper.updateGroups(formData, this.object);
    return formData;
  }
}
