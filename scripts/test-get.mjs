async function test() {
  const text = "Comprar libreta para Álgebra urgente";
  const url = `https://onyx-habits.vercel.app/api/shortcuts?action=task&pin=3340&text=${encodeURIComponent(text)}`;
  console.log("Testing URL:", url);
  const res = await fetch(url);
  console.log("Status:", res.status);
  console.log("Response:", await res.text());
}
test();
