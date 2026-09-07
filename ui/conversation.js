
export class ConversationUI extends EventTarget {

    constructor(rootId = "conversation-ui") {

        super();

        this.ui = document.getElementById(rootId);
        this.optionsEl = document.getElementById("conversation-options");

        this.optionsEl.addEventListener("click", (e) => {

            if (!e.target.dataset.index) return;
            const index = parseInt(e.target.dataset.index);

            this.dispatchEvent(new CustomEvent("conversationSelect", { 
                detail: { index } 
            }));

        });
    }

    renderNode(node) {

        this.optionsEl.innerHTML = "";

        node.options.forEach((opt, i) => {

            const div = document.createElement("div");
            div.textContent = opt.text;
            div.dataset.index = i;
            this.optionsEl.appendChild(div);
        });
    }

    reset() {

        this.optionsEl.innerHTML = "";
    }

    show() {

        this.ui.classList.remove("hidden");
    }

    hide() {

        this.ui.classList.add("hidden");
    }
}
