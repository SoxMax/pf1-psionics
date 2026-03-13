/**
 * PF1 System and pf1-psionics module type declarations.
 *
 * These declarations provide IDE autocomplete and type checking for PF1 system
 * globals and pf1-psionics module APIs without requiring TypeScript compilation.
 */

// PF1 system global
declare const pf1: {
  documents: {
    actor: {
      ActorPF: typeof Actor;
      changes: {
        setSourceInfoByName: (actor: any, name: string, value: any, source: string) => void;
      };
    };
    item: {
      ItemPF: typeof Item;
    };
  };
  components: {
    ItemAction: any;
    ItemChange: any;
  };
  config: {
    skills: Record<string, any>;
    featTypes: Record<string, string>;
    featTypesPlurals: Record<string, string>;
    traitTypes: Record<string, string>;
    creatureSubtypes: Record<string, string>;
    psionics: {
      disciplines: Record<string, string>;
      subdisciplines: Record<string, string>;
      subdisciplineMap: Record<string, string>;
    };
  };
};

// lib-wrapper global
declare const libWrapper: {
  register(
    moduleId: string,
    target: string,
    fn: Function,
    type?: "WRAPPER" | "MIXED" | "OVERRIDE"
  ): void;
  unregister(moduleId: string, target: string): void;
};

// PF1 RollPF global
declare class RollPF extends Roll {
  static safeRollSync(formula: string, data?: Record<string, any>): { total: number };
}

// jQuery globals (used in Foundry sheet code)
declare const $: JQueryStatic;
declare const jQuery: JQueryStatic;
