import listen from "stellar2";

listen().then(() => {
  console.log("listening on http://localhost");
});
