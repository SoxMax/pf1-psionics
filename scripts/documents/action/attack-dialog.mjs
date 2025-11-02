import { MODULE_ID } from "../../_module.mjs";

export async function renderAttackDialogHook(app, html, data) {
  if (data.item.type !== `${MODULE_ID}.power`) return;
  const powerControls = await foundry.applications.handlebars.renderTemplate("modules/pf1-psionics/templates/action/attack-dialog.hbs", data);
  const controls = html.find(".conditionals");
  controls.after(powerControls);
  // Force the application to recalculate its dimensions.
  app.setPosition({
    height: "auto"
  });

  html.find('input.attribute[name="sl-offset"]').on("change", app._onChangeAttribute.bind(app));
  html.find('input.attribute[name="cl-offset"]').on("change", app._onChangeAttribute.bind(app));
  html.find('input.attribute[name="pp-offset"]').on("change", onChangeAttribute.bind(app));
  html.find('input[type="checkbox"][name="concentration"]').on("change", app._onToggleFlag.bind(app));
  html.find('input[type="checkbox"][name="cl-check"]').on("change", app._onToggleFlag.bind(app));
}

function onChangeAttribute(event) {
  event.preventDefault();

  const elem = event.currentTarget;
  this.attributes[elem.name] = elem.value;

  switch (elem.name) {
    case "pp-offset":
      this.rollData.chargeCostBonus = (this.rollData?.chargeCostBonus ?? 0) + parseInt(elem.value);
      break;
  }

  this.render();
}