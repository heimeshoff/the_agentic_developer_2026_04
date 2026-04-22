export function FormError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <div className="rounded border border-expense/30 bg-expense/5 px-3 py-2 text-sm text-expense">
      {messages.join(" ")}
    </div>
  );
}
