class FocusgroupStatus extends HTMLElement {
  constructor() {
    super();
    const supported = "focusgroup" in document.createElement("div");
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host {
          display: inline-block;
          font-family: system-ui, sans-serif;
          font-size: 14px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          font-weight: 600;
          line-height: 1;
          color: #fff;
          background: ${supported ? "#16a34a" : "#2678dc"};
        }
        .icon {
          font-size: 16px;
          line-height: 1;
        }
      </style>
      <span class="badge">
        <span class="icon">${supported ? "✓" : "ℹ️"}</span>
        ${supported ? "Focusgroup supported, polyfill off" : "Focusgroup not supported, polyfill active"}
      </span>
    `;
  }
}

customElements.define("focusgroup-status", FocusgroupStatus);
