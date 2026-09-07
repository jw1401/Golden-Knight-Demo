import { Room } from "../../engine/dist/aventra.js";

export class WoodsRoom extends Room {

    constructor(engine, path) {

        super(engine, path)
    }

    async exitForrest(hs) {

        await this.engine.player.moveTo(hs.walkX, hs.walkY)
        this.engine.changeRoom(this.engine.rooms.forrest, { x: 438, y: 210 })
    }

    async exitHarbour(hs) {

        await this.engine.player.moveTo(hs.walkX, hs.walkY)
        this.engine.changeRoom(this.engine.rooms.harbour, { x: 25, y: 250 })
    }

    talkPalm(hs) {

        this.engine.speechBubble.show("I don't know what to say!!!!!!")
    }

    async pickupPalm(hs) {

        await this.engine.player.moveTo(hs.walkX, hs.walkY)
        await this.engine.textBox.show("Nothing to pick here")
    }

    usePalm(hs) {

        this.engine.textBox.show("You can not use the palm")
    }

    lookPalm(hs) {

        this.engine.textBox.show("You are starring at a palm. HMMMM....");
    }

    async lookWater(hs) {

        await this.engine.player.moveTo(hs.walkX, hs.walkY)
        this.engine.textBox.show("Pure, clear water stretches out before you!");
    }

    async useWater(hs) {

        await this.engine.player.moveTo(hs.walkX, hs.walkY)
        await this.engine.textBox.show("...You trink refreshing water");

        this.engine.addScore(1);
    }

    onEnter(engine, data) {

        this.engine.player.setPosition({ x: data.x, y: data.y });
        this.engine.player.moveTo(256, 256)
    }

    update(dt, engine) {
    }

    render(ctx) {

    }
}
