import { Engine } from "../engine/dist/aventra.js";
import { InventoryUI, VerbsUI, DebugUI, ConversationUI } from "./ui/index.js";
import * as Rooms from "./rooms/index.js";

// Setup inventoryUI, verbsUI, InputManager 
const inventoryUI = new InventoryUI("inventory")
const verbsUI = new VerbsUI("verbs")
const conversationUI = new ConversationUI("conversation-ui")

const canvas = document.getElementById("game");

// Setup engine
const engine = new Engine(canvas, inventoryUI, verbsUI, conversationUI);

// Init engine
await engine.init(Rooms, "./assets/config/rooms.json")

// Show first room
engine.changeRoom(engine.rooms["forrest"], { x: 240, y: 280 });

// Setup debug-layer
const debug = new DebugUI(engine);

// Start Engine loop
engine.loop();
