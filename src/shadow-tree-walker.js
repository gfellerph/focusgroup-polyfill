export class ShadowWalker {
  currentNode = null;

  constructor(node) {
    if (node instanceof Element) {
      this.currentNode = node;
    }
  }

  parentNode() {
    if (this.currentNode.assignedSlot !== null) {
      return this.currentNode.assignedSlot;
    }

    let parentNode = this.currentNode.parentElement;

    if (parentNode === null) {
      parentNode = this.currentNode.getRootNode()?.host;
    }

    if (parentNode !== null) {
      this.currentNode = parentNode;
    }

    return parentNode;
  }

  get #root() {
    return this.currentNode.shadowRoot || this.currentNode;
  }

  firstChild() {
    if (this.currentNode.childElementCount === 0) {
      return null;
    }

    this.currentNode = this.#root.firstElementChild;

    return this.currentNode;
  }

  lastChild() {
    if (this.currentNode.childElementCount === 0) {
      return null;
    }

    this.currentNode = this.#root.lastElementChild;

    return this.currentNode;
  }

  previousSibling() {
    const previousSibling = this.currentNode.previousElementSibling;
    if (previousSibling !== null) {
      this.currentNode = previousSibling;
    }
    return previousSibling;
  }

  nextSibling() {
    const nextSibling = this.currentNode.nextElementSibling;
    if (nextSibling !== null) {
      this.currentNode = nextSibling;
    }
    return nextSibling;
  }
}
