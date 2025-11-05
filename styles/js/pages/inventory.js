/* ==================================================================== */
/* Import Charadex
======================================================================= */
import { charadex } from '../charadex.js';


/* ==================================================================== */
/* Load
======================================================================= */
document.addEventListener("DOMContentLoaded", async () => {

  let dex = await charadex.initialize.page(
    null,
    charadex.page.inventory,
    null, 
    async (listData) => {

      if (listData.type == 'profile') {

        let profile = listData.profileArray[0];

        console.log("[INV] profile keys:", Object.keys(profile));
        console.log("[INV] profile.masterlist =", profile.masterlist);
        console.log("[INV] profile.inventorylog =", profile.inventorylog);

        console.log("[INV] checkArray(profile.masterlist) =>", charadex.tools.checkArray(profile.masterlist));
        console.log("[INV] checkArray(profile.inventorylog) =>", charadex.tools.checkArray(profile.inventorylog));

        console.log("[INV] inventory.relatedData keys:", Object.keys(charadex.page.inventory.relatedData));
        console.log("[INV] inventory.relatedData['masterlist'] =", charadex.page.inventory.relatedData['masterlist']);
        console.log("[INV] inventory.relatedData['마스터리스트'] =", charadex.page.inventory.relatedData['마스터리스트']);
        console.log("[INV] inventory.relatedData['inventory log'] =", charadex.page.inventory.relatedData['inventory log']);
        console.log("[INV] inventory.relatedData['인벤토리 내역'] =", charadex.page.inventory.relatedData['인벤토리 내역']);

        // Inventory
        charadex.initialize.groupGallery(
          charadex.page.inventory.inventoryConfig,
          await charadex.manageData.inventoryFix(profile),
          'type',
          charadex.url.getPageUrl('items')
        )

        // Designs
        if (charadex.tools.checkArray(profile.masterlist)) {
          console.log("[INV] Running designs init...");
          let designs = await charadex.initialize.page(
            profile.masterlist,
            charadex.page.inventory.relatedData['마스터리스트'],
          );
          console.log("[INV] designs result:", designs);
        } else {
          console.log("[INV] designs skipped: profile.masterlist not array");
        }

        // Logs
        if (charadex.tools.checkArray(profile.inventorylog)) {
          console.log("[INV] Running logs init...");
          let logs = await charadex.initialize.page(
            profile.inventorylog,
            charadex.page.inventory.relatedData['인벤토리 내역'],
          );
          console.log("[INV] logs result:", logs);
        } else {
          console.log("[INV] logs skipped: profile.inventorylog not array");
        }

      }
    }
  );
  
  charadex.tools.loadPage('.softload', 500);
  
});
