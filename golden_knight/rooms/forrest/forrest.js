
import { Room } from "../../../engine/dist/aventra.js";


export class ForrestRoom extends Room {

    constructor(engine, path) {

        super(engine, path)

        this.engine.flagsManager.set("bucketPicked", false)
        this.engine.flagsManager.set("ropePaid", false)
        this.engine.flagsManager.set("palmSeen", false)
        this.engine.flagsManager.set("fireIsKilled", false)
        this.engine.flagsManager.set("leafPicked", false)

        this.engine.globalAssets.registerAnimation("fire_off", { folder: "assets/animations/fire/", frameCount: 8, fps: 12, loop: true })
    }

    async pickupRope(hs) {

        await this.walkToHotspot(hs)

        if (!this.engine.flagsManager.is("ropePaid")) {

            const npc = this.engine.gameObjectManager.get("blue_knight")
            npc.charakter.stop()

            await this.engine.speechBubble.show("This is my rope!", null, npc.charakter)

            this.engine.noInteraction()

            await this.engine.conversationManager.start(npc)

            this.engine.allowInteraction()

            this.setPatrolRoute()
        }
    }

    lookRope(hs) {

        this.walkToHotspot(hs, () => {

            this.engine.textBox.show("A rope is laying around. It looks sturdy enough to tie something with.");
        })
    }

    async exitWoods(hs) {

        await this.walkToHotspot(hs)

        if (!this.engine.flagsManager.is("fireIsKilled"))
            return

        this.engine.changeRoom(this.engine.rooms.woods, { x: 100, y: 213 })
    }

    async exitBeach(hs) {

        await this.walkToHotspot(hs)
        this.engine.changeRoom(this.engine.rooms.beach, { x: 369, y: 481 })
    }

    async talkPalm(hs) {

        await this.walkToHotspot(hs)
        await this.engine.speechBubble.show("Hello, palm tree !")
    }

    async talkBlue_knight(hs) {

        const npc = this.engine.gameObjectManager.get("blue_knight")

        npc.talk = true;
        npc.pauseNpc()

        await this.walkToHotspot(hs)

        this.engine.noInteraction()

        await this.engine.conversationManager.start(npc)

        npc.talk = false

        this.engine.allowInteraction()

        if (this.engine.flagsManager.get("quest_leaf_done") && !this.engine.flagsManager.get("ropePicked")) {

            this.engine.noInteraction()

            npc.charakter.stop()
            npc.charakter.minDistance = 20

            await npc.moveTo(300, 390)

            this.engine.hotspotsEngine.removeHotspot("rope")
            this.engine.gameObjectManager.remove("rope")

            await npc.moveTo(this.engine.player.x + npc.charakter.minDistance, this.engine.player.y + npc.charakter.minDistance)

            this.engine.inventoryManager.addItem(this.inventoryItems.rope.id);
            this.engine.flagsManager.set("ropePicked", true)

            await this.engine.textBox.show("You got the rope from the blue knight!")

            npc.charakter.minDistance = 40

            this.setPatrolRoute()

            this.engine.allowInteraction()
        }
    }

    async quest_done(args) {

        console.log(args)
    }

    async pickupBucket(hs) {

        await this.walkToHotspot(hs)

        this.engine.flagsManager.set("bucketPicked", true)

        await this.engine.textBox.show("You pick the bucket from the ground...")

        this.engine.inventoryManager.addItem(this.getItemId("bucket")) // this.inventoryItems["bucket"].id);
        this.engine.hotspotsEngine.removeHotspot(hs.id)
        this.engine.gameObjectManager.remove(hs.id)
    }

    async lookBucket(hs) {

        await this.walkToHotspot(hs)
        await this.engine.textBox.show("There is a bucket on the ground... I can pick it up and use it to collect water from the water source.")
    }

    async pickupPalm(hs) {

        await this.walkToHotspot(hs)

        if (this.engine.flagsManager.is("leafPicked")) {
            await this.engine.textBox.show("You allready got one")
            return
        }

        if (!this.engine.flagsManager.is("find_leaf")) {
            await this.engine.textBox.show("Why I should get a leaf? I don't need it.")
            return
        }

        this.engine.flagsManager.set("has_leaf", true)
        this.engine.flagsManager.toggle("leafPicked")
        this.engine.inventoryManager.addItem(this.inventoryItems.leaf.id)

        await this.engine.textBox.show("You try to get a leaf. You got it!")
    }

    async useBucketWithPalm(item, hs) {

        await this.walkToHotspot(hs)
        await this.engine.textBox.show("Maybe i should fill it with water?");
    }

    async useRopeWithPalm(item, hs) {

        await this.walkToHotspot(hs)
        await this.engine.textBox.show("You tie the rope around the palm. Nothing happens so you decide to put the rope back in your bag");
    }

    async useBucketWithWater(item, hs) {

        await this.walkToHotspot(hs)

        await this.engine.textBox.show("You fill the bucket with water...");

        this.engine.inventoryManager.removeItem(this.getItemId("bucket"))
        this.engine.inventoryManager.addItem(this.getItemId("_bucket_full_"))

        this.engine.addScore(1);
    }

    async use_bucket_full_WithFire(item, hs) {

        this.engine.noInteraction()

        await this.walkToHotspot(hs)

        const fire = this.engine.gameObjectManager.get("fire")

        fire.setAnimation(this.engine.globalAssets.makeAnimationObject("fire_off"))

        await fire.playOnce()

        await this.engine.textBox.show("You kill the fire with pure water!");

        this.engine.inventoryManager.removeItem(this.getItemId("_bucket_full_"))
        this.engine.gameObjectManager.remove("trigger_zone")

        this.engine.flagsManager.set("fireIsKilled", true);
        this.engine.flagsManager.set("forrestChapterDone", true);

        this.engine.addScore(5);

        this.engine.allowInteraction()
    }

    usePalm(hs) {

        this.engine.textBox.show("You can not use the palm")
    }

    async lookPalm(hs) {

        await this.walkToHotspot(hs)

        if (!this.engine.flagsManager.is("palmSeen")) {

            await this.engine.textBox.show("You look at the palm for the first time. A tall palm tree sways gently in the wind.");
            this.engine.flagsManager.set("palmSeen", true);

            return
        }

        await this.engine.textBox.show("You already looked at the palm.");
    }

    async walkPalm(hs) {

        await this.walkToHotspot(hs)
        await this.engine.textBox.show("You walk towards the palm tree. The sand crunches under your feet as you approach the tall palm tree.");
    }

    async lookWater(hs) {

        await this.walkToHotspot(hs)
        await this.engine.textBox.show("Pure, clear water stretches out before you, reflecting the sunlight. You can see small fish swimming near the surface.");
    }

    async lookFire(hs) {

        await this.walkToHotspot(hs)

        if (this.engine.flagsManager.is("fireIsKilled")) {

            await this.engine.textBox.show("The fire is not burning anymore!");
            return
        }

        await this.engine.textBox.show("The fire is burning!");
    }

    async onEnter(engine, data) {

        // PLAYER
        this.engine.player.setPosition({ x: data.x, y: data.y })

        // TRIGGER
        const zone = this.getGameObject("trigger_zone")

        if (zone) {

            zone.onCollide = (obj) => {

                this.engine.player.stop()
                this.engine.player.x -= 4;
                this.engine.textBox.show("OUCH! It's too hot! I can't get through!")
            }
        }

        // NPC
        this.setPatrolRoute()
    }

    setPatrolRoute() {

        const npc = this.engine.gameObjectManager.get("blue_knight")

        const patrolRoute = [
            { x: 250, y: 450 },
            { x: 300, y: 340 }
        ];

        npc.followPath(patrolRoute, true)
    }

    update(dt, engine) {

    }

    render(ctx) {

    }
}



