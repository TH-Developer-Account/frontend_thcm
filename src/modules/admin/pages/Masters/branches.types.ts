interface MasterRow {
	code: string;
	desc: string;
}

interface MasterMeta {
	icon: string;
	color: string;
}

export interface MasterConfig {
	[key: string]: {
		meta: MasterMeta;
		rows: MasterRow[];
	};
}

export interface EditState {
	name: string;
	code: string;
	val: string;
}
