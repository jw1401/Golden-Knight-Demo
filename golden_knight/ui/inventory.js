
export class InventoryUI extends EventTarget {

    constructor(rootId = "inventory") {

        super();

        this.root = document.getElementById(rootId);

        this.root.addEventListener("click", (e) => {

            const itemEl = e.target.closest(".inv-item");
            if (!itemEl) return;

            const itemId = itemEl.dataset.item;
            if (!itemId) return;

            this.dispatchEvent(new CustomEvent("itemSelect", { 
                detail: { itemId } 
            }));
        });
    }

    setSelected(itemId) {

        // UI highlight
        this.root.querySelectorAll(".inv-item").forEach(el => {
            el.classList.toggle("selected", el.dataset.item === itemId);
        });
    }

    addItem(item) {

        const div = document.createElement("div");
        div.className = "inv-item";
        div.dataset.item = item.id;


        // Bild
        const img = document.createElement("img");
        img.src = item.icon;
        img.className = "inv-icon";

        // Text
        const span = document.createElement("span");
        span.textContent = item.name;

        // Zusammenbauen
        div.appendChild(img);
        div.appendChild(span);

        this.root.appendChild(div);
    }

    removeItem(itemId) {

        const el = this.root.querySelector(`[data-item="${itemId}"]`);
        if (el) el.remove();
    }

    deselectItem(itemId) {

        if (itemId) {
            this.root.querySelectorAll(".inv-item").forEach(el => {
                el.classList.remove("selected");
            });
        }
    }

    hide(){

        this.root.classList.add("hidden");
    }

    show(){

        this.root.classList.remove("hidden");
    }
}
