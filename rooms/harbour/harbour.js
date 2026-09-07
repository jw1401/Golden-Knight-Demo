import { Room } from "../../engine/dist/aventra.js";

export class HarbourRoom extends Room {

    constructor(engine, path) {

        super(engine, path)
    }

    async exitWoods(hs) {

        await this.engine.player.moveTo(hs.walkX, hs.walkY)
        this.engine.changeRoom(this.engine.rooms.woods, { x: 382, y: 212 })
    }

    async lookWater(hs) {

        await this.engine.player.moveTo(hs.walkX, hs.walkY)
        this.engine.textBox.show("A big sea stretches out before you!!!!!!");
    }

    async lookShip(hs) {

        await this.engine.player.moveTo(hs.walkX, hs.walkY)
        this.engine.textBox.show("A ship!");
    }

    async lookPalm(hs) {

        await this.engine.player.moveTo(hs.walkX, hs.walkY)
        this.engine.textBox.show("Another palm here!");
    }

    async lookCrumpy_palm(hs) {

        await this.engine.player.moveTo(hs.walkX, hs.walkY, true)
        this.engine.textBox.show("Another crumpy palm here!");
    }

    onEnter(engine, data) {

        this.engine.player.setPosition({ x: data.x, y: data.y });
        this.engine.player.moveTo(143, 250)
    }

    update(dt, engine) {
    }

    render(ctx) {
    }
}
