export function renderItemActionSheetHook(app, html) {
  if (app.object.parent.type === "pf1-psionics.power") {
    updateDcDisplay(html);
  }
}

function updateDcDisplay(html) {
  // Locate the DC formula label rendered as: <label>DC Formula</label>
  // and replace it with the offset formula localization
  const dcFormulaText = game.i18n.localize("PF1.DCFormula") ?? "PF1.DCFormula";
  const dcOffsetText = game.i18n.localize("PF1.DCOffsetFormula") ?? "PF1.DCOffsetFormula";

  // Find label by matching "DC Formula" text content
  const $dcLabel = html.find("label").filter((_, el) => {
    return el.textContent === dcFormulaText;
  });

  if ($dcLabel.length) {
    // Replace with DC Offset Formula text
    $dcLabel.text(dcOffsetText);
  }
}
