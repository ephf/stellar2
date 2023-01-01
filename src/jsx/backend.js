import { randomUUID } from "crypto";

function generateNamespace() {
  return "_" + randomUUID().replace(/-/g, "");
}

export class Element {
  constructor(html, functions) {
    this.html = html;
    this.functions = functions;
  }

  toString() {
    return this.html;
  }
}

export default {
  createElement(name, attributes, ...children) {
    if (typeof name == "function") return name(attributes, ...children);
    let functions = Object.entries(attributes ?? {}).reduce(
      (functions, [, value]) => {
        if (typeof value == "function") {
          const namespace = generateNamespace();
          functions += `window._stellarFunctionRegistry.${namespace}=${value.toString()};`;
          Object.assign(value, {
            toString: () =>
              `window._stellarFunctionRegistry.${namespace}.call(this,event)`,
          });
          return functions;
        }
        if (value instanceof Element) {
          return functions + value.functions;
        }
        return functions;
      },
      ""
    );
    children.forEach(
      (child) => child instanceof Element && (functions += child.functions)
    );
    if (!name) return new Element(children.join(""), functions);
    return new Element(
      `<${name} ${Object.entries(attributes ?? {})
        .map(([key, value]) => `${key}=${JSON.stringify(value.toString())}`)
        .join(" ")}>${children.join("")}</${name}>`,
      functions
    );
  },
};
