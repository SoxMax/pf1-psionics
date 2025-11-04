export class PowerModel extends foundry.abstract.TypeDataModel  {
    static defineSchema() {
        const { SchemaField, StringField, NumberField, BooleanField, ArrayField, ObjectField, TypedObjectField } = foundry.data.fields;

        const optional = { required: false, initial: undefined };

        return {
            description: new SchemaField({
                value: new StringField({required: true, initial: ""}),
                instructions: new StringField({initial: "" }),
            }),
            tags: new ArrayField(new StringField(), {initial: []}),
            actions: new ArrayField(new ObjectField({required: true, initial: {}})),
            attackNotes: new ArrayField(new StringField(), {initial: []}),
            effectNotes: new ArrayField(new StringField(), {initial: []}),
            links: new SchemaField({
                children: new ArrayField(new StringField({initial: ""}), {initial: []}),
            }),
            flags: new SchemaField({
                boolean: new ObjectField(),
                dictionary: new ObjectField(),
            }),
            uses: new SchemaField({
                per: new StringField(),
                value: new NumberField(),
                maxFormula: new StringField(),
                autoDeductChargesCost: new StringField({required: true, initial: ""}),
                rechargeFormula: new StringField(),
            }),
            changes: new ArrayField(new SchemaField({
                _id: new StringField({required: true, initial: ""}),
                formula: new StringField({initial: ""}),
                target: new StringField({initial: ""}),
                type: new StringField({initial: ""}),
                operator: new StringField({required: false, initial: undefined}),
                priority: new NumberField({required: false, initial: undefined}),
                continuous: new BooleanField({required: false, initial: undefined}),
            })),
            contextNotes: new ArrayField(new SchemaField({
                target: new StringField({initial: ""}),
                text: new StringField({initial: ""})
            })),
            sources: new ArrayField(new SchemaField({
                title: new StringField({initial: ""}),
                pages: new StringField({initial: ""}),
                id: new StringField({initial: ""}),
                errata: new StringField({initial: ""}),
                date: new StringField({initial: ""}),
                publisher: new StringField({initial: ""}),
            })),
            learnedAt: new SchemaField(
                {
                    class: new TypedObjectField(
                        new NumberField({ integer: true, min: 0, nullable: false, required: true }),
                        { ...optional }
                    ),
                },
                { ...optional }
            ),
            discipline: new StringField({ initial: "athanatism" }),
            subdiscipline: new ArrayField(new StringField(), { initial: [] }),
            descriptors: new ArrayField(new StringField(), { initial: [] }),
            level: new NumberField({ initial: 1 }),
            manifestTime: new SchemaField({
                value: new NumberField({ initial: 1 }),
                units: new StringField({ initial: "standard" })
            }),
            display: new SchemaField({
                auditory: new BooleanField({initial: false }),
                material: new BooleanField({initial: false }),
                mental: new BooleanField({initial: false }),
                olfactory: new BooleanField({initial: false }),
                visual: new BooleanField({initial: false }),
            }),
            modifiers: new SchemaField({
                cl: new NumberField(),
                sl: new NumberField(),
            }),
			known: new BooleanField({ initial: false }),
			prepared: new BooleanField({ initial: false }),
            manifestor: new StringField({ initial: "" }),
            sr: new BooleanField({ initial: true }),
        };
    }

    /**
     * @override
     */
    prepareBaseData() {
        super.prepareBaseData();
    }

    /**
     * @override
     */
    prepareDerivedData() {
        super.prepareDerivedData();
    }
}