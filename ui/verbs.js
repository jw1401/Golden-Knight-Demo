
export class VerbsUI extends EventTarget{

    constructor(rootId = "verbs") {

        super();

        this.root = document.getElementById(rootId);

        this.root.addEventListener("click", (e) => {

            const verb = e.target.dataset.verb;
            if (!verb) return;

            this.dispatchEvent(new CustomEvent("verbSelect", { 
                detail: { verb } 
            }));
        });
    }

    setSelected(verb) {
        
        // UI highlight
        this.root.querySelectorAll(".verb").forEach(el => {
            el.classList.toggle("selected", el.dataset.verb === verb);
        });

    }

    hide(){

        this.root.classList.add("hidden");
    }

    show(){

        this.root.classList.remove("hidden");
    }

}
