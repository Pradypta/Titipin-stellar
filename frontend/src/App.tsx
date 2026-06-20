import { useState, type FormEvent } from "react";
import { type Note } from "../bindings/index.ts";
import { connectFreighter, createContractClient } from "./stellar";

export default function App() {
  const [wallet, setWallet] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState("");

  const btn = "cursor-pointer rounded-lg px-6 py-3 text-base font-medium transition-opacity hover:opacity-90";
  const fail = (err: unknown) => setError(err instanceof Error ? err.message : "Something went wrong");

  async function handleGetNotes() {
    try {
      setError("");

      // read notes from contract
      const tx = await createContractClient(wallet).get_notes();

      setNotes(tx.result ?? []);
    } catch (err) {
      fail(err);
    }
  }

  async function handleCreateNote(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    try {
      setError("");

      // create note in contract
      const client = createContractClient(wallet);
      const tx = await client.create_note({
        title: String(form.get("title")),
        content: String(form.get("content")),
      });
      // sign and send transaction to contract
      await tx.signAndSend();

      formEl.reset();
      await handleGetNotes();
    } catch (err) {
      fail(err);
    }
  }

  async function handleDeleteNote(id: Note["id"]) {
    try {
      setError("");
      // delete note in contract
      const client = createContractClient(wallet);
      const tx = await client.delete_note({ id });

      // sign and send transaction to contract
      await tx.signAndSend();

      await handleGetNotes();
    } catch (err) {
      fail(err);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-50 p-6 font-sans text-gray-900">
      <div className="flex w-full max-w-lg flex-col items-center gap-4">
        <h1 className="text-2xl font-semibold">Stellar Note</h1>

        {!wallet ? (
          <button
            type="button"
            className={`${btn} bg-violet-600 text-white`}
            onClick={async () => {
              try {
                setError("");
                setWallet(await connectFreighter());
              } catch (err) {
                fail(err);
              }
            }}>
            Connect Freighter
          </button>
        ) : (
          <>
            <p className="break-all text-center font-mono text-sm">{wallet}</p>
            <button
              type="button"
              className="text-sm text-gray-500 underline"
              onClick={() => {
                setWallet("");
                setNotes([]);
              }}>
              Disconnect
            </button>

            <button type="button" className={`${btn} bg-violet-600 text-white`} onClick={handleGetNotes}>
              Load Notes
            </button>

            <form className="flex w-full flex-col gap-2" onSubmit={handleCreateNote}>
              <input name="title" placeholder="Title" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" required />
              <textarea name="content" placeholder="Content" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" rows={3} required />
              <button type="submit" className={`${btn} bg-gray-900 text-sm text-white`}>
                Create Note
              </button>
            </form>

            <ul className="flex w-full flex-col gap-2">
              {notes.map((note) => (
                <li key={String(note.id)} className="rounded-lg border border-gray-200 p-3 text-left">
                  <p className="font-medium">{note.title}</p>
                  <p className="text-sm text-gray-600">{note.content}</p>
                  <button type="button" className="mt-2 text-sm text-red-600" onClick={() => handleDeleteNote(note.id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {error && <p className="text-center text-sm text-red-600">{error}</p>}
      </div>
    </main>
  );
}
