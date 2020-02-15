abstract class View {
  static createElem(tagName: string, className: string): HTMLElement {
    const elem = document.createElement(tagName);
    elem.classList.add(className);

    return elem;
  }
  protected abstract initEvents(): void;
  protected abstract generateHTML(): void;
}

export default View;
