import listen from "stellar2";

listen({ dirname: import.meta.url }).then(() => {
  console.log("listening on http://localhost");
});
