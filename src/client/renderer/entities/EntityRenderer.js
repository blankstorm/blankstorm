import ModelRenderer from '../ModelRenderer.js';

export default class EntityRenderer extends ModelRenderer {
	constructor(id, scene) {
		super(id, scene);
	}

	static async FromData(data, scene) {
		const entity = new this(data.id, scene);
		await entity.update(data);
		return entity;
	}
}
