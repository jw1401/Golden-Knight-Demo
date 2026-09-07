import { Room } from "../../../engine/dist/aventra.js";

export class BeachRoom extends Room {

    constructor(engine, path) {

        super(engine, path)
    }

    async exitForrest(hs) {

        await this.walkToHotspot(hs)
        await this.engine.changeRoom(this.engine.rooms.forrest, { x: 153, y: 230 })
    }

    async lookWater(hs) {

        await this.walkToHotspot(hs)
        await this.engine.textBox.show("A big sea stretches out before you!");
    }

    lookSky(hs) {

        this.engine.textBox.show("A big bright blue sky!");
    }

    lookRock(hs) {
        
        this.engine.textBox.show("...Its a rock...")
    }

    onEnter(engine, data) {

        this.engine.player.setPosition({ x: data.x, y: data.y });
        this.engine.player.moveTo(280, 450)
    }

    update(dt, engine) {
    }

    render(ctx) {
    }
}
