export function handleClientSideRender(html, page, result, req, res) {
  if (req.headers["x-stellar-prerender"] == "true") {
    res.status(200).json({
      type: "csr",
      script: `document.querySelector("#root").append((${result.toString()})(${JSON.stringify(
        res.state
      )}))`,
      exports: page.exports,
    });
    return;
  }

  res
    .status(200)
    .html(
      html
        .replace(
          "</body>",
          `<script id="stellarcsr">document.querySelector("#root").append((${result.toString()})(${JSON.stringify(
            res.state
          )}))</script></body>`
        )
        .replace(
          "</head>",
          `<script id="stellarexports">${page.exports}</script></head>`
        )
    );
}
