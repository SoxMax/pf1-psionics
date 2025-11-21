import { MODULE_ID } from "../_module.mjs";
import { runMigrations } from "../migrations/_module.mjs";

export async function readyHook() {
	console.log(`${MODULE_ID} | Ready`);
	await runMigrations();
}
