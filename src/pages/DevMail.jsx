import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { request } from "@/api/client";
export default function DevMail() {
  const [messages, setMessages] = useState([]),
    [error, setError] = useState("");
  const refresh = () =>
    request("/dev/mail")
      .then(setMessages)
      .catch((e) => setError(e.message));
  useEffect(() => {
    refresh();
  }, []);
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-5">
      <Link to="/" className="underline">
        LA VOIX
      </Link>
      <h1 className="text-2xl font-bold">Courriels de développement</h1>
      <p>
        Cette boîte est réservée à cette instance locale. Aucun courriel réel
        n’est envoyé.
      </p>
      <button className="underline" onClick={refresh}>
        Actualiser
      </button>
      {error && <p role="alert">{error}</p>}
      {!messages.length && <p>Aucun courriel pour le moment.</p>}
      {messages.map((m) => (
        <article key={m.url} className="p-4 border rounded-xl space-y-2">
          <h2 className="font-semibold">{m.subject}</h2>
          <p>{m.to}</p>
          <a href={m.url} className="underline">
            Ouvrir le lien
          </a>
        </article>
      ))}
    </main>
  );
}
