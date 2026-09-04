async function test() {
  const res = await fetch("https://onyx-habits.vercel.app/api/shortcuts?action=task&pin=3340", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "Comprar libreta para Álgebra urgente",
    }),
  });
  console.log("Status:", res.status);
  console.log("Response:", await res.text());
}
test();
