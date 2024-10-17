import { Attribute, registerAttribute } from "./custom-attribute-polyfill";

const add = document.getElementById("add");
const rem = document.getElementById("remove");

class CustomAttribute extends Attribute {
  created(value) {
    console.log(`focusgroup on`, this.host, "newValue: ", value);
  }
  changed(newValue, oldValue) {
    console.log(
      `focusgroup on`,
      this.host,
      `change: ${oldValue} -> ${newValue}`
    );
  }
  removed() {
    console.log(`focusgroup on`, this.host, `removed`);
  }
}

class EmptyAttribute extends Attribute {}

registerAttribute("c-a", EmptyAttribute, document);

add?.addEventListener("click", () => {
  console.time("add");
  document.querySelectorAll("span").forEach((e) => e?.setAttribute("c-a", ""));
  console.timeEnd("add");
});

rem?.addEventListener("click", () => {
  document.querySelectorAll("span").forEach((e) => e?.setAttribute("c-a", ""));
});
