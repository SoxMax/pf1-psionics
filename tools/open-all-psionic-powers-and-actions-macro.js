// Macro: Simulate Editing All Psionic Power Actions
// This macro simulates editing all actions in the Psionic Powers compendium
// by changing the range and then changing it back, triggering update hooks

(async () => {
    // Get the Psionic Powers compendium
    const pack = game.packs.get("pf1-psionics.powers");
    
    if (!pack) {
        ui.notifications.error("Psionic Powers compendium not found! Make sure the pf1-psionics module is enabled.");
        return;
    }
    
    ui.notifications.info("Loading Psionic Powers compendium...");
    
    // Get all documents from the pack
    const documents = await pack.getDocuments();
    
    ui.notifications.info(`Found ${documents.length} powers. Processing actions...`);

    let totalActions = 0;
    let processedActions = 0;

    // Process each power's actions
    for (const doc of documents) {
        if (doc.actions && doc.actions.size > 0) {
            for (const [actionId, action] of doc.actions.entries()) {
                totalActions++;

                // Get the current range value
                const currentRange = action.range?.value;
                const currentUnits = action.range?.units;

                // Simulate editing: Change range to a temporary value
                await action.update({
                    "range.value": currentRange === "temp_edit" ? currentRange : "temp_edit"
                });

                // Change it back to original value
                await action.update({
                    "range.value": currentRange,
                    "range.units": currentUnits
                });

                processedActions++;

                // Log progress every 50 actions
                if (processedActions % 50 === 0) {
                    ui.notifications.info(`Processed ${processedActions}/${totalActions} actions...`);
                }
            }
        }
    }
    
    ui.notifications.info(`Successfully simulated editing ${processedActions} actions across ${documents.length} powers!`);
})();

