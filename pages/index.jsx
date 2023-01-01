export default function () {
  return (
    <>
      <h1 class="font-bold text-3xl">
        Stellar Server and Client Side Rendering
      </h1>
      <i class="mt-[-1.5rem]">*All Content is Fetched Before you Navigate*</i>

      <a href="/ssr" class="underline">
        Server-Side Rendering
      </a>
      <a href="/csr" class="underline">
        Client-Side Rendering
      </a>
      <button
        class="p-2 shadow"
        onclick={() =>
          (document.querySelector("body").style.backgroundColor =
            "#" + ((Math.random() * 0xffffff) | 0).toString(16))
        }
      >
        Randomize Background Color 🎲
      </button>

      <p class="render-type">SSR</p>
    </>
  );
}
