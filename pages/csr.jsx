export default function () {
  return () => (
    <>
      <h2 class="text-xl">This Page was Rendered Client-Side</h2>
      <a href="/" class="underline">
        ← Back
      </a>

      <p class="render-type">CSR</p>
    </>
  );
}
