// core/state.js
var Verbs = {
  LOOK: "look",
  USE: "use",
  TALK: "talk",
  PICKUP: "pickup",
  OPEN: "open",
  CLOSE: "close",
  WALK: "walk"
};

// core/utils.js
var EMPTY_ARRAY = Object.freeze([]);
async function load(path = null) {
  if (!path)
    return;
  try {
    const response = await fetch(path);
    console.log("Loaded:", path);
    return await response.json();
  } catch (error) {
    console.log(error);
    return null;
  }
}
function loadImage(src = null) {
  if (!src)
    return;
  const img = new Image();
  img.src = src;
  return img;
}
function assignArray(inputData) {
  return Array.isArray(inputData) ? inputData : EMPTY_ARRAY;
}
function drawBoxAndPoint(ctx, box, point, color = "red") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
  ctx.beginPath();
  ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// core/game_object/object.js
var Object2 = class {
  constructor({
    id = null,
    type = "",
    worldX = 0,
    worldY = 0,
    width = 0,
    height = 0,
    img = null,
    pivot = { x: 0, y: 0 },
    walkTarget = { x: 0, y: 0 },
    occludes = false,
    collides = false,
    trigger = false,
    hs = null,
    collider = null
  }) {
    this.id = id;
    this.type = type;
    this.worldX = worldX;
    this.worldY = worldY;
    this.width = width;
    this.height = height;
    this.img = img;
    this.pivot = pivot;
    this.walkTarget = walkTarget;
    this.occludes = occludes;
    this.collides = collides;
    this.trigger = trigger;
    this.collider = collider;
    this.hotspot = hs;
    this.debug = false;
  }
  getCollisionBox() {
    if (!this.collider) return null;
    return {
      x: this.worldX + (this.collider.offsetX ?? 0),
      y: this.worldY + (this.collider.offsetY ?? 0),
      width: this.collider.width ?? 0,
      height: this.collider.height ?? 0
    };
  }
  onCollide(obj) {
  }
  update(dt) {
    throw new Error(`[${this.constructor.name}] Method 'update' must be implemented.`);
  }
  render(ctx) {
    throw new Error(`[${this.constructor.name}] Method 'render' must be implemented.`);
  }
  debugLayer(ctx, color = "yellow", fillStyle = "rgba(19, 34, 167, 0.5)") {
    const box = this.getCollisionBox();
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = fillStyle;
    ctx.lineWidth = 2;
    if (box) {
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      ctx.fillRect(box.x, box.y, box.width, box.height);
    }
    ctx.strokeRect(this.renderX, this.renderY, this.width, this.height);
    ctx.beginPath();
    ctx.arc(this.worldX, this.worldY, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  // Calculates render point left, top
  get renderX() {
    return this.worldX - this.width * this.pivot.x;
  }
  get renderY() {
    return this.worldY - this.height * this.pivot.y;
  }
};

// core/game_object/game_object.js
var GameObject = class extends Object2 {
  constructor({
    id = null,
    type = "gameObject",
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    img = null,
    occludes = false,
    collides = false,
    trigger = false,
    hs = null,
    collider = null,
    walkTarget = null,
    pivot = { x: 0, y: 0 },
    dialog = null
  }) {
    super({
      id,
      type,
      worldX: x,
      worldY: y,
      width,
      height,
      img,
      occludes,
      collides,
      trigger,
      hs,
      collider,
      pivot,
      walkTarget
    });
    this.charakter = null;
    this.dialog = dialog;
    this.animation = null;
  }
  setCharakter(npcChar) {
    this.charakter = npcChar;
    this.charakter.setPosition({ x: this.worldX, y: this.worldY });
    this.charakter.getCollisionBox = () => this.getCollisionBox();
    return this;
  }
  followPath(path, loop = true) {
    this.charakter?.followPath(path, loop);
  }
  async moveTo(x, y, callback = null) {
    await this.charakter?.moveTo(x, y, callback);
  }
  setAnimation(anim) {
    this.animation = anim;
    return this;
  }
  pauseNpc() {
    this.charakter?.pauseMovement();
  }
  resumeNpc() {
    this.charakter?.resumeMovement();
  }
  set talk(value) {
    if (!this.charakter)
      return;
    this.charakter.isTalking = Boolean(value);
  }
  // Proxy playback calls directly to the animation instance
  play() {
    this.animation?.play();
  }
  stop() {
    this.animation?.stop();
  }
  async playOnce(callback = null) {
    if (this.animation)
      await this.animation.playOnce(callback);
  }
  onCollide(obj) {
    console.log(`[${this.type.toUpperCase()}] [${this.id}] collided with [${obj.id}]`);
  }
  update(dt) {
    if (this.charakter) {
      this.charakter.update(dt);
      this.worldX = this.charakter.x;
      this.worldY = this.charakter.y;
    }
    if (this.hotspot) {
      this.hotspot.worldX = this.worldX;
      this.hotspot.worldY = this.worldY;
    }
    if (this.animation)
      this.animation.update(dt);
  }
  render(ctx) {
    if (this.charakter) {
      this.charakter.render(ctx);
    } else if (this.animation) {
      this.animation.render(ctx, this.renderX, this.renderY, this.width, this.height);
    } else if (this.img) {
      ctx.drawImage(this.img, this.renderX, this.renderY, this.width, this.height);
    }
    if (this.debug) {
      this.debugLayer(ctx);
    }
  }
};

// core/engines/hotspot.js
var Hotspot = class {
  constructor(obj) {
    this.id = obj.id;
    this.type = obj.type;
    this.action = obj.action;
    this.target = obj.target;
    this.worldX = obj.worldX;
    this.worldY = obj.worldY;
    this.pivot = obj.pivot;
    this.walkTarget = obj.walkTarget;
    this.hotspot = obj.hotspot;
    this.name = obj.name;
    this.width = obj.width;
    this.height = obj.height;
    this.offsetX = obj.offsetX;
    this.offsetY = obj.offsetY;
  }
  // Canvas left, top render coordinates
  get renderX() {
    return this.worldX - this.width * this.pivot.x;
  }
  get renderY() {
    return this.worldY - this.height * this.pivot.y;
  }
  get walkX() {
    return this.worldX + this.walkTarget.x;
  }
  get walkY() {
    return this.worldY + this.walkTarget.y;
  }
  // Walk target point for player 
  get absoluteWalkTarget() {
    if (!this.walkTarget)
      return { x: this.worldX, y: this.worldY };
    return {
      x: this.walkX,
      y: this.walkY
    };
  }
  // Bounding-Box for mouse events
  getHotspotBounds() {
    if (!this.hotspot)
      return null;
    const left = this.worldX + this.offsetX;
    const top = this.worldY + this.offsetY;
    return {
      left,
      top,
      right: left + this.width,
      bottom: top + this.height,
      centerX: left + this.width / 2,
      centerY: top + this.height / 2,
      width: this.width,
      height: this.height
    };
  }
  debug(ctx) {
    const bounds = this.getHotspotBounds();
    ctx.save();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(bounds.left, bounds.top, bounds.width, bounds.height);
    ctx.fillStyle = "red";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.walkX, this.walkY, 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 3;
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(this.worldX, this.worldY, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  }
};

// core/scene.js
var SceneLoader = class {
  constructor(engine) {
    this.engine = engine;
  }
  // Fetch and return loaded scene assets as a dictionary
  async loadAssets(path) {
    const paths = await load(path);
    const [walkmapData, objectData, ocData] = await Promise.all([
      load(paths.walkmap),
      load(paths.hotspots),
      load(paths.occlusion)
    ]);
    const { hotspots, entities, occlusionObjects } = await this.createAssets(objectData, ocData);
    return {
      walkmap: walkmapData,
      bgSrc: paths.background,
      hotspots,
      entities,
      ocObjects: occlusionObjects,
      initialized: true
    };
  }
  async load(currentRoom) {
    let assets = null;
    if (!currentRoom.initialized)
      assets = await this.loadAssets(currentRoom.path);
    currentRoom.init(assets);
    this.registerEngineSystems();
  }
  // Register loaded dictionary assets or actual state of room into the game engine
  registerEngineSystems() {
    this.engine.player.setWalkmap(this.engine.currentRoom.walkmap);
    this.engine.gameObjectManager.setEntities(this.engine.currentRoom.entities);
    this.engine.hotspotsEngine.setHotspots(this.engine.currentRoom.hotspots);
    this.engine.occlusionEngine.setStaticOcclusionObjects(this.engine.currentRoom.ocObjects);
  }
  // Create GameObejcts, Hotspots, NPCs, Occlusion-Objects
  async createAssets(objectData, ocData) {
    const entities = [];
    const hotspots = [];
    for (const obj of objectData) {
      let hotspot = null;
      if (obj.sprite?.animation) {
        this.engine.globalAssets.registerAnimation(obj.sprite.animation.id, {
          folder: obj.sprite.animation.folder,
          frameCount: obj.sprite.animation.frameCount,
          fps: obj.sprite.animation.fps,
          loop: obj.sprite.animation.loop
        });
      }
      if (obj.type === "hotspot" || obj.type === "gameObject" || obj.type === "npc") {
        hotspot = new Hotspot({
          id: obj.id,
          type: "hotspot",
          action: obj.action ?? null,
          target: obj.target ?? null,
          worldX: obj.worldX,
          worldY: obj.worldY,
          pivot: obj.pivot,
          walkTarget: obj.walkTarget,
          name: obj.hotspot.name,
          width: obj.hotspot.width,
          height: obj.hotspot.height,
          offsetX: obj.hotspot.offsetX,
          offsetY: obj.hotspot.offsetY,
          hotspot: obj.hotspot
        });
        hotspots.push(hotspot);
      }
      const commonProps = {
        id: obj.id,
        type: obj.type,
        x: obj.worldX,
        y: obj.worldY,
        pivot: obj.pivot,
        walkTarget: obj.walkTarget,
        occludes: obj.occludes ?? false,
        collides: obj.collides ?? false,
        trigger: obj.trigger ?? false,
        collider: obj.collider ?? null
      };
      if (obj.type === "gameObject") {
        entities.push(new GameObject({
          ...commonProps,
          width: obj.sprite.width ?? 0,
          height: obj.sprite.height ?? 0,
          img: obj.sprite?.img ? loadImage(obj.sprite.img) : null,
          hs: hotspot
        }).setAnimation(this.engine.globalAssets.animations[obj.sprite.animation?.id]?.() ?? null));
      }
      if (obj.type === "trigger") {
        entities.push(new GameObject({
          ...commonProps,
          trigger: obj.trigger ?? true
        }));
      }
      if (obj.type === "npc") {
        const NPCdialog = await load(obj.charakter.dialog);
        this.engine.globalAssets.registerCharakter(obj.charakter.id, {
          engine: this.engine,
          id: obj.charakter.id,
          charakterWidth: obj.charakter.width,
          charakterHeight: obj.charakter.height,
          spritePath: obj.charakter.spritePath ?? null,
          debug: obj.charakter.debug,
          speed: obj.charakter.speed,
          minDistance: obj.charakter.minDistance,
          offsetY: obj.charakter.offsetY
        });
        entities.push(new GameObject({
          ...commonProps,
          width: obj.charakter.width ?? 0,
          height: obj.charakter.height ?? 0,
          img: obj.charakter?.img ? loadImage(obj.charakter.img) : null,
          hs: hotspot,
          dialog: NPCdialog ? NPCdialog.dialog : null
        }).setCharakter(this.engine.globalAssets.charakters[obj.charakter.id]?.() ?? null));
      }
    }
    const occlusionObjects = this.createOcclusionObjects(ocData);
    return { hotspots, entities, occlusionObjects };
  }
  // Create occusion objects
  createOcclusionObjects(oc) {
    const objects = [];
    if (!oc)
      return objects;
    for (const o of oc) {
      const img = loadImage(o.image);
      objects.push({ ...o, img });
    }
    return objects;
  }
  // Load all scenes
  async loadScenes(Rooms, path) {
    const roomConfigs = await load(path);
    for (const config of roomConfigs) {
      const RoomClass = Rooms[config.class];
      if (!RoomClass) {
        console.error(`Class ${config.class} not found in Rooms registry.`);
        continue;
      }
      const roomInstance = new RoomClass(this.engine, config.path);
      await this.engine.addRoom(roomInstance, config.name);
    }
  }
};

// core/inventory.js
var InventoryManager = class {
  constructor(engine) {
    this.engine = engine;
    this.inventory = [];
    this.inventoryItems = this.engine.globalAssets.items;
  }
  addItem(itemId) {
    const item = this.getInventoryItem(itemId);
    if (!item) {
      console.error("Unknown item:", itemId);
      return;
    }
    if (!this.inventory.includes(itemId)) {
      this.inventory.push(itemId);
      this.engine.inventoryUI.addItem(item);
    }
  }
  removeItem(itemId) {
    this.inventory = this.inventory.filter((i) => i !== itemId);
    this.engine.inventoryUI.removeItem(itemId);
    if (this.engine.selectedItem === itemId) {
      this.engine.selectedItem = null;
    }
  }
  hasItem(itemId) {
    return this.inventory.includes(itemId);
  }
  getInventoryItem(itemId) {
    return this.inventoryItems[itemId] ?? null;
  }
  lookItem(itemId) {
    const item = this.getInventoryItem(itemId);
    if (!item)
      return;
    this.engine.textBox.show(item.description);
  }
};

// core/flags_manager.js
var FlagsManager = class {
  constructor(engine) {
    this.engine = engine;
    this.flags = /* @__PURE__ */ new Map();
    this.listeners = /* @__PURE__ */ new Map();
  }
  /**
   * Set a flag value (boolean, string, number, etc.)
   */
  set(flag, value = true) {
    const previousValue = this.flags.get(flag);
    if (previousValue !== value) {
      this.flags.set(flag, value);
      this.notify(flag, value, previousValue);
    }
  }
  /**
   * Get a flag value with an optional default fallback
   */
  get(flag, defaultValue = false) {
    return this.flags.has(flag) ? this.flags.get(flag) : defaultValue;
  }
  /**
   * Quick boolean check
   */
  is(flag) {
    return Boolean(this.get(flag, false));
  }
  /**
   * Toggle a boolean flag
   */
  toggle(flag) {
    this.set(flag, !this.is(flag));
  }
  /**
   * Listen for changes to a specific flag (great for quests or UI updates)
   */
  onChange(flag, callback) {
    if (!this.listeners.has(flag)) {
      this.listeners.set(flag, []);
    }
    this.listeners.get(flag).push(callback);
  }
  notify(flag, newValue, oldValue) {
    if (this.listeners.has(flag)) {
      this.listeners.get(flag).forEach((callback) => callback(newValue, oldValue));
    }
  }
  /**
   * Export all flags for saving game state
   */
  serialize() {
    return Object.fromEntries(this.flags);
  }
  /**
   * Import flags from a save file
   */
  deserialize(data) {
    this.flags = new Map(Object.entries(data || {}));
  }
  // Inside FlagsManager class
  increment(flag, amount = 1) {
    const currentValue = this.get(flag, 0);
    this.set(flag, currentValue + amount);
  }
  decrement(flag, amount = 1) {
    const currentValue = this.get(flag, 0);
    this.set(flag, currentValue - amount);
  }
};

// core/conversation/conversation.js
var ConversationManager = class {
  constructor(engine) {
    this.engine = engine;
    this.visible = false;
    this.activeNPC = null;
    this.activeNode = null;
    this.resolveCurrentConversation = null;
  }
  async start(npc) {
    this.activeNPC = npc;
    this.activeNode = npc.dialog.start;
    this.visible = true;
    if (this.activeNode.onEnter) {
      this.executeActions(this.activeNode.onEnter);
    }
    this.engine.inventoryUI.hide();
    this.engine.verbsUI.hide();
    this.engine.conversationUI.reset();
    this.engine.conversationUI.show();
    await this.engine.speechBubble.show(this.activeNode.playerIntro, () => {
    });
    await this.engine.speechBubble.show(this.activeNode.text, () => {
    }, this.activeNPC.charakter);
    this.renderFilteredNode();
    return new Promise((resolve) => {
      this.resolveCurrentConversation = resolve;
    });
  }
  async choose(index) {
    if (this.engine.speechBubble.visible || this.engine.textBox.visible)
      return;
    const validOptions = this.getValidOptions(this.activeNode.options || []);
    const selectedOption = validOptions[index];
    if (!selectedOption)
      return;
    if (selectedOption.onSelect) {
      this.executeActions(selectedOption.onSelect);
    }
    await this.engine.speechBubble.show(selectedOption.text, async () => {
    });
    const nextKey = selectedOption.next;
    this.activeNode = this.activeNPC.dialog[nextKey];
    if (!this.activeNode) {
      this.close();
      return;
    }
    if (this.activeNode.onEnter) {
      this.executeActions(this.activeNode.onEnter);
    }
    const nextValidOptions = this.getValidOptions(this.activeNode.options || []);
    if (nextValidOptions.length === 0) {
      await this.engine.speechBubble.show(this.activeNode.text, () => {
      }, this.activeNPC.charakter);
      this.close();
    } else {
      this.renderFilteredNode();
      await this.engine.speechBubble.show(this.activeNode.text, () => {
      }, this.activeNPC.charakter);
    }
  }
  /**
   * Filter options based on conditions of FlagsEngine
   */
  getValidOptions(options) {
    return options.filter((option) => {
      if (!option.condition)
        return true;
      const { flag, equals = true } = option.condition;
      if (flag !== void 0 && this.engine.flagsManager) {
        return this.engine.flagsManager.get(flag) === equals;
      }
      return true;
    });
  }
  /**
   * Filter only valid options for UI
   */
  renderFilteredNode() {
    const validOptions = this.getValidOptions(this.activeNode.options || []);
    const nodeToRender = { ...this.activeNode, options: validOptions };
    this.engine.conversationUI.renderNode(nodeToRender);
  }
  /**
   * Execute Actions for flags, quests and items
   */
  executeActions(actions) {
    if (!Array.isArray(actions))
      return;
    for (const act of actions) {
      switch (act.action) {
        case "set_flag":
          if (this.engine.flagsManager) {
            this.engine.flagsManager.set(act.flag, act.value ?? true);
          }
          break;
        case "toggle_flag":
          if (this.engine.flagsManager) {
            this.engine.flagsManager.toggle(act.flag);
          }
          break;
        case "start_quest":
          if (this.engine.flagsManager) {
            this.engine.flagsManager.set(act.questId, true);
          }
          break;
        case "complete_quest":
          if (this.engine.flagsManager) {
            this.engine.flagsManager.set(act.questId, false);
          }
          break;
        case "give_item":
          if (this.engine.inventoryManager) {
            this.engine.inventoryManager.removeItem(act.item);
          }
          break;
        case "get_item":
          if (this.engine.inventoryManager) {
            this.engine.inventoryManager.addItem(act.item);
          }
          break;
        case "call_action":
          this.engine.currentRoom[act.method]?.(act?.args);
          break;
        default:
          console.warn(`[ConversationManager] Unknown action: ${act.action}`);
      }
    }
  }
  render() {
    if (!this.visible)
      return;
  }
  close() {
    if (this.activeNode && this.activeNode.onExit) {
      this.executeActions(this.activeNode.onExit);
    }
    this.visible = false;
    this.engine.inventoryUI.show();
    this.engine.conversationUI.hide();
    this.engine.verbsUI.show();
    this.activeNPC = null;
    this.activeNode = null;
    if (this.resolveCurrentConversation) {
      const resolve = this.resolveCurrentConversation;
      this.resolveCurrentConversation = null;
      resolve();
    }
  }
};

// core/game_object/manager.js
var GameObjectManager = class {
  constructor(engine) {
    this.entities = [];
    this.engine = engine;
  }
  setEntities(entities) {
    this.entities = assignArray(entities);
  }
  add(entitiesToAdd) {
    if (Array.isArray(entitiesToAdd)) {
      this.entities.push(...entitiesToAdd);
    } else {
      this.entities.push(entitiesToAdd);
    }
  }
  remove(id) {
    const index = this.entities.findIndex((e) => e.id === id);
    if (index !== -1) {
      this.entities.splice(index, 1);
    }
  }
  getAll() {
    return this.entities;
  }
  getObstacles() {
    return this.entities.filter((obj) => Boolean(obj.collides)).map((obj) => {
      const box = obj.getCollisionBox();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    });
  }
  get(id) {
    return this.entities.find((e) => e.id === id) || null;
  }
  update(dt) {
    for (const entity of this.entities) {
      entity.update(dt);
      entity.debug = this.engine.debugHotspots;
    }
  }
};

// input/input.js
var InputManager = class {
  constructor(engine, canvas, inventoryUI, verbsUI, conversationUI) {
    this.engine = engine;
    this.canvas = canvas;
    this.inventoryUI = inventoryUI;
    this.verbsUI = verbsUI;
    this.conversationUI = conversationUI;
    this.init();
  }
  init() {
    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (this.engine.textBox.visible) {
        this.engine.textBox.hide();
        return;
      }
      if (this.engine.speechBubble.visible) {
        this.engine.speechBubble.hide();
        return;
      }
      if (this.engine.busy)
        return;
      const hs = this.engine.hotspotsEngine.getHotspotAt(x, y);
      if (hs) {
        this.runVerb(hs);
        return;
      }
      this.engine.player.moveTo(x, y);
    });
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.engine.mousX = x;
      this.engine.mousY = y;
    });
    this.inventoryUI.addEventListener("itemSelect", (e) => {
      const { itemId } = e.detail;
      if (this.engine.currentVerb === Verbs.LOOK) {
        this.engine.inventoryManager.lookItem(itemId);
        return;
      }
      this.engine.selectedItem = itemId;
      this.inventoryUI.setSelected(itemId);
    });
    this.verbsUI.addEventListener("verbSelect", (e) => {
      const { verb } = e.detail;
      this.engine.currentVerb = verb;
      this.engine.inventoryUI.deselectItem(this.engine.selectedItem);
      this.engine.selectedItem = null;
      this.verbsUI.setSelected(verb);
    });
    this.conversationUI.addEventListener("conversationSelect", async (e) => {
      const { index } = e.detail;
      await this.engine.conversationManager.choose(index);
    });
  }
  runVerb(hotspot) {
    if (this.engine.currentVerb === Verbs.USE && this.engine.selectedItem) {
      this.engine.currentRoom.executeUseWith(this.engine.selectedItem, hotspot);
      this.engine.selectedItem = null;
      this.engine.verbsUI.setSelected(Verbs.WALK);
      return;
    }
    this.engine.currentRoom.executeAction(this.engine.currentVerb, hotspot);
  }
};

// core/engines/collision_engine.js
var CollisionEngine = class {
  constructor(engine) {
    this.engine = engine;
    this.activeCollisions = /* @__PURE__ */ new Set();
  }
  checkCollision(object, targets = []) {
    for (const target of targets) {
      if (!(target.collides || target.trigger))
        continue;
      if (this.overlap(object.getCollisionBox(), target.getCollisionBox())) {
        const key = this.getCollisionKey(object, target);
        if (!this.activeCollisions.has(key)) {
          this.activeCollisions.add(key);
          if (target.onCollide) {
            target.onCollide(object);
          }
        }
        return target;
      }
    }
    this.removeCollision(object);
    return null;
  }
  getCollisionKey(a, b) {
    return `${a.id}_${b.id}`;
  }
  removeCollision(object) {
    for (const key of this.activeCollisions) {
      if (key.startsWith(object.id + "_")) {
        this.activeCollisions.delete(key);
      }
    }
  }
  overlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }
  checkDistanceTo(obj, target) {
    const dx = obj.x - target.x;
    const dy = obj.y - target.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
};

// core/engines/occlusion_engine.js
var OcclusionEngine = class {
  constructor(engine) {
    this.engine = engine;
    this.player = null;
    this.objects = [];
    this.allBuffer = [];
  }
  setStaticOcclusionObjects(oc) {
    this.objects = assignArray(oc);
  }
  isOccluded(player, obj) {
    return obj.occludes && player.y < obj.worldY;
  }
  sortObjectsByDepth(objects) {
    objects.sort((a, b) => a.worldY - b.worldY);
  }
  render(ctx) {
    this.player = this.engine.player;
    const gameObjects = this.engine.gameObjectManager.getAll();
    this.allBuffer.length = 0;
    if (gameObjects) this.allBuffer.push(...gameObjects);
    if (this.objects) this.allBuffer.push(...this.objects);
    if (this.player && this.allBuffer) {
      if (this.allBuffer.length === 0) {
        this.player.render(ctx);
        return;
      }
      this.sortObjectsByDepth(this.allBuffer);
      this.allBuffer.forEach((obj) => {
        if (!this.isOccluded(this.player, obj)) {
          if (typeof obj.render === "function") {
            obj.render(ctx);
            return;
          }
          ctx.drawImage(obj.img, obj.worldX, obj.worldY - obj.height);
        }
      });
      this.player.render(ctx);
      this.allBuffer.forEach((obj) => {
        if (this.isOccluded(this.player, obj)) {
          if (typeof obj.render === "function") {
            obj.render(ctx);
            return;
          }
          ctx.drawImage(obj.img, obj.worldX, obj.worldY - obj.height);
        }
      });
    }
  }
};

// core/engines/hotspots_engine.js
var HotspotsEngine = class {
  constructor(engine) {
    this.engine = engine;
    this._hotspots = [];
  }
  setHotspots(hs) {
    this._hotspots = assignArray(hs);
  }
  getAll() {
    return this._hotspots;
  }
  updateHoverHotspot() {
    this.engine.hoverHotspot = this.getHotspotAt(this.engine.mousX, this.engine.mousY);
  }
  getHotspot(id) {
    if (this._hotspots) {
      return this._hotspots.find((h) => h.id === id);
    }
    return null;
  }
  removeHotspot(id) {
    if (!this._hotspots)
      return;
    const index = this._hotspots.findIndex((h) => h.id === id);
    if (index !== -1) {
      this._hotspots.splice(index, 1);
    }
  }
  getHotspotAt(x, y) {
    if (!this._hotspots)
      return null;
    return this._hotspots.find((h) => {
      const bounds = h.getHotspotBounds();
      if (!bounds)
        return false;
      return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
    }) || null;
  }
  renderDebug(ctx) {
    if (!this.engine.debugHotspots)
      return;
    this._hotspots.forEach((h) => {
      h.debug(ctx);
    });
  }
};

// graphics/textbox.js
var TextBox = class {
  constructor(engine) {
    this.engine = engine;
    this.text = "";
    this.visible = false;
    this.x = 40;
    this.width = engine.canvas.width - this.x * 2;
    this.height = 150;
    this.y = engine.canvas.height - this.height;
    this.timeoutId = null;
    this.onClose = null;
    this.resolve = null;
  }
  show(text, callback = null) {
    this.visible = true;
    this.text = text;
    this.centerVertically();
    this.onClose = callback || null;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.timeoutId = setTimeout(() => this.hide(), 2500);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }
  hide() {
    this.visible = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.onClose) {
      this.onClose();
      this.onClose = null;
    }
    if (this.resolve) {
      this.resolve();
      this.resolve = null;
    }
  }
  render(ctx) {
    if (!this.visible)
      return;
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = "#5e5e5e";
    ;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#000000";
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const lines = this.wrapText(ctx, this.text, this.width - 20);
    const lineHeight = 22;
    const textHeight = lines.length * lineHeight;
    const startY = this.y + (this.height - textHeight) / 2;
    const centerX = this.x + this.width / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line.trim(), centerX, startY + i * lineHeight);
    });
    ctx.restore();
  }
  wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (let w of words) {
      const testLine = line + w + " ";
      const width = ctx.measureText(testLine).width;
      if (width > maxWidth) {
        lines.push(line);
        line = w + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line);
    return lines;
  }
  centerVertically() {
    this.y = (this.engine.canvas.height - this.height) / 2;
  }
};

// graphics/speechbubble.js
var SpeechBubble = class {
  constructor(engine) {
    this.engine = engine;
    this.text = "";
    this.visible = false;
    this.padding = 10;
    this.maxWidth = 220;
    this.lineHeight = 20;
    this.onClose = null;
    this.timeoutId = null;
    this.resolve = null;
    this.actor = this.engine.player;
  }
  show(text, callback = null, actor = this.engine.player) {
    if (this.visible)
      return;
    this.actor = actor;
    this.visible = true;
    this.text = text;
    this.onClose = callback || null;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.timeoutId = setTimeout(() => this.hide(), 2e3);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }
  hide() {
    this.visible = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.onClose) {
      this.onClose();
      this.onClose = null;
    }
    if (this.resolve) {
      this.resolve();
      this.resolve = null;
    }
  }
  render(ctx) {
    if (!this.visible)
      return;
    ctx.save();
    ctx.font = "bold 14px 'Trebuchet MS'";
    const lines = this.wrapText(ctx, this.text, this.maxWidth - this.padding * 2);
    const bubbleHeight = lines.length * this.lineHeight + this.padding * 2;
    const bubbleX = this.actor.x - this.maxWidth / 2;
    const bubbleY = this.actor.y - bubbleHeight - 64 - 10;
    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";
    ctx.fillRect(bubbleX, bubbleY, this.maxWidth, bubbleHeight);
    ctx.beginPath();
    ctx.moveTo(this.actor.x, this.actor.y - 60);
    ctx.lineTo(this.actor.x - 10, bubbleY + bubbleHeight);
    ctx.lineTo(this.actor.x + 10, bubbleY + bubbleHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "black";
    lines.forEach((line, i) => {
      ctx.fillText(line, bubbleX + this.padding, bubbleY + this.padding + 15 + i * this.lineHeight);
    });
    ctx.restore();
  }
  wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (let w of words) {
      const testLine = line + w + " ";
      const width = ctx.measureText(testLine).width;
      if (width > maxWidth) {
        lines.push(line);
        line = w + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line);
    return lines;
  }
};

// graphics/animation.js
var Animation = class {
  constructor({ folder, frameCount, fps = 8, loop = true, filePrefix = "frame_", fileExtension = ".png" }) {
    this.frames = [];
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.frameDuration = 1e3 / fps;
    this.loop = loop;
    this.finished = false;
    this.resolve = null;
    this.onComplete = null;
    this.loadFrames(folder, filePrefix, frameCount, fileExtension);
  }
  loadFrames(folder, filePrefix, frameCount, fileExtension) {
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = `${folder}${filePrefix}${String(i).padStart(3, "0")}${fileExtension}`;
      this.frames.push(img);
    }
  }
  play(loop = true) {
    this.loop = loop;
    this.finished = false;
    this.currentFrame = 0;
    this.frameTimer = 0;
  }
  stop() {
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.finished = true;
  }
  playOnce(callback = null) {
    this.onComplete = callback || null;
    this.loop = false;
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }
  update(dt) {
    if (this.finished || this.frames.length === 0)
      return;
    this.frameTimer += dt;
    if (this.frameTimer >= this.frameDuration) {
      this.frameTimer -= this.frameDuration;
      this.currentFrame++;
      if (this.currentFrame >= this.frames.length) {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.frames.length - 1;
          this.finished = true;
          if (typeof this.onComplete === "function") {
            this.onComplete();
            this.onComplete = null;
          }
          if (this.resolve) {
            this.resolve();
            this.resolve = null;
          }
        }
      }
    }
  }
  render(ctx, x, y, width, height) {
    const img = this.currentImage;
    if (img && img.complete) {
      ctx.drawImage(img, x, y, width, height);
    }
  }
  get currentImage() {
    return this.frames[this.currentFrame] || null;
  }
  get isComplete() {
    const img = this.currentImage;
    return img ? img.complete : false;
  }
};

// charakter/npc.js
var NpcCharakter = class {
  constructor({
    engine,
    spritePath = "",
    id = "",
    x = 0,
    y = 0,
    pivot = { x: 0.5, y: 1 },
    offsetY = 8,
    charakterWidth = 0,
    charakterHeight = 0,
    speed = 0.75,
    debug = true,
    minDistance = 40
  }) {
    this.engine = engine;
    this.id = "_" + id;
    this.x = x;
    this.y = y;
    this.pivot = pivot;
    this.offsetY = offsetY;
    this.debug = debug;
    this.charakterWidth = charakterWidth;
    this.charakterHeight = charakterHeight;
    this.speed = speed;
    this.currentDir = "south" + this.id;
    this.moving = false;
    this.target = null;
    this.animations = {};
    this.setAnimations(spritePath);
    this.onArrived = null;
    this.resolve = null;
    this.occludes = true;
    this.path = [];
    this.currentWaypoint = 0;
    this.loopPath = false;
    this.pausedByCollision = false;
    this.minDistance = minDistance;
    this.isTalking = false;
  }
  setPosition({ x = 0, y = 0 }) {
    this.x = x;
    this.y = y;
  }
  setAnimations(spritePath) {
    ["west", "east", "north", "south"].forEach((dir) => {
      this.engine.globalAssets.registerAnimation(dir + this.id, { folder: `${spritePath}${dir}/`, frameCount: 6, fps: 12 });
      if (typeof this.engine.globalAssets.animations[dir + this.id] === "function")
        this.animations[dir + this.id] = this.engine.globalAssets.animations[dir + this.id]();
    });
  }
  followPath(path, loop = true) {
    if (!path || path.length === 0)
      return;
    this.path = path;
    this.currentWaypoint = 0;
    this.loopPath = loop;
    this.target = this.path[this.currentWaypoint];
    this.moving = true;
    this.animations[this.currentDir].play();
  }
  moveTo(x, y, callback = null) {
    this.target = { x, y };
    this.moving = true;
    this.onArrived = callback || null;
    this.animations[this.currentDir].play();
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }
  update(dt) {
    const distance = this.engine.collisionEngine.checkDistanceTo(this, this.engine.player);
    if (distance < this.minDistance) {
      this.pauseMovement();
    }
    if (distance > this.minDistance && !this.isTalking) {
      this.resumeMovement();
    }
    if (this.moving && this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 2) {
        this.currentDir = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "east" + this.id : "west" + this.id : dy > 0 ? "south" + this.id : "north" + this.id;
        this.x += dx / dist * this.speed;
        this.y += dy / dist * this.speed;
      } else {
        this.advanceToNextWaypoint();
      }
    }
    this.animations[this.currentDir].update(dt);
  }
  stop() {
    this.moving = false;
    this.target = null;
    this.path = [];
    this.currentWaypoint = 0;
    this.loopPath = false;
    this.animations[this.currentDir].stop();
    if (typeof this.onArrived === "function") {
      this.onArrived();
      this.onArrived = null;
    }
    if (this.resolve) {
      this.resolve();
      this.resolve = null;
    }
    this.engine.emit("npcArrived", { id: this.id, x: this.x, y: this.y });
  }
  pauseMovement() {
    this.moving = false;
    this.pausedByCollision = true;
    this.animations[this.currentDir].stop();
  }
  resumeMovement() {
    if (this.pausedByCollision) {
      this.moving = true;
      this.pausedByCollision = false;
      this.animations[this.currentDir].play();
    }
  }
  get renderX() {
    return this.x - this.charakterWidth * this.pivot.x;
  }
  get renderY() {
    return this.y - this.charakterHeight * this.pivot.y + this.offsetY;
  }
  get footpointY() {
    return this.y;
  }
  render(ctx) {
    this.animations[this.currentDir].render(ctx, this.renderX, this.renderY, this.charakterWidth, this.charakterHeight);
    if (this.debug) {
      const box = this.getCollisionBox();
      drawBoxAndPoint(ctx, box, { x: this.x, y: this.y }, "darkgreen");
    }
  }
  advanceToNextWaypoint() {
    if (this.loopPath) {
      this.currentWaypoint = (this.currentWaypoint + 1) % this.path.length;
      this.target = this.path[this.currentWaypoint];
    } else {
      this.currentWaypoint++;
      if (this.currentWaypoint < this.path.length) {
        this.target = this.path[this.currentWaypoint];
      } else {
        this.stop();
      }
    }
  }
};

// charakter/pathfinding.js
var Pathfinding = class {
  constructor(grid, gridSize) {
    this.grid = grid;
    this.gridSize = gridSize;
  }
  findPath(currentGrid, start, end) {
    if (!currentGrid || currentGrid.length === 0) return [];
    if (!currentGrid[end.y] || !currentGrid[end.y][end.x]) return [];
    const openList = [];
    const closedSet = /* @__PURE__ */ new Set();
    const startNode = {
      x: start.x,
      y: start.y,
      g: 0,
      h: this.heuristic(start, end),
      f: 0,
      parent: null
    };
    startNode.f = startNode.g + startNode.h;
    openList.push(startNode);
    let iterations = 0;
    const maxIterations = 5e3;
    while (openList.length > 0) {
      iterations++;
      if (iterations > maxIterations) {
        console.warn("Pathfinding: Maximale Iterationen erreicht.");
        return [];
      }
      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift();
      if (current.x === end.x && current.y === end.y) {
        const rawPath = this.reconstructPath(current);
        return this.smoothPath(rawPath, currentGrid);
      }
      const key = `${current.x},${current.y}`;
      closedSet.add(key);
      const neighbors = this.getNeighbors(current, currentGrid);
      for (const neighborPos of neighbors) {
        const neighborKey = `${neighborPos.x},${neighborPos.y}`;
        if (closedSet.has(neighborKey)) continue;
        const gScore = current.g + neighborPos.cost;
        let neighborNode = openList.find((n) => n.x === neighborPos.x && n.y === neighborPos.y);
        if (!neighborNode) {
          neighborNode = {
            x: neighborPos.x,
            y: neighborPos.y,
            g: gScore,
            h: this.heuristic(neighborPos, end),
            f: 0,
            parent: current
          };
          neighborNode.f = neighborNode.g + neighborNode.h;
          openList.push(neighborNode);
        } else if (gScore < neighborNode.g) {
          neighborNode.g = gScore;
          neighborNode.f = neighborNode.g + neighborNode.h;
          neighborNode.parent = current;
        }
      }
    }
    return [];
  }
  heuristic(a, b) {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return Math.sqrt(dx * dx + dy * dy);
  }
  getNeighbors(node, grid) {
    const neighbors = [];
    const cardinal = [
      { x: 0, y: -1 },
      // North
      { x: 1, y: 0 },
      // East
      { x: 0, y: 1 },
      // South
      { x: -1, y: 0 }
      // West
    ];
    const diagonal = [
      { x: 1, y: -1, check1: { x: 1, y: 0 }, check2: { x: 0, y: -1 } },
      // NE
      { x: 1, y: 1, check1: { x: 1, y: 0 }, check2: { x: 0, y: 1 } },
      // SE
      { x: -1, y: 1, check1: { x: -1, y: 0 }, check2: { x: 0, y: 1 } },
      // SW
      { x: -1, y: -1, check1: { x: -1, y: 0 }, check2: { x: 0, y: -1 } }
      // NW
    ];
    for (const dir of cardinal) {
      const nx = node.x + dir.x;
      const ny = node.y + dir.y;
      if (this.isValidCell(nx, ny, grid)) {
        neighbors.push({ x: nx, y: ny, cost: 1 });
      }
    }
    for (const dir of diagonal) {
      const nx = node.x + dir.x;
      const ny = node.y + dir.y;
      if (this.isValidCell(nx, ny, grid)) {
        const c1Valid = this.isValidCell(node.x + dir.check1.x, node.y + dir.check1.y, grid);
        const c2Valid = this.isValidCell(node.x + dir.check2.x, node.y + dir.check2.y, grid);
        if (c1Valid && c2Valid) {
          neighbors.push({ x: nx, y: ny, cost: 1.414 });
        }
      }
    }
    return neighbors;
  }
  isValidCell(x, y, grid) {
    return y >= 0 && y < grid.length && x >= 0 && x < grid[0].length && grid[y][x] === true;
  }
  reconstructPath(node) {
    const path = [];
    let current = node;
    while (current) {
      path.push({ x: current.x, y: current.y });
      current = current.parent;
    }
    path.reverse();
    return path;
  }
  smoothPath(path, grid) {
    if (path.length <= 2) return path;
    const smoothed = [path[0]];
    let current = 0;
    while (current < path.length - 1) {
      let furthestVisible = current + 1;
      for (let next = current + 2; next < path.length; next++) {
        if (this.hasLineOfSight(path[current], path[next], grid)) {
          furthestVisible = next;
        } else {
          break;
        }
      }
      smoothed.push(path[furthestVisible]);
      current = furthestVisible;
    }
    return smoothed;
  }
  // Raycasting check between two grid points
  hasLineOfSight(start, end, grid) {
    let x0 = start.x;
    let y0 = start.y;
    let x1 = end.x;
    let y1 = end.y;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (x0 !== x1 || y0 !== y1) {
      if (!grid[y0] || !grid[y0][x0]) {
        return false;
      }
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
    return grid[y1] && grid[y1][x1];
  }
};

// charakter/utils.js
function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = yi > point.y !== yj > point.y && point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
function drawDebugCurrentGrid(ctx, grid, navGrid) {
  if (!grid || grid.length === 0)
    return;
  ctx.save();
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const px = x * navGrid.gridSize;
      const py = y * navGrid.gridSize;
      if (grid[y][x]) {
        ctx.fillStyle = "rgba(119, 255, 0, 0.35)";
      } else {
        ctx.fillStyle = "rgba(43, 0, 255, 0)";
      }
      ctx.fillRect(px, py, navGrid.gridSize, navGrid.gridSize);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.strokeRect(px, py, navGrid.gridSize, navGrid.gridSize);
    }
  }
  ctx.restore();
}
function drawPath(ctx, path) {
  if (!path)
    return;
  ctx.save();
  ctx.strokeStyle = "yellow";
  ctx.beginPath();
  ctx.lineWidth = "3";
  path.forEach((p, i) => {
    if (i === 0)
      ctx.moveTo(p.x, p.y);
    else
      ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
  ctx.restore();
}
function drawWalkAreas(ctx, walkAreas) {
  ctx.save();
  ctx.strokeStyle = "lime";
  ctx.fillStyle = "rgba(9, 255, 0, 0)";
  ctx.lineWidth = 2;
  for (const polygon of walkAreas) {
    if (polygon.length < 3)
      continue;
    ctx.beginPath();
    ctx.moveTo(polygon[0].x, polygon[0].y);
    for (let i = 1; i < polygon.length; i++) {
      ctx.lineTo(polygon[i].x, polygon[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    for (const p of polygon) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "red";
      ctx.fill();
    }
  }
  ctx.restore();
}

// charakter/grid.js
var NavigationGrid = class {
  constructor(width, height, gridSize = 8) {
    this.width = width;
    this.height = height;
    this.gridSize = gridSize;
    this.staticGrid = [];
    this.walkAreas = [];
  }
  setWalkmap(walkmap) {
    this.walkAreas = walkmap;
    this.createBaseGrid();
  }
  worldToGrid(x, y) {
    return {
      x: Math.floor(x / this.gridSize),
      y: Math.floor(y / this.gridSize)
    };
  }
  gridToWorld(cell) {
    return {
      x: cell.x * this.gridSize + this.gridSize / 2,
      y: cell.y * this.gridSize + this.gridSize / 2
    };
  }
  createBaseGrid() {
    const cols = Math.floor(this.width / this.gridSize);
    const rows = Math.floor(this.height / this.gridSize);
    this.staticGrid = Array.from({ length: rows }, () => new Array(cols));
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * this.gridSize + this.gridSize / 2;
        const py = y * this.gridSize + this.gridSize / 2;
        this.staticGrid[y][x] = this.isSafeCell(px, py);
      }
    }
  }
  isSafeCell(x, y) {
    const r = 4;
    const testPoints = [
      { x: x - r, y: y - r },
      { x: x + r, y: y - r },
      { x: x - r, y: y + r },
      { x: x + r, y: y + r }
    ];
    for (const p of testPoints) {
      let inside = false;
      for (const poly of this.walkAreas) {
        if (pointInPolygon(p, poly)) {
          inside = true;
          break;
        }
      }
      if (!inside) return false;
    }
    return true;
  }
  getDynamicGrid(obstacles = []) {
    const dynamicGrid = this.staticGrid.map((row) => [...row]);
    for (const obstacle of obstacles) {
      if (obstacle.enabled !== false) {
        this.applyObstacle(dynamicGrid, obstacle);
      }
    }
    return dynamicGrid;
  }
  applyObstacle(grid, obstacle) {
    const padding = 4;
    const min = this.worldToGrid(obstacle.x - padding, obstacle.y - padding);
    const max = this.worldToGrid(obstacle.x + obstacle.width + padding, obstacle.y + obstacle.height + padding);
    const startX = Math.max(0, min.x);
    const startY = Math.max(0, min.y);
    const endX = Math.min(grid[0].length - 1, max.x);
    const endY = Math.min(grid.length - 1, max.y);
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        grid[y][x] = false;
      }
    }
  }
  findNearestWalkableCell(cell, grid) {
    if (grid[cell.y] && grid[cell.y][cell.x]) return cell;
    const maxRadius = 10;
    for (let r = 1; r <= maxRadius; r++) {
      for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
          const nx = cell.x + x;
          const ny = cell.y + y;
          if (grid[ny] && grid[ny][nx]) {
            return { x: nx, y: ny };
          }
        }
      }
    }
    return null;
  }
};

// charakter/player.js
var PlayerCharakter = class {
  constructor({
    engine,
    spritePath = "",
    id = "player",
    x = 0,
    y = 0,
    pivot = { x: 0.5, y: 1 },
    playerWidth = 0,
    playerHeight = 0,
    speed = 0,
    debug = false,
    collider = {},
    offsetY = 0
  }) {
    this.engine = engine;
    this.id = id;
    this.x = x;
    this.y = y;
    this.pivot = pivot;
    this.offsetY = offsetY;
    this.collider = collider;
    this.playerWidth = playerWidth;
    this.playerHeight = playerHeight;
    this.speed = speed;
    this.currentDir = "south";
    this.navGrid = new NavigationGrid(this.engine.canvas.width, this.engine.canvas.height, 8);
    this.pathfinder = new Pathfinding(this.navGrid.staticGrid, this.navGrid.gridSize);
    this.path = [];
    this.currentWaypoint = 0;
    this.onActorArrived = null;
    this.resolve = null;
    this.animations = {
      west: this.engine.globalAssets.makeAnimationObject("player_west"),
      east: this.engine.globalAssets.makeAnimationObject("player_east"),
      north: this.engine.globalAssets.makeAnimationObject("player_north"),
      south: this.engine.globalAssets.makeAnimationObject("player_south")
    };
    this.debug = debug;
  }
  setWalkmap(walkmap) {
    this.walkAreas = walkmap;
    this.navGrid.setWalkmap(walkmap);
  }
  getCollisionBox() {
    return {
      x: this.x + this.collider.offsetX,
      y: this.y + this.collider.offsetY,
      width: this.collider.width,
      height: this.collider.height
    };
  }
  setPosition({ x = 0, y = 0 }) {
    this.x = x;
    this.y = y;
    this.stop();
  }
  moveTo(x, y, callback = null) {
    const start = this.navGrid.worldToGrid(this.x, this.y);
    const end = this.navGrid.worldToGrid(x, y);
    const obstacles = this.engine.gameObjectManager.getObstacles();
    this.currentGrid = this.navGrid.getDynamicGrid(obstacles);
    const validEnd = this.navGrid.findNearestWalkableCell(end, this.currentGrid);
    if (!validEnd)
      return;
    const gridPath = this.pathfinder.findPath(this.currentGrid, start, validEnd) || [];
    this.path = gridPath.map((cell) => this.navGrid.gridToWorld(cell));
    this.currentWaypoint = 0;
    this.onActorArrived = callback || null;
    this.animations[this.currentDir].play();
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }
  update(dt) {
    const hit = this.engine.collisionEngine.checkCollision(this.engine.player, this.engine.gameObjectManager.getAll());
    if (this.path.length > 0) {
      const target = this.path[this.currentWaypoint];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 2) {
        this.currentDir = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "east" : "west" : dy > 0 ? "south" : "north";
        const dirX = dx / dist;
        const dirY = dy / dist;
        this.x += dirX * this.speed;
        this.y += dirY * this.speed;
      } else {
        this.currentWaypoint++;
        if (this.currentWaypoint >= this.path.length) {
          this.stop();
        }
      }
    }
    this.animations[this.currentDir].update(dt);
  }
  stop() {
    this.path = [];
    this.animations[this.currentDir].stop();
    if (typeof this.onActorArrived === "function") {
      this.onActorArrived();
      this.onActorArrived = null;
    }
    if (this.resolve) {
      this.resolve();
      this.resolve = null;
    }
    this.engine.emit("actorArrived", { x: this.x, y: this.y });
  }
  render(ctx) {
    this.animations[this.currentDir].render(ctx, this.renderX, this.renderY, this.playerWidth, this.playerHeight);
    if (this.debug) {
      drawBoxAndPoint(ctx, this.getCollisionBox(), { x: this.x, y: this.y }, "red");
      drawWalkAreas(ctx, this.navGrid.walkAreas);
      drawPath(ctx, this.path);
      drawDebugCurrentGrid(ctx, this.currentGrid, this.navGrid);
    }
  }
  get renderX() {
    return this.x - this.playerWidth * this.pivot.x;
  }
  get renderY() {
    return this.y - this.playerHeight * this.pivot.y + this.offsetY;
  }
  get footpointY() {
    return this.y;
  }
};

// core/assets.js
var GlobalAssets = class {
  constructor(engine) {
    this.engine = engine;
    this.animations = {};
    this.charakters = {};
    this.items = {};
  }
  registerAnimation(id, config) {
    if (this.animations[id]) {
      console.warn(`Animation "${id}" already exists!`);
      return;
    }
    this.animations[id] = () => new Animation(config);
  }
  async loadAnimations(jsonPath = "./assets/animations/animation.json") {
    try {
      const data = await load(jsonPath);
      for (const [id, config] of Object.entries(data)) {
        this.registerAnimation(id, config);
      }
    } catch (error) {
      console.error("[Animations] Error:", error);
    }
  }
  registerCharakter(id, config) {
    if (this.charakters[id]) {
      console.warn(`NpcCharkter "${id}" already exists!`);
      return;
    }
    if (id === "player") {
      this.charakters[id] = () => new PlayerCharakter(config);
      return;
    }
    this.charakters[id] = () => new NpcCharakter(config);
  }
  async loadCharakters(jsonPath = "./assets/charakters/charakters.json") {
    try {
      const data = await load(jsonPath);
      for (const [id, config] of Object.entries(data)) {
        config.engine = this.engine;
        config.id = id;
        this.registerCharakter(id, config);
      }
    } catch (error) {
      console.error("[Charakter] Error:", error);
    }
  }
  registerItem(id, itemData) {
    if (this.items[id]) {
      console.warn(`Item "${id}" already exists!`);
      return;
    }
    this.items[id] = { id, ...itemData };
  }
  async loadItems(jsonPath = "./assets/items/items.json") {
    try {
      const data = await load(jsonPath);
      for (const [id, itemData] of Object.entries(data)) {
        this.registerItem(id, itemData);
      }
    } catch (error) {
      console.error("[Items] Error:", error);
    }
  }
  getItem(id) {
    return this.items[id] || null;
  }
  makeAnimationObject(id) {
    return typeof this.animations[id] === "function" ? this.animations[id]() : null;
  }
  getAnimation(id) {
    return this.animations[id] || null;
  }
  getCharakter(id) {
    return this.charakters[id] || null;
  }
  async load() {
    await Promise.all([
      this.loadAnimations(),
      this.loadCharakters(),
      this.loadItems()
    ]);
  }
};

// core/cursor.js
function drawCursor(ctx, mousX, mousY, text, canvasWidth = 512, canvasHeight = 512) {
  const x = mousX;
  const y = mousY;
  ctx.save();
  ctx.strokeStyle = "rgb(0, 0, 0)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 20, y);
  ctx.lineTo(x + 20, y);
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x, y + 20);
  ctx.stroke();
  ctx.strokeStyle = "rgb(255, 255, 255)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 19, y);
  ctx.lineTo(x + 19, y);
  ctx.moveTo(x, y - 19);
  ctx.lineTo(x, y + 19);
  ctx.stroke();
  if (text) {
    ctx.font = '15px "Press Start 2P", monospace';
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgb(0, 0, 0)";
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.textBaseline = "alphabetic";
    const margin = 10;
    const textWidth = ctx.measureText(text).width;
    const textHeight = 15;
    let textX = x + 12;
    let textY = y + 25;
    if (textX + textWidth > canvasWidth - margin) {
      textX = x - textWidth - 12;
    }
    if (textY + textHeight > canvasHeight - margin) {
      textY = y - 25;
    }
    if (textY - textHeight < margin) {
      textY = y + 25;
    }
    ctx.strokeText(text, textX, textY);
    ctx.fillText(text, textX, textY);
  }
  ctx.restore();
}

// core/engine.js
var Engine = class {
  constructor(canvas, inventoryUI, verbsUI, conversationUI) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.currentRoom = null;
    this.player = null;
    this.debugHotspots = false;
    this.hoverHotspot = null;
    this.selectedItem = null;
    this.currentVerb = Verbs.WALK;
    this.globalAssets = new GlobalAssets(this);
    this.gameObjectManager = new GameObjectManager(this);
    this.inventoryManager = new InventoryManager(this);
    this.conversationManager = new ConversationManager(this);
    this.flagsManager = new FlagsManager(this);
    this.inputManager = new InputManager(this, canvas, inventoryUI, verbsUI, conversationUI);
    this.collisionEngine = new CollisionEngine(this);
    this.occlusionEngine = new OcclusionEngine(this);
    this.hotspotsEngine = new HotspotsEngine(this);
    this.verbsUI = verbsUI;
    this.inventoryUI = inventoryUI;
    this.conversationUI = conversationUI;
    this.sceneLoader = new SceneLoader(this);
    this.rooms = {};
    this.listeners = {};
    this.textBox = new TextBox(this);
    this.speechBubble = new SpeechBubble(this);
    this.score = 0;
    this.mousX = 0;
    this.mousY = 0;
    this.busy = false;
  }
  async init(Rooms, path) {
    await this.globalAssets.load();
    this.player = this.globalAssets.charakters.player();
    await this.sceneLoader.loadScenes(Rooms, path);
  }
  noInteraction() {
    this.busy = true;
  }
  allowInteraction() {
    this.busy = false;
  }
  addScore(amount) {
    this.score += amount;
    document.getElementById("scoreValue").textContent = this.score;
  }
  // Event listeners
  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }
  // Event emitter
  emit(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach((callback) => callback(data));
    }
  }
  async loadRoom(room) {
    this.currentRoom = room;
    await this.sceneLoader.load(this.currentRoom);
  }
  async addRoom(room, name) {
    this.rooms[name] = room;
  }
  async changeRoom(room, data) {
    await this.loadRoom(room);
    room.onEnter(this, data);
  }
  update(dt) {
    if (!this.currentRoom.initialized)
      return;
    if (this.player) this.player.update(dt, this);
    if (this.gameObjectManager) this.gameObjectManager.update(dt, this);
    if (this.currentRoom) this.currentRoom.update(dt, this);
    if (this.hotspotsEngine) this.hotspotsEngine.updateHoverHotspot();
  }
  render() {
    if (!this.currentRoom.initialized)
      return;
    if (this.currentRoom) this.currentRoom.renderBG(this.ctx);
    if (this.occlusionEngine) this.occlusionEngine.render(this.ctx);
    if (this.currentRoom) this.currentRoom.render(this.ctx);
    drawCursor(this.ctx, this.mousX, this.mousY, this.hoverHotspot?.name);
    if (this.hotspotsEngine) this.hotspotsEngine.renderDebug(this.ctx);
    if (this.speechBubble) this.speechBubble.render(this.ctx);
    if (this.textBox) this.textBox.render(this.ctx);
  }
  async loop(timestamp) {
    const dt = timestamp - (this.last || timestamp);
    this.last = timestamp;
    this.update(dt);
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }
};

// core/room.js
var Room = class {
  /**
   * @param {Engine} engine - Das Engine-Objekt
   * @param {string} path - Der Pfad
   */
  constructor(engine, path) {
    this.engine = engine;
    this.path = path;
    this.bg = new Image();
    this.entities = null;
    this.walkmap = null;
    this.hotspots = null;
    this.ocObjects = null;
    this.globalAssets = this.engine.globalAssets;
    this.globalAnimations = this.globalAssets.animations;
    this.inventoryItems = this.globalAssets.items;
    this.initialized = false;
  }
  init(assets) {
    if (!this.initialized) {
      this.bg.src = assets.bgSrc;
      this.hotspots = assets.hotspots;
      this.entities = assets.entities;
      this.ocObjects = assets.ocObjects;
      this.walkmap = assets.walkmap;
      this.initialized = true;
    }
    console.log(this.constructor.name + ":", this);
  }
  getOcclusionObjects() {
    if (this.ocObjects) return this.ocObjects;
  }
  executeUseWith(item, hotspot) {
    if (!item || !hotspot)
      return;
    const functionName = "use" + this.capitalize(item) + "With" + this.capitalize(hotspot.id);
    if (typeof this[functionName] === "function") {
      this[functionName](item, hotspot);
    } else {
      this.engine.textBox.show("That doesn't work.");
    }
  }
  executeAction(action, hotspot) {
    if (!hotspot)
      return;
    if (hotspot.action && hotspot.action === "exit") {
      const functionName2 = hotspot.action + this.capitalize(hotspot.target);
      this[functionName2](hotspot);
      return;
    }
    const functionName = action + this.capitalize(hotspot.id);
    if (typeof this[functionName] === "function") {
      this[functionName](hotspot);
    } else {
      this.defaultAction(action, hotspot);
    }
  }
  defaultAction(action, hotspot) {
    switch (action) {
      case "look":
        this.engine.textBox.show("Nothing interesting.");
        break;
      case "pickup":
        this.engine.textBox.show("I can't pick that up.");
        break;
      case "talk":
        this.engine.textBox.show("It doesn't respond.");
        break;
      case "use":
        this.engine.textBox.show("That doesn't work.");
        break;
      case "walk":
        this.engine.player.moveTo(hotspot.walkX, hotspot.walkY);
        break;
      default:
        this.engine.textBox.show("Nothing happens.");
    }
  }
  onEnter(engine, data) {
    throw new Error("onEnter method not implemented in derived class");
  }
  update(dt, engine) {
    throw new Error("update method not implemented in derived class");
  }
  renderBG(ctx) {
    ctx.drawImage(this.bg, 0, 0);
  }
  render(ctx) {
    throw new Error("render method not implemented in derived class");
  }
  capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  async walkToHotspot(hotspot, callback) {
    await this.engine.player.moveTo(hotspot.walkX, hotspot.walkY, callback);
  }
  getItem(id) {
    return this.inventoryItems?.[id] ?? null;
  }
  getItemId(id) {
    return this.inventoryItems?.[id].id ?? null;
  }
  getGameObject(id) {
    return this.engine.gameObjectManager.get(id);
  }
};
export {
  Engine,
  Room
};
