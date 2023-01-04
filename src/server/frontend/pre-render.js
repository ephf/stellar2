export function preRender() {
  let oldhref = location.href;

  const handleNewContent = (content) => {
    const root = document.querySelector("#root");

    document.querySelector("#stellarcsr")?.remove();
    document.querySelector("#stellarexports")?.remove();

    if (content.type == "csr") {
      root.innerHTML = "";
      document.head.append(
        jsx.createElement("script", { id: "stellarexports" }, content.exports)
      );
      document.body.append(
        jsx.createElement("script", { id: "stellarcsr" }, content.script)
      );
    }

    if (content.type == "ssr") {
      document.head.append(
        jsx.createElement("script", { id: "stellarexports" }, content.functions)
      );
      root.innerHTML = content.html;
    }
  };

  window.onpopstate = () => {
    if (location.href != oldhref) {
      oldhref = location.href;
      fetch(location.href, {
        headers: {
          "X-Stellar-Prerender": "true",
        },
      })
        .then((res) => res.json())
        .then(handleNewContent);
    }
  };

  new MutationObserver((mutations) => {
    mutations.forEach(({ addedNodes }) =>
      addedNodes.forEach((node) => {
        if (node.nodeName == "A") {
          const href = node.outerHTML.match(/(?<=href=").+?(?=")/)?.[0];
          if (!href || href.match(/^https?:\/\//)) return;
          node.awaitData = fetch(href, {
            headers: {
              "X-Stellar-Prerender": "true",
            },
          }).then((res) => res.json());
          node.onclick = async (ev) => {
            ev.preventDefault();
            const content = await node.awaitData;
            handleNewContent(content);
            window.history.pushState(null, "", node.href);
            oldhref = location.href;
          };
        }
      })
    );
  }).observe(document, { childList: true, subtree: true });
}
