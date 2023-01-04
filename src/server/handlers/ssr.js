export function handleServerSideRender(html, page, result, req, res) {
  if (req.headers["x-stellar-prerender"] == "true") {
    res.status(200).json({
      type: "ssr",
      functions: result.functions + page.exports,
      html: result.html,
    });
    return;
  }

  res
    .status(200)
    .html(
      html
        .replace(
          /(<div(?:.|[\r\n])*?id="root"(?:.|[\r\n])*?>)<\/div>/,
          `$1${result.html}</div>`
        )
        .replace(
          "</head>",
          `<script id="stellarexports">${
            result.functions + page.exports
          }</script></head>`
        )
    );
}
