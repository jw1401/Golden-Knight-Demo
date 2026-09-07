/////////////////////////////// DEBUG LAYER /////////////////////////////

export class DebugUI {

    constructor(engine) {

        this.engine = engine

        this.chDebugHotspots = document.getElementById("chDebugHotspots");
        this.chDebugWalkmaps = document.getElementById("chDebugWalkmaps");
        this.debugTools = document.getElementById("debug-tools");

        this.debugTools.classList.toggle('hidden')

        this.installEvents()
    }

    installEvents() {

        // Checkbox setzen
        this.chDebugHotspots.checked = false
        this.chDebugWalkmaps.checked = false

        // Variable aktualisieren, wenn Benutzer klickt
        this.chDebugHotspots.addEventListener("change", () => {
            this.engine.debugHotspots = this.chDebugHotspots.checked
        });

        this.chDebugWalkmaps.addEventListener("change", () => {
            this.engine.player.debug = this.chDebugWalkmaps.checked
        });

        window.addEventListener("keydown", (event) => {

            // Check if key pressed is 'd' or 'D'
            if (event.key.toLowerCase() === "d") {

                // Don't trigger if the user is typing inside an input field or textarea
                const isTyping = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
                if (isTyping) return;

                this.debugTools.classList.toggle("hidden");
            }
        });

        const dropdown = document.getElementById("myDropdown");

        // 3. Populate using array.forEach
        Object.entries(this.engine.rooms).forEach(([key, room]) => {

            const option = document.createElement("option");

            option.value = key;     // Set underlying value
            option.textContent = key; // Set displayed text

            dropdown.appendChild(option);
        });

        // 4. Handle selection change
        dropdown.addEventListener("change", (e) => {

            console.log("Selected ID:", e.target.value);

            this.engine.changeRoom(this.engine.rooms[e.target.value], { x: 240, y: 420 });
        });
    }

}
