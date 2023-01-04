export function createElement(name, attributes, ...children) {
  children = children.map((child) =>
    child instanceof Array ? jsx.createElement("", null, ...child) : child
  );
  if (typeof name == "function") {
    return name(attributes, ...children);
  }
  const element = name
    ? document.createElement(name)
    : document.createDocumentFragment();
  Object.entries(attributes ?? {}).forEach(([key, value]) => {
    if (typeof value == "function") {
      element.setAttribute(
        key,
        `jsx._functionRegistry[${jsx._functionRegistry.length}].call(this, event)`
      );
      jsx._functionRegistry.push(value);
      return;
    }
    element.setAttribute(key, value);
  });
  element.append(...children);
  return element;
}
